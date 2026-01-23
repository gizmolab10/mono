# Hub App Specification

* [Ports](#ports)
* [Keyboard Shortcuts](#keyboard-shortcuts)
* [UI Components](#ui-components)

Reference for the hub app. See [hub-app.md](./hub-app.md) for architecture, environment variables, and current issues.

## Ports

Port assignments for all services. Check here if something won't start or you need to know what's running where.

| Port | Service |
|----|----|
| 5170 | Hub UI (served by dispatch or direct file) |
| 5171 | API server |
| 5172 | ws app |
| 5173 | di app |
| 5174 | ws-docs |
| 5175 | di-docs |
| 5176 | mono-docs |

## Keyboard Shortcuts

Quick reference for power users.

| Key | Action |
|----|----|
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
| Esc | Restart Vite servers |
| Backspace | Rebuild docs |
| \` | Restart API server |
| Enter | Open highlighted URL |
| Cmd+C | Copy highlighted URL |

## UI Components

What the buttons and controls do.

### Mode/Project Selection

* **Mode**: App or Docs
* **Project**: mono, ws, di
* Combinations determine which URLs/actions are available

### Action Buttons

* **vite**: Restart all Vite dev servers (calls POST /restart-all)
* **docs**: Rebuild documentation for all projects
* **api**: Restart the API server
* **Local**: Open localhost URL for selected mode/project
* **Netlify**: Open Netlify preview URL
* **Public**: Open production URL
* **Repo**: Open GitHub repo
* **Deploy**: Open Netlify deploys page
* **DNS**: Open domain registrar
* **Bubble**: Open Bubble.io (ws only)

### Console Row

Single-line status display showing:

* Restart progress
* Rebuild progress
* Deploy status (when building on Netlify)
