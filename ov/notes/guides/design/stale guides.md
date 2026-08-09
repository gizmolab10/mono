# Stale guides

The ten guides furthest out of date, worst first. Judged by one hard test: a guide that names files which are no longer there is describing something that has moved on without it. 169 guide files were read; 15 name at least one file that is gone.

A guide's own date was not used to rank — old is not the same as wrong. Where a date matters it is named.

## The ten

1. **`ji/notes/guides/map.md`** — names three things that are gone: the tag picker (`support/Tags.svelte`, now `Select_Tags.svelte`), the chat view (`support/Ask_LLM.svelte`, which nothing imports any more), and a project content file (`md/Intersection.md`, whose whole folder is gone). It also still describes the ask view and the manage-tags stub as if both were live.

2. **`di/notes/guides/pre-flight/always.md`** — four of the paths it hands out are wrong, and they are the paths a session is told to follow first: the revert hook (`di/.claude/hooks/snap.sh` is now a folder called `snap`), di's own learn file (`notes/work/now/learn.md`, which di's own CLAUDE.md says lives at `notes/work/ai/learn.md`), and two more.

3. **`notes/guides/pre-flight/*` — anything naming the old shared always file.** The standing rules were split into `response.md` and `agency.md` on 2026-08-01; the pre-flight index and the root CLAUDE.md were updated, nothing else was checked. Any guide still saying "the always file holds the rules" now half-answers.

4. **`notes/guides/synopsis of our guides.md`** — hand-kept, dated 2026-07-08, and it knows nothing of ov, replying, working, or the labels every guide now carries. The OKF proposal already says this file is stale the moment a guide changes, which is why overview exists.

5. **`di/notes/guides/project/philosophy/logic driven design.md`** — names a checking tool (`notes/tools/validate-adherence.mjs`) and a manager (`managers/Versions.ts`) that aren't there.

6. **`di/notes/guides/project/philosophy/update guides.md`** — the guide about keeping guides current names two files that are gone: di's own map at `project/overview/map.md` and `work/now/update.guides.md`.

7. **`ji/notes/guides/specifications/db spec.md`** — names `persistable/Persistable.ts` and `state/S_Persistence.ts`, neither of which exists; ji's storage was reshaped after this was written.

8. **`ws/notes/guides/architecture/ux/breadcrumbs.md`** — names a test file and a stores file that are gone.

9. **`ws/notes/guides/architecture/ux/paging.md`** — names a pager component (`src/lib/svelte/radial/Cluster_Pager.svelte`) that is gone.

10. **`ws/notes/guides/architecture/internals/styles.md`** — names `src/lib/ts/utilities/Styles.ts`, which is gone.

## Worth knowing

- **ws's guides being old is not the same as being wrong.** Most are dated January, but only one source file in ws has changed since February, so those guides describe code that has barely moved.
- **di is the opposite.** Its guides are dated May and June while its code changed through late July — so the drift there is likely wider than this test can see.
- **Three flagged files were left off the list** because what they name are examples, not real paths: the migration guide's `/path/to/...` placeholders, the workflow guide's `notes/work/X.md`, and the chat guide's one bad link.

## How this was worked out

Every guide was scanned for file names written in code marks. Each name was looked for from the repo, from the guide's own folder, from its project, and from that project's source folders. What survived all four is a name with nothing behind it.
