# Hub App

**Started:** 2025-01-09
**Status:** Stable 2026-01-24

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Hub UI](#hub-ui)
- [API Endpoints](#api-endpoints)
- [Setup](#setup)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Overview

The hub app provides a local dashboard for managing dev servers and navigating between projects in the monorepo.

**Location:** `~/GitHub/mono/notes/sites/`

**URL:** http://localhost:5170

## Architecture

### Sites and Ports

Defined in `notes/sites/ports.json`:

| Site | Port | Purpose |
|------|------|---------|
| dispatch | 5170 | Hub UI (static server) |
| dispatcher | 5171 | API for hub actions |
| ws app | 5172 | WebSeriously app |
| di app | 5173 | Design Intuition app |
| ws docs | 5174 | WebSeriously docs |
| di docs | 5175 | Design Intuition docs |
| mono docs | 5176 | Monorepo docs |

### Key Files

| File | Purpose |
|------|---------|
| `notes/sites/index.html` | Hub UI |
| `notes/sites/dispatcher.py` | API server (command runner) |
| `notes/sites/servers.sh` | Start/restart/kill dev servers |
| `notes/sites/ports.json` | Port configuration |

### servers.sh

Manages all dev servers. Options:

```bash
restart                    # alias: restart with verification
servers.sh --no-verify     # fast restart, skip verification
servers.sh --verify-only   # check if servers are running
servers.sh --kill-only     # kill all servers
```

Verification checks:
1. Port listening (lsof, 10s timeout)
2. HTTP 200 response (curl, 20s timeout)

**Note:** The dispatcher automatically makes servers.sh executable if needed.

## Hub UI

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ localhosts │ docs │ dispatcher │      Work Sites      │ dns │
├─────────────────────────────────────────────────────────────┤
│                    [console output]                         │
├─────────────────────────────────────────────────────────────┤
│ app │ docs │                               │ mono │ di │ ws │
├─────────────────────────────────────────────────────────────┤
│  [destination URL preview]              │ [project] [mode]  │
├─────────────────────────────────────────────────────────────┤
│ bubble │ repo │ deploy │         │ local │ netlify │ public │
└─────────────────────────────────────────────────────────────┘
```

### Top Row Buttons

| Button | Shortcut | Action |
|--------|----------|--------|
| localhosts | Esc | Restart all local dev servers |
| docs | ⌫ | Pre-publish all md and html files |
| dispatcher | \` | Restart local command runner |
| dns | N | Open domain registrar |

### Features

- **Project/Mode selection** — Pick ws/di/mono + app/docs
- **Action buttons** — Navigate to local, Netlify, public URLs
- **localhosts** — Restarts all dev servers with verification
- **docs** — Runs update-project-docs.sh for all projects
- **dispatcher** — Restarts the command runner (itself)
- **Deploy status** — Console shows Netlify deploy progress
- **Hover preview** — Shows destination URL before clicking
- **Keyboard driven** — All actions have shortcuts

### Console Row

Shows status messages for:
- Restart progress (per-site verification)
- Rebuild docs progress
- Deploy status (polls Netlify every 10s)
- Dispatcher restart status

Hover over localhosts, docs, or dispatcher buttons to see their last status message.

### Feedback Row

The row below the mode/project segments shows:
- **Left:** Destination URL preview (when hovering action buttons)
- **Right:** Current project and mode

### Button States

- **Green** — Active/chosen
- **Dark blue** — Available
- **Muted** — Unavailable (e.g., mono has no app mode)

## API Endpoints

The dispatcher server (`dispatcher.py`) provides these endpoints:

### POST /restart-all
Restarts all dev servers via servers.sh.

### POST /rebuild-docs
Rebuilds docs for all projects.

### POST /restart-dispatcher
Restarts the dispatcher itself. Spawns new process then exits.

### GET /restart-status
Returns restart progress.

### GET /rebuild-status
Returns rebuild progress.

### GET /deploy-status
Returns Netlify deploy status for all 5 sites.

### GET /deploy-status/{site}
Returns deploy status for one site (ws, di, ws-docs, di-docs, mono-docs).

## Setup

### Starting the Hub

1. Start the static server for the hub UI:
   ```bash
   cd ~/GitHub/mono/notes/sites && python3 -m http.server 5170
   ```

2. Start the dispatcher:
   ```bash
   cd ~/GitHub/mono/notes/sites && python3 dispatcher.py
   ```

3. Open http://localhost:5170

### Shell Aliases

Add to `~/.zshrc`:

```bash
alias restart="~/GitHub/mono/notes/sites/servers.sh"
alias killdev="~/GitHub/mono/notes/sites/servers.sh --kill-only"
```

### Environment

Requires `NETLIFY_ACCESS_TOKEN` for deploy status polling.

## Keyboard Shortcuts

### Segments

| Key | Action |
|-----|--------|
| A | App mode |
| X | Docs mode |
| W | ws project |
| D | di project |
| M | mono project |

### Actions

| Key | Action |
|-----|--------|
| Esc | Restart all local dev servers |
| ⌫ | Rebuild docs |
| \` | Restart dispatcher |
| Enter | Open hovered destination |
| ⌘C | Copy hovered URL |
| L | Local |
| T | Netlify |
| P | Public |
| R | Repo |
| Y | Deploy |
| N | DNS |
| B | Bubble |
