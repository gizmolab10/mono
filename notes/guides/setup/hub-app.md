# Hub App Design Document

- [Overview](#overview)
- [Architecture](#architecture)
- [Files](#files)
- [Status](#status)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Future Improvements](#future-improvements)

## Overview

The hub app is a browser-based dashboard for managing local development servers across the mono repository. It provides quick access to local dev servers, documentation sites, and external resources (Netlify deploys, GitHub repos).

See [hub-app-spec.md](hub-app-spec.md) for ports, UI components, and keyboard shortcuts.

## Architecture

How the pieces fit together. Read this to understand the data flow from UI to scripts and back.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser: index.html (localhost:5170)                       │
│  - UI controls                                              │
│  - Polls API for status                                     │
│  - Opens URLs in new tabs                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  API: api.py (localhost:5171)                               │
│  - POST /restart-api → restarts itself                      │
│  - POST /restart-all → servers.sh                           │
│  - POST /rebuild-docs → update-project-docs.sh              │
│  - GET /restart-status → reads status file                  │
│  - GET /rebuild-status → reads status file                  │
│  - GET /deploy-status → polls Netlify API                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Shell Scripts                                              │
│  - servers.sh: start/restart dev servers                    │
│  - update-project-docs.sh: rebuild VitePress docs           │
│  - Write progress to status files for polling               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Status Files (for async progress reporting)                │
│  - mono/logs/restart-status.txt                             │
│  - mono/logs/rebuild-status.txt                             │
└─────────────────────────────────────────────────────────────┘
```
## Files

Five files do all the work.

| File                   | Location         | Purpose                           |
| ---------------------- | ---------------- | --------------------------------- |
| index.html             | mono/sites/      | Hub app                           |
| api.py                 | mono/sites/      | Read/write single source of truth |
| servers.sh             | mono/sites/      | Start/restart Vitepress instances |
| ports.json             | mono/sites/      | Ports for each Vitepress instance |
| update-project-docs.sh | mono/tools/docs/ | Docs rebuild script               |
## Status

I want to know what the tool is doing: its status. The status appears in the console row. It is constructed from various single sources of truth (persistent state variables and status files, see tables below) via polling every half second during operations. These sources of truth are generated and updated by the two shell scripts (in the table, above).

| State Variable  | Purpose                                  |
| --------------- | ---------------------------------------- |
| rebuild_running | True while docs rebuild is in progress   |
| restart_running | True while server restart is in progress |

| File               | Location   | Purpose          |
| ------------------ | ---------- | ---------------- |
| restart-status.txt | mono/logs/ | Restart progress |
| rebuild-status.txt | mono/logs/ | Rebuild progress |
### Status File Format
- Progress: `[2/3] ws: Step 3/7: Building docs...`
- Success: `✓ mono, ws, di docs updated`
- Failure: `❌ [2/3] ws failed`


## API Endpoints

The HTTP interface between the browser and the backend. It runs on port 5171. Reads/writes single source of truth.

### POST /restart-api
Restarts the API server itself. Spawns a new process and exits. The hub polls until the API is back, then reloads the page.

### POST /restart-all
Starts servers.sh in background thread. Returns immediately.

### GET /restart-status
Returns:
```json
{
  "status": "Starting ws on 5172...",
  "done": false,
  "running": true
}
```

### POST /rebuild-docs
Starts update-project-docs.sh in background thread. Returns immediately.

**Current behavior**: Rebuilds all projects (mono, ws, di) sequentially.

### GET /rebuild-status
Returns:
```json
{
  "status": "Step 3/7: Building docs...",
  "project": "all",
  "done": false,
  "running": true
}
```

### GET /deploy-status
Polls Netlify API for all sites. Returns:
```json
{
  "ws": {"state": "ready", ...},
  "ws-docs": {"state": "building", ...},
  ...
}
```
## Future Improvements

Ideas for later.

1. Add individual project rebuild option
2. Add server health indicators
3. Add git status/branch display
4. Add quick commit/push functionality

## Environment Variables

If polling of the Netlify deployment shows nothing, execute `echo $NETLIFY_ACCESS_TOKEN`. If empty:

1. Get a token:
   - **Jonathan**: Check 1Password for "Netlify Access Token"
   - **Newbie**: Go to [Netlify > User Settings > Applications > Personal access tokens](https://app.netlify.com/user/applications#personal-access-tokens) and create one
2. Add to `~/.zshrc`: `export NETLIFY_ACCESS_TOKEN=your_token_here`
3. Run `source ~/.zshrc` or restart your terminal

| Variable | Purpose |
|----------|--------|
| NETLIFY_ACCESS_TOKEN | For polling the status of Netlify deployment |
