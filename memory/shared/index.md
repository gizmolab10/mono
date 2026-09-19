# shared

Cross-project bundle: the subject of this project is the collaboration itself — its rules, its vocabulary, its taste.

## Truths

- [map of shared files.md](truth/map%20of%20shared%20files.md) — the files that belong to no one project: the tools, the hub, the scripts, the hooks and the commands; read it instead of discovering files using regex and wildcards, and update it when files move. Made 17 September 2026.
- [workflow.md](truth/workflow.md) — how work moves between Jonathan and co: the development states, cadence, where work lives, how it moves, proposals, tidying, friction, review. In collaborate until 16 September 2026, rewritten that day.
- [artwork/workflow.svg](truth/artwork/workflow.svg) — workflow's cycle drawn: eight boxes in a ring, start to commit and back, each step with its who beneath, a fill each for co, Jonathan and both. Made 18 September 2026 as zone/diagrams.svg by a scratch script that computed every coordinate; renamed, and in truth's artwork folder, the same day.
- [artwork/cadence.svg](truth/artwork/cadence.svg) — the cadence step drawn: the turn-taking loop, then one lane each for proposal, drive, pac, decision, idea and draft guide rule, every state a box naming the file that holds it, every arrow labelled with the task that moves it, from workflow's tables, cadence.md and the handbook. Made 18 September 2026 in the zone by a scratch script; in truth's artwork folder the same day.
- [handbook.md](truth/handbook.md) — the operating rules of the memory system; the authority every session loads.
- [lexicon.md](truth/lexicon.md) — the terms every project says, the memory system's and the collaboration's, defined once.
- [taste.md](truth/taste.md) — Jonathan's visual/design principles, in his own words.
- [conventions.md](truth/conventions.md) — how Jonathan wants Claude to work and speak: the Always rules, how a reply is written, the conduct rules, the banned words.
- [create a project.md](truth/create a project.md) — the steps to bring up a new project, in memory and in mono.
- [agency.md](truth/agency.md) — how the work itself is done: what to touch, what to prove, and what never to change unasked.
- [shorthand.md](truth/shorthand.md) — the short commands Jonathan types, and what each one does; the trigger surface.
- [keywords.md](truth/keywords.md) — the words in a request that require reading a guide before acting.
- [gates.md](truth/gates.md) — which guide must be read before which kind of task.
- [kinds of tasks.md](truth/kinds%20of%20tasks.md) — task types, the guides each one needs, and the conflicts between those guides.
- [code debt.md](write%20the%20code%20debt.md) — what the code debt file is: the row, the eight patterns counted by grep, the walk, the script that writes it and its test.
- [finished.md](truth/finished.md) — what the finished file is: the row, the three patterns counted by grep, the walk through done folders, what the tool writes, and its proof. A twin of code debt, 15 September 2026.
- [pitfalls.md](truth/pitfalls.md) — edge cases that have caused mistakes, mostly failures to read before acting.
- `collaborate/` — chat roles, prose voice, workflow discipline; moved whole from `notes/guides/collaborate/`, unsorted.
- `develop/` — how to migrate, refactor, port, style and test code; moved whole from `notes/guides/develop/`, unsorted.
- `philosophy/` — how the work is structured and why; moved whole from `notes/guides/philosophy/`, unsorted.
- `setup/` — bringing up a machine, a site, a service; moved whole from `notes/guides/setup/`, unsorted.
- `test/` — the test commands and debugging principles; moved whole from `notes/guides/test/`, unsorted.
- `tools/` — the hub app, git, and the mono tools; moved whole from `notes/guides/tools/`, unsorted.

## Zone

- [learn.md](zone/learn.md) — lessons Jonathan gave co that apply across every project, one checkbox each in co's words until he rewrites and ticks it; record moves a ticked one into its truth. Each project keeps its own at the same place. In the zone since 18 September 2026.
- [questions.md](zone/questions.md) — what is unanswered, one line each. In the zone since 18 September 2026.
- [ideas.md](memory/shared/zone/ideas.md) — live thinking about the collaboration itself.
- [proposals.md](zone/proposals.md) — the proposals being weighed; one leaves when it becomes the drive, dissolves into truth, or is culled. In the zone since 18 September 2026, in logs before.
- [incorporating a project.md](zone/architecture/incorporating%20a%20project.md) — the steps a host follows to take panel in, as mu and mj did.
- [libraries.md](zone/architecture/libraries.md) — what a library is, and how a host takes one on: one alias and one bridge per library per host, nothing built on its own.
- [library projects.md](zone/architecture/library%20projects.md) — the chain of libraries, each importing the one above it, and the proposal to make the code match it.
- [draft guide rules.md](drafted%20guide%20rules.md) — a section for workflow: a rule co writes into a guide is a checkbox, a draft, until Jonathan rewrites it, code debt counting the drafts; the 23 drafts of 15 September 2026 in two tables. Proposed 15 September 2026, undecided.
- [proposal for finished.md](zone/proposal%20for%20finished.md) — the finished tool the shorthand names: a twin of code debt counting finished work. Proposed and decided 15 September 2026, built the same day.
- [consolidate.md](zone/consolidate.md) — the folder-by-folder detail behind the guides sorting: of the 142 now in truth/, 91 stay, 17 fold, 22 archive, 6 to zone, 9 to ws's manual, 6 die; the mechanical move is built, the sorting is a pending pac in shared's decisions.md, the drive dissolved. ov's until 15 September 2026, as is everything below from ov. ov's, then ai's, until 15 September 2026.
- [dead links.md](zone/dead%20links.md) — every markdown link under memory that points at nothing, 1449 as of 2026-09-16, one table per project. Jonathan's decision, 16 September 2026.
- [code debt.md](zone/code%20debt.md) — one line per memory file holding unfinished work, across every project. Written by tools/code_debt.py, never by hand. Named unfinished until 15 September 2026, and in memory's own zone for the day before.
- [converting guides to new memory design.md](zone/converting%20guides%20to%20new%20memory%20design.md) — the move of the 142 guides from every project's notes folder into truth, gathered 14 September 2026: what moved and when, the 7 September decision, the sorting folder by folder, and what is still open.

## Logs

- [decisions.md](logs/decisions.md) — every decision, dated, never deleted, and the pacs decided. In logs since 18 September 2026, the open pacs in zone/proposals.md.
- [finished.md](logs/finished.md) — one line per memory file holding finished work, across every project. Written by tools/finished.py, never by hand; the shorthand `finished` runs it. In logs since 17 September 2026.
- [log.md](logs/log.md) — the shared log, one line per entry, tagged D, I or S.
- [distilled.md](logs/distilled.md) — every lesson that became a rule, the pattern and the guide it went to, oldest first; record adds a row for each correction it places. learn.md's Distilled table until 18 September 2026, its own file since.
- [collisions.md](logs/collisions.md) — pairs of rules that cannot both be obeyed, each met in real work, with the rewrite that would end it.
- [journal.md](logs/journal.md) — the collaboration's journal, from webseriously and di on, finished work newest first.
- [remember.md](logs/remember.md) — faster session starts, research begun 1 February 2026.
- [big rewrite log.md](logs/big%20rewrite%20log.md) — the running report of the unsupervised sweep on branch sweep/unmurk, which rewrite the guides planned.
- `ai/` — the eight files about working with an AI moved to [memory/ai/zone/ai](../ai/zone/ai/) on 14 September 2026.
