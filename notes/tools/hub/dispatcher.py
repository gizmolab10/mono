#!/usr/bin/env python3
"""
Dispatcher server for hub
Listens on port 5171, executes shell commands on behalf of the browser
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import sys
import json
import os
import threading
import time
import urllib.request
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_SERVERS = os.path.join(SCRIPT_DIR, 'servers.sh')
GITHUB_DIR = os.path.expanduser('~/GitHub/mono')
UPDATE_DOCS = os.path.join(GITHUB_DIR, 'notes/tools/docs/update-project-docs.sh')

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

# Project paths for rebuild-docs
PROJECT_PATHS = {
    'mono': GITHUB_DIR,
    'ws': os.path.join(GITHUB_DIR, 'ws'),
    'di': os.path.join(GITHUB_DIR, 'di'),
}

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

# Netlify site IDs (from Netlify dashboard)
NETLIFY_SITES = {
    'ws': 'webseriously',
    'ws-docs': 'webseriously-documentation',
    'di': 'designintuition',
    'di-docs': 'designintuition-documentation',
    'mono-docs': 'monorepo-documentation',
}

NETLIFY_TOKEN = os.environ.get('NETLIFY_ACCESS_TOKEN', '')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

# Per-project error log paths
DOC_ERROR_LOGS = {
    'mono': os.path.join(GITHUB_DIR, 'logs', 'update-docs.error.mono.log'),
    'ws': os.path.join(GITHUB_DIR, 'logs', 'update-docs.error.ws.log'),
    'di': os.path.join(GITHUB_DIR, 'logs', 'update-docs.error.di.log'),
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
    ('ws', 5172, 'ws', 'yarn dev', None),
    ('ws-docs', 5174, 'ws', 'yarn docs:dev', {'VITE_PORT': '5174'}),
    ('di', 5173, 'di', 'yarn dev', None),
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
    
    # Kill any existing process on port 5171
    result = subprocess.run(['lsof', '-ti', ':5171'], capture_output=True, text=True)
    if result.stdout.strip():
        for pid in result.stdout.strip().split('\n'):
            try:
                os.kill(int(pid), signal.SIGKILL)
                print(f"Killed existing process {pid} on port 5171")
            except:
                pass
        time.sleep(1.0)  # Wait for port to be released
    
    # Allow rebinding to port immediately after restart
    class ReusableHTTPServer(HTTPServer):
        allow_reuse_address = True
    
    server = ReusableHTTPServer(('localhost', 5171), APIHandler)
    print("Dispatcher running on http://localhost:5171")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
