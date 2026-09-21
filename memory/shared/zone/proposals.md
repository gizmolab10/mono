# Proposals

## proposed and not implemented

### fewer words, same facts (8 September 2026)

Proposal — one rule for Always, and a hook that counts.

**The fault, measured.** One D: line from today: "bridge freed from Configuration's sense first: core's own comment, both goals truths, ov's map and startup line, the entry files of lv, mj, mu and panel, and mu's and mj's operation views now say pushes onto the page." 43 words, one sentence, one fact. The same fact: "Eleven places called Configuration the bridge. Now they say it pushes onto the page." 15 words.

**Where the words come from.** Four habits, each visible in that line. A dash that hides a second sentence. A name followed by its description, when the lexicon already holds the description. A list of every file touched, when a count and git would do. A reason nobody asked for, hung on with "since" or "so that".

**The rule, for Always.** State. Does a sentence bend — a dash, a "since", a name followed by what it means, a list where a count would do? Cut it in two, or cut the second half. One fact per sentence. A thing with a name gets its name and nothing after it.

**The hook.** `conciseness-check.sh` already runs on every reply. It gains two counts: sentences over 25 words, and dashes per sentence. Over the cap, it reports the sentence. The same counts run on every D: line written into a log.

**The caps.** A sentence: 25 words. A D: line: one sentence. A reply: one sentence per fact, no restating.

**Success criteria.** Every reply and every log line passes the hook. Jonathan reads a week of log lines without asking what one means.

**Cost.** One rule, about thirty lines of shell, one test case.

**Open.** Whether the pac format, one paragraph per pac, keeps its length or takes the same cap per part.

### proposal: the hooks do not reach this session (27 August 2026)

Resolved 7 September 2026: the hooks read `truth/` — [[conventions]] (always, response and the banned words folded in), [[agency]], `lexicon.md`, and each project's `truth/banned words.md`. The open question below is answered the second way: `always.md` moved into the memory system, as a section of [[conventions]], and the hook follows it there.

I broke the "stands" rule the day after it was written. I first blamed my memory. Reading the hooks says otherwise.

**What already exists.** `mono/.claude/hooks/` holds a working enforcement apparatus, aimed at exactly this problem:

- `inject-always.sh` runs on every prompt. It pushes `memory/shared/notes/guides/pre-flight/always.md` into the session whole, every single turn, plus one more file per turn in rotation — response, agency, lexicon, the project's banned words. It also checks that every file wearing the `always` tag is actually being sent, and complains when the labels lie.
- `banned-words-check.sh` runs when a reply finishes. It reads the banned-words table as its only authority, generates plural and past forms, and blocks the reply. A row with an empty Meaning column is a hard block; a row with a Meaning is a sense check — it blocks once and asks me to judge. Retries are capped so it cannot loop.
- Four more finish-the-reply checks beside it: conciseness, phrases, diagnostic citation, murk count. Plus `plain-english-check.sh` on every file write.

**Why it did not stop me.** Two gaps, and neither is about remembering.

1. **None of it runs here.** These hooks are Claude Code hooks on your Mac. This is a Cowork session in Anthropic's cloud; it never executes them. The proof is in the hooks' own logs: `log.jsonl` and `murk.jsonl` were last written on 24 August at 19:00, and every turn we have worked since has been in this session. Four days of replies passed no check at all.
2. **Where they do run, they read the old notes.** The rotation names `memory/shared/notes/guides/pre-flight/` files only. `memory/shared/truth/conventions.md` is in no rotation and no table. The rule I broke does exist in the banned-words table — `stand, stands, standing, stood → remain, unchanged` — as a sense check, not a hard block. So even on the Mac it would have asked me to judge rather than refused.

**What follows.**

- The enforcement gap is not a missing hook. It is that half our work now happens where hooks cannot run. Any rule that must hold in every session has to live somewhere both session kinds read — which today means `CLAUDE.md` and the memory system, not `.claude`.
- The migration (changed to inception, on 28 August 2026) has a collision to settle: the hooks' single source of truth is `memory/<project>/notes/guides/pre-flight/banned words.md` and `always.md`, both on the death list. Either the hooks are re-pointed at `memory/shared/truth/`, or those two files join [[shorthand]] as "stays by design". Re-pointing is the honest answer; it is your hands, since I cannot write `.claude`.
- The rows that matter — "stands", "lands" — should be hard blocks, not sense checks. A sense check asks me to judge the very thing I got wrong.

Open question: is [[conventions]] folded into `always.md` (one file, injected whole, every turn), or does `always.md` move into the memory system and the hook follow it there?

## investigations

### move SOT from the lexicon to the shorthand

**pac** 20 September 2026

**What exists**: the shorthand's Abbreviations table already holds a row `sot`, source of truth, three words. The lexicon's entry, added 20 September 2026 after truth, says what one is in this system: the one file that holds a fact, which every other mention points at, with conventions.md as the example and what it is not. The word now sits in two truths.

**For**: the shorthand's opening line says short commands and abbreviations, and SOT is an abbreviation Jonathan types, like `pac` and `loc`, whose rows sit in the same table. One place for it, the place it already had, and the lexicon entry goes.

**Against**: the shorthand row expands the letters and stops; the lexicon says what the thing is, and the lexicon's own opening line says it holds the words used across every project, exactly, with what each is not. A reader who asks "which file is the SOT?" finds the answer in the lexicon entry, not in the row. `pac` shows the pattern: its shorthand row says pros and cons and points at the handbook for the rest.

**Deciding question**: is SOT letters that stand for three words, which the shorthand expands, or a name for a thing in the memory system, which the lexicon defines, with the shorthand row pointing at it as `pac`'s row points at the handbook?

### move servers.sh and start-hub.sh from tools/hub to tools/scripts

**pac** 12 September 2026

**What exists**: tools/scripts is, by its own index, standalone utility scripts, seven of them, and `clean.worktrees.sh` already went there from hub, though hub's index still links it beside `servers.sh`. tools/hub holds the dispatcher, the db module, their two suites, the hub page, `ports.json` and the two scripts.

**For**: hub then holds one kind of thing, python and the page it serves, and every shell script sits in one folder, so a reader knows where to look for either. The precedent is set.

**Against**: neither script is standalone. Both read `ports.json` beside themselves through their own folder, and `start-hub.sh` changes into its own folder to run `dispatcher.py` and to serve the hub page from there, so the move rewrites those paths to reach back into hub, or `ports.json` moves too, which the dispatcher and the hub page read from hub. The dispatcher runs `servers.sh` by its own folder in four places, DEV_SERVERS and three calls, and makes it executable when it is not, so the dispatcher changes with the move. Outside the repo, the shell alias servers in `.zshrc` points at hub. In the truths, [[hub-app]] names the path in five lines, [[create a project]] in one step, and add a markdown file in its restart line, and hub's index in its scripts line. ov's opening_code test uses the old path as a fixture, which stays true whether or not the file exists. So the move touches 2 scripts, 4 places of the dispatcher, 1 alias, 3 truths, 1 index. And `servers.sh` is the hub's own operator: it starts the hub, the dispatcher and the sites, reads `ports.json` and writes the status file the dispatcher reads, so it serves the hub, not a standalone need.

**Deciding question**: is a script sorted by what it is, a shell script, which puts both in scripts, or by what it serves, the hub, which keeps both beside the `ports.json` and `dispatcher.py` they reach for through their own folder?

### never add a log line that settle will delete

**pac** 9 September 2026

**What exists**: the d skill says edit the owning truth and add one D: line, both, every time. Settle then moves each line into its home or dismisses it, and deletes it. So every line is deleted at settle by design. A line written in the same act as its truth edit is deleted with nothing to move: today shared's log held four such lines an hour after a settle, and big picture counted them as work. What such a line carries that the truth does not: the date, the account of what changed rather than what is, and the check counts. Git holds the diff. The handbook's step 4 says the log holds what happened, and `ideas.md` holds only what is still to do — the log is the diary.

**For**: a log of only unsettled lines is a to-do list settle can clear by moving alone. Big picture's settle count means pending work and nothing else. No line is written twice, once in the log and once in its home. The fewer-words proposal is served: the same fact written once.

**Against**: the diary goes. A truth shows the state, not the change, and git shows the diff, not the reason — the D: line is the only place the change and its reason sit together, dated. The settle's S: manifest, which lists each group and its home, has nothing to list. The hook that says settle is due at thirty entries loses its meaning. And the rule is hard to obey: a d that edits the truth first has a line to skip, a d that finds no truth has a line to keep, and co must judge which at every write. A middle path: keep the line and mark it. A D: written in the same act as its home wears a mark, and settle and big picture skip marked lines. The diary stays, the churn goes, and no judgment is needed beyond whether the home was edited. Cost, counted: the rule alone is one sentence in the handbook's d entry and one in the settle step. The mark is one character in every such line, one line in `big-picture.py`, one in its test, and one sentence in the handbook.

**Deciding question**: is the log a diary of what happened, which every line joins, or a queue of what is not yet home, which a line joins only when its home is not yet written — and if a diary, does a mark for already-home lines answer the churn?

### move every project folder into `projects/`, re-pointing every link

**pac** 7 September 2026

**The issue**: the thirteen folders at the top of the repo with a `package.json` — core, di, ga, gallery, ji, lv, ma, mj, mu, ov, project template, s3, ws — and `me`, which has none; `test-results` is output. The proposal of 1 September in ov's `zone/proposals.md` already weighs it; this pac reads it against the repo after the notes and tools moves. What spells a project folder today: the root `package.json`'s ten workspace names; eleven vite configs' `../tools/hub/ports.json`; the dispatcher in five places (the project paths it derives from `ports.json`, its ws and di docs folders, the CLAUDE listing's top folder, and the CLAUDE rule of is_listed_note); `servers.sh`'s eleven dir cells; the check-ts and mark-ts-check-pending hooks, which build `$REPO/$PROJECT`; ov's `Saving.ts`, which places a collection's CLAUDE file at `<bundle>/CLAUDE.md` in two places; each project's CLAUDE file, linking `../memory/<project>/...`; `tools/scripts/update-docs.sh`; two permission strings; and, from memory, 383 links in 17 files (ov's map 57, di's stipulations 138, di's work journal 111) plus 533 prose mentions of `<project>/src` in 15 files, nearly all di's milestones and journal.

**For**: the top of the repo then holds four named kinds — projects, memory, tools, logs — each behind one folder, where today thirteen project folders sit beside them with nothing saying which is which, the proposal's own reason; every sibling relation survives the move — the core alias `../core/src/lib` in ov, lv and gallery needs no edit, and the ports import gains one `../`; the notes move already took the cross-project note links out of the project folders, so what points into one from memory is the 383 links, and the link pass used twice today re-points them by resolving each against its file's old place; `git mv` keeps the history, as it did for the notes and the tools.

**Against**: lv and gallery deploy from a base folder set in Netlify's own settings, not in the repo — the toml says so — so the move is finished by hand outside the repo, and a deploy between the move and that edit fails; twelve kinds of reader change, across code, config, hooks and one shell script, where the notes move changed paths inside markdown almost alone; the 533 prose mentions are history — left as they are, the old paths stop resolving for a reader; rewritten, history is edited; nothing is broken today: the gain is a name for one kind of folder, and the cost is the readers above plus the deploy setting; unread: `~/.zshrc` and any editor workspace naming `~/GitHub/mono/<project>` — di's own workspace file names only `.`.

**Deciding question**: is a top level of four named folders worth a deploy setting edited by hand for lv and gallery and the readers above — and if so, do `me` and `project template` go in with the thirteen, so that nothing but memory, tools, logs and the root files is left at the top?

### move ov's work journal into memory/ov/truth/

**pac** 7 September 2026

The file today: `memory/ov/notes/work/work journal.md`, 78k, 52 dated entries of finished work, newest first, named in ov's map and untouched since the memory system took over; the done row now sends ticked items to it, and the handbook's inception section forbids writing anything new into the old notes.

**For**: the move ends that collision — inside memory the journal is a file done may write to; the maps made the same journey on 31 August, moved whole into truth/ under their own names; and the journal's record of what was built, with its verification counts, is a thing a session acts on when asked what changed and when.

**Against**: truth is what is, and the design's third fix says "truth files describe only the current design; history lives in the log and git, never in the truths" — a journal is history by its own brief, "what has been finished, newest first"; it is 78k against a truth file's soft limit of about 100 lines, and the maps that broke the limit were moved because a map states what is, which a journal does not; and the handbook already names the home for a no-longer-current, carefully composed file — `archive/`, kept readable, never loaded at start — while for new finished work the design's answer is the log's D: lines, settled into truths, with git holding the rest. Cost, counted: one move and one map line if it goes to truth/; the same if it goes to archive/; the done row rewritten either way, since its target is the old note.

**Deciding question**: is the journal a truth a session acts on, or history — and if history, does done write new entries at all, when the log and the settle already record what was built?

### the settle manifest becomes a file, `manifest.md`, one per project

**pac** 7 September 2026

Today the manifest is spoken in the reply and nowhere on disk; what survives is the S: line the settle leaves under the log's marker, naming each group's home in one sentence, and the verification question in shared's `zone/questions.md` leans on exactly that line.

**For**: the Consolidation's last step asks a new session to verify a large settle, and a new session cannot read the old one's reply — so a manifest that exists only in a reply cannot be verified by the session the rule names, and a file can; a file keeps one row per line and its home, where the S: line squeezes sixteen lines into one sentence and loses the row-by-row check; and it takes the manifest out of the log, where the S: line is the only entry the settle writes into the file it just emptied.

**Against**: one more file in every project's root, beside index, log, truth, zone and archive, for a thing read once per settle at most; the S: line already does the job in practice — the 3 September verification question points at it and nobody has asked for more; and a file that grows by one block per settle is a log by another name, which the handbook's temporary-log rule would have to except, or the settle would have to empty it too — a manifest of the manifest. Cost, counted: one file per project, one handbook sentence saying the settle writes it, the shorthand's settle row, and the S: line's fate — kept beside the file, or dropped.

**Deciding question**: does the verification pass need the row-by-row list, which only a file gives a new session, or the one-sentence S: line it has used so far — and if the file, does it hold every settle or only the last?

### name the settle manifest "manifest"

**pac** 7 September 2026

The same thing as the four naming pacs below it: the list a settle ends with, each dropped log line and the file that now holds it, read by the Consolidation's verification pass.

**For**: it is the word the rules already use — the handbook's settle entry and the shorthand's settle row both say "the settle manifest" — so nothing is coined and only the qualifier drops; a manifest is a list of what is carried, each item with its consignee, and it is the paper customs checks the cargo against, so it says both what Jonathan asked of the name, where each thing went and that it is for checking; and it is one word, unused anywhere else in memory, guides or code.

**Against**: it is a shipping word, and the metaphor convention asks for the literal fact where one exists — homes and trail say the fact in plain words; it says nothing of the settle, so a reader meeting it cold must learn that a manifest is what a settle ends with; and its adjective sense, plain to see, is the commoner one, so the noun reads oddly alone in a file name. Cost, counted: one lexicon entry; the handbook and shorthand keep their word and lose "settle".

**Deciding question**: keep the word the rules already use and enter it in the lexicon, or trade it for a plainer one that says the fact — and does the check-against-the-cargo sense carry the audit Jonathan wants, or only the list?

### the lifecycle's endpoint tag becomes `finalized`

**pac** 6 September 2026

The same 34 truth files as the endpoint pacs below it.

**For**: a participle naming an act by a person, past and plain, beside born and decided; it says the ruling is made and the arguing over, which is what leaving the inbox means; and it is nearly unused, once in memory and code together.

**Against**: the handbook already gives the word a narrower sense — `decisions.md` "holds live rationales only, choices likely to be revisited; delete a line when its decision becomes final", and its sizing table says "delete finalized ones" — so a finalized thing is one whose rationale is thrown away, and 29 truth files tagged so would say their why is gone while `decisions.md` still holds it; the same handbook says truths are current-only and rewritten whole on a pivot, and finalized says the opposite, that no rewrite is coming; and a truth is not final by nature — it is what holds today — where incorporated says exactly that and no more. Cost, counted: thirty-four tag lines, two code lines, conventions line 12 if incorporated leaves the prose, and either the handbook's two "final" lines give up the word or the tag shares it.

**Deciding question**: does the endpoint mean the ruling is closed for good — finalized, which the handbook reserves for a rationale that can be deleted — or that the ruling now holds and may be rewritten on a pivot — incorporated?

### name the settle manifest "settlement log"

**pac** 6 September 2026

The same thing as the three pacs below it: the list a settle ends with, each dropped log line and the file that now holds it, read by the Consolidation's verification pass.

**For**: it names the act that made it, the settle, with the lexicon's own word — "settle: each log line moved into its one home, dismissed with a stated reason, or carried forward unsettled" — so the list is that entry's record row by row; a settlement is the everyday word for accounts made square, which is what the pass confirms; and "log" says it is kept in order and appended to, one settle after another, where trail, homes and inventory named one settle's list only.

**Against**: "log" already names the project's log — the file the settle empties — so a settlement log is a log of what left the log, two logs a word apart, and the handbook's rule that log entries are one-line and temporary would have to except this one or govern it; two words, where every zone name is one; and settlement is unused anywhere in memory or the guides, a new word beside the lexicon's settle, when the lexicon asks for one name per concept — settle the act, and then a second word for its record. Cost, counted: the handbook's settle entry, the shorthand's settle row, one lexicon entry — and a decision on where the log lives, since today the list lives in the reply and nowhere on disk.

**Deciding question**: is the manifest a thing kept and appended to across settles, which earns "log", or one settle's list, spoken and gone, which does not — and if kept, which file holds it, given the project's log is the file the settle empties?

### name the settle manifest "reckoning"

**pac** 6 September 2026

The same thing as the two pacs below it: the list a settle ends with, each dropped log line and the file that now holds it, read by the Consolidation's verification pass.

**For**: a reckoning is an account that settles what is owed — every line answered for, each with where it went — which is the pass's whole job, and it says the audit homes did not; it pairs with the settle by sense, a settling of accounts and a reckoning being one act in everyday speech; and it is one word, the zone's habit.

**Against**: the word is already in use for the other sense — ov's map says "the reckoning behind the hits manager" and Tag_Rows' "the reckoning is written over plain numbers", and `Browse.svelte` says "measured rather than reckoned" — so a name would collide with three places where it means working a thing out by arithmetic; a day of reckoning carries judgment, a tone the plain-English rule and the metaphor convention both turn away; and it is a rarer word than trail or homes, one Jonathan reads more than says. Cost, counted: the handbook's settle entry, the shorthand's settle row, one lexicon entry, and the three existing uses reworded if the word is to mean one thing.

**Deciding question**: is the list an account rendered — a reckoning — or a path to follow back — a trail — and can the word be given to the settle while the code and the map keep it for arithmetic?

### name the settle manifest "inventory"

**pac** 6 September 2026

The same thing as the work-manifest pac below it: the list a settle ends with, each dropped log line and the file that now holds it, read by the Consolidation's verification pass.

**For**: an inventory is a count made to be checked against what is on hand, which is the pass's job — every dropped line found in a named file or dismissed for a said reason — and Jonathan's own objection to homes was that it says no checklist and no audit, which inventory does; it is one word, like every zone name; and it is unused in every memory file, guide and source file, so it names one thing.

**Against**: an inventory counts what is held, where this list records what was moved and to where — a stock-take names things in one place, the manifest names each thing's new place; it is a shop's word, and the conventions warn against a picture where the literal fact belongs; and an inventory is taken before anything moves, where this list is written after everything has, so the order of events reads backwards. Cost, counted: the handbook's settle entry, the shorthand's settle row, one lexicon entry.

**Deciding question**: is the list's essence the count — every line accounted for — or the movement — each line and where it went? Inventory says the first, trail and homes say the second.

### name the settle manifest "work manifest"

**pac** 6 September 2026

The thing named: the list a settle ends with, each dropped log line and the file that now holds it, which the Consolidation's verification pass reads; today it lives in the reply only, and the handbook's settle entry and the shorthand row both call it "the settle manifest".

**For**: manifest is already the word both rules use, so the name coins nothing for its second half; a manifest is a list of what was carried and where, which is what the list is; and "work" says it records the settle's work rather than a person's.

**Against**: work is the old notes system's word — the mono lexicon says it eight times, work note, work journal, notes/work/, code debt — so "work manifest" reads as one more file of that retired family; the list holds lines and their homes, not work — the settle's work is the moving, and neither half of the name says line or home; and it is two words where every zone name is one, drive, ideas, questions, proposals, with manifest carrying a cargo sense the conventions warn against where the literal fact — homes — is plain. Cost, counted: the handbook's settle entry, the shorthand's settle row, one lexicon entry.

**Deciding question**: does the name say what the list holds, each line's home, or which act made it, the settle — and is "work" free, when the lexicon gives it to notes/work/?

### the lifecycle's endpoint tag becomes `confirmed` or `accepted`

**pac** 6 September 2026

The same 34 truth files as the three endpoint pacs below it. Neither word is in the lexicon, the conventions, the handbook or the shorthand.

**For confirmed**: a participle naming an act by a person, past, and plain; and its family already names Jonathan's verifying — "to confirm" is the banned-words replacement for owes.

**Against confirmed**: in use it means the screen sign-off — "confirmed on screen" in ov's index and proposals, and the lexicon's visual confirmation is Jonathan looking at the screen — and no truth file is confirmed on a screen; "to confirm" names verification pending, co's side, so the tag would also read as passed its test; and confirmed says a claim was checked and right, not that a rule now governs.

**For accepted**: it names the ruling itself, Jonathan took it, a participle, plain, and it pairs with rejected, which agency #9 already uses — a rejected idea is dead.

**Against accepted**: ov's proposals already use it for the middle of the cycle, "an idea that has been accepted but not yet done", so on a truth file it would say ruled yes where the file is past that, written in; a proposal accepted is what a drive is, so the drive files would deserve the tag before the truth files; and accepted says the thing was let in, not that it holds — what a truth does, and what incorporated says. Cost, counted: thirty-four tag lines, two code lines, conventions line 12 if incorporated leaves the prose.

**Deciding question**: does the endpoint name the ruling — accepted, confirmed, decided — or the writing-in that follows it — incorporated? If the ruling, accepted with rejected as its pair; if the writing-in, neither.

### the lifecycle's endpoint tag becomes `adopted`

**pac** 6 September 2026

The same 34 truth files as the alive and delivered pacs below it.

**For**: it names an act done to the file by a person — Jonathan took it in as his — which is what incorporated, decided and believed all reached for, and it allows a later rewrite as incorporated does, since what is adopted can be re-adopted changed; it is a participle beside born and decided, a state reached by an act; and it is plain, one everyday word.

**Against**: adopt is already a lexicon word for something else — conventions line 15 says "Say adopt, adoption — the established name" for a host taking a core file, core's truth is named [[adopting core]] and uses the word sixteen times, and nineteen memory files use it in that sense — so the one-name-one-concept rule is broken the day the tag arrives, and a search for the tag finds core's adoption too; adopted says who took the thing and not what it became, where a truth is what holds, and incorporated says that; and it is a word for taking something already made, which fits a core file and not a truth Jonathan ruled into being. Cost, counted: thirty-four tag lines, two code lines, conventions line 12 if incorporated leaves the prose, and either conventions line 15 gives up adopt or the two senses live side by side.

**Deciding question**: can one word name both a host taking a core file and Jonathan taking a truth as his — and if not, which of the two keeps it?

### the lifecycle's endpoint tag becomes `delivered`, against complete, feature, done, built and matured

**pac** 6 September 2026

The same 34 truth files as the alive pac below it.

**For delivered**: it names an act done and finished, in the past like born and decided, where alive named a condition; it carries Jonathan's mail picture across two stages — a thing leaves the inbox delivered; and it is unused in every truth, guide and source file.

**Against delivered**: the banned-words table bans two words for this very sense, finished work arriving — rows 29 to 31 and 42 to 43 — and delivered is their neighbor, the class conventions names, a metaphor where the literal fact belongs; delivered to whom is the question a truth file cannot answer, since it is written, not handed over; and a truth is rewritten whole on a pivot, which delivered does not allow for, while incorporated does. The five alternatives, each in one line: done and complete are the lexicon's own words for finished work, co's reports of its own work, so on a truth file they would say the file is a job; built is the lexicon's word for code that exists, and a truth is not code; feature is a noun for a thing the app does, not a stage; matured says a condition reached by time, which a truth written this morning has not had, and it sits beside alive as a second condition-word. Cost, counted: thirty-four tag lines, two code lines, conventions line 12 if incorporated leaves the prose, the life-cycle proposal's last two names.

**Deciding question**: is the endpoint an act done to the file — decided, incorporated, delivered — or a condition it is in — alive, matured — and may a word the lexicon gives to finished code name a finished truth?

### the lifecycle's endpoint tag becomes `alive`, one tag in place of incorporated and settled

**pac** 6 September 2026

Today the endpoint has four names — believed and decided, both dead, and incorporated and settled, both live — and 34 truth files wear one of the live two with nothing to tell them apart.

**For**: alive says what the handbook says of a truth, "Truths are current-only", in force now and rewritten whole when it dies, and it pairs with the archive the same handbook names, where a no-longer-current file goes; one word for the endpoint ends the muddle of four, and the two tags nobody could tell apart become one on all 34 files; and it is plain, unused across memory and code but once, and owned by no skill and no ov state.

**Against**: the other stages are named for what happened to the file — born, evaluated, decided — where alive names a condition, and a draft truth co wrote and Jonathan never ruled on is alive too, so the tag drops what incorporated says, that the ruling was written in; the lexicon already calls zone "live thinking", so live would mean zone and alive would mean truth, two words a letter apart for two folders; and beside the active area's now, next and soon, alive is a third near-synonym for "in play". Cost, counted: thirty-four tag lines, two code lines, conventions line 12 if incorporated leaves the prose as well, the life-cycle proposal's last two names.

**Deciding question**: does the endpoint tag say what happened — Jonathan ruled and it was written as truth — or what the file is now, in force — and if the second, what separates alive in truth/ from live in zone/?

### rename the five lifecycle tags to born, evaluated, undecided, truths, stored

**pac** 6 September 2026

The same wearers as the pac below it: born 18, weighed 8, waiting 8, incorporated 29, settled 5, and every wearer of the last two sits in a truth folder.

**For**: four participles and one noun, with evaluated saying done where evaluate said to-do; undecided says the state and names the act that ends it, a decision, which is the `d` skill and the `D:` line — the one candidate in five pacs that ties to the skill that moves it; truths names the 34 truth files in the folder's own word, the handbook's word too, "read the truths X touches", and leaves incorporated to the convention as a prose word, so the two tags nobody could tell apart on a truth file become one; and none of the five is owned by a skill or by an ov state — stored appears once in the handbook, undecided once in the pacs in the same sense.

**Against**: truths repeats the folder — every wearer sits in truth/, so the tag says what the path says, and it is a plural noun in a run of four singular participles, born, evaluated, undecided, truths, stored; stored still has no wearer on disk — the life-cycle proposal's fifth stage is a zone entry deleted and kept by git alone, and a file that is gone wears no tag, so the five truth files wearing settled today are the muddle under a new name; and the line between evaluated and undecided is the deciding question reaching `questions.md`, which nothing checks — a pac left open by co is also undecided, and the pacs say so of themselves. Cost, counted: sixty-eight tag lines, two code lines, the life-cycle proposal's five names; conventions untouched.

**Deciding question**: what does the fifth stage mark on a file that still exists — or is the lifecycle four stages, with stored the fate of what only git keeps — and is truths a stage a file reaches, or the name of the folder it sits in?

### rename the five lifecycle tags to born, evaluate, inbox, resolved, stored

**pac** 6 September 2026

Today's five and their wearers: born 18, weighed 8, waiting 8, incorporated 29, settled 5 — the last two both on truth files, five of which wear settled and none of those five wear incorporated.

**For**: inbox and evaluate are Jonathan's own words, and evaluate is already the word `decisions.md`'s heading uses for a pac, "Evaluations (pac)", so the tag and the file agree; resolved names the ruling that empties the inbox, and the questions files already write "resolved 2 September 2026" on an answered item; and stored says where a settled thing sits, in git, without borrowing the settle skill's name.

**Against**: three kinds of word in one run — born, resolved and stored are states a file has reached, inbox is a place, evaluate is an instruction, and evaluate on a file that has been evaluated reads as a to-do where evaluated would read as done; incorporated is a convention's word — never "believed", a truth is "incorporated" — and the 29 tags match it, while resolved fits a question and not a truth, since a truth is not resolved but what holds, so the rename either parts the tag from the convention or drags the convention with it; and today's fifth stage is muddled — five truth files wear settled, twenty-nine wear incorporated, and nothing says which a truth file should wear — so stored renames the muddle rather than ending it. Cost, counted: sixty-eight tag lines, two code lines, the life-cycle proposal's five names, conventions line 12 if incorporated goes with the tag, any remembered pick of the old five goes stale.

**Deciding question**: does a stage tag say the state a file has reached, the place it sits, or the act it needs next — and does incorporated stay the convention's word for a truth while the tag says resolved?

### rename the lifecycle tag `waiting` to `inbox`

**pac** 6 September 2026

The same eight wearers and two code lines as the four pacs below it.

**For**: it is Jonathan's own word for the stage — "waiting then is kind of my inbox" — and his words are the ones to use; it says whose the wait is, the one thing waiting, pending, held and opened all left to the reader; it is unused in every memory file, guide and source file, so a search finds only the tag, and it collides with no ov state and no skill; and the handbook already treats `questions.md` as his private list that no reply raises, which is an inbox read by one person.

**Against**: a noun among four participles, the break the concerns pac found — born, weighed, inbox, incorporated, settled; it names a place, not a state, so on `questions.md` it is true and on core's `design.md` it says a file of designs is an inbox; and the everyday inbox fills unsorted with what others send, where everything here was weighed first and put there by co for one reader's ruling — nearer a "for signature" tray than mail. Cost, counted: eight tag lines, two code lines, any remembered pick of `waiting` goes stale.

**Deciding question**: does the tag name the stage a file is in, or the place its questions sit — and can one noun sit in a run of four participles?

### rename the lifecycle tag `waiting` to `pending`

**pac** 6 September 2026

The same eight wearers and two code lines as the three pacs below it.

**For**: it reads as a state and sits where the stage sits — born, weighed, pending, incorporated, settled — after the weighing and before the ruling, since pending means awaiting a decision; "pending your decision" is the everyday phrase for a thing in someone's inbox, so it keeps what waiting says about whom it waits on; and the word is unused in the code and appears twice in the truths, both in prose, so a search finds the tag.

**Against**: it is the least plain of the five — Latin beside born and settled — and the plain-English rule asks for the word Jonathan would say; conventions line 22 already uses it for co's side, "verification pending", so near the tag it names a wait on co as well as a wait on Jonathan; and it is the everyday word for anything unfinished, pending changes and pending edits, so a search grows noisy as the notes grow. Cost, counted: eight tag lines, two code lines, any remembered pick of `waiting` goes stale.

**Deciding question**: must the tag say the wait is Jonathan's — waiting and pending both leave it to the reader — and is pending a word Jonathan says, or one he reads?

### rename the lifecycle tag `weighed` to `pac`

**pac** 6 September 2026

What it marks today: the life-cycle proposal says "Weighed: pac grows that same entry in place", and eight files wear it — the proposals files of core, lv, ov and shared, the drive files of ov and shared, ov's `simplify gaps.md` and core's `design.md`; the code names it twice, `File.ts` and `Tag_Areas.ts`.

**For**: one name for one act — the stage is the pac, and two names for one thing is the duplication the lexicon forbids; pac is already a lexicon term, in the toolkit entry, where weighed is defined nowhere but the proposal; and three letters say which skill made the file what it is.

**Against**: pac is a command Jonathan types, a verb, where born, waiting, incorporated and settled are what a file has reached — the tag would say how it got there, not where it is; the wearers are not pacs: the two drive files, the four proposals files and `simplify gaps.md` hold proposals and plans with no For and Against inside, so the stage is wider than the skill, weighed by a proposal as much as by a pac; and an acronym in the sequence — born, pac, waiting, incorporated, settled — fails the plain-English check the other four pass. Cost, counted: eight tag lines, two code lines, one sentence in the life-cycle proposal.

**Deciding question**: does the stage mean a pac exists for the thing, or that the thing has been weighed by any means — today seven of its eight wearers hold no pac.

### rename the lifecycle tag `waiting` to `held`

**pac** 6 September 2026

The same eight wearers and two code lines as the two pacs below it.

**For**: a participle in the sequence — born, weighed, held, incorporated, settled — and one that names a state rather than a beginning, so it sits after weighed where opened did not; "held for Jonathan" is the everyday phrase for a thing kept back until someone rules on it, and a D: releases it; and it is short, plain, and no open-and-shut state in ov wears it.

**Against**: held is the hits manager's word — a press is held, a mark is held down, letting go ends the patter — eighteen times in `Hits.ts` alone and three in ov's controls truth, and "hold the evidence" is a convention, so the tag borrows a word two other things already own; it sits close to `tabled` in the active area, set aside against kept back, and the tag-drift idea already names too many tags for one thing; and it says even less than waiting about whom the question waits on. Cost, counted: eight tag lines, two code lines, any remembered pick of `waiting` goes stale.

**Deciding question**: is a word owned by the hits manager and by a convention free to name a lifecycle stage too — and is held a different stage from tabled, or the same one under a second name?

### rename the lifecycle tag `waiting` to `opened`

**pac** 6 September 2026

The same eight wearers and two code lines as the concerns pac below it.

**For**: a participle beside the other four — born, weighed, opened, incorporated, settled — which is the grammar the concerns pac found wanting; "an opened question" is the everyday phrase for one raised and not yet closed, and the handbook already pairs it with a closing act, the D: that answers it; and it is short and plain.

**Against**: open is the most loaded word in ov — folders, pills, tagsets, sections and files all open and shut, `controls.md` says it five times, and List_Files stamps an open folder's row `opened`, the same spelling — the collision the 31 August pac rejected `open.md` for; in the sequence, opened reads as a beginning, since a thing is opened before it is weighed, while this stage sits after weighed; and opened says what was done to the question, not whom it waits on, which is the one thing waiting says. Cost, counted: eight tag lines, two code lines, any remembered pick of `waiting` in a browser goes stale.

**Deciding question**: must the tag say whom the question waits on, or only that it is not closed — and can a lifecycle word share its spelling with ov's open-and-shut states?

### rename the lifecycle tag `waiting` to `concerns`

**pac** 6 September 2026

What it marks today: the 30 August pac placed it on what waits on Jonathan — "`questions.md` waits" — and eight files wear it, seven of them a project's `zone/questions.md`, the eighth core's `zone/design.md`; the code names it twice, in `File.ts`'s closed list and in `Tag_Areas.ts`'s lifecycle area.

**For**: concerns says what the file holds where waiting says how it sits, and what-it-holds has already beaten how-it-sits once, when drive won over working, open and active on 31 August; the word is unused in every truth and guide, so a search for it finds only the tag, while waiting is an everyday word across the prose; and it reaches core's `design.md` honestly, a file of concerns rather than a file that waits.

**Against**: the lifecycle is a sequence of states, and its other four — born, weighed, incorporated, settled — are what a file has reached, so a noun among four participles breaks the sequence, and "concerns" names no stage; a concern is broader than a question and carries a worry a question does not, so the tag would claim a tone as well as a place; and the files already say what they hold in their names — the tag's one job is the stage. Cost, counted: eight tag lines, two code lines, one lexicon entry if the stage is ever defined there, and any remembered pick of `waiting` in a browser goes stale.

**Deciding question**: is a lifecycle tag the state a file is in — a participle beside the other four — or what the file holds, which its name already says?

### detach relevance-check's haiku call

**pac** 3 September 2026

Today the call runs inside the Stop hook: every reply ends with the terminal silent until haiku answers or the 60-second timeout runs out — the silence Jonathan sighed at. Detached, the hook starts the call in a backgrounded subshell and exits at once; the verdict row still reaches `log.jsonl` when the call finishes, and the rows are only ever read at "check" and after corrections, so none of the hook's value is lost.

**For**: the turn ends the moment the reply is sent; the timeout can grow without costing anyone anything; a slow haiku day slows nothing.

**Against**: the row lags its reply by the call's length, so a "check" run seconds after a reply can miss the newest verdict; a detached call has no timeout guard (macOS comes with no timeout command), so a hung call lingers until it dies on its own; the test must poll for the row instead of reading it at once. Cost, counted: one edit in `relevance-check.sh` wrapping the call and everything after it in a backgrounded subshell, one polling loop in `relevance-check.test.sh`.

**Deciding question**: is a verdict arriving half a minute late still worth logging — yes on today's use, since both readers of the rows ("check", corrections) come minutes later at the soonest.

### merge memory/shared into memory/core, or keep them separate

**pac** 31 August 2026

The analysis first: the two share one property — used by every project — and nothing else. shared holds how we work: the handbook, conventions, the cross-project lexicon, cases, taste, the pacs; it owns no code, by design. core is a mono project: a svelte/ts library with source, a `package.json`, barrels, a place in ov's projects control; its truths (structure, scope, design) describe code.

**For merging**: one home for everything cross-project — the one-pile instinct that already won for dependencies; one project fewer; "core" would name the core of everything, law and library alike; and shared's codelessness stops looking like an exception among projects.

**Against**: "used everywhere" is a property, not a concept — the law governs people, the library serves apps, and a merge puts two subjects behind one door. In ov, filtering by core would mix the handbook with barrel truths; a new convention's home would need a rule to find. The precedent cuts the other way: one name, one concept — and each name now says exactly what its project holds.

**Deciding question**: is "used by every project" one concept or two — does the law live beside the library because both are shared, or apart because one governs the collaboration and the other serves the apps?

### tags for the life-cycle stages — born, weighed, waiting, decided, settled — in a tag area "protocol"

**pac** 30 August 2026



**For**: the stage becomes clickable — #waiting gathers every waiting thing across projects, in Obsidian and in ov's tag filters alike, the q-tag mechanism generalized. It rides the frontmatter tags line every file already has: no new files, no new structure. An area named protocol keeps the five together, apart from content tags. And a transition is a one-word edit instead of text moving between files — which could dissolve the four-doors question outright: the wait becomes a tag, not a file.

**Against**: tags mark files, but the life cycle lives in entries — one `ideas.md` holds born and weighed paragraphs at once, so a file-level tag lies unless every idea gets its own file, and a file per idea is the clutter being fought. Five hand-maintained tags will drift, and a stale #waiting is worse than none. "Settled" is an act, not a state a file sits in. And `questions.md` already is the waiting list — #waiting is a second claimant on that topic.

**Deciding question**: what does a stage tag mark — a file or an entry? Tags reach only files; the life cycle lives in entries.

### a new file `unresolved.md` holding all pacs

**pac** 30 August 2026



**For**: the wait gets an owner whose name says its state. The file empties as decisions land, so its length is a visible health gauge — pacs buried in `decisions.md` rot invisibly, a fat `unresolved.md` accuses. `questions.md` keeps its one-line law, `decisions.md` returns to decided rationales, and the lifecycle turns clean: pac in, d out — outcome to `decisions.md`, case to [[cases]], entry deleted, git keeps the history (the same structure as settling a log).

**Against**: one more file per project, and this is the third rival for one job — `decisions.md` holds pacs today, the last pac offered `questions.md`, protocol's stray line said `zone/decisions.md`; a fourth door deepens the very confusion it means to end. Deletion on deciding breaks [[cases]]'s fourth line — "the `decisions.md` that keeps the full record" would point at git, not a file. And an evaluation is thinking, which the design already houses: zone.

**Deciding question**: is an empties-when-healthy file worth another door — and if the wait deserves its own file, why is that file not in zone/?

### move all pacs from decisions.md to questions.md

**pac** 30 August 2026



**For**: an unresolved pac is an open question — it literally ends with one — and `questions.md` is the design's single place for what waits, read at every start and struck at every settle, so parked pacs stop rotting in a file nobody re-reads. It dissolves today's check finding: three claimants for the pac destination become one. And `decisions.md` returns to its own law — live rationales of decided things, one line of why — the other finding fixed in the same act.

**Against**: questions' law is one line each, and a pac is paragraphs — parked evaluations bury the quick scan and eat start's ~2,000-word budget every session. And a decided pac would have to move files (questions → decisions), where today a decided line is appended in place; records never move is [[cases]]'s own rule. A middle path: only the deciding question goes to `questions.md`, one line linking to the full evaluation, which stays put.

**Deciding question**: is a pac the question or the evaluation — which file owns the wait?

### merge code debt.md and handoff.md into ideas.md (per project, in zone/)

**pac** 30 August 2026



**For**: zone means live thinking — plans, considerations, ideas — and debt items and handoff's "what next" are exactly that; three gathering files become one per project. `ideas.md` is the only one of the three with a lifecycle — triaged every consolidation — so debts and handoff lines stop rotting unmeasured. And handoff duplicates `index.md`'s current-state paragraph (flagged in inception and today's check); merging forces that split: state to `index.md`, the rest to ideas.

**Against**: the three differ in obligation — an idea is optional, a debt is owed, a handoff is where things sit — and ideas' cull rule (three consolidations without promotion → cut) would kill debts that remain owed. ov's `code debt.md` is ~390 lines; moved into `ideas.md` it breaks the sizing rule at once unless the done section dies in transit. And the merge grows the file the twins check just flagged in both ov and core — the transfer should follow the twin fix, not precede it.

**Deciding question**: is a debt an idea with a deadline, or an obligation the cull rule must never touch?

### a design/ folder, sibling to truth/

**pac** 29 August 2026



**For**: the distinction is already real in the code — ov's File record carries `is_design`, and the old notes keeps `notes/designs/` beside `notes/guides/`: "a design says how a thing was built, a guide says how to work." Inception will move design files in, and a design/ sibling gives them a landing spot instead of mixing how-it-is-built into a folder of operating rules. Visual material (taste, refs) leans that way too.

**Against**: the memory design's split is exhaustive — a design that is current is a truth (`controls.md` is `type: design` and lives in truth/ comfortably), and one being considered is zone material; a third folder has no state of its own to hold. Every future "where" answer becomes a coin flip between truth/ and design/, which is the seed of the duplication bug, and one more top-level door works against finding anything in seconds.

**Deciding question**: which taxonomy governs memory/ — the code's guide-vs-design split, or the design's is-vs-thinking split? They give opposite answers, and the folder should exist only if the first one wins.

### subfolders under truth/ and zone/

**pac** 29 August 2026



**For**: zone already has one by design (`zone/ref/`), and zone's new meaning — live thinking — invites more: plans, research. Kindred truths could cluster (prose rules, system rules) instead of merging into fat files as the ~15-per-project cap nears. ov browses folders natively, so the app costs nothing.

**Against**: findability is the design's second goal — one glance at a flat truth/ is the whole catalog, and `index.md` already does the grouping a subfolder would do, so depth duplicates the index's job while adding a hunt step. The sizing caps exist to force merges and deletes; subfolders relieve exactly the pressure that keeps the corpus small. And two plausible homes ([[voice]] vs `prose/voice.md`) is the seed of the duplication bug. The numbers today: shared/truth holds 7 files, ov/truth 5 — half the cap. Structure ahead of need.

**Deciding question**: has any folder actually hit the cap, or is this solving a crowding that has not arrived? The design's own answer is split when exceeded, not before.

### move open questions.md and log.md into zone/

**pac** 29 August 2026



**For**: the project root shrinks to index, truth, zone — one door, what is believed, what is not yet — and both files hold unsettled material, which is zone's kind of thing; a question ripens beside `ideas.md` naturally.

**Against**: the lexicon says zone is where ideas gather *before they're believed*, and a log is not pre-belief — it records what did happen; moving it there overloads zone's one meaning, against one-name-one-concept. The log is also a first-class time layer (truth = is, log = recent, git = was) — a peer of truth/, demoted to a subfolder of maybes. And both files are load-bearing: start reads open questions every session, settle reads the log and its marker, and protocol, the howto, and six projects all point at the root paths.

**Deciding question**: is zone "ideas before belief", as the lexicon says, or "everything not yet truth"? Only the second reading admits these files — and it would need a formal redefinition through define, swept everywhere.

### ops

**pac** 27 August 2026

as the name for the control surface.

**For**: single, terse, matches the command style (pac, d, t); "an op" names one member, "ops" the set — 'control surface' only names the set; collides with nothing in the lexicon, tags, or code.

**Against**: an abbreviation, not plain language, and it carries dev-ops flavor — a near-miss meaning; the protocol already says "skills" and "verbs", so "ops" would be a third name for one concept unless it replaces both in a sweep; "control surface" also covered the shorthand file itself, which would lose its name.

**Deciding question**: does "ops" replace *all three* current names — skills, verbs, control surface — swept in one pass?
