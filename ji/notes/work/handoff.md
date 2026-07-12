# Handoff

**Status:** active. Layout frame (Intersection) with a collapsible details region (di hamburger toggle, persists across reload), an Activity region holding the arrival text + the "Build N" opener, and a build-notes popup that hides both regions while open. Accent picker themes the page live. A fixed control cluster (Controls) sits top-left in both states: the hamburger plus the operation segments. **Design tokens complete:** every design value (sizes, colors, fonts, weight, spacing, borders, shadow, opacity) lives once in Constants or Colors and is mirrored to CSS variables at startup — components hardcode nothing but `100%` fills and `0` resets (see the design-tokens journal entries).

## Proposal — next: phase 2, the real add-documents flow

Move the add view past the drop-rectangle skeleton to actually storing documents.

1. **Document store.** ws scouted — see [db spec](db%20spec.md). Finding: **do not port ws's framework** (it drags in Firebase + a ~1,750-line engine). ws's real local store is just one localStorage key holding a JSON list of records, and ji already owns that primitive (its Preferences wrapper). **Recommendation:** build a small ji-native store — a document is `{ id, name, tags: string[] }`, saved as a JSON list under one key. **Awaiting Jonathan's call:** trimmed native store (recommended) vs full ws port, and the document record shape.
2. **Categories UI.** Design and wire the two empty stubs: `add_categories.svelte` (create a new category) and `categories.svelte` (choose one or more). Decide the categories data model first.
3. **Wire the Add flow.** Dropped/chosen files → assign categories → save to the store; show what's stored.

## Next

Add-document flow, **Phase 1 skeleton done**: the operation segments (browse / add / search) persist across reload; clicking the active segment clears to nothing (the arrival landing); the app opens with nothing selected. The Add view has a drop-here rectangle (dropped files are logged, not yet saved), with top room clearing the control cluster. Remaining work is listed in [code debt](code%20debt.md) — the categories components and the local document store.

**Next:** the categories components, then the local document store.
