# Handoff

**Status:** active. Layout frame with a collapsible details region (di hamburger toggle, snippet, persists across reload), a Content region holding the "Intersection" text + the "Build N" opener, and a build-notes popup that hides both regions while open. Accent picker themes the page live.

## Next

Three coding tasks remain in [code debt](code%20debt.md) under "work":

1. **Netlify single build** — build only the project that changed on a push.
2. **Add-document flow** — an "add" button in controls, an add view in the content area, a content-area mode store (add / search / browse), a large drop target, a tags chooser, a document store.
3. **Auto text color** — flip `--text-color` white/black by the background's luminance.

**Next:** the Netlify single-project build (item 1).
