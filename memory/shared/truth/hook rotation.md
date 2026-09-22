# Hook rotation

How co reads the rules on every turn, how to measure what reaches it, and how to divide the rotation again. Made 21 September 2026, the day the count of saves began.

## What the rotation is

On every turn co reads two parts from [hooks](collaborate/hooks.md)' inject-always.sh, `.claude/hooks/inject-always.sh`:

1. **Part A**, every turn: the Always section of [[conventions]], about 3.1KB.
2. **Part B**, one file per turn, in order: the rest of conventions.md, agency.md, lexicon.md, and the active project's `truth/banned words.md` when it has one. shared has none, so today the round is three turns.

The hook keeps the turn count in `.claude/hooks/.turn-count`, one number that only grows; the file picked is the count's remainder over the list. The list is the array `IN_TURN` in the script. The line `--- ONE PART IN TURN: <file> (turn N of M ...) ---` names the file each time.

When part A and part B together pass the Claude harness's limit, the harness saves the whole to a file and co reads only the first 2KB, rules 1 to 5 of Always and nothing else. Measured in this session's transcript: 10KB was saved, 8.4KB was shown whole, so the limit lies between.

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

Decided 21 September 2026 in [drive](../zone/drive.md), seven pieces each under 6.9K, not built yet. What the cut needs, when it is built:

1. The list holds pieces, each a file and a heading, in place of files: a piece is that heading and its lines up to the next heading of the same depth, cut when sent, so no file is copied and every truth stays one file.
2. The pieces are chosen from the measurements above so that each, with Always, sits under the limit: sections that fit together share a piece, a section over the limit is cut at its own sub-headings, as Response at its rule 7.
3. The round is as long as the list; a rule comes round once per round, so fewer, fuller pieces are better than many small ones.
4. When a file's headings change, the pieces that name them are checked; a heading gone breaks its piece.
