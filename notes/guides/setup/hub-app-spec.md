# Hub App Specification

* [Ports](#ports)
* [Keyboard Shortcuts](#keyboard-shortcuts)
* [UI Components](#ui-components)

Reference for the hub app. See [hub-app.md](../develop/hub-app.md) for architecture and setup.

## Ports

Port assignments for all services. Defined in `notes/sites/ports.json`.

| Port | Service |
|------|---------|
| 5170 | Hub UI (static server) |
| 5171 | Dispatcher (command runner) |
| 5172 | ws app |
| 5173 | di app |
| 5174 | ws-docs |
| 5175 | di-docs |
| 5176 | mono-docs |

## Keyboard Shortcuts

Quick reference for power users.

| Key | Action |
|-----|--------|
| A | Select App mode |
| X | Select Docs mode |
| W | Select ws project |
| D | Select di project |
| M | Select mono project |
| L | Highlight Local button |
| T | Highlight Netlify button |
| P | Highlight Public button |
| R | Highlight Repo button |
| Y | Highlight Deploy button |
| N | Highlight DNS button |
| B | Highlight Bubble button |
| Esc | Restart local dev servers |
| ⌫ | Rebuild docs |
| \` | Restart dispatcher |
| Enter | Open highlighted URL |
| ⌘C | Copy highlighted URL |

## UI Components

What the buttons and controls do.

### Mode/Project Selection

* **Mode**: App or Docs
* **Project**: mono, ws, di
* Combinations determine which URLs/actions are available

### Top Row Buttons

| Button | Shortcut | Description |
|--------|----------|-------------|
| localhosts | Esc | Restart all local dev servers |
| docs | ⌫ | Pre-publish all md and html files |
| dispatcher | \` | Restart local command runner |
| dns | N | Open domain registrar (Dynadot) |

### Navigation Buttons

| Button | Shortcut | Description |
|--------|----------|-------------|
| Local | L | Open localhost URL for selected mode/project |
| Netlify | T | Open Netlify preview URL |
| Public | P | Open production URL |
| Repo | R | Open GitHub repo |
| Deploy | Y | Open Netlify deploys page |
| Bubble | B | Open Bubble.io (ws only) |

### Console Row

Shows status messages for:
* Restart progress (per-site verification)
* Rebuild docs progress
* Deploy status (polls Netlify every 10s)
* Dispatcher restart status

Hover over localhosts, docs, or dispatcher to see their last status message.

### Feedback Row

The row below the mode/project segments shows:
* **Left:** Destination URL preview (when hovering action buttons)
* **Right:** Current project and mode
