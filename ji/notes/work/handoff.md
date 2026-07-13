# Handoff

**Status:** active. Layout frame (Intersection) with a collapsible details region (di hamburger toggle, persists across reload), an Activity region holding the arrival text + the "Build N" opener, and a build-notes popup that hides both regions while open. Accent picker themes the page live. A fixed control cluster (Controls) sits top-left in both states: the hamburger plus the operation segments. **Design tokens complete.** **Document store built** — the ported plugin engine, ji-trimmed (five records + external bytes, local storage only, driven test green); design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: port D_Data.svelte from ws

The store now exists but nothing shows its state. ws's D_Data is a storage details readout; trimmed to ji it becomes a small panel in the details region reporting the document store and letting you switch storages.

1. **What survives the trim.** Keep the **storage switcher** (drives the registry's change-storage) and a **count readout** (documents, tags, and how many still need saving). Drop ws's import/export and its graph-model counts.
2. **Where it lives.** A new details panel, shown inside the Details region alongside the preferences panel — a details view, not part of the repository.
3. **What it reads.** The registry's active storage: its record counts and the dirty count from the bookkeeping; the active-storage store for the switcher's current pick.
4. **Open question for Jonathan:** with only the local storage built, the switcher has one option — include it now (ready for the cloud storage) or defer the switcher and show just the counts?

## Later (from code debt)

The categories UI (`add_categories.svelte`, `categories.svelte`) and wiring the Add flow to actually save through the store — the sibling "determine design and wire in" subpart. Deferred store work (disk-file blobs, the firestore storage) is tracked in [db handoff](db%20handoff.md).
