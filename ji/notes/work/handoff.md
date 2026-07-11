# Handoff

**Status:** active. Layout frame with a collapsible details region (di hamburger toggle, snippet, persists across reload), a Content region holding the "Intersection" text + the "Build N" opener, and a build-notes popup that hides both regions while open. Accent picker themes the page live.

## Next

Add-document flow, **Phase 1 skeleton done**: a content-mode store (browse / add / search), an "add" button, and an Add view with a drop-here rectangle (dropped files are logged, not yet saved). Remaining work is listed in [code debt](code%20debt.md) — persist the mode, turn the add button into a segmented control (segment for the current mode, bg `--accent`), add the categories components, and the local document store.

**Next:** persist the content-mode state, then the segmented control.
