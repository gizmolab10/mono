# Bubble Plugin Guide

How-to's for working with the Bubble plugin. For architecture details, see [bubble.md](../architecture/platforms/bubble.md).

## Table of Contents
- [Debugging](#debugging)
- [Adding a State](#adding-a-state)
- [Publishing a New Version](#publishing-a-new-version)
- [Best Practices](#best-practices)

## Debugging

Enable logging via `enable_logging: true` plugin property. All messages logged with `[PLUGIN]` prefix:

```javascript
LOG('initializing with url:', url);
LOG('PUBLISH --> focus_id:', event.data.id);
LOG('LISTENING');
```

From Webseriously side, use `?debug=bubble` parameter to enable DB_Bubble logging.

## Adding a State

When i need to expose new state to Bubble, there's a dance between TypeScript and JavaScript. Here's the checklist.

### 1. Add the postMessage (TypeScript)

In `DB_Bubble.ts`, inside `prepare_to_signal_bubble_plugin()`:

```typescript
window.parent.postMessage({
    type: 'my_new_tag',
    value: whatever_value
}, '*');
```

Subscribe to the relevant store so it fires when state changes:

```typescript
my_store.subscribe(() => {
    this.prepare_to_signal_bubble_plugin();
});
```

### 2. Handle the message (JavaScript)

In `bubble/initialize.js`, add a case to `handle_webseriously_message()`:

```javascript
case 'my_new_tag':
    instance.publishState('my_new_tag', event.data.value);
    break;
```

### 3. Register the state in Bubble

In the Bubble plugin editor:

1. Go to "Exposed States"
2. Add `my_new_tag` with the appropriate type (text, number, list, etc.)
3. Save and deploy

### 4. Test the flow

1. Enable `?debug=bubble` in the URL
2. Trigger the state change in Webseriously
3. Check console for the postMessage
4. Verify Bubble's plugin inspector shows the new state

### Gotcha

Bubble's plugin editor is finicky. If you rename or change the type of an exposed state, existing workflows using it may break silently. Better to add a new state than modify an existing one.

## Publishing a New Version

The Catalyst team wants a stable version of webseriously, one that is isolated from ongoing work. To do this, I create a git branch and point netlify at it, then tell bubble.io. Done!

The most self-documenting name for the branch is `plugin-major-minor-incremental` (eg, plugin-0-3-4), and for the numbers to refer to the about-to-be-published version in the bubble plugin editor. In the terminal, go to the project directory, and type something like this:

`git branch plugin-0-3-5`

Then, in netlify, visit the project called `plugin.webseriously.org`. Navigate to:

- Project configuration
- Build and deploy
- Branches and deploy contexts (scroll 1/3 down the page)
- Configure (button)
- Production branch (change the name)

## Best Practices

✅ **DO**:

* Check `iframeIsListening` before sending messages
* Queue messages if iframe not ready
* Use `[PLUGIN]` prefix for logging
* Handle missing IDs gracefully
* Validate message types

❌ **DON'T**:

* Send messages before `listening` received
* Assume synchronous state updates
* Mix TypeScript and JavaScript (bubble/ is JS only)
* Test in Bubble without proper plugin setup
* Skip error handling in message handlers
