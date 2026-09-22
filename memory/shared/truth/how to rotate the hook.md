# Hook rotation

How co reads the rules on every turn, how to measure what reaches it, and how to divide the rotation again. Made 21 September 2026, the day the count of saves began.

## What the rotation is

On every turn co reads two parts from [hooks](collaborate/hooks.md)' inject-always.sh, `.claude/hooks/inject-always.sh`:

1. **Part A**, every turn: the Always section of [[conventions]], 1.2KB since 22 September 2026, four rules; 3.1KB and ten rules before.
2. **Part B**, one piece per turn, in order, seven pieces since 22 September 2026, the table below; the active project's `truth/banned words.md` is an eighth when it has one. shared has none, so today the round is seven turns.

The hook keeps the turn count in `.claude/hooks/.turn-count`, one number that only grows; the piece picked is the count's remainder over the list. The list is the array `PIECES` in the script; `IN_TURN` still lists the files, for the label checks. The line `--- ONE PART IN TURN: <piece> (turn N of M ...) ---` names the piece each time, a name with no spaces.

When part A and part B together pass the Claude harness's limit, the harness saves the whole to a file and co reads only the first 2KB: all of Always, 1.2KB, and the head of the division, nothing else. Measured in this session's transcript: 10KB was saved, 8.4KB was shown whole, so the limit lies between.

## How to measure what reaches co

1. `.claude/hooks/saves.jsonl` holds one row per turn since 21 September 2026: the division, its size in KB, and saved or shown. saved-output-count.sh writes it at every reply's end, and on every tenth save it hands co the tally, which co reports in the chat.
2. The limit: the smallest saved size and the largest shown size in saves.jsonl bound it. A division must sit under the smallest saved size, Always included.
3. A file's sections, in bytes:

```
awk '/^## /{if (name) printf "%7d  %s\n", size, name; name=$0; size=0} {size += length($0) + 1} END {printf "%7d  %s\n", size, name}' memory/shared/truth/conventions.md
```

4. A whole file: `wc -c` on it.

## How to divide again, whole files

1. Edit `IN_TURN` in inject-always.sh: add a file's path, or take one out. Conventions is the one file sent without its Always section; every other file is sent whole.
2. Every file in the list wears the `always` tag in the db, and every truth wearing the tag is in the list; the hook says so on screen when the two disagree. Add or take off the tag through the dispatcher's add-label route when the list changes.
3. Run `.claude/hooks/test-always-tag.sh`; all four must hold.
4. One D: line in shared's log.

## How to divide again, pieces of a file

Built 22 September 2026. A piece is one or more ranges of one file, a range running from the line that starts with one heading up to the line that starts with another, or to the end; an empty start is the top of the file. Each piece with Always must sit under the largest size seen shown whole, 8.4KB on 19 September 2026; the pieces today, bytes measured 22 September 2026:

| piece | what is in it | bytes | with Always |
| --- | --- | --- | --- |
| 1 | conventions.md, Response 1 to 7 | 4172 | 5.4KB |
| 2 | conventions.md, Response 8 to 14; lexicon.md, Who and A turn | 5676 | 6.9KB |
| 3 | conventions.md, Conduct and need translation; lexicon.md, Saying what is true | 6095 | 7.3KB |
| 4 | conventions.md, Banned words | 6151 | 7.3KB |
| 5 | agency.md, whole | 5315 | 6.5KB |
| 6 | lexicon.md, its opening and What we keep | 4869 | 6.1KB |
| 7 | lexicon.md, The memory system and Verbs to use carefully | 6307 | 7.5KB |

1. Edit `PIECES` in inject-always.sh: one entry per piece, its name with no spaces, then `@`, then its ranges as `file|from|to` with `@` between. A name is what saves.jsonl records.
2. Run `.claude/hooks/test-pieces.sh`: every non-blank line of the three files comes out in exactly one piece, and the largest output with Always is under 8.4KB. It runs the hook with a count file of its own, so the real count stands.
3. When a heading named in a range changes, the test fails on the lines that went missing; put the new heading in the range.
4. Fewer, fuller pieces are better than many small ones: a rule comes round once per round, and the round is as long as the list.
5. One D: line in shared's log.
