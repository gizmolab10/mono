# Single-Line Progress Display

**Started:** 2026-01-14
**Status:** Complete

## Problem

When running `update-docs`, it spewed dozens of progress lines, making it hard to see if anything went wrong and what.

## Goal

Maintain a single line of output that updates in place, showing step progress without terminal noise. Errors logged to file and displayed at end.

## What We Built

### CLI: Single-Line Progress

The `update-project-docs.sh` script now shows:
```
Step 3/7: Building docs... processing sidebar.ts
```

Each sub-item overwrites the last. On completion: `✓ All 7 steps complete`. On failure: dumps error log to stdout.

**Key tricks:**
- `\r\033[K` — carriage return + clear to end of line
- `${line:0:30}` — truncate long output
- Background process + polling to capture exit code (piping through `while read` loses it)
- Status file for hub polling

### Hub: Live Progress Console

Added a console row to the hub that shows live progress for both Restart and Rebuild Docs buttons.

**Architecture:**
- Script writes to status file (`rebuild-status.txt` or `restart-status.txt`)
- API exposes `/rebuild-status` and `/restart-status` GET endpoints
- Hub polls every 500ms, displays current status
- Stops polling when status starts with `✓` or `❌`

### Restart: Direct Process Management

Originally called `servers.sh` for each site, but that killed the API mid-process (something in the shell script was terminating python). 

Fixed by handling restarts directly in Python:
- `kill_port()` — find and kill process on port
- `subprocess.Popen()` — start new process in background
- No external script dependency

## Files Changed

- `tools/docs/update-project-docs.sh` — single-line progress + status file
- `sites/servers.sh` — single-line progress for CLI
- `sites/api.py` — `/rebuild-status`, `/restart-status` endpoints, direct restart logic
- `sites/index.html` — console row, polling functions
- `notes/guides/develop/single-line.md` — documented the tricks

## Lessons

1. **Polling > waiting** — for long operations, return immediately and poll for status
2. **Status files** — simple IPC between shell scripts and web APIs
3. **Direct control** — calling external scripts from Python can have unexpected side effects; sometimes inline logic is safer
4. **Error tolerance** — allow a few poll failures before giving up (API might be momentarily busy)
