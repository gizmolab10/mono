# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: move di's hooks up to mono

The shared session-behavior hooks (the brief-reply check, banned-words, plain-English, guess/citation, the done-checklist, the always-file injection, the pre-edit snapshot, and so on) live under `di/.claude/hooks/` and are wired by di's own settings. But those behaviors fire in *every* project (they're active in this ji session), so they belong at the repo root, not inside di. Move them to `mono/.claude/hooks/` and wire them from mono's settings, so one copy serves all projects.

1. **Sort di-only from shared.** Walk `di/.claude/hooks/`. Most are project-neutral (brief, banned-words, plain-English, citation, done-checklist, inject-always, snapshot, ts-check). A few are di-specific (e.g. `block-di-files.sh`) and stay put. List which is which before moving anything.
2. **Move the shared scripts** to `mono/.claude/hooks/`, then point mono's `settings.local.json` at the moved paths. Remove the duplicated wiring from di's settings so a hook doesn't fire twice.
3. **Fix hardcoded di assumptions.** Any script that hardcodes a di path or reads di's always-file must take the project from the working directory (each project already keeps its own always-file at the same relative path), so the same script works from ji, ws, ga, di.
4. **Verify from two projects.** After the move, run a small edit in both ji and di and confirm each hook still fires once (not zero, not twice).

**Decision for Jonathan:** move-and-rewire wholesale, or move one hook at a time (safer, since a mis-wired hook can block every turn)? I lean one-at-a-time.

## Later (from code debt)

Matching control heights (segmented controls, buttons, inputs), remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
