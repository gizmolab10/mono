# Handoff

**Status:** active. Layout frame (Intersection) with a collapsible details region (di hamburger toggle, persists across reload), an Activity region holding the arrival text + the "Build N" opener, and a build-notes popup that hides both regions while open. Accent picker themes the page live. A fixed control cluster (Controls) sits top-left in both states: the hamburger plus the operation segments.

## Next

Add-document flow, **Phase 1 skeleton done**: the operation segments (browse / add / search) persist across reload; clicking the active segment clears to nothing (the arrival landing); the app opens with nothing selected. The Add view has a drop-here rectangle (dropped files are logged, not yet saved), with top room clearing the control cluster. Remaining work is listed in [code debt](code%20debt.md) — the categories components and the local document store.

**Next:** the categories components, then the local document store.
