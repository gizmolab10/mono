#!/usr/bin/env python3
"""
Simple API server for dev-hub.html
Listens on port 5171, executes dev-servers.sh commands
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import json
import os
import threading
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_SERVERS = os.path.join(SCRIPT_DIR, 'servers.sh')
GITHUB_DIR = os.path.expanduser('~/GitHub/mono')
UPDATE_DOCS = os.path.join(GITHUB_DIR, 'tools/docs/update-project-docs.sh')

# Project paths for rebuild-docs
PROJECT_PATHS = {
    'mono': GITHUB_DIR,
    'ws': os.path.join(GITHUB_DIR, 'projects/ws'),
    'di': os.path.join(GITHUB_DIR, 'projects/di'),
}

# Status files for rebuild progress (per project location)
STATUS_FILES = {
    'mono': os.path.join(GITHUB_DIR, 'logs', 'rebuild-status.txt'),
    'ws': os.path.join(GITHUB_DIR, 'projects', 'logs', 'rebuild-status.txt'),
    'di': os.path.join(GITHUB_DIR, 'projects', 'logs', 'rebuild-status.txt'),
}

# Restart status file
RESTART_STATUS_FILE = os.path.join(GITHUB_DIR, 'logs', 'restart-status.txt')

# Track current rebuild project
current_rebuild_project = None

# Track if rebuild is running
rebuild_running = False
restart_running = False

# Sites to restart: name, port, dir, command, env
RESTART_SITES = [
    ('ws', 5172, 'projects/ws', 'yarn dev', None),
    ('ws-docs', 5174, 'projects/ws', 'yarn docs:dev', {'VITE_PORT': '5174'}),
    ('di', 5173, 'projects/di', 'yarn dev', None),
    ('di-docs', 5175, 'projects/di', 'yarn docs:dev', {'VITE_PORT': '5175'}),
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
        # Call servers.sh which handles everything including verification
        # It writes progress to RESTART_STATUS_FILE
        servers_script = os.path.join(SCRIPT_DIR, 'servers.sh')
        subprocess.run([servers_script], capture_output=True)
    finally:
        restart_running = False

def rebuild_docs_async(project_path):
    """Run rebuild in background thread"""
    global rebuild_running
    try:
        subprocess.run(
            [UPDATE_DOCS, project_path],
            capture_output=True,
            text=True,
            timeout=300
        )
    except Exception as e:
        # Write error to status file
        status_file = STATUS_FILES.get(current_rebuild_project, '')
        if status_file:
            os.makedirs(os.path.dirname(status_file), exist_ok=True)
            with open(status_file, 'w') as f:
                f.write(f"❌ Error: {str(e)}")
    finally:
        rebuild_running = False

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
                status_file = STATUS_FILES.get(current_rebuild_project, '')
                if status_file and os.path.exists(status_file):
                    with open(status_file, 'r') as f:
                        status = f.read().strip()
                
                # Check if done (starts with ✓ or ❌)
                done = status.startswith('✓') or status.startswith('❌')
                
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
                
                # Check if done (starts with ✓ or ❌)
                done = status.startswith('✓') or status.startswith('❌')
                
                self._send_response(200, {
                    'status': status,
                    'done': done,
                    'running': restart_running
                })
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
            global rebuild_running, current_rebuild_project
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode()
            
            try:
                data = json.loads(body) if body else {}
                project = data.get('project', 'mono')
                project_path = PROJECT_PATHS.get(project)
                
                if not project_path:
                    self._send_response(400, {'success': False, 'error': f'Unknown project: {project}'})
                    return
                
                if rebuild_running:
                    self._send_response(400, {'success': False, 'error': 'Rebuild already in progress'})
                    return
                
                # Start rebuild in background
                rebuild_running = True
                current_rebuild_project = project
                thread = threading.Thread(target=rebuild_docs_async, args=(project_path,))
                thread.daemon = True
                thread.start()
                
                self._send_response(200, {
                    'success': True,
                    'message': 'Rebuild started'
                })
            except Exception as e:
                self._send_response(500, {'success': False, 'error': str(e)})
        
        else:
            self._send_response(404, {'error': 'Not found'})

    def log_message(self, format, *args):
        print(f"[API] {args[0]}")

if __name__ == '__main__':
    server = HTTPServer(('localhost', 5171), APIHandler)
    print("API server running on http://localhost:5171")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
