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

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_SERVERS = os.path.join(SCRIPT_DIR, 'servers.sh')

# Sites to restart (excludes hub and api)
RESTART_SITES = ['ws', 'ws-docs', 'di', 'di-docs', 'docs']

def restart_sites_async():
    """Run restarts in background thread"""
    for site in RESTART_SITES:
        subprocess.run([DEV_SERVERS, site], capture_output=True, text=True, timeout=30)

class APIHandler(BaseHTTPRequestHandler):
    def _send_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

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
            try:
                # Start restarts in background, respond immediately
                thread = threading.Thread(target=restart_sites_async)
                thread.start()
                
                self._send_response(200, {
                    'success': True,
                    'message': 'Restart initiated'
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
    server.serve_forever()
