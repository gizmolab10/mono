# mu

**Current state:** memory/mu and mono/mu are both up — mono/mu is ov's structure with one App.svelte on port 5186, in the hub under U, in the servers script, a collection in ov's browse. mu is a music browser: scan the disk, read each file's own labels, offer several hierarchies over one collection. The zone holds the goal, the challenges, and what is settled. Since 7 September 2026 it adopts core, and since 10 September 2026 it imports panel through `common/Panel.ts`, holding no version of panel's files: App.svelte hosts panel's page and hands it one line for the operation view, nothing for the details column, nothing for the controls row. Everything it takes from core arrives through `common/Core.ts`, and the two bridges are the only files that reach through an alias. `Customizations.ts` holds the name. No flesh yet: the goal in zone/project goal.md says what goes in each region.

## Truths

- [design.md](truth/design.md) — what mu is and how it is put together, as it is today.
