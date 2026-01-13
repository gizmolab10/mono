# Bubble Integration Architecture

Bubble plugins are beasts. Webseriously runs in an iframe and uses postMessage to synchronize with bubble. Ugly stuff here, but it works.

## Table of Contents

* [Overview](#overview)
* [Architecture](#architecture)
* [Plugin Files](#plugin-files)
* [Initialization Flow](#initialization-flow)
* [PostMessage Protocol](#postmessage-protocol)
  * [From Webseriously → Bubble Plugin](#from-webseriously--bubble-plugin)
  * [From Bubble Plugin → Webseriously](#from-bubble-plugin--webseriously)
* [Plugin Implementation](#plugin-implementation)
  * [Initialize (initialize.js)](#initialize-initializejs)
  * [Message Handler](#message-handler)
  * [Send to Webseriously](#send-to-webseriously)
* [DB_Bubble Implementation](#db_bubble-implementation)
  * [State Publishing](#state-publishing)
  * [Command Handling](#command-handling)
* [Bubble Plugin Properties](#bubble-plugin-properties)
* [Update Flow (update.js)](#update-flow-updatejs)
* [Standalone vs Plugin Mode](#standalone-vs-plugin-mode)
* [Edge Cases](#edge-cases)
* [Related Files](#related-files)

For how-to guides (debugging, adding state, publishing), see [plugin.md](../../guides/plugin.md).

## Overview

Webseriously can be embedded as a Bubble.io plugin, running inside an iframe with bidirectional postMessage communication. The plugin publishes state changes to Bubble and receives commands to change focus, selection, and graph mode.

## Architecture

**Bubble Plugin** (JavaScript in `bubble/` directory)

* Creates and manages iframe
* Handles postMessage communication
* Publishes state to Bubble
* Sends commands to Webseriously

**DB_Bubble** (TypeScript backend)

* Database backend for Bubble mode
* Sends state updates via postMessage
* Receives commands from plugin

## Plugin Files

| File | Purpose |
|----|----|
| `initialize.js` | Create iframe, setup message handlers |
| `update.js` | Handle property updates from Bubble |
| `change_focus.js` | Command to change focus |
| `change_selection.js` | Command to change selection (grabs) |
| `change_graph_mode.js` | Command to switch tree/radial mode |
| `replace_hierarchy.js` | Command to replace entire hierarchy |

## Initialization Flow




1. **Plugin loads** in Bubble page
2. **initialize.js** creates iframe pointing to `https://webseriously.netlify.app/?db=bubble&theme=bubble&debug=bubble`
3. **Iframe loads** Webseriously in Bubble mode
4. **DB_Bubble** detects Bubble mode via `?db=bubble` parameter
5. **Webseriously sends** `{ type: 'listening' }` message when ready
6. **Plugin responds** by sending any pending messages
7. **Bidirectional communication** established

## PostMessage Protocol

### From Webseriously → Bubble Plugin

Published to Bubble as plugin state:

```javascript
// Focus changed
{ type: 'focus_id', id: 'thing123' }
→ instance.publishState('focus_id', 'thing123')

// Details ancestry changed
{ type: 'details_id', id: 'thing456' }
→ instance.publishState('details_id', 'thing456')

// Selection (grabs) changed
{ type: 'selected_ids', ids: ['thing1', 'thing2'] }
→ instance.publishState('selected_ids', ['thing1', 'thing2'])

// Graph mode changed
{ type: 'in_radial_mode', in_radial_mode: true }
→ instance.publishState('in_radial_mode', true)

// Trigger Bubble workflow
{ type: 'trigger_an_event', trigger: 'event_name' }
→ instance.triggerEvent('event_name')

// Ready for communication
{ type: 'listening' }
→ Sets iframeIsListening flag, sends pending messages
```

### From Bubble Plugin → Webseriously

Commands sent via `instance.data.send_to_webseriously(type, object)`:

```javascript
// Change focus
{ type: 'change_focus', id: 'thing123' }

// Change selection
{ type: 'change_selection', ids: ['thing1', 'thing2'] }

// Change graph mode
{ type: 'change_graph_mode', in_radial_mode: true }

// Replace entire hierarchy
{ type: 'replace_hierarchy', hierarchy: {...} }
```

## Plugin Implementation

### Initialize (initialize.js)

```javascript
instance.data.assure_iframe_is_instantiated = function(properties) {
    const iframe = document.createElement('iframe');
    iframe.src = url_from_properties(properties);
    iframe.style.overflow = 'hidden';
    iframe.style.border = 'none';
    iframe.style.height = '100%';
    iframe.style.width = '100%';

    instance.data.iframe = iframe;
    window.addEventListener('message', handle_webseriously_message);
    instance.canvas.append(iframe);
}
```

URL parameters:

* `db=bubble` - Use Bubble database backend
* `theme=bubble` - Use Bubble theme
* `debug=bubble` - Enable Bubble debugging
* `erase=settings` - Clear user settings (optional)

### Message Handler

```javascript
function handle_webseriously_message(event) {
    if (event.data && !event.data.hello) {
        switch (event.data.type) {
            case 'focus_id':
                instance.publishState('focus_id', event.data.id);
                break;
            case 'selected_ids':
                instance.publishState('selected_ids', event.data.ids);
                break;
            case 'in_radial_mode':
                instance.publishState('in_radial_mode', event.data.in_radial_mode);
                break;
            case 'listening':
                instance.data.iframeIsListening = true;
                send_pending_messages();
                break;
        }
    }
}
```

### Send to Webseriously

```javascript
instance.data.send_to_webseriously = function(type, object) {
    const message = { type, ...object };

    if (!instance.data.iframeIsListening) {
        // Queue until iframe is ready
        instance.data.pendingMessages.push(message);
    } else {
        instance.data.iframe.contentWindow.postMessage(message, '*');
    }
}
```

**Pending messages**: Commands sent before `listening` message are queued and sent once iframe is ready.

## DB_Bubble Implementation

### State Publishing

```typescript
prepare_to_signal_bubble_plugin() {
    if (c.w_device_isMobile) { return; }  // Mobile doesn't use plugin

    // Publish focus
    window.parent.postMessage({
        type: 'focus_id',
        id: get(x.w_ancestry_focus)?.thing?.id
    }, '*');

    // Publish selection
    window.parent.postMessage({
        type: 'selected_ids',
        ids: x.si_grabs.items.map(a => a.thing?.id)
    }, '*');

    // Publish graph mode
    window.parent.postMessage({
        type: 'in_radial_mode',
        in_radial_mode: !controls.inTreeMode
    }, '*');
}
```

Called when:

* Focus changes (`x.w_ancestry_focus` subscription)
* Selection changes (`x.si_grabs.w_items` subscription)
* Graph mode changes (`controls` subscription)

### Command Handling

```typescript
setup_remote_handlers() {
    window.addEventListener('message', (event) => {
        if (event.data?.type) {
            switch (event.data.type) {
                case 'change_focus':
                    const thing = h.thing_forID(event.data.id);
                    thing?.ancestry?.becomeFocus();
                    break;

                case 'change_selection':
                    const ancestries = event.data.ids
                        .map(id => h.thing_forID(id)?.ancestry)
                        .filter(a => !!a);
                    x.si_grabs.items = ancestries;
                    break;

                case 'change_graph_mode':
                    controls.set_graphMode(event.data.in_radial_mode);
                    break;

                case 'replace_hierarchy':
                    await this.replace_hierarchy(event.data.hierarchy);
                    break;
            }
        }
    });

    // Signal ready
    window.parent.postMessage({ type: 'listening' }, '*');
}
```

## Bubble Plugin Properties

Configured in Bubble plugin editor:

| Property | Type | Purpose |
|----|----|----|
| `enable_logging` | boolean | Enable console logging |
| `erase_user_settings` | boolean | Clear settings on load |

Exposed state (readable from Bubble workflows):

| State | Type | Description |
|----|----|----|
| `focus_id` | string | Current focus thing ID |
| `details_id` | string | Current details thing ID |
| `selected_ids` | list | Array of selected thing IDs |
| `in_radial_mode` | boolean | True if radial mode, false if tree |

## Update Flow (update.js)

```javascript
function(instance, properties, context) {
    instance.data.assure_iframe_is_instantiated(properties);

    // Send commands based on property changes
    if (properties.change_focus && properties.focus_id) {
        instance.data.send_to_webseriously('change_focus', {
            id: properties.focus_id
        });
    }

    if (properties.change_selection && properties.selected_ids) {
        instance.data.send_to_webseriously('change_selection', {
            ids: properties.selected_ids
        });
    }
}
```

## Standalone vs Plugin Mode

```typescript
get isStandalone(): boolean {
    return this.t_database != T_Database.bubble;
}
```

Used throughout codebase to conditionally enable/disable features:

* Standalone: Full UI with database switcher
* Plugin: Minimal UI, Bubble owns data and controls

## Edge Cases


1. **Pending messages**: Commands sent before iframe ready are queued
2. **Mobile**: Plugin not used on mobile (c.w_device_isMobile check)
3. **Cross-origin**: postMessage uses `'*'` origin (iframe is same-origin)
4. **State sync**: Bubble state may lag during rapid changes
5. **Hierarchy replacement**: Async operation, requires rebuild

## Related Files

**TypeScript (src/lib/ts/)**:

* `database/DB_Bubble.ts` - Backend implementation
* `managers/Configuration.ts` - `w_device_isMobile` check

**JavaScript (bubble/)**:

* `initialize.js` - Plugin initialization
* `update.js` - Property updates
* `change_*.js` - Command implementations


