# shared

Cross-project bundle: the subject of this project is the collaboration itself — its rules, its vocabulary, its taste.

**Current state:** the toolkit is fourteen skills (d, start, p, pac, go, define, propose, settle, t, syns, obs, check, where, summary — no two overlapping), plus `wordy` as t's careful-wording form; the law is `truth/handbook.md` (protocol renamed); zone means a project's live thinking — ideas.md for ideas, proposals.md for proposals, drive.md for the one being driven, questions.md for what waits on an answer, each existing only while it holds something; a truth is incorporated, never believed; decided pacs leave compressed stories in `truth/cases.md`; shared's drive is making the handbook fully implemented — six gaps listed; every cycle-riding file wears a lifecycle tag (born, weighed, waiting, incorporated — logs and indexes ride none; settled is gone, being the settle act and not a state). Git is permitted in `memory/`. Consolidation keeps each project's map true from git — a step between settling lines and committing. Seven projects are up: shared, ov, core, mu, me, lv, ji. panel is up too, since 7 September 2026, and mu and mj each hold their own version of its four files. Three more zone files: collisions.md for pairs of rules that cannot both be obeyed, incorporating a project.md for taking panel in, and code debt.md, written by tools/code_debt.py and never by hand. bridge is a lexicon term, the host's one file that imports from a library. The rules of reply are rebuilt: conventions.md opens with an Always section — "offer the minimum, checkable wording" and nine yes/no checks — sent every turn, and the rest of conventions, agency, the lexicon and the project's banned words arrive in rotation; three Stop hooks are log-only and relevance-check judges each reply by haiku, detached, so no turn waits. The unmurk sweep is merged and Jonathan's review of it committed; its lessons — a table row governs a sense, never a word — are in the lexicon and the banned-words table. The two-model strategy waits in `zone/fable.md`, its pac undecided. Open: checked finding 7 in `logs/questions.md`, the starved-row test Jonathan found bad, and a settle to verify in a new session. The hooks read truth/ since 7 September 2026, when the pre-flight files entered it. Six guide folders followed the same day — `collaborate/` (15 files), `develop/` (26), `philosophy/` (4), `setup/` (6), `test/` (3), `tools/` (5) — moved whole from `notes/guides/`, unsorted; ov's zone/consolidate.md proposes where each file finally goes. Open: the check's inconsistency list.

## Truths

- [handbook.md](truth/handbook.md) — the operating rules of the memory system; the authority every session loads.
- [lexicon.md](truth/lexicon.md) — the terms every project says, the memory system's and the collaboration's, defined once.
- [taste.md](truth/taste.md) — Jonathan's visual/design principles, in his own words.
- [conventions.md](truth/conventions.md) — how Jonathan wants Claude to work and speak: the Always rules, how a reply is written, the conduct rules, the banned words.
- [create a project.md](truth/create a project.md) — the steps to bring up a new project, in memory and in mono.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
- [agency.md](truth/agency.md) — how the work itself is done: what to touch, what to prove, and what never to change unasked.
- [shorthand.md](truth/shorthand.md) — the short commands Jonathan types, and what each one does; the trigger surface.
- [keywords.md](truth/keywords.md) — the words in a request that require reading a guide before acting.
- [gates.md](truth/gates.md) — which guide must be read before which kind of task.
- [kinds of tasks.md](truth/kinds%20of%20tasks.md) — task types, the guides each one needs, and the conflicts between those guides.
- [code debt.md](truth/code%20debt.md) — what the code debt file is: the row, the eight patterns counted by grep, the walk, the script that writes it and its test.
- [finished.md](truth/finished.md) — what the finished file is: the row, the three patterns counted by grep, the walk through done folders, what the tool writes, and its proof. A twin of code debt, 15 September 2026.
- [pitfalls.md](truth/pitfalls.md) — edge cases that have caused mistakes, mostly failures to read before acting.
- `collaborate/` — chat roles, prose voice, workflow discipline; moved whole from `notes/guides/collaborate/`, unsorted.
- `develop/` — how to migrate, refactor, port, style and test code; moved whole from `notes/guides/develop/`, unsorted.
- `philosophy/` — how the work is structured and why; moved whole from `notes/guides/philosophy/`, unsorted.
- `setup/` — bringing up a machine, a site, a service; moved whole from `notes/guides/setup/`, unsorted.
- `test/` — the test commands and debugging principles; moved whole from `notes/guides/test/`, unsorted.
- `tools/` — the hub app, git, and the mono tools; moved whole from `notes/guides/tools/`, unsorted.

## Zone

- [ideas.md](memory/shared/zone/ideas.md) — live thinking about the collaboration itself.
- [incorporating a project.md](zone/architecture/incorporating%20a%20project.md) — the steps a host follows to take panel in, as mu and mj did.
- [libraries.md](zone/architecture/libraries.md) — what a library is, and how a host takes one on: one alias and one bridge per library per host, nothing built on its own.
- [library projects.md](zone/architecture/library%20projects.md) — the chain of libraries, each importing the one above it, and the proposal to make the code match it.
- [proposal for finished.md](zone/proposal%20for%20finished.md) — the finished tool the shorthand names: a twin of code debt counting finished work. Proposed and decided 15 September 2026, built the same day.
- [consolidate.md](zone/consolidate.md) — the folder-by-folder detail behind the guides sorting: of the 142 now in truth/, 91 stay, 17 fold, 22 archive, 6 to zone, 9 to ws's manual, 6 die; the mechanical move is built, the sorting is a pending pac in shared's decisions.md, the drive dissolved. ov's until 15 September 2026, as is everything below from ov. ov's, then ai's, until 15 September 2026.
- [code debt.md](zone/code%20debt.md) — one line per memory file holding unfinished work, across every project. Written by tools/code_debt.py, never by hand. Named unfinished until 15 September 2026, and in memory's own zone for the day before.
- [finished.md](zone/finished.md) — one line per memory file holding finished work, across every project. Written by tools/finished.py, never by hand; the shorthand `finished` runs it.
- [converting guides to new memory design.md](zone/converting%20guides%20to%20new%20memory%20design.md) — the move of the 142 guides from every project's notes folder into truth, gathered 14 September 2026: what moved and when, the 7 September decision, the sorting folder by folder, and what is still open.

## Logs

- [log.md](logs/log.md) — the shared log, one line per entry, tagged D, I or S.
- [learn.md](logs/learn.md) — past mistakes that apply across every project, distilled into rules. Each project keeps its own at the same place, made the day its first one is written.
- [collisions.md](logs/collisions.md) — pairs of rules that cannot both be obeyed, each met in real work, with the rewrite that would end it.
- [proposals.md](logs/proposals.md) — the proposals being weighed; one leaves when it becomes the drive, dissolves into truth, or dies.
- [questions.md](logs/questions.md) — what is unanswered, one line each; empty today.
- [journal.md](logs/journal.md) — the collaboration's journal, from webseriously and di on, finished work newest first.
- [remember.md](logs/remember.md) — faster session starts, research begun 1 February 2026.
- [big rewrite log.md](logs/big%20rewrite%20log.md) — the running report of the unsupervised sweep on branch sweep/unmurk, which rewrite the guides planned.
- `ai/` — the eight files about working with an AI moved to [memory/ai/zone/ai](../ai/zone/ai/) on 14 September 2026.
