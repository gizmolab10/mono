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
import importlib.util

import database   # the db beside this file: the labels on a host's files, and what else they do not say

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_SERVERS = os.path.join(SCRIPT_DIR, 'servers.sh')
GITHUB_DIR = os.path.expanduser('~/GitHub/mono')
UPDATE_DOCS = os.path.join(GITHUB_DIR, 'tools/docs/update-project-docs.sh')

# Every code folder sits under projects/ since 23 September 2026, a library's under
# projects/libraries/; mono's own is the repo itself.
CODE_PARENTS = ('projects', os.path.join('projects', 'libraries'))

def folder_of_project(key):
    """Where a project's code sits, by its name in ports.json."""
    if key == 'mono':
        return GITHUB_DIR
    for parent in CODE_PARENTS:
        whole = os.path.join(GITHUB_DIR, parent, key)
        if os.path.isdir(whole):
            return whole
    return os.path.join(GITHUB_DIR, key)


# --- the plugins ------------------------------------------------------------------------------------
# One plugin.py per host, imported from the host's code folder, mono/projects/<host>, for each host the host list
# names, database.HOSTS: the specialty's code, as memory/ai/zone/music and ai.md's plugin api table
# lays it out. Its listing rule says which files under the root are listed, is listed says it of one
# path, and labels gives a file its labels inside the rules pass. The import and every call are
# wrapped: a fault is said in the log and fails that file or that request, never the server. A host
# with no plugin of its own uses the plugin of a host sharing its db. A request naming no host is
# ai's, so a request naming none asks ai's db and ai's plugin.
PLUGINS = {}

def load_plugins():
    """Import each host's plugin.py, where the host's folder holds one. A plugin that fails to
    import is said in the log and left out, so its host lists nothing and the server stays up."""
    for host in database.HOSTS:
        place = os.path.join(folder_of_project(host), 'plugin.py')
        if not os.path.isfile(place):
            continue
        try:
            spec = importlib.util.spec_from_file_location(f'{host}_plugin', place)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            PLUGINS[host] = module
            print(f'plugin: {host}\'s imported from {place}', flush=True)
        except Exception as e:
            print(f'plugin: {host}\'s failed to import from {place}: {e}', flush=True)

def plugin_for(host):
    """The plugin a request's host runs: its own, or the plugin of a host sharing its db. None
    where no host with that db has one."""
    host = host or 'ai'
    if host in PLUGINS:
        return PLUGINS[host]
    db = database.HOSTS.get(host)
    for other, module in PLUGINS.items():
        if database.HOSTS.get(other) == db:
            return module
    return None

def call_plugin(host, name, *args, otherwise):
    """One call into the host's plugin, wrapped: a fault is said in the log and answers otherwise,
    and so does a host with no plugin."""
    plugin = plugin_for(host)
    if plugin is None:
        return otherwise
    try:
        return getattr(plugin, name)(*args)
    except Exception as e:
        print(f'plugin: {name} failed on {args[1:] if len(args) > 1 else args}: {e}', flush=True)
        return otherwise

def files_listed_by(host=None):
    """The host's listing, from its plugin: the repo's own place on this machine, and each listed
    file's path counting from the top of the repo, sorted. Index files are left in, since the app
    decides what to skip. Nothing for a host with no plugin."""
    root = os.path.realpath(GITHUB_DIR)
    return root, call_plugin(host, 'listed_files', root, otherwise=[])

def listed_by(host, where):
    """Whether the host's plugin lists this file, so its words may be read and written back. A
    place on this machine is turned into a path counting from the top of the repo first, so the
    memory system is recognised however the app names it."""
    root = os.path.realpath(GITHUB_DIR)
    inside = where
    if os.path.isabs(inside):
        full = os.path.realpath(inside)
        if not full.startswith(root + os.sep):
            return False
        inside = os.path.relpath(full, root)
    return bool(call_plugin(host, 'is_listed', root, inside, otherwise=False))

load_plugins()

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

# Derive project paths from ports.json (projects with docs port = buildable docs).
PROJECT_PATHS = {}
for _key, _val in PORTS.items():
    if isinstance(_val, dict) and 'docs' in _val:
        _name = 'mono' if _key == 'mono' else _key
        PROJECT_PATHS[_name] = folder_of_project(_key)

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
# When this process began. The hub page reads it before and after asking for a restart: a later
# time is the new process answering, the same time is the old one still here.
STARTED = time.time()

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

        ws_dir = folder_of_project('ws')
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

        di_dir = folder_of_project('di')
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

def scan_labels(host=None):
    """Read every listed file's own label block into the db: the kind and the tags it says become
    its hand labels, the title, description, use_when and date its fields, on a row made from
    the disk. The reading of one file's block is the host's plugin's, its scan; the walk and the
    db are the dispatcher's. A file whose block says none of the six keeps what the db holds.
    Nothing in any file changes. Answers the counts."""
    root, paths = files_listed_by(host)
    files, kinds, tags, fields, said_nothing, unreadable = 0, 0, 0, 0, 0, 0
    for where in paths:
        full = os.path.join(root, where)
        said = call_plugin(host, 'scan', root, where, otherwise=None)
        if said is None:
            unreadable += 1
            continue
        files += 1
        if all(said[key] is None for key in ('kind', 'tags', 'title', 'description', 'use_when', 'date')):
            said_nothing += 1
            continue
        database.record_file(where, full, said['kind'], said['tags'], title=said['title'],
                             description=said['description'], use_when=said['use_when'], date=said['date'], host=host)
        kinds += 1 if said['kind'] is not None else 0
        tags += len(said['tags']) if said['tags'] is not None else 0
        fields += sum(1 for key in ('title', 'description', 'use_when', 'date') if said[key] is not None)
    return {'files': files, 'kinds': kinds, 'tags': tags, 'fields': fields, 'said_nothing': said_nothing, 'unreadable': unreadable}

def rescan():
    """Bring the db into line with the disk: the listing is taken from the plugin, and every row
    checked against it. A file changed, moved or thrown away in the Finder is noticed here. Then
    a collection the listing names for the first time gets its row in the collections table, one
    per project, the plugin's specialty and the repo its root. Answers how many rows were made
    among the counts."""
    root, paths = files_listed_by()
    said = database.reconcile(root, paths)
    specialty = getattr(plugin_for(None), 'SPECIALTY', '')
    said['collections'] = database.ensure_collections({database.collection_of(one) for one in paths}, specialty, root)
    return said

# What the rules last ran against, path by path: the file's size and time. A file whose two are
# unchanged since is left alone, so its content is read again only when it changed.
RULED = {}

def labels_by_rules(rules, where, full):
    """The kinds and the tags the rules give one file: each rule's regex tried against what it
    reads — the file's name, its location (its path from the top of the repo) or its content,
    read once and only when a rule asks for it. A regex that will not compile hits nothing.
    Each value once."""
    kinds, tags = [], []
    text = None
    for rule in rules:
        if rule['reads'] == 'name':
            subject = os.path.basename(where)
        elif rule['reads'] == 'location':
            subject = where
        else:
            if text is None:
                try:
                    with open(full, 'r') as f:
                        text = f.read()
                except Exception:
                    text = ''
            subject = text
        try:
            hit = re.search(rule['pattern'], subject) is not None
        except re.error:
            hit = False
        if hit:
            (kinds if rule['name'] == 'kind' else tags).append(rule['value'])
    return list(dict.fromkeys(kinds)), list(dict.fromkeys(tags))

def run_rules(everything=False):
    """Run every rule on the listed files: those changed or new since the rules last ran, or all
    of them when asked, which is what adding or taking away a rule asks. Each file's rule labels
    are made exactly what the rules give and what the plugin gives, hand labels untouched, and a
    file neither hits gets no row. With no rules at all, every label a rule gave goes as each
    file is done. Answers how many files were done."""
    root, paths = files_listed_by()
    rules = database.rules()
    done = 0
    on_disk = set()
    for where in paths:
        full = os.path.join(root, where)
        try:
            stat = (os.path.getsize(full), os.path.getmtime(full))
        except OSError:
            continue
        on_disk.add(where)
        if not everything and RULED.get(where) == stat:
            continue
        RULED[where] = stat
        kinds, tags = labels_by_rules(rules, where, full)
        # The plugin's labels for the file, as rule rows beside the pattern rules': a kind or a
        # tag. Any other name waits for the table that holds it, step 22 of the plan.
        for name, value in call_plugin(None, 'labels', root, where, otherwise=[]):
            if name == 'kind':
                kinds.append(value)
            elif name == 'tag':
                tags.append(value)
        database.set_rule_labels(where, full, kinds, tags)
        done += 1
    for where in [one for one in RULED if one not in on_disk]:
        del RULED[where]
    return done

def look():
    """One look at the disk: the db brought into line with it, then the rules run on whatever
    changed or is new. What the watcher does every few seconds, /all-labels does before
    answering, and /rescan does on request."""
    said = rescan()
    said['ruled'] = run_rules()
    return said

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
            said = look()
            if any(said.values()):
                print(f'watch: {said}', flush=True)
        except Exception as e:
            print(f'watch: {e}', flush=True)
        time.sleep(WATCH_EVERY)

def strip_blocks(host=None):
    """Take the whole label block off the top of every listed file the db holds a row for. The
    taking off one file's block is the host's plugin's, its strip; the walk and the db are the
    dispatcher's. A file the db has no row for is passed over, and so is a file whose block
    carries a line the db has no place for, named in the answer so a person can look, so nothing
    is lost. Answers the counts."""
    root, paths = files_listed_by(host)
    known = database.all_fields(host=host)
    changed, untouched, unscanned, unreadable = 0, 0, 0, 0
    kept = []
    for where in paths:
        if where not in known:
            unscanned += 1
            continue
        did = call_plugin(host, 'strip', root, where, otherwise=None)
        if did is None:
            unreadable += 1
        elif did['did'] == 'kept':
            kept.append(f'{where}: {", ".join(did["unknown"])}')
        elif did['did'] == 'untouched':
            untouched += 1
        else:
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
        refusal is sent from here, and None comes back. A route asks this before it reads its
        body, so a refusal drops the body first: left unread, it resets the connection under
        the asker, who then sees the reset in place of the refusal."""
        def refuse(status, error):
            self._drain_body()
            self._send_response(status, {'success': False, 'error': error})

        if not where:
            refuse(400, 'no file named')
            return None
        if not listed_by(self._host_named(), where):
            refuse(409, f'not a guide: {where!r}')
            return None
        full = os.path.realpath(where if os.path.isabs(where) else os.path.join(GITHUB_DIR, where))
        root = os.path.realpath(GITHUB_DIR)
        if not full.startswith(root + os.sep):
            refuse(409, 'outside the repo')
            return None
        if must_exist and not os.path.isfile(full):
            refuse(404, f'no such file: {where!r}')
            return None
        return os.path.relpath(full, root), full

    def _host_named(self):
        """The host a request names, unchecked, for picking its plugin before the body is read.
        None when it names none. _host refuses an unknown one, where the route calls it."""
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        return params.get('host', [None])[0]

    def _host(self):
        """Whose db a route opens: the host query value, which ports.json pairs with a db, and ai
        when none is sent, so a request naming none answers ai's db. A
        host ports.json gives no db is refused with a 400 sent from here, and False comes back so
        the route returns. None is ai, never a refusal."""
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        host = params.get('host', [None])[0]
        if host is not None and host not in database.HOSTS:
            self._send_response(400, {'success': False, 'error': f'no db for host {host!r}: one of {sorted(database.HOSTS)}'})
            return False
        return host

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
                    'running': restart_running,
                    'started': STARTED
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
            # inside the repo. The reading itself is the host's plugin's, its read.
            try:
                host = self._host()
                if host is False:
                    return
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                if not where:
                    self._send_response(400, {'success': False, 'error': 'no file named'})
                    return
                if not listed_by(host, where):
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
                text = call_plugin(host, 'read', root, os.path.relpath(full, root), otherwise=None)
                if text is None:
                    self._send_response(409, {'success': False, 'error': f'not read by the host\'s plugin: {where!r}'})
                    return
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
                host = self._host()
                if host is False:
                    return
                root, found = files_listed_by(host)
                # The repo's own place on this machine goes back too, since the app reads each
                # file by its full place and has nothing else to work it out from.
                self._send_response(200, {'success': True, 'root': root, 'paths': found})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/labels':
            # Every label the db holds on one file, for the overview app: /labels?where=<path>
            # Each is a name (kind or tag), a value, and who made it: hand, rule or ai. A file
            # the db has no row for answers an empty list, not a refusal. Here and in every
            # route below that reads or writes the db, &host=<a host ports.json gives a db>
            # picks whose db, ai's when left out.
            try:
                host = self._host()
                if host is False:
                    return
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=False)
                if not placed:
                    return
                where, _ = placed
                self._send_response(200, {'success': True, 'labels': database.labels_of(where, host=host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/all-labels':
            # Every label and every field on every file, for the overview app, in one answer:
            # each file's path from the top of the repo, its labels, and its title, description,
            # use_when and date. One ask at launch in place of one per file. A path among the
            # fields is a file the db holds a row for, labels or not. The disk is looked at
            # first, so a file moved a moment ago answers under its new path. The look is ai's:
            # another host's db answers as it is, its own look coming with its plugin.
            try:
                host = self._host()
                if host is False:
                    return
                if host is None:
                    look()
                self._send_response(200, {'success': True, 'labels': database.all_labels(host=host), 'fields': database.all_fields(host=host), 'sources': database.all_sources(host=host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/rules':
            # Every rule, for the overview app: what each reads, the regex it matches, and the
            # label it gives.
            try:
                host = self._host()
                if host is False:
                    return
                self._send_response(200, {'success': True, 'rules': database.rules(host=host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/sources':
            # A file's sources, for the overview app: /sources?where=<path>. Each is an author,
            # where the file came from (a url or a person), and a date.
            try:
                host = self._host()
                if host is False:
                    return
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=False)
                if not placed:
                    return
                where, _ = placed
                self._send_response(200, {'success': True, 'sources': database.sources_of(where, host=host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/collections':
            # Every collection in a host's db, for the overview app: /collections for ai's,
            # /collections?host=mu for mu's. Each is an id, a name, a specialty and a root folder:
            # for ai one per project, made by the look, the repo the root of every one; for mu one
            # per folder dropped.
            try:
                host = self._host()
                if host is False:
                    return
                self._send_response(200, {'success': True, 'collections': database.collections(host=host)})
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
            # The writing itself, and the second refusal, are the host's plugin's, its save.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                if not where:
                    self._send_response(400, {'success': False, 'error': 'no file named'})
                    return
                if not listed_by(self._host_named(), where):
                    self._send_response(409, {'success': False, 'error': f'not a guide: {where!r}'})
                    return
                full = os.path.realpath(os.path.join(GITHUB_DIR, where))
                root = os.path.realpath(GITHUB_DIR)
                if not full.startswith(root + os.sep):
                    self._send_response(409, {'success': False, 'error': 'outside the repo'})
                    return
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode())
                host = self._host()
                if host is False:
                    return
                text = sent.get('text')
                as_opened = sent.get('as_opened')
                if not isinstance(text, str) or not isinstance(as_opened, str):
                    self._send_response(400, {'success': False, 'error': 'text and as_opened must both be sent'})
                    return
                said = call_plugin(host, 'save', root, os.path.relpath(full, root), text, as_opened, otherwise=None)
                if said is None:
                    self._send_response(409, {'success': False, 'error': f'not written by the host\'s plugin: {where!r}'})
                    return
                if not said['ok']:
                    self._send_response(409, {'success': False, 'error': said['why']})
                    return
                self._send_response(200, {'success': True, 'path': full, 'wrote': said['wrote']})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/restart-server':
            # Restart one dev server, for the hub page: /restart-server?which=ai
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
                host = self._host()
                if host is False:
                    return
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where_from = params.get('from', [''])[0]
                where_to = params.get('to', [''])[0]
                root = os.path.realpath(GITHUB_DIR)

                def guide_path(where):
                    if not where or not listed_by(host, where):
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
                database.move_path(os.path.relpath(full_from, root), os.path.relpath(full_to, root), host=host)
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
                host = self._host()
                if host is False:
                    return
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                where = params.get('where', [''])[0]
                root = os.path.realpath(GITHUB_DIR)
                if not where or not listed_by(host, where):
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
                database.delete_path(os.path.relpath(full, root), host=host)
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
                host = self._host()
                if host is False:
                    return
                database.add_label(where, full, name, value, made_by, host=host)
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
                host = self._host()
                if host is False:
                    return
                removed = database.remove_label(where, name, value, host=host)
                self._send_response(200, {'success': True, 'path': where, 'removed': removed})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/scan':
            # Read every listed file's own label block into the db, for the overview app: /scan
            # The kind and the tags a file says become its hand labels, and its title,
            # description, use_when and date its fields, its row made from the disk. A file
            # saying none of them keeps what the db holds. Nothing in any file changes. The
            # reading of a block is the host's plugin's.
            try:
                self._drain_body()
                host = self._host()
                if host is False:
                    return
                self._send_response(200, {'success': True, **scan_labels(host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/set-sources':
            # Make a file's sources exactly what is sent, for the overview app:
            # /set-sources?where=<path from the top of the repo>. The body is JSON:
            # {"authors": [names], "came_from": <a url or a person>, "date": <year-month-day>}.
            # One row per author, each saying where the file came from, or one row with no
            # author where only that is said. The file has to be there.
            try:
                params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                placed = self._note_place(params.get('where', [''])[0], must_exist=True)
                if not placed:
                    return
                where, full = placed
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                authors, came_from, date = sent.get('authors', []), sent.get('came_from', ''), sent.get('date', '')
                if not isinstance(authors, list) or not all(isinstance(one, str) for one in authors):
                    self._send_response(400, {'success': False, 'error': 'authors must be a list of names'})
                    return
                if not isinstance(came_from, str) or not isinstance(date, str):
                    self._send_response(400, {'success': False, 'error': 'came_from and date must be words'})
                    return
                host = self._host()
                if host is False:
                    return
                database.set_sources(where, full, [one.strip() for one in authors], came_from.strip(), date, host=host)
                self._send_response(200, {'success': True, 'path': where, 'sources': database.sources_of(where, host=host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/forget-missing':
            # Forget every file the db holds a row for and the disk no longer does, for the
            # overview app: /forget-missing. Each row goes with its labels and sources, whether
            # or not a look had marked it missing. Answers the paths forgotten.
            try:
                self._drain_body()
                host = self._host()
                if host is False:
                    return
                gone = database.forget_missing(os.path.realpath(GITHUB_DIR), host=host)
                self._send_response(200, {'success': True, 'gone': gone})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif self.path == '/rescan':
            # Bring the db into line with the disk now, rather than at the watcher's next look:
            # /rescan. Answers how many rows changed, moved, went missing or were found again,
            # and how many files the rules were run on.
            try:
                self._drain_body()
                self._send_response(200, {'success': True, **look()})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/add-rule':
            # One more rule, for the overview app: /add-rule. The body is JSON: {"reads": name,
            # location or content, "pattern": <a regex>, "name": kind or tag, "value": <the label>}.
            # Every rule is then run on every file. Answers the rule's id and how many files. The
            # run is ai's: another host's rules wait for its look, which comes with its plugin.
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                reads, pattern, name, value = sent.get('reads'), sent.get('pattern'), sent.get('name'), sent.get('value')
                if reads not in database.READS or name not in database.GIVES:
                    self._send_response(400, {'success': False, 'error': f'a rule reads one of {list(database.READS)} and gives one of {list(database.GIVES)}'})
                    return
                if not isinstance(pattern, str) or not pattern or not isinstance(value, str) or not value:
                    self._send_response(400, {'success': False, 'error': 'pattern and value must both be sent'})
                    return
                try:
                    re.compile(pattern)
                except re.error as bad:
                    self._send_response(400, {'success': False, 'error': f'not a regex: {bad}'})
                    return
                host = self._host()
                if host is False:
                    return
                made = database.add_rule(reads, pattern, name, value, host=host)
                self._send_response(200, {'success': True, 'id': made, 'ruled': run_rules(everything=True) if host is None or database.place_of(host) == database.PLACE else 0})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/remove-rule':
            # One rule gone, for the overview app: /remove-rule, the body {"id": <its id>}. Every
            # rule left is then run on every file, so what the gone one gave goes.
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                rule_id = sent.get('id')
                if not isinstance(rule_id, int):
                    self._send_response(400, {'success': False, 'error': 'id must be a number'})
                    return
                host = self._host()
                if host is False:
                    return
                removed = database.remove_rule(rule_id, host=host)
                self._send_response(200, {'success': True, 'removed': removed, 'ruled': run_rules(everything=True) if host is None or database.place_of(host) == database.PLACE else 0})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/dump':
            # Write every table of a host's db as plain text beside it, ai.sql or mu.sql: /dump.
            # The db never enters git and the dump does, so the labels live in git through it.
            # Answers where it went, how many statements it holds and how many labels.
            try:
                self._drain_body()
                host = self._host()
                if host is False:
                    return
                self._send_response(200, {'success': True, **database.write_dump(host=host)})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/restore':
            # Make a new db from a host's dump: /restore, with the JSON body {"into": <a .db name>}.
            # The file is made beside the db and nowhere else, and no live db is ever written
            # over, whatever the ask says. Answers where it went and how many labels it holds.
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                into = sent.get('into')
                if not isinstance(into, str) or not into:
                    self._send_response(400, {'success': False, 'error': 'send {"into": "<a .db name>"}'})
                    return
                host = self._host()
                if host is False:
                    return
                try:
                    said = database.restore(into, host=host)
                except ValueError as e:
                    self._send_response(400, {'success': False, 'error': str(e)})
                    return
                self._send_response(200, {'success': True, **said})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/add-collection':
            # One more collection in a host's db: /add-collection?host=mu, the body JSON
            # {"name": <its name>, "specialty": ai or music, "root": <a folder on this machine>}.
            # For the drop box, and for curl until the drop box exists: a dropped folder's row,
            # named for the folder. The root has to be a folder that is there. A name already
            # there is left as it is. Answers the row's id.
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                host = self._host()
                if host is False:
                    return
                name, specialty, root = sent.get('name'), sent.get('specialty'), sent.get('root')
                if not all(isinstance(one, str) and one for one in (name, specialty, root)):
                    self._send_response(400, {'success': False, 'error': 'name, specialty and root must all be sent'})
                    return
                if not os.path.isdir(root):
                    self._send_response(400, {'success': False, 'error': f'no such folder: {root!r}'})
                    return
                made = database.add_collection(name, specialty, root, host=host)
                self._send_response(200, {'success': True, 'id': made})
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})

        elif urllib.parse.urlparse(self.path).path == '/strip-block':
            # Take the whole label block off the top of every listed file the db holds a row for:
            # /strip-block, with the JSON body {"confirm": "strip"}. A file whose block carries a
            # line the db has no place for is passed over and named. Every file is rewritten on
            # this machine, so the word is asked for: without it, nothing is touched. The taking
            # off of a block is the host's plugin's.
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                sent = json.loads(self.rfile.read(content_length).decode() or '{}')
                host = self._host()
                if host is False:
                    return
                if sent.get('confirm') != 'strip':
                    self._send_response(400, {'success': False, 'error': 'send {"confirm": "strip"} to rewrite every file'})
                    return
                self._send_response(200, {'success': True, **strip_blocks(host)})
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
                host = self._host()
                if host is False:
                    return
                database.set_fields(where, full, host=host, **fields)
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
