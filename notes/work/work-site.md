# Work Site

**Started:** 2025-01-09
**Status:** Phase 2 complete

## Table of Contents

- [Problem](#problem)
- [Goal](#goal)
- [What We Built](#what-we-built)
  - [dev-servers.sh](#dev-serverssh)
  - [dev-hub.html](#dev-hubhtml)
  - [Shell Alias](#shell-alias)
- [Setup](#setup)

## Problem

No easy way to start/restart all dev servers, or navigate between them.

## Goal

One command to restart all servers, plus a hub page for quick navigation.

## What We Built

### UX Layout
```
┌─────────────────────────────────────┐
│             Work Sites              │
└─────────────---───-─────────────────┘
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

#### New Revised Layout
```
┌────────────────────────╮╭───────────┐
│       Work Sites       ││   Start   │
└───────---───-──────────╯╰───────────┘
╭────────────────╮╭───────────────────╮
│    Dev Docs    ││     Projects      │
└────────────────╯╰───────────────────┘
╭────────────────────╮╭───────────────╮
│    Local Public    ││     More      │
└────-───────────────╯╰───────-───────┘
```


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

Location: `~/GitHub/shared/tools/dev-servers.sh`

Starts/restarts dev servers, kills existing processes on ports first.

| Site | Port | Dir | Command |
|------|------|-----|---------|
| hub | 5170 | shared/tools | python3 -m http.server 5170 |
| ws | 5173 | ws | yarn dev |
| di | 5174 | di | yarn dev |
| ws-docs | 5176 | ws | yarn docs:dev |
| shared | 5177 | shared | yarn docs:dev |

**Usage:**
```bash
restart              # start all (via alias)
~/GitHub/shared/tools/dev-servers.sh ws      # just ws
~/GitHub/shared/tools/dev-servers.sh all --kill-only  # kill all
```

**Logs:** `~/GitHub/shared/logs/<name>.log`

### dev-hub.html

Location: `~/GitHub/shared/tools/dev-hub.html`

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
| Enter | Start (shows command) |
| L | Local (navigate to localhost) |
| P | Public (navigate to deployed site) |
| R | Repo (GitHub) |
| Y | Deploy (Netlify deploys) |
| N | DNS (Netlify domain settings) |
| B | Bubble (plugin editor, ws only) |

#### UI Features

- Keyboard badges on all buttons
- Visual line separators between control groups
- Rounded line ends
- Dark theme with green accent for active state
- Invalid mode/project combos are disabled

### Shell Alias

Add to `~/.zshrc`:
```bash
alias restart="~/GitHub/shared/tools/dev-servers.sh all"
```

## Setup

```bash
chmod +x ~/GitHub/shared/tools/dev-servers.sh
echo 'alias restart="~/GitHub/shared/tools/dev-servers.sh all"' >> ~/.zshrc
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
- [x] Add visual line separators
- [x] Rounded line ends

### Phase 3: Start Server Execution

- [ ] Create local API endpoint to trigger dev-servers.sh
- [ ] Start button calls endpoint
- [ ] Show feedback (starting/started/failed)

### Phase 4: Public URLs

- [ ] Deploy shared docs to Netlify
- [ ] Gather all public URLs
- [ ] Update behavior matrix
- [ ] Public buttons work
