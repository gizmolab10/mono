# Work Site

**Started:** 2025-01-09
**Status:** Complete

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Hub UI](#hub-ui)
- [API Endpoints](#api-endpoints)
- [Setup](#setup)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Overview

The work site provides a local hub for managing dev servers and navigating between projects in the monorepo.

**Location:** `~/GitHub/mono/sites/`

**URL:** http://localhost:5170

## Architecture

### Sites and Ports

Defined in `sites/ports.json`:

| Site | Port | Purpose |
|------|------|---------|
| hub | 5170 | Navigation hub |
| api | 5171 | API for hub actions |
| ws app | 5172 | WebSeriously app |
| di app | 5173 | Design Intuition app |
| ws docs | 5174 | WebSeriously docs |
| di docs | 5175 | Design Intuition docs |
| mono docs | 5176 | Monorepo docs |

### Key Files

| File | Purpose |
|------|---------|
| `sites/index.html` | Hub UI |
| `sites/api.py` | API server |
| `sites/servers.sh` | Start/restart/kill dev servers |
| `sites/ports.json` | Port configuration |

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

**Note:** API (port 5171) is not in the restart list — it can't restart itself. Use `restart-api` alias separately.

## Hub UI

### Layout

```
┌─────────────────────────────────────────────┐
│  DNS  │     Work Sites     │ Restart │ Rebuild │
├─────────────────────────────────────────────┤
│            [console output]                 │
├─────────────────────────────────────────────┤
│  mono │ di │ ws  ││  App │ Docs             │
├─────────────────────────────────────────────┤
│  [destination URL preview]  │ ws │ app      │
├─────────────────────────────────────────────┤
│ Bubble │ Repo │ Deploy ││ Local │ Netlify │ Public │
└─────────────────────────────────────────────┘
```

### Features

- **Project/Mode selection** — Pick ws/di/mono + app/docs
- **Action buttons** — Navigate to local, Netlify, public URLs
- **Restart** — Restarts all dev servers with verification
- **Rebuild Docs** — Runs update-project-docs.sh for current project
- **Deploy status** — Console shows Netlify deploy progress
- **Hover preview** — Shows destination URL before clicking
- **Keyboard driven** — All actions have shortcuts

### Console Row

Shows status for:
- Restart progress (per-site verification)
- Rebuild docs progress (7 steps)
- Deploy status (polls Netlify every 10s)

Priority: restart/rebuild status takes precedence over deploy status.

Deploy status filters out Netlify's "no content change" errors (builds skipped when nothing changed) — these appear as errors in the API but aren't real failures.

### Button States

- **Green** — Active/chosen
- **Dark blue** — Available
- **Muted** — Unavailable (e.g., mono has no app mode)

## API Endpoints

### POST /restart-all
Restarts all dev servers via servers.sh.

### POST /rebuild-docs
Rebuilds docs for specified project.
```json
{"project": "ws"}  // or "di" or "mono"
```

### GET /restart-status
Returns restart progress.

### GET /rebuild-status
Returns rebuild progress.

### GET /deploy-status
Returns Netlify deploy status for all 5 sites.

### GET /deploy-status/{site}
Returns deploy status for one site (ws, di, ws-docs, di-docs, mono-docs).

## Setup

### Shell Aliases

Add to `~/.zshrc`:

```bash
alias restart="~/GitHub/mono/sites/servers.sh"
alias restart-api="kill -9 \$(lsof -ti :5171) 2>/dev/null; cd ~/GitHub/mono/sites && python3 api.py > ~/GitHub/mono/tools/logs/api.log 2>&1 &"
alias killdev="~/GitHub/mono/sites/servers.sh --kill-only"
```

### Environment

Requires `NETLIFY_ACCESS_TOKEN` for deploy status polling.

### API Logging

The API suppresses `/deploy-status` requests from logs to avoid spam (polls every 10s).

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
| Esc | Restart all servers |
| ⌫ | Rebuild docs |
| Enter | Open hovered destination |
| ⌘C | Copy hovered URL |
| L | Local |
| T | Netlify |
| P | Public |
| R | Repo |
| Y | Deploy |
| N | DNS |
| B | Bubble |
