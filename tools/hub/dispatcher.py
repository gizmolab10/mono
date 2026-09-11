#!/usr/bin/env python3
"""
Dispatcher server for hub
Listens on the port defined in ports.json, executes shell commands on behalf of the browser
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import sys
import json
import os
import re
import threading
import time
import urllib.request
import urllib.error
import urllib.parse

import database   # the db beside this file: the labels on ov's files, and what else they do not say

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_SERVERS = os.path.join(SCRIPT_DIR, 'servers.sh')
GITHUB_DIR = os.path.expanduser('~/GitHub/mono')
UPDATE_DOCS = os.path.join(GITHUB_DIR, 'tools/docs/update-project-docs.sh')

# The folders inside a work folder whose notes go out with the guides, beside the notes standing at
# that folder's own top. Overview draws the same line in `ov/src/lib/ts/utilities/Saving.ts`, and
# the two lists have to agree — a file sent from here that it will not place is read and thrown away.
WORK_FOLDERS = ('next', 'milestones', 'now', 'soon', 'done', 'proposals')
# Every collection's notes folder sits inside the memory system, under the collection's own
# folder there; the shared collection's sits under shared. The claimed set is the folders
# under memory/ whose notes are listed by the notes rules, not as memory files.
COLLECTIONS = ('', 'core', 'di', 'gallery', 'ji', 'lv', 'me', 'mj', 'mu', 'ov', 'ws')

# Load ports.json — single source of truth
with open(os.path.join(SCRIPT_DIR, 'ports.json'), 'r') as f:
    PORTS = json.load(f)

# Load .env file if it exists (for secrets like NETLIFY_ACCESS_TOKEN)
def load_env_file():
    env_path = os.path.join(SCRIPT_DIR, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env_file()

# Derive project paths from ports.json (projects with docs port = buildable docs)
PROJECT_PATHS = {}
for _key, _val in PORTS.items():
    if isinstance(_val, dict) and 'docs' in _val:
        _name = 'mono' if _key == 'mono' else _key
        PROJECT_PATHS[_name] = GITHUB_DIR if _key == 'mono' else os.path.join(GITHUB_DIR, _key)

# Status file for rebuild progress (single file, Option C)
REBUILD_STATUS_FILE = os.path.join(GITHUB_DIR, 'logs', 'rebuild-status.txt')

# Restart status file
RESTART_STATUS_FILE = os.path.join(GITHUB_DIR, 'logs', 'restart-status.txt')

# Tests status file
TESTS_STATUS_FILE = os.path.join(GITHUB_DIR, 'logs', 'tests-status.txt')

# Track if rebuild is running
rebuild_running = False
restart_running = False
tests_running = False

# Derive Netlify sites from ports.json URLs
def _netlify_name(url):
    """Extract site name from https://xxx.netlify.app"""
    return url.split('//')[1].split('.')[0]

NETLIFY_SITES = {}
for _key, _val in PORTS.items():
    if isinstance(_val, dict):
        if 'netlify' in _val:
            NETLIFY_SITES[_key] = _netlify_name(_val['netlify'])
        if 'docsNetlify' in _val:
            _doc_key = 'mono-docs' if _key == 'mono' else f'{_key}-docs'
            NETLIFY_SITES[_doc_key] = _netlify_name(_val['docsNetlify'])

def _settings_beside_this_file():
    """Read the .env sitting next to this file, so keys are found however the hub is started.

    Anything already in the environment wins; this only fills in what is missing. Lines are
    NAME=value, with # starting a comment and surrounding quotes taken off.
    """
    beside = os.path.join(SCRIPT_DIR, '.env')
    if not os.path.isfile(beside):
        return
    try:
        with open(beside) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                name, _, value = line.partition('=')
                name = name.strip()
                value = value.strip().strip('"').strip("'")
                if name and name not in os.environ:
                    os.environ[name] = value
    except Exception:
        pass        # a settings file that cannot be read simply leaves the environment as it was

_settings_beside_this_file()

NETLIFY_TOKEN = os.environ.get('NETLIFY_ACCESS_TOKEN', '')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

# Derive error log paths from projects with docs. Each project's own error log sits beside its
# other logs in memory/<proj>/logs/; mono names no memory project of its own and keeps the top.
DOC_ERROR_LOGS = {
    proj: os.path.join(GITHUB_DIR, 'logs', f'update-docs.error.{proj}.log') if proj == 'mono'
    else os.path.join(GITHUB_DIR, 'memory', proj, 'logs', f'update-docs.error.{proj}.log')
    for proj in PROJECT_PATHS
}

def read_doc_errors():
    """Read all per-project error logs, return dict of project -> content."""
    results = {}
    for proj, path in DOC_ERROR_LOGS.items():
        if os.path.exists(path) and os.path.getsize(path) > 0:
            with open(path, 'r') as f:
                results[proj] = f.read().strip()
        else:
            results[proj] = ''
    return results

def analyze_doc_errors(errors):
    """Call Claude API (haiku) to summarize errors and suggest fixes."""
    # Build prompt from non-empty errors
    parts = []
    for proj, text in errors.items():
        if text:
            parts.append(f"── {proj} ──\n{text}")

    if not parts:
        return {'has_errors': False}

    if not ANTHROPIC_API_KEY:
        return {'has_errors': True, 'error': 'No ANTHROPIC_API_KEY configured', 'raw': errors}

    error_text = '\n\n'.join(parts)
    prompt = (
        "You are a build-error analyst. Below are VitePress/docs build error logs from a monorepo. "
        "For each project that has errors, give a 1-3 sentence summary of what broke and how to fix it. "
        "Be specific: name the file, the missing script, the dead link, etc. "
        "Return plain text, one section per project, no markdown.\n\n"
        f"{error_text}"
    )

    try:
        req_body = json.dumps({
            'model': 'claude-haiku-4-20250414',
            'max_tokens': 1024,
            'messages': [{'role': 'user', 'content': prompt}]
        }).encode()

        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=req_body,
            method='POST'
        )
        req.add_header('Content-Type', 'application/json')
        req.add_header('x-api-key', ANTHROPIC_API_KEY)
        req.add_header('anthropic-version', '2023-06-01')

        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
            analysis = data.get('content', [{}])[0].get('text', '')
            return {'has_errors': True, 'analysis': analysis, 'raw': errors}

    except Exception as e:
        return {'has_errors': True, 'analysis': f'Analysis failed: {str(e)}', 'raw': errors}

# Sites to restart: name, port, dir, command, env
RESTART_SITES = [
    ('di', 5173, 'di', 'yarn dev', None),
    ('lv', 5183, 'di', 'yarn dev', None),
    ('ws', 5172, 'ws', 'yarn dev', None),
    ('ws-docs', 5174, 'ws', 'yarn docs:dev', {'VITE_PORT': '5174'}),
    ('di-docs', 5175, 'di', 'yarn docs:dev', {'VITE_PORT': '5175'}),
    ('mono-docs', 5176, '.', 'yarn docs:dev', {'VITE_PORT': '5176'}),
]

def kill_port(port):
    """Kill process on a port"""
    import signal
    result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
    if result.stdout.strip():
        for pid in result.stdout.strip().split('\n'):
            try:
                os.kill(int(pid), signal.SIGKILL)
            except:
                pass

def verify_port_listening(port, timeout=5):
    """Wait for a process to listen on port"""
    start = time.time()
    while time.time() - start < timeout:
        result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
        if result.stdout.strip():
            return True
        time.sleep(0.5)
    return False

def verify_url_responds(port, timeout=10):
    """Wait for localhost:port to return HTTP 200"""
    import urllib.request
    start = time.time()
    while time.time() - start < timeout:
        try:
            response = urllib.request.urlopen(f'http://localhost:{port}', timeout=2)
            if response.status == 200:
                return True
        except:
            pass
        time.sleep(0.5)
    return False

def restart_sites_async():
    """Run restarts by calling servers.sh"""
    global restart_running
    try:
        servers_script = os.path.join(SCRIPT_DIR, 'servers.sh')
        # Ensure script is executable
        if not os.access(servers_script, os.X_OK):
            os.chmod(servers_script, 0o755)
        subprocess.run([servers_script], capture_output=True)
    finally:
        restart_running = False

def rebuild_docs_async(project_arg):
    """Run rebuild in background thread"""
    global rebuild_running
    try:
        subprocess.run(
            [UPDATE_DOCS, project_arg],
            capture_output=True,
            text=True,
            timeout=600  # 10 min timeout for all projects
        )
    except Exception as e:
        # Write error to status file
        os.makedirs(os.path.dirname(REBUILD_STATUS_FILE), exist_ok=True)
        with open(REBUILD_STATUS_FILE, 'w') as f:
            f.write(f"❌ Error: {str(e)}")
    finally:
        rebuild_running = False

def run_tests_async():
    """Run all tests in background thread (ws and di)"""
    global tests_running
    import re

    def parse_test_output(output):
        """Parse vitest output, return (passed, failed)"""
        output = re.sub(r'\x1b\[[0-9;]*m', '', output)  # Strip ANSI codes
        passed_match = re.search(r'Tests\s+(?:\d+\s+failed\s+\|\s+)?(\d+)\s+passed', output)
        failed_match = re.search(r'Tests\s+(\d+)\s+failed', output)
        passed = int(passed_match.group(1)) if passed_match else 0
        failed = int(failed_match.group(1)) if failed_match else 0
        return passed, failed

    try:
        os.makedirs(os.path.dirname(TESTS_STATUS_FILE), exist_ok=True)
        total_passed = 0
        total_failed = 0

        # Run ws tests
        with open(TESTS_STATUS_FILE, 'w') as f:
            f.write('Running ws tests...')

        ws_dir = os.path.join(GITHUB_DIR, 'ws')
        result = subprocess.run(
            ['yarn', 'test:run'],
            cwd=ws_dir,
            capture_output=True,
            text=True,
            timeout=300
        )
        ws_passed, ws_failed = parse_test_output(result.stdout + result.stderr)
        total_passed += ws_passed
        total_failed += ws_failed

        # Run di tests
        with open(TESTS_STATUS_FILE, 'w') as f:
            f.write(f'ws: {ws_passed} passed. Running di tests...')

        di_dir = os.path.join(GITHUB_DIR, 'di')
        result = subprocess.run(
            ['yarn', 'test:run'],
            cwd=di_dir,
            capture_output=True,
            text=True,
            timeout=300
        )
        di_passed, di_failed = parse_test_output(result.stdout + result.stderr)
        total_passed += di_passed
        total_failed += di_failed

        # Write final status with per-project breakdown
        with open(TESTS_STATUS_FILE, 'w') as f:
            if total_failed > 0:
                f.write(f'❌ [WS] Passed: {ws_passed}, Failed: {ws_failed} --- [DI] Passed: {di_passed}, Failed: {di_failed}')
            elif total_passed > 0:
                f.write(f'✓ [WS] Passed: {ws_passed}, Failed: 0 --- [DI] Passed: {di_passed}, Failed: 0')
            else:
                f.write('✓ Tests completed')

    except subprocess.TimeoutExpired:
        with open(TESTS_STATUS_FILE, 'w') as f:
            f.write('❌ Tests timed out')
    except Exception as e:
        os.makedirs(os.path.dirname(TESTS_STATUS_FILE), exist_ok=True)
        with open(TESTS_STATUS_FILE, 'w') as f:
            f.write(f'❌ Error: {str(e)}')
    finally:
        tests_running = False

def is_listed_note(where):
    """Whether the overview app may read this file's words and write them back.

    Every guide and every design, at any depth. A work note where it sits at the very top of a
    work folder, and inside any of WORK_FOLDERS — the same rule the listing uses, said here as
    well because reading and writing pass through this one door. Every file in the memory
    system, at any depth, the same as a guide."""
    if not where.lower().endswith('.md'):
        return False
    # A place on this machine is turned into one counting from the top of the repo, so the
    # memory system is recognised however the app names it.
    inside = where
    if os.path.isabs(inside):
        root = os.path.realpath(GITHUB_DIR)
        full = os.path.realpath(inside)
        if not full.startswith(root + os.sep):
            return False
        inside = os.path.relpath(full, root)
    # A collection's CLAUDE file — its entry point — spelled CLAUDE.MD or CLAUDE.md. The
    # same line the listing draws: at the repo's own top, or at the top of a collection.
    parts = inside.split('/')
    if parts[-1].lower() == 'claude.md':
        return len(parts) == 1 or (len(parts) == 2 and parts[0] in ('di', 'ws', 'ji', 'lv', 'mu', 'ov'))
    if not inside.startswith('memory/'):
        return False
    # A work note follows its own rule -- at the very top of a zone/work folder, or one level
    # down inside any of WORK_FOLDERS. Every other memory file -- truth, zone's other files,
    # archive -- is readable at any depth, the same as a guide always was.
    at = inside.find('/zone/work/')
    if at < 0:
        return True
    tail = inside[at + len('/zone/work/'):].split('/')
    if len(tail) == 1:
        return True
    return len(tail) == 2 and tail[0].lower() in WORK_FOLDERS

def listed_files():
    """Every file the overview app lists, on disk right now: the repo's own place on this machine,
    and each file's path counting from the top of the repo, sorted. Index files are left in, since
    the app decides what to skip."""
    root = os.path.realpath(GITHUB_DIR)
    found = []
    for collection in COLLECTIONS:
        # The work folder gives up what sits at its very top — the handoff, the debt,
        # the journal, the working features — and what sits one folder down inside the
        # five named here. Those are the ones a guide links to. Anything deeper, and
        # any other folder, stays out.
        #
        # Overview draws the same line for itself, in `site_of_file`. The two have to
        # agree: a file sent from here that it will not place is read and thrown away.
        work = os.path.join(root, 'memory', collection or 'shared', 'zone', 'work')
        if os.path.isdir(work):
            for one in sorted(os.listdir(work)):
                whole = os.path.join(work, one)
                if one.endswith('.md') and os.path.isfile(whole):
                    found.append(os.path.relpath(whole, root))
                elif os.path.isdir(whole) and one.lower() in WORK_FOLDERS:
                    for deeper in sorted(os.listdir(whole)):
                        inside_one = os.path.join(whole, deeper)
                        if deeper.endswith('.md') and os.path.isfile(inside_one):
                            found.append(os.path.relpath(inside_one, root))
        # The collection's CLAUDE file — its entry point — sits at its very top,
        # spelled CLAUDE.MD or CLAUDE.md depending on the project. Listed here so
        # the overview app can show it.
        top_dir = os.path.join(root, collection) if collection else root
        if os.path.isdir(top_dir):
            for one in sorted(os.listdir(top_dir)):
                if one.lower() == 'claude.md' and os.path.isfile(os.path.join(top_dir, one)):
                    found.append(os.path.relpath(os.path.join(top_dir, one), root))
    # The memory system sits at the top of the repo and belongs to no collection.
    # Every file inside it is listed, however deep it sits — except a project's own
    # zone/work, which the walk above has already listed, depth-limited, as work notes.
    memory = os.path.join(root, 'memory')
    if os.path.isdir(memory):
        for here, folders, files in os.walk(memory):
            folders[:] = [f for f in folders if not f.startswith('.')]
            if os.path.basename(here) == 'zone' and os.path.dirname(os.path.dirname(here)) == memory:
                folders[:] = [f for f in folders if f != 'work']
            for one in files:
                if one.endswith('.md'):
                    found.append(os.path.relpath(os.path.join(here, one), root))
    found.sort()
    return root, found

def label_block(text):
    """The lines between the first row of three dashes and the next, and which line the closing
    dashes stand on. Nothing, and -1, for a file with no block."""
    lines = text.split('\n')
    if not lines or lines[0].strip() != '---':
        return [], -1
    for at in range(1, len(lines)):
        if lines[at].strip() == '---':
            return lines[1:at], at
    return [], -1

# The lines a label block can carry and the db has a place for. type and updated are the older
# spellings of kind and date, read as those where the newer line is not there.
KNOWN_KEYS = ('kind', 'title', 'description', 'tags', 'use_when', 'date', 'type', 'updated')

def _names_below(block, at):
    """The names written one to a line under a bare label, each beginning with a dash."""
    named = []
    for below in block[at + 1:]:
        if not re.match(r'^\s+-\s', below):
            break
        name = re.sub(r'^\s+-\s*', '', below).strip()
        if name:
            named.append(name)
    return named

def _list_after(block, at, line, key):
    """A list label's values, in either shape: `[a, b]` on the one line, which the overview app
    wrote, or one name to a line under the bare label, which Obsidian writes."""
    inside = line[len(key) + 1:].strip()
    if inside.startswith('['):
        return [one.strip() for one in inside.strip('[]').split(',') if one.strip()]
    return _names_below(block, at)

def _value_after(line, key):
    """One label's value, the surrounding quote marks taken off."""
    value = line[len(key) + 1:].strip()
    if len(value) > 1 and value[0] == value[-1] and value[0] in '"\'':
        value = value[1:-1]
    return value

def labels_in_text(text):
    """What a file's own label block says: kind, tags, title, description, use_when and date,
    each None where the block has no such line, and unknown, the keys the block carries that the
    db has no place for. A `type` line is read as the kind and an `updated` line as the date
    where the newer line is missing."""
    block, _ = label_block(text)
    said = {'kind': None, 'tags': None, 'title': None, 'description': None, 'use_when': None, 'date': None, 'unknown': []}
    older = {'type': None, 'updated': None}
    for at, line in enumerate(block):
        key = line.split(':', 1)[0] if ':' in line and not line.startswith((' ', '\t')) else ''
        if key in ('kind', 'title', 'description', 'date'):
            said[key] = _value_after(line, key)
        elif key in ('tags', 'use_when'):
            said[key] = _list_after(block, at, line, key)
        elif key in older:
            older[key] = _value_after(line, key)
        elif key and key not in KNOWN_KEYS:
            said['unknown'].append(key)
    if said['kind'] is None and older['type'] is not None:
        said['kind'] = older['type']
    if said['date'] is None and older['updated'] is not None:
        said['date'] = older['updated']
    return said

def without_block(text):
    """The file's text with its whole label block taken off the top, and the one blank line after
    it, where there is one. Every other line stays exactly as it is, and a file with no block
    comes back untouched."""
    block, ends_at = label_block(text)
    if ends_at < 0:
        return text
    rest = text.split('\n')[ends_at + 1:]
    if rest and rest[0].strip() == '':
        rest = rest[1:]
    return '\n'.join(rest)

def scan_labels():
    """Read every listed file's own label block into the db: the kind and the tags it says become
    its hand labels, the title, description, use_when and date its fields, on a row made from
    the disk. A file whose block says none of the six keeps what the db holds. Nothing in any
    file changes. Answers the counts."""
    root, paths = listed_files()
    files, kinds, tags, fields, said_nothing, unreadable = 0, 0, 0, 0, 0, 0
    for where in paths:
        full = os.path.join(root, where)
        try:
            with open(full, 'r') as f:
                text = f.read()
        except Exception:
            unreadable += 1
            continue
        files += 1
        said = labels_in_text(text)
        if all(said[key] is None for key in ('kind', 'tags', 'title', 'description', 'use_when', 'date')):
            said_nothing += 1
            continue
        database.record_file(where, full, said['kind'], said['tags'], title=said['title'],
                             description=said['description'], use_when=said['use_when'], date=said['date'])
        kinds += 1 if said['kind'] is not None else 0
        tags += len(said['tags']) if said['tags'] is not None else 0
        fields += sum(1 for key in ('title', 'description', 'use_when', 'date') if said[key] is not None)
    return {'files': files, 'kinds': kinds, 'tags': tags, 'fields': fields, 'said_nothing': said_nothing, 'unreadable': unreadable}

def rescan():
    """Bring the db into line with the disk: the listing is taken, and every row checked against
    it. A file changed, moved or thrown away in the Finder is noticed here."""
    root, paths = listed_files()
    return database.reconcile(root, paths)

# How many seconds pass between one look at the disk and the next.
WATCH_EVERY = 3

def watch_the_disk():
    """For as long as the dispatcher runs, the disk is looked at every few seconds and the db
    brought into line, so a file moved or changed in the Finder keeps its labels. Nothing on
    this machine reports changes as they happen without a package the dispatcher does not carry,
    so the disk is asked instead: one listing and one stat per file each time, and a fingerprint
    only for a file that changed or has no row while another's is gone. The first look is at
    launch, for changes made while the dispatcher was off."""
    print(f'watch: looking at the disk every {WATCH_EVERY} seconds', flush=True)
    while True:
        try:
            said = rescan()
            if any(said.values()):
                print(f'watch: {said}', flush=True)
        except Exception as e:
            print(f'watch: {e}', flush=True)
        time.sleep(WATCH_EVERY)

def strip_blocks():
    """Take the whole label block off the top of every listed file the db holds a row for. A file
    the db has no row for is passed over, and so is a file whose block carries a line the db has
    no place for, named in the answer so a person can look, so nothing is lost. Answers the
    counts."""
    root, paths = listed_files()
    known = database.all_fields()
    changed, untouched, unscanned, unreadable = 0, 0, 0, 0
    kept = []
    for where in paths:
        if where not in known:
            unscanned += 1
            continue
        full = os.path.join(root, where)
        try:
            with open(full, 'r') as f:
                text = f.read()
        except Exception:
            unreadable += 1
            continue
        unknown = labels_in_text(text)['unknown']
        if unknown:
            kept.append(f'{where}: {", ".join(unknown)}')
            continue
        stripped = without_block(text)
        if stripped == text:
            untouched += 1
            continue
        with open(full, 'w') as f:
            f.write(stripped)
        changed += 1
    return {'changed': changed, 'untouched': untouched, 'unscanned': unscanned, 'unreadable': unreadable, 'kept': kept}

def is_skippable_deploy(deploy):
    """Check if a deploy should be skipped (canceled or failed build)."""
    state = deploy.get('state', '').lower()
    err_msg = deploy.get('error_message', '') or ''
    published_at = deploy.get('published_at')

    # Skip canceled deploys
    if state == 'canceled' or 'cancel' in err_msg.lower():
        return True

    # Skip failed builds (error state with no published_at)
    if state == 'error' and not published_at:
        return True

    return False

def get_netlify_deploy_status(site_name):
    """Fetch latest deploy status from Netlify API.
    Skip canceled deploys and failed builds to find the last successful/active one."""
    if not NETLIFY_TOKEN:
        return {'error': 'No Netlify token configured'}

    try:
        url = f'https://api.netlify.com/api/v1/sites/{site_name}.netlify.app/deploys?per_page=5'
        req = urllib.request.Request(url)
        req.add_header('Authorization', f'Bearer {NETLIFY_TOKEN}')

        with urllib.request.urlopen(req, timeout=10) as response:
            deploys = json.loads(response.read().decode())
            if not deploys:
                return {'error': 'No deploys found'}

            # Find first non-skippable deploy
            for deploy in deploys:
                if not is_skippable_deploy(deploy):
                    return {
                        'state': deploy.get('state'),
                        'created_at': deploy.get('created_at'),
                        'published_at': deploy.get('published_at'),
                        'error_message': deploy.get('error_message'),
                        'deploy_url': deploy.get('deploy_ssl_url'),
                        'title': deploy.get('title', ''),
                    }

            # All deploys in window are skippable, return the latest anyway
            latest = deploys[0]
            return {
                'state': latest.get('state'),
                'created_at': latest.get('created_at'),
                'published_at': latest.get('published_at'),
                'error_message': latest.get('error_message'),
                'deploy_url': latest.get('deploy_ssl_url'),
                'title': latest.get('title', ''),
            }
    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}'}
    except Exception as e:
        return {'error': str(e)}

class APIHandler(BaseHTTPRequestHandler):
    def _send_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _drain_body(self):
        """Read and drop a request body a route has no use for. A body left unread when the
        answer is sent and the connection closed makes the operating system reset the
        connection, and the asker, still reading the answer, sees the reset instead."""
        self.rfile.read(int(self.headers.get('Content-Length', 0)))

    def _note_place(self, where, must_exist):
        """Where a note named from the top of the repo sits, for the label routes: its path
        counting from the top of the repo, which is what the db keys on, and its full place on
        this machine. The same refusals as reading one -- it has to be one of the files the app
        lists, and it has to sit inside the repo -- and, where asked, it has to be there. Every
        refusal is sent from here, and None comes back."""
        if not where:
            self._send_response(400, {'success': False, 'error': 'no file named'})
            return None
        if not is_listed_note(where):
            self._send_response(409, {'success': False, 'error': f'not a guide: {where!r}'})
            return None
        full = os.path.realpath(where if os.path.isabs(where) else os.path.join(GITHUB_DIR, where))
        root = os.path.realpath(GITHUB_DIR)
        if not full.startswith(root + os.sep):
            self._send_response(409, {'success': False, 'error': 'outside the repo'})
            return None
        if must_exist and not os.path.isfile(full):
            self._send_response(404, {'success': False, 'error': f'no such file: {where!r}'})
            return None
        return os.path.relpath(full, root), full

    def do_GET(self):
        if self.path == '/rebuild-status':
            try:
                status = ''
                if os.path.exists(REBUILD_STATUS_FILE):
                    with open(REBUILD_STATUS_FILE, 'r') as f:
                        status = f.read().strip()
                
                # Done if not running OR status indicates completion
                status_done = status.startswith('✓') or status.startswith('❌')
                done = (not rebuild_running) or status_done
                
                self._send_response(200, {
                    'status': status,
                    'done': done,
                    'running': rebuild_running
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})
        
        elif self.path == '/restart-status':
            try:
                status = ''
                if os.path.exists(RESTART_STATUS_FILE):
                    with open(RESTART_STATUS_FILE, 'r') as f:
                        status = f.read().strip()

                # Done if not running OR status indicates completion
                status_done = status.startswith('✓') or status.startswith('❌')
                done = (not restart_running) or status_done

                self._send_response(200, {
                    'status': status,
                    'done': done,
                    'running': restart_running
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/read-guide':
            # Hand back one guide's own words, for the overview app.
            # /read-guide?where=<its place, from the top of the repo or in full on this machine>
            #
            # The dev server can serve these too, but it will not accept a name holding a
            # question mark however it is written — it answers with the app's own page instead
            # of the file. Here the name arrives as a query value, which is unpacked before
            # anything touches disk, so every name works.
            #
            # The same two refusals as saving: it has to be one of the files the app lists —
            # a guide, a design, or a work note at the top of a work folder — and it has to sit
            # inside the repo.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                if not where:
                    self._send_response(400, {'success': False, 'error': 'no file named'})
                    return
                if not is_listed_note(where):
                    self._send_response(409, {'success': False, 'error': f'not a guide: {where!r}'})
                    return
                # Either a place counting from the top of the repo, or a full place on this
                # machine — the app has one or the other to hand depending on what it is doing.
                full = os.path.realpath(where if os.path.isabs(where) else os.path.join(GITHUB_DIR, where))
                root = os.path.realpath(GITHUB_DIR)
                if not full.startswith(root + os.sep):
                    self._send_response(409, {'success': False, 'error': 'outside the repo'})
                    return
                if not os.path.isfile(full):
                    self._send_response(404, {'success': False, 'error': f'no such file: {where!r}'})
                    return
                with open(full, 'r') as f:
                    text = f.read()
                self._send_response(200, {'success': True, 'path': full, 'text': text})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/list-files':
            # Every file on disk right now, for the overview app: /list-files
            #
            # Overview settles its own list of files when its code is prepared, so a file added
            # since then is invisible to it. Asking here instead means a new file shows up
            # without the dev server being restarted. Each answer is a path counting from the
            # top of the repo; index files are left in, since the app decides what to skip.
            try:
                root, found = listed_files()
                # The repo's own place on this machine goes back too, since the app reads each
                # file by its full place and has nothing else to work it out from.
                self._send_response(200, {'success': True, 'root': root, 'paths': found})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/labels':
            # Every label the db holds on one file, for the overview app: /labels?where=<path>
            # Each is a name (kind or tag), a value, and who made it: hand, rule or ai. A file
            # the db has no row for answers an empty list, not a refusal.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=False)
                if not placed:
                    return
                where, _ = placed
                self._send_response(200, {'success': True, 'labels': database.labels_of(where)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/all-labels':
            # Every label and every field on every file, for the overview app, in one answer:
            # each file's path from the top of the repo, its labels, and its title, description,
            # use_when and date. One ask at launch in place of one per file. A path among the
            # fields is a file the db holds a row for, labels or not. The disk is looked at
            # first, so a file moved a moment ago answers under its new path.
            try:
                rescan()
                self._send_response(200, {'success': True, 'labels': database.all_labels(), 'fields': database.all_fields()})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/tests-status':
            try:
                status = ''
                if os.path.exists(TESTS_STATUS_FILE):
                    with open(TESTS_STATUS_FILE, 'r') as f:
                        status = f.read().strip()

                # Done if not running OR status indicates completion
                status_done = status.startswith('✓') or status.startswith('❌')
                done = (not tests_running) or status_done

                self._send_response(200, {
                    'status': status,
                    'done': done,
                    'running': tests_running
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/deploy-status':
            try:
                results = {}
                for key, site_name in NETLIFY_SITES.items():
                    results[key] = get_netlify_deploy_status(site_name)
                self._send_response(200, results)
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})
        
        elif self.path.startswith('/deploy-status/'):
            try:
                site_key = self.path.split('/')[-1]
                if site_key in NETLIFY_SITES:
                    result = get_netlify_deploy_status(NETLIFY_SITES[site_key])
                    self._send_response(200, result)
                else:
                    self._send_response(404, {'error': f'Unknown site: {site_key}'})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path.startswith('/obsidian/'):
            try:
                # Extract path after /obsidian/
                file_path = self.path[len('/obsidian/'):]
                # URL decode the path
                from urllib.parse import unquote
                file_path = unquote(file_path)
                # Open in Obsidian (vault name = mono)
                subprocess.run(['open', f'obsidian://open?vault=mono&file={file_path}'])
                self._send_response(200, {'success': True, 'file': file_path})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/doc-errors':
            try:
                errors = read_doc_errors()
                has_errors = any(v for v in errors.values())
                self._send_response(200, {'has_errors': has_errors, 'errors': errors})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/doc-errors-analysis':
            try:
                errors = read_doc_errors()
                result = analyze_doc_errors(errors)
                self._send_response(200, result)
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        else:
            self._send_response(404, {'error': 'Not found'})

    def do_POST(self):
        if self.path == '/start':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            
            try:
                data = json.loads(body) if body else {}
                site = data.get('site', 'all')
                
                result = subprocess.run(
                    [DEV_SERVERS, site],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                self._send_response(200, {
                    'success': result.returncode == 0,
                    'output': result.stdout,
                    'error': result.stderr
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})
        
        elif self.path == '/restart-all':
            global restart_running
            try:
                if restart_running:
                    self._send_response(400, {'success': False, 'error': 'Restart already in progress'})
                    return
                
                # Start restarts in background, respond immediately
                restart_running = True
                thread = threading.Thread(target=restart_sites_async)
                thread.daemon = True
                thread.start()
                
                self._send_response(200, {
                    'success': True,
                    'message': 'Restart initiated'
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})
        
        elif self.path == '/rebuild-docs':
            global rebuild_running
            
            try:
                if rebuild_running:
                    self._send_response(400, {'success': False, 'error': 'Rebuild already in progress'})
                    return
                
                # Start rebuild of all projects in background
                rebuild_running = True
                thread = threading.Thread(target=rebuild_docs_async, args=('all',))
                thread.daemon = True
                thread.start()
                
                self._send_response(200, {
                    'success': True,
                    'message': 'Rebuild started'
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})
        
        elif self.path == '/run-tests':
            global tests_running

            try:
                if tests_running:
                    self._send_response(400, {'success': False, 'error': 'Tests already running'})
                    return

                # Start tests in background
                tests_running = True
                thread = threading.Thread(target=run_tests_async)
                thread.daemon = True
                thread.start()

                self._send_response(200, {
                    'success': True,
                    'message': 'Tests started'
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/log':
            # Append or overwrite ~/GitHub/mono/logs/<where>.log with the request body.
            # /log?where=<name> picks the file (defaults to "debug"); ?erase=1 overwrites
            # (first call per browser session), otherwise the body is appended. <name>
            # must be a bare filename (letters, digits, dash, underscore, dot) so it can't
            # point outside the logs folder — and two dots in a row are refused, since that
            # is how a name climbs out of the folder it is given.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', ['debug'])[0]
                if not where or '..' in where or not all(c.isalnum() or c in '-_.' for c in where):
                    self._send_response(400, {'success': False, 'error': f'bad where: {where!r}'})
                    return
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode()
                # A name like "di", "di.debug" or "di-docs" names its own project's log; one
                # naming no memory project (the bare default "debug", among others) keeps
                # writing to the shared logs folder at the top, same as before.
                project = re.sub(r'-docs$', '', where.split('.')[0])
                if os.path.isdir(os.path.join(GITHUB_DIR, 'memory', project)):
                    log_path = os.path.join(GITHUB_DIR, 'memory', project, 'logs', f'{where}.log')
                else:
                    log_path = os.path.join(GITHUB_DIR, 'logs', f'{where}.log')
                os.makedirs(os.path.dirname(log_path), exist_ok=True)
                erase = params.get('erase', ['0'])[0] == '1'
                mode = 'w' if erase else 'a'
                with open(log_path, mode) as f:
                    f.write(body)
                    if not body.endswith('\n'):
                        f.write('\n')
                self._send_response(200, {'success': True, 'path': log_path, 'erase': erase})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/save-guide':
            # Write a changed guide back to its own file, for the overview app.
            # /save-guide?where=<path from the top of the repo>. The body is JSON:
            # {"text": <the whole new file>, "as_opened": <the file as the app last read it>}.
            #
            # Two refusals guard it, and both answer 409 rather than writing:
            #   - the path must be one of the files the app lists — a guide, a design, or a work
            #     note at the top of a work folder — and must resolve inside the repo (no climbing
            #     out with "..", no symlinks out)
            #   - the file on disk must still read exactly as the app last saw it
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                if not where:
                    self._send_response(400, {'success': False, 'error': 'no file named'})
                    return
                if not is_listed_note(where):
                    self._send_response(409, {'success': False, 'error': f'not a guide: {where!r}'})
                    return
                full = os.path.realpath(os.path.join(GITHUB_DIR, where))
                root = os.path.realpath(GITHUB_DIR)
                if not full.startswith(root + os.sep):
                    self._send_response(409, {'success': False, 'error': 'outside the repo'})
                    return
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode())
                text = sent.get('text')
                as_opened = sent.get('as_opened')
                if not isinstance(text, str) or not isinstance(as_opened, str):
                    self._send_response(400, {'success': False, 'error': 'text and as_opened must both be sent'})
                    return
                # A file that isn't there yet can be made, but only when the app says it saw
                # nothing there. Otherwise the file has to still read as the app last saw it.
                if not os.path.isfile(full):
                    if as_opened != '':
                        self._send_response(409, {'success': False, 'error': 'no such file'})
                        return
                    if not os.path.isdir(os.path.dirname(full)):
                        self._send_response(409, {'success': False, 'error': 'no such folder'})
                        return
                else:
                    with open(full, 'r') as f:
                        on_disk = f.read()
                    if on_disk != as_opened:
                        self._send_response(409, {'success': False, 'error': 'the file changed since it was opened'})
                        return
                with open(full, 'w') as f:
                    f.write(text)
                self._send_response(200, {'success': True, 'path': full, 'wrote': len(text)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/restart-server':
            # Restart one dev server, for the overview app: /restart-server?which=ov
            #
            # Overview settles its list of guide files when its code is prepared, so a file
            # that moved or was renamed only shows in its new place once the server has been
            # restarted. The name must be plain letters, so nothing else can be run.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                which = params.get('which', [''])[0]
                if not which or not which.isalnum():
                    self._send_response(400, {'success': False, 'error': f'bad server name: {which!r}'})
                    return
                if not os.access(DEV_SERVERS, os.X_OK):
                    os.chmod(DEV_SERVERS, 0o755)
                subprocess.Popen([DEV_SERVERS, which], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                self._send_response(200, {'success': True, 'which': which})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/show-folder':
            # Show one folder of notes in the Finder, for the overview app.
            # /show-folder?where=<path from the top of the repo>
            #
            # It refuses, answering 409, anything that is not a folder holding notes the app
            # lists — the guides, the designs, and the work. Work is here because the app lists
            # work notes now, so a file's own folder can be a work folder.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                root = os.path.realpath(GITHUB_DIR)
                full = os.path.realpath(os.path.join(GITHUB_DIR, where)) if where else ''
                if not where or not any(part in where for part in ('notes/guides', 'notes/designs', 'notes/work')) or not full.startswith(root + os.sep):
                    self._send_response(409, {'success': False, 'error': f'not a guides folder: {where!r}'})
                    return
                if not os.path.isdir(full):
                    self._send_response(409, {'success': False, 'error': 'no such folder'})
                    return
                subprocess.Popen(['open', full])
                self._send_response(200, {'success': True, 'path': full})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/move-guide':
            # Move a guide's file from one place in the repo to another, for the overview app.
            # /move-guide?from=<path from the top of the repo>&to=<the same>
            #
            # Every refusal answers 409 and moves nothing:
            #   - either path is not one of the files the app lists — a guide, a design, or a work
            #     note at the top of a work folder
            #   - either path resolves outside the repo
            #   - the file to move isn't there, or something is already at the new place
            #   - the folder it would land in doesn't exist (folders are never made here)
            #
            # On success it answers with the file's full place on this machine, so the app can
            # read it again without waiting for a restart.
            try:
                self._drain_body()
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where_from = params.get('from', [''])[0]
                where_to = params.get('to', [''])[0]
                root = os.path.realpath(GITHUB_DIR)

                def guide_path(where):
                    if not where or not is_listed_note(where):
                        return None
                    full = os.path.realpath(os.path.join(GITHUB_DIR, where))
                    return full if full.startswith(root + os.sep) else None

                full_from = guide_path(where_from)
                full_to = guide_path(where_to)
                if not full_from or not full_to:
                    self._send_response(409, {'success': False, 'error': 'not a guide, or outside the repo'})
                    return
                if full_from == full_to:
                    self._send_response(409, {'success': False, 'error': 'already there'})
                    return
                if not os.path.isfile(full_from):
                    self._send_response(409, {'success': False, 'error': 'no such file'})
                    return
                # This disk treats "okf.md" and "OKF.md" as one and the same, so changing only the
                # capitals in a name finds the file itself sitting where it wants to go. That is a
                # re-lettering, not a clash, and it is allowed.
                if os.path.exists(full_to) and not os.path.samefile(full_from, full_to):
                    self._send_response(409, {'success': False, 'error': 'a file of that name is already there'})
                    return
                if not os.path.isdir(os.path.dirname(full_to)):
                    self._send_response(409, {'success': False, 'error': 'no such folder'})
                    return
                os.rename(full_from, full_to)
                # The db keys the file's labels and fields by its path, so its row follows it.
                database.move_path(os.path.relpath(full_from, root), os.path.relpath(full_to, root))
                self._send_response(200, {'success': True, 'path': full_to})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/delete-guide':
            # Throw one guide's file away, for the overview app.
            # /delete-guide?where=<path from the top of the repo>
            #
            # Every refusal answers 409 and throws nothing away:
            #   - the path is not one of the files the app lists — a guide, a design, or a work
            #     note at the top of a work folder
            #   - the path resolves outside the repo (no climbing out with "..", no symlinks out)
            #   - the file isn't there
            try:
                self._drain_body()
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                root = os.path.realpath(GITHUB_DIR)
                if not where or not is_listed_note(where):
                    self._send_response(409, {'success': False, 'error': f'not a guide: {where!r}'})
                    return
                full = os.path.realpath(os.path.join(GITHUB_DIR, where))
                if not full.startswith(root + os.sep):
                    self._send_response(409, {'success': False, 'error': 'outside the repo'})
                    return
                if not os.path.isfile(full):
                    self._send_response(409, {'success': False, 'error': 'no such file'})
                    return
                os.remove(full)
                # Its row in the db goes with it, and every label and source on it.
                database.delete_path(os.path.relpath(full, root))
                self._send_response(200, {'success': True, 'path': full})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/add-label':
            # Write one label on a file, in the db and never in the file, for the overview app.
            # /add-label?where=<path from the top of the repo>. The body is JSON:
            # {"name": "kind" or "tag", "value": <the kind or the tag>, "made_by": hand, rule or ai}
            # made_by is hand when left out. The file has to be there: its row in the db is made
            # from what is on disk. The same label written twice leaves one row.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=True)
                if not placed:
                    return
                where, full = placed
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode())
                name, value, made_by = sent.get('name'), sent.get('value'), sent.get('made_by', 'hand')
                if not isinstance(name, str) or not name or not isinstance(value, str) or not value:
                    self._send_response(400, {'success': False, 'error': 'name and value must both be sent'})
                    return
                if made_by not in database.MADE_BY:
                    self._send_response(400, {'success': False, 'error': f'made_by must be one of {list(database.MADE_BY)}, not {made_by!r}'})
                    return
                database.add_label(where, full, name, value, made_by)
                self._send_response(200, {'success': True, 'path': where})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/remove-label':
            # Take one label off a file, whoever made it, for the overview app.
            # /remove-label?where=<path from the top of the repo>. The body is JSON:
            # {"name": "kind" or "tag", "value": <the kind or the tag>}
            # Answers how many rows went: none, for a label that was not there.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=False)
                if not placed:
                    return
                where, _ = placed
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode())
                name, value = sent.get('name'), sent.get('value')
                if not isinstance(name, str) or not name or not isinstance(value, str) or not value:
                    self._send_response(400, {'success': False, 'error': 'name and value must both be sent'})
                    return
                removed = database.remove_label(where, name, value)
                self._send_response(200, {'success': True, 'path': where, 'removed': removed})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/scan':
            # Read every listed file's own label block into the db, for the overview app: /scan
            # The kind and the tags a file says become its hand labels, and its title,
            # description, use_when and date its fields, its row made from the disk. A file
            # saying none of them keeps what the db holds. Nothing in any file changes.
            try:
                self._drain_body()
                self._send_response(200, {'success': True, **scan_labels()})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/rescan':
            # Bring the db into line with the disk now, rather than at the watcher's next look:
            # /rescan. Answers how many rows changed, moved, went missing or were found again.
            try:
                self._drain_body()
                self._send_response(200, {'success': True, **rescan()})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/strip-block':
            # Take the whole label block off the top of every listed file the db holds a row for:
            # /strip-block, with the JSON body {"confirm": "strip"}. A file whose block carries a
            # line the db has no place for is passed over and named. Every file is rewritten on
            # this machine, so the word is asked for: without it, nothing is touched.
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                if sent.get('confirm') != 'strip':
                    self._send_response(400, {'success': False, 'error': 'send {"confirm": "strip"} to rewrite every file'})
                    return
                self._send_response(200, {'success': True, **strip_blocks()})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/set-fields':
            # Write a file's title, description, use_when and date on its row in the db, for the
            # overview app: /set-fields?where=<path from the top of the repo>. The body is JSON
            # holding any of the four: {"title": ..., "description": ..., "use_when": [...],
            # "date": ...}. One left out is left as it is. The file has to be there.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=True)
                if not placed:
                    return
                where, full = placed
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                fields = {}
                for name in database.FIELDS:
                    if name not in sent:
                        continue
                    value = sent[name]
                    wanted = list if name == 'use_when' else str
                    if not isinstance(value, wanted) or (name == 'use_when' and not all(isinstance(one, str) for one in value)):
                        self._send_response(400, {'success': False, 'error': f'{name} must be {"a list of words" if name == "use_when" else "words"}'})
                        return
                    fields[name] = value
                if not fields:
                    self._send_response(400, {'success': False, 'error': f'send at least one of {list(database.FIELDS)}'})
                    return
                database.set_fields(where, full, **fields)
                self._send_response(200, {'success': True, 'path': where, 'fields': sorted(fields)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/restart-dispatcher' or self.path == '/restart-api':  # /restart-api for backwards compat
            log_file = os.path.join(GITHUB_DIR, 'logs', 'dispatcher-restart.log')
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            script_path = os.path.abspath(__file__)

            # Spawn new process with current environment (so NETLIFY_ACCESS_TOKEN is inherited)
            with open(log_file, 'w') as log:
                subprocess.Popen(
                    ['python3', script_path],
                    stdout=log,
                    stderr=log,
                    env=os.environ,
                    start_new_session=True
                )
            time.sleep(1.0)  # Let it start

            # Now exit - the new process will kill us anyway
            os._exit(0)
        
        else:
            self._send_response(404, {'error': 'Not found'})

    def log_message(self, format, *args):
        # Suppress all request logging
        pass

    def handle(self):
        """Override to suppress BrokenPipeError noise"""
        try:
            super().handle()
        except BrokenPipeError:
            pass

if __name__ == '__main__':
    import socket
    import signal

    PORT = PORTS['dispatcher']['port']

    # Kill any existing process on the port
    result = subprocess.run(['lsof', '-ti', f':{PORT}'], capture_output=True, text=True)
    if result.stdout.strip():
        for pid in result.stdout.strip().split('\n'):
            try:
                os.kill(int(pid), signal.SIGKILL)
                print(f"Killed existing process {pid} on port {PORT}")
            except:
                pass
        time.sleep(1.0)  # Wait for port to be released

    # Allow rebinding to port immediately after restart
    class ReusableHTTPServer(HTTPServer):
        allow_reuse_address = True

    server = ReusableHTTPServer(('localhost', PORT), APIHandler)
    print(f"Dispatcher running on http://localhost:{PORT}")
    # The disk is watched for as long as the server runs, its first look at launch.
    threading.Thread(target=watch_the_disk, daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
