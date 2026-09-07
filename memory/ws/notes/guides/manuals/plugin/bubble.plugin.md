# Bubble Plugin

Using Webseriously inside a Bubble.io app.

## How It Works

Webseriously runs in an iframe inside your Bubble page. Communication happens via postMessage — your Bubble app sends commands, Webseriously publishes state changes back.

Your data structure lives in Bubble. Webseriously visualizes it and reports user actions. Bubble owns the data; Webseriously owns the view.

## Setting It Up

1. Install the Webseriously plugin from the Bubble plugin marketplace
2. Drag the Webseriously element onto your page
3. Configure the data source (which Bubble data type to visualize)
4. Map fields (name, parent, any extras)
5. Wire up events and actions

## Data Structure

Your Bubble data type needs at minimum:

| Field | Type | Purpose |
|-------|------|---------|
| name | text | What shows as the item label |
| parent | same type (self-referential) | Creates the hierarchy |

The parent field links an item to its parent item. Root items have no parent.

Optional fields show up in the Details panel if you map them.

## Field Mapping

In the plugin settings, tell Webseriously which Bubble fields to use:

**Name field** — displayed as the item label in the graph

**Parent field** — the self-referential link that creates hierarchy

**ID field** — Bubble's unique ID (usually automatic)

Get these wrong and you'll see: items without names, flat hierarchy (no nesting), or missing data.

## Exposed States

Webseriously publishes these states that your Bubble workflows can read:

| State | Type | Description |
|-------|------|-------------|
| `focus_id` | text | The item currently at center/focus |
| `details_id` | text | The item shown in Details panel |
| `selected_ids` | list of texts | All currently selected items |
| `in_radial_mode` | yes/no | True if radial mode, false if tree |

Use these in conditions or to sync other parts of your app with the graph.

## Events

The plugin triggers events your workflows can respond to:

| Event | When |
|-------|------|
| Item selected | User clicked an item |

More events (double-click, create, delete, move) are planned but not yet implemented.

## Actions

Your workflows can send commands to Webseriously:

| Action | What it does |
|--------|--------------|
| Change focus | Centers the graph on a specific item |
| Change selection | Selects one or more items |
| Change graph mode | Switches between tree and radial |
| Replace hierarchy | Reloads the entire data structure |

Use these to keep Webseriously in sync when data changes elsewhere in your app.

## Plugin Properties

| Property | Type | Purpose |
|----------|------|---------|
| `enable_logging` | yes/no | Console logging for debugging |
| `erase_user_settings` | yes/no | Clear saved preferences on load |

## Initialization

When the plugin loads:

1. Plugin creates an iframe pointing to Webseriously
2. Webseriously loads with `?db=bubble&theme=bubble`
3. Webseriously sends a "listening" message when ready
4. Any commands queued before ready are sent
5. Two-way communication established

Commands sent before Webseriously is ready get queued automatically — you don't need to wait.

## What's Disabled in Plugin Mode

The `?theme=bubble` parameter turns off:

- Graph editing (adding/deleting items)
- Title editing
- Horizontal scrolling
- Auto-save (Bubble owns persistence)
- Rubberband selection
- Details button

Bubble controls the data. Webseriously just displays it.

## Debugging

Things not working? Check:

1. **Data source** — is the Bubble query returning items?
2. **Field mapping** — name and parent fields correct?
3. **Parent links** — do items actually have parents set?
4. **Console** — browser dev tools show JavaScript errors
5. **Plugin version** — using the latest?

Common issues:

- **Flat graph (no nesting)** — parent field not mapped or not populated
- **No items showing** — data source returning empty, or ID mapping wrong
- **Changes not persisting** — that's expected; Bubble owns data, update via workflows

## Limitations

- No direct file export (build that in Bubble if needed)
- No editing in the graph (use Bubble UI for CRUD)
- Mobile: plugin mode not supported on mobile devices
- Performance: large datasets may lag during rapid state changes
