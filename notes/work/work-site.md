# Work Site

**Started:** 2025-01-09
**Status:** Phase 3 complete

## Table of Contents

- [Problem](#problem)
- [Goal](#goal)
- [What We Built](#what-we-built)
  - [dev-servers.sh](#dev-serverssh)
  - [dev-api.py](#dev-apipy)
  - [dev-hub.html](#dev-hubhtml)
  - [Shell Alias](#shell-alias)
- [Setup](#setup)
- [Evolving the UI](#evolving-the-ui)

## Problem

No easy way to start/restart all dev servers, or navigate between them.

## Goal

One command to restart all servers, plus a hub page for quick navigation.

## What We Built

### UX Layout
```
┌────────────────────────╮╭───────────┐
│       Work Sites       ││  Restart  │
└───────---───-──────────╯╰───────────┘
╭────────────────╮╭───────────────────╮
│    Dev Docs    ││     Projects      │
└────────────────╯╰───────────────────┘
╭────────────────────╮╭───────────────╮
│    Local Public    ││     More      │
└────-───────────────╯╰───────-───────┘
```

*Conceptual layout — shows groupings, not exact visual appearance*

Key takeaways:
- three rows of boxes
- boxes contain elements: text, segmented controls, buttons
- three layers: background, boxes, elements

#### Button Color Scheme

1. **Choices**
	1. **Chosen** — green with white text
	2. **Not chosen** — dark blue with gray text
	3. **Unavailable** — dark blue at 30% opacity
2. **Action** — dark blue with white text

#### Visual Language

Shares visual language with Design Intuition (di):
- Rounded rectangle boxes as containers
- Three-layer hierarchy: background → boxes → elements
- Muted blues/purples for containers, darker blues for buttons
- Clean separation between groups

### dev-servers.sh

Location: `~/GitHub/shared/notes/tools/sites/dev-servers.sh`

Starts/restarts dev servers, kills existing processes on ports first.

| Site | Port | Dir | Command |
|------|------|-----|---------|
| api | 5171 | shared/notes/tools/sites | python3 dev-api.py |
| hub | 5170 | shared/notes/tools/sites | python3 -m http.server 5170 |
| ws | 5173 | ws | yarn dev |
| di | 5174 | di | yarn dev |
| ws-docs | 5176 | ws | yarn docs:dev |
| shared | 5177 | shared | yarn docs:dev |

**Usage:**
```bash
restart              # start all (via alias)
~/GitHub/shared/notes/tools/sites/dev-servers.sh ws      # just ws
~/GitHub/shared/notes/tools/sites/dev-servers.sh all --kill-only  # kill all
```

**Logs:** `~/GitHub/shared/notes/tools/logs/<n>.log`

### dev-api.py

Location: `~/GitHub/shared/notes/tools/sites/dev-api.py`

Simple API server that executes dev-servers.sh commands. Listens on port 5171.

**Endpoints:**
- `POST /restart-all` — Restarts all dev servers (excludes hub and api)
- `POST /start` — Restarts a specific site (body: `{"site": "ws"}`)

### dev-hub.html

Location: `~/GitHub/shared/notes/tools/sites/dev-hub.html`

URL: http://localhost:5170/dev-hub.html

#### Segmented Controls

| Key | Control |
|-----|---------|
| 1 | Dev mode |
| 2 | Docs mode |
| W | ws project |
| D | di project |
| S | shared project |
| E | en project |

#### Action Buttons

| Key | Action |
|-----|--------|
| Enter | Restart (restarts all dev servers) |
| L | Local (navigate to localhost) |
| P | Public (navigate to deployed site) |
| R | Repo (GitHub) |
| Y | Deploy (Netlify deploys) |
| N | DNS (Netlify domain settings) |
| B | Bubble (plugin editor, ws only) |

#### UI Features

- Keyboard badges on all buttons
- Dark theme with green accent for active state
- Invalid mode/project combos are disabled
- Dynamic title-box width adjustment (accommodates Restart/Restarting text change)

### Shell Alias

Add to `~/.zshrc`:
```bash
alias restart="~/GitHub/shared/notes/tools/sites/dev-servers.sh all"
```

## Setup

```bash
chmod +x ~/GitHub/shared/notes/tools/sites/dev-servers.sh
echo 'alias restart="~/GitHub/shared/notes/tools/sites/dev-servers.sh all"' >> ~/.zshrc
source ~/.zshrc
```

## Implementation Phases

### Phase 1: Static Hub v2 ✅

- [x] Replace dev-hub.html with new layout
- [x] Add segmented controls (Dev/Docs, ws/di/shared)
- [x] Add action buttons (Start/Local/Public)
- [x] Disable invalid combos (di docs, shared dev)
- [x] Add keyboard shortcuts
- [x] Local/Public buttons work (navigate)
- [x] Start button shows command (no execution yet)

### Phase 2: Extended Actions ✅

- [x] Add Repo button (R) → GitHub repo page
- [x] Add Deploy button (Y) → Netlify deploy page
- [x] Add DNS button (N) → Netlify DNS settings
- [x] Add Bubble button (B) → Bubble plugin page (ws only)
- [x] Add "en" project
- [x] Update config with URLs per project
- [x] Disable buttons for projects that don't have that resource
- [x] Add keyboard badges to buttons

### Phase 3: Restart Server Execution ✅

- [x] Create local API endpoint (dev-api.py) to trigger dev-servers.sh
- [x] Restart button calls endpoint
- [x] Show feedback (button text changes to "Restarting" for 7 seconds)

### Phase 4: Public URLs

- [ ] a. Gather all public URLs for each project
- [ ] b. Add public URLs to dev-hub.html config
- [ ] c. Public button navigates to deployed site
- [ ] d. Update behavior matrix in docs
- [ ] e. Deploy di to Netlify
- [ ] f. Deploy shared docs to Netlify

#### Current Deployment Status

| Mode | Project | at Netlify        | Status                 |
| ---- | ------- | ----------------- | ---------------------- |
| dev  | ws      | webseriously      | deployed               |
| dev  | di      | di                | needs setup (Phase 4e) |
| docs | ws      | webseriously-docs | deployed               |
| docs | shared  | —                 | needs setup (Phase 4f) |
| dev  | shared  | n/a               | no dev mode            |
| dev  | en      | n/a               | not configured         |
| docs | di      | n/a               | no docs mode           |
| docs | en      | n/a               | not configured         |

#### Proposed Public URLs

| Mode | Project | Public URL |
|------|---------|------------|
| dev | ws | https://webseriously.netlify.app |
| dev | di | — (pending Phase 4e) |
| docs | ws | https://webseriously-docs.netlify.app |
| docs | shared | — (pending Phase 4f) |

## Evolving the UI

The interface went through several iterations:

1. **Connected lines** — Initial design used visual separators (lines with rounded ends) connecting groups. Felt cluttered.

2. **Standalone boxes** — Removed connecting lines. Each group became an independent rounded rectangle. Cleaner, but rows felt disconnected.

3. **Row alignment** — Added dynamic width matching so all rows share the same visual width. Used JavaScript to measure and sync.

4. **Two-box title row** — Title and Restart button in separate boxes side-by-side. Required complex width calculation (total - button - gap).

5. **Single-box title row** — Merged title and Restart into one box. Title uses `flex: 1` to fill space and center. Simpler code, cleaner result.

**Lessons:**
- Start simple, add complexity only when needed
- Visual elements that change size (like button text) need dynamic layout adjustment
- Fewer containers = simpler math = fewer bugs
- CSS flex handles alignment better than manual width calculations
