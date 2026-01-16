# Hub Console Progress System

**Date:** 2026-01-14
**Status:** Complete

## Overview

Added live progress display to the dev hub for Restart and Rebuild Docs operations.

## Features

### Console Row
- Positioned between title row and segment row
- Transparent background, small monospace font (10px)
- Fixed height (20px), single line with overflow ellipsis
- Auto-clears on mouseleave after operation completes (1s delay)

### Restart Button
- Disables Rebuild button while running
- Polls `/restart-status` every 500ms
- Shows step progress: "Step 1/5: Restarting ws"
- Tolerates up to 3 poll failures before giving up

### Rebuild Docs Button  
- Disables Restart button while running
- Polls `/rebuild-status` every 500ms
- Shows step progress from shell script status file

## API Endpoints

### GET /restart-status
Returns: `{ status, done, running }`

### GET /rebuild-status
Returns: `{ status, done, running }`

### POST /restart-all
Starts background restart of all dev servers (ws, ws-docs, di, di-docs, mono-docs)

### POST /rebuild-docs
Starts background docs rebuild for specified project

## Architecture

### Restart Flow
1. Hub calls POST `/restart-all`
2. API spawns daemon thread running `restart_sites_async()`
3. Thread writes progress to `~/GitHub/mono/logs/restart-status.txt`
4. Hub polls GET `/restart-status` every 500ms
5. When `done=true`, polling stops and button re-enables

### Rebuild Flow
1. Hub calls POST `/rebuild-docs` with project
2. API spawns daemon thread running `rebuild_docs_async()`
3. Shell script writes progress to status file
4. Hub polls GET `/rebuild-status` every 500ms
5. When `done=true`, polling stops and button re-enables

## Key Implementation Details

### Direct Process Management
Originally used `servers.sh` but it killed the API mid-process. Now handles restarts directly in Python:

```python
def kill_port(port):
    result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
    if result.stdout.strip():
        for pid in result.stdout.strip().split('\n'):
            os.kill(int(pid), signal.SIGKILL)

# Start new process
subprocess.Popen(cmd, shell=True, cwd=work_dir, stdout=log, stderr=log)
```

### Daemon Threads
Threads marked as daemon so Ctrl+C works:
```python
thread = threading.Thread(target=restart_sites_async)
thread.daemon = True
thread.start()
```

### Console Auto-Clear
Uses mouseleave events (not continuous mousemove tracking):
```javascript
let shouldClearConsole = false;

consoleRow.addEventListener('mouseleave', () => {
  if (shouldClearConsole && consoleOutput.textContent) {
    consoleOutput.textContent = '';
    shouldClearConsole = false;
  }
});
```

### Mutual Exclusion
One operation blocks the other:
```javascript
function doStart() {
  if (pollInterval) return; // Rebuild in progress
  btnRebuild.classList.add('disabled');
  // ...
}

function doRebuild() {
  if (restartPollInterval) return; // Restart in progress
  btnStart.classList.add('disabled');
  // ...
}
```

## Persistent Console Output (2026-01-14)

Added localStorage persistence for console output, separate for each button:
- `hub-console-restart` stores Restart button's last output
- `hub-console-rebuild` stores Rebuild Docs button's last output
- Hover over button (when idle) reveals its stored output
- Leave button to hide (value persists in storage)
- Strengthened mutual exclusion: both functions check both poll intervals
- Console storage clears on page refresh (session-only persistence)

## Final Messages (2026-01-14)

- Restart: "✓ All 5 sites are up"
- Rebuild Docs: "✓ All 7 doc update steps succeeded"

## Keyboard Shortcuts (2026-01-14)

- Swapped key assignments: Escape → Restart, Delete/Backspace → Rebuild Docs
- Badge text color changed to green (`--bg-chosen`) for visual coherence ("choose me" = "chosen")

## Files Changed

- `sites/index.html` - Console row, polling, mutual exclusion, persistent console output
- `sites/api.py` - Status endpoints, direct restart logic, daemon threads
- `tools/docs/update-project-docs.sh` - Status file writing
