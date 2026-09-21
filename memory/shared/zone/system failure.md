# System failure

Written 20 September 2026, where the memory system's rules did not reach co's replies, and what the misses have in common. Taken from

## Sampling area

Where every correction is, counted 20 September 2026:

| where | count |
| --- | --- |
| shared [learn](learn.md), open | 10 |
| di's [learn](../../di/zone/learn.md) | 17 |
| ov's [learn](../../ov/zone/learn.md) | 0 |
| [distilled](../logs/distilled.md), placed corrections with the pattern and where the rule went | 63 table lines, header included |
| [pitfalls](../truth/pitfalls.md), each a past mistake | 22 |
| [log](../logs/log.md) lines saying egads or correction | 13 |
| `.claude/hooks/murk.jsonl`, complaints since 12 August, each with the murky text and its plain rewrite | 85 |
| this session's transcript, 3 to 20 September, Jonathan's 1267 messages: t 79, chime 28, learn 18, no or wrong 18, huh? 14, egads 9 | 166 |
| the 23 drafts of 15 September, from 35 earlier learn entries, in the [work journal](../logs/work%20journal.md) entry of 19 September | 23 |

The transcript and the murk file are the two big samples, and both hold the text corrected, not only the lesson.

## Patterns across the sampling area

Read 20 September 2026: the 61 distilled rows, the 22 pitfalls, di's 17, the 13 log lines, the 85 murk complaints with their murky and plain text, and the 136 correcting messages of this session's transcript with the reply each corrected.

1. **Words are the biggest fault, by far.** t is the single most frequent correction, 79 of 136 in the transcript and most of the 85 murk complaints. Five of the nine egads are about a word co chose: frame, freed and swept, stand, routes, pac. The words fall in three kinds: a name co coined where the code or the lexicon had one (frame, door, shell, drawer, pills, twins, fold, gate); a metaphor or abstract noun for a plain fact (landed, lift, your eye, round of drawing, an empty hand); a tool's verb for what co takes in (sends, prints, injects, arrives).
2. **Claims without the look, second.** In every source: stale reads and wrong paths in distilled; pitfalls 1, 3 and 10; eight of di's 17, from an invented cause stated as finding to a line number quoted from memory; in the transcript the okf.md that "did not exist", the compaction named as cause, and four no's in a row on 10 September while co asserted a mechanism against what Jonathan described.
3. **Lesson have no single SOT.** 10 of the 61 distilled rows say repeated or already covered; 4 of di's 17 say twice, more than once or kept slipping. Re-read before claiming is in distilled twice, pitfalls 1, agency 7, Conduct, and di's learn three times. Stand and land are banned in four files and still written. Storage is not the failure; application at writing time is.
4. **Corrections multiply when co writes about the system itself.** By day, the transcript's corrections peak on the days of guide, plan and proposal writing: 19 September 24, 12 September 19, 9 September 14, 20 September 16; days of code work run 3 to 7. Murk complaints in August are about code explained with metaphors; in September they are about the memory system's own words: settle, manifest, door, bridge, route, matcher. With no code name to anchor to, co coins.
5. **A correction is answered with the smallest local edit, so it repeats.** t, t, t on 10 September; three rounds on one verb, sends, prints, puts, before reads; four no's on the debounce. Pitfall 16 already names it: three corrections to kill one idea. The fix each time was a change of frame, co as the subject, or Jonathan's description as the evidence, not another synonym.
6. **Where the rules went.** Of the 61 distilled rows, 17 went to Always, 15 to pitfalls, 9 to agency, 6 to conventions' Response, 5 to the lexicon or the banned words, 3 to the shorthand. Always is the one file co reads on every reply, and it holds 10 rules; the other 50 rules sit in files co reads at session start or in the hook's rotation, past the 2KB it reads when the output is saved.

## proposal to address these patterns

Proposed 20 September 2026, one line per pattern.

1. **Words.** Before every reply all words are checked against (a) banned words (b) lexicons (c) the code. Success is where co defines it or says the thing in plain words. Many failures.
2. **Claims.** HUH? The read-this-turn hook wakes co again: a sentence naming a file, a line or a count with no tool call behind it in the same reply is sent back before it reaches the screen.
3. **APPROVED — One SOT per lesson.** Every lesson lives in one truth; distilled rows and learn lines that say 'already covered' have an overstrike, and the other files point at the SOT.
4. **Writing about the system.** Before any prose about the memory system, co reads the shared lexicon in the same turn, and every name in the draft is one of its entries or a code name. WILL THIS ACTUALLY WORK?
5. **A second correction changes the frame.** On the second correction of one sentence, co changes its subject or its side, co reading, Jonathan seeing, never only a word; on the third, co asks what Jonathan sees.
6. **Ten rules in sight, the rest reachable.** Always stays at ten. The other fifty reach co every turn in pieces small enough to be read whole, the division by size in drive.md. A rule broken twice in a week moves into Always, and one Always rule moves out.

## proposal for no influence from me

i wonder if all my memory stuff is doing more harm than good. a shut-it-all-off switch, so Jonathan would experience -> co with Claude Code's own defaults and the session's context, and knowledge of the project but no rules, guidance, manipulation of words, nor influence from me.

### just knowledge of the project

no rules, guidance, manipulation of words, anything like that. proposal

Proposed 20 September 2026: a third position of the switch, `memory knowledge`, between on and off.

1. Disable every hook and ignore conventions, agency, pitfalls, gates, the collaborate folder, voice, the banned words of every project. To do this the hooks leave the settings file, kept beside it, so nothing runs before a prompt, nor after an edit nor at a reply's end.
2. Keep —> the commands, the shorthand, kinds of tasks, keywords
3. Keep for each project —> map of files, lexicons, its truths that say how the code is built, its specs, its working features, its logs and its zone, all related indexes.
4. Add "disableAllHooks": true to [settings.local.json](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/.claude/settings.local.json).
5. The repo's CLAUDE.md is rewritten.

#### risks

1. **The 13 project CLAUDE files** carry rules, and Claude Code reads them on its own. Off, those rules still reach co unless each file opens with a skip line or is renamed aside.
2. **The shorthand and keywords are rules by another door.** `pac` points at the handbook, `record` and `consolidate` at its routines, `propose` says do not execute, keywords send co to pitfalls and the develop guides. Off is not rules-free; it is rules minus five files.
3. **The measurement goes down with the hooks.** murk-count, which counts Jonathan's complaints per reply, is a hook; the flag turns it off with the rest. Line 1's way, the hooks leaving the file, can keep that one. The transcript count of 20 September needs no hook and works either way.
4. **The knowledge line is unclear for four truth folders.** develop, test, setup and tools hold guidance on how to work, not how the code is built. Line 3 needs a list, file by file.
5. **No measure of harm or good.** Without one named before the flip, the feeling decides, and the switch settles nothing.

#### proposal to rewrite CLAUDE.md

It must just (a) list the projects and where each one's knowledge files are, (b) look at disableAllHooks to know whether or not to ignore (c) rules and guidance about how to write or work and (d) the 13 project CLAUDE files (since each mixes rules with pointers). proposal

Proposed 20 September 2026. One flag, `disableAllHooks` in `.claude/settings.local.json`, is the whole switch; the `memory knowledge` position of (b) folds into it, since knowledge is read either way.

1. CLAUDE.md opens with the switch, one line: read `.claude/settings.local.json`; when `disableAllHooks` is true, read the Knowledge section below and nothing else, in this file or any project's CLAUDE file.
2. **Knowledge**, the first section: the project list, and for each project its map of files, its truth folder, its working features, its logs and its zone. Nothing about how co writes or works.
3. **Rules**, the second section, read only when `disableAllHooks` is false: what CLAUDE.md holds today, the principles, who, reading on load, the canary and the defaults, as they are.
4. Each of the 13 project CLAUDE files opens with the same one line, since Claude Code reads a project's CLAUDE file on its own when co works in that folder, and a line at its top is what makes co pass it by. I AM GUESSING the moment Claude Code reads them.
5. `memory off` sets the flag true, `memory on` sets it false. Nothing is renamed, nothing moved; the hooks stop and start with the same flag, in the running session.

