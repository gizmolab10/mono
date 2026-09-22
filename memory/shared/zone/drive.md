# Drive

see also [[system failure]] and [[memory/shared/logs/work journal|work journal]].

---

## hook rotation issue

Proposed 19 September 2026

### Plan

1. A rule in [[agency]]: when a hook's **output** is saved to a file, co reads that file the same turn. the file's contents will otherwise be **ignored**.
2. Avoid this using a better distribution

Avoid triggering the Claude harness to save anything to a file. Restrict every hook's **output** to well under co's (unmeasured) estimate of 10KB.

#### Proposal — divide by size

The rotated content adds up to 37.5K, measured 21 September 2026, every piece the hook goes round, bytes rounded to a tenth of a KB, the total from the bytes:

| piece                              | KB   |
| ---------------------------------- | ---- |
| conventions.md, Response           | 7.7  |
| conventions.md, Banned words       | 6.2  |
| conventions.md, Conduct            | 4.4  |
| conventions.md, need translation   | 0.4  |
| agency.md, whole                   | 5.3  |
| lexicon.md, What we keep           | 4.1  |
| lexicon.md, Verbs to use carefully | 3.3  |
| lexicon.md, The memory system      | 3.0  |
| lexicon.md, Saying what is true    | 1.1  |
| lexicon.md, A turn                 | 0.9  |
| lexicon.md, its opening            | 0.8  |
| lexicon.md, Who                    | 0.4  |
| total, the whole rotation          | 37.5 |

Reading [[always]] takes 3.1K, leaving slightly less than 7K for each division. That's 6 divisions. 

#### Seven divisions

1. Six divisions forces rewriting the files. Jonathan says this is not necessary.
2. Seven pieces, each under 6.9K, cut at section headings, Response at its rule 7:

| division | what is in it                                                              | KB  |
| -------- | -------------------------------------------------------------------------- | --- |
| 1        | conventions.md, Banned words and need translation                          | 6.6 |
| 2        | agency.md, and the lexicon's Saying what is true                           | 6.4 |
| 3        | conventions.md, Conduct, and the lexicon's A turn, opening and Who         | 6.5 |
| 4        | conventions.md, Response rules 1 to 6, and the lexicon's The memory system | 6.8 |
| 5        | conventions.md, Response rules 7 to 12                                     | 4.0 |
| 6        | the lexicon's What we keep                                                 | 4.1 |
| 7        | the lexicon's Verbs to use carefully                                       | 3.3 |

3. The hook goes round the **seven**, one per turn after Always, so a full round is seven turns; today it is **three**.

### Analysis

**The cause.** On every turn, the hook inject-always.sh does two things:
1. reads the Always section of conventions.md
2. in rotation, reads one of these:
    1. conventions' rest
    2. agency
    3. the lexicon
    4. the project's banned words

When a hook's **output** on a turn is large, the Claude harness saves it to a file, and co reads only the first 2KB of it: rules 1 to 5 of Always and nothing else (eg, Response). This session's context was recently compacted. Since then, co has only read single rules of Response, those a task pointed at.

#### Use case

While editing files this afternoon, co has written file names as they appear on disk, such as `chat.md`, violating [[conventions]] (Response 4 says a file name is written as a clickable link, including the folder it lives in). Seems to me that the violations were happening BEFORE the compaction, so that cannot be the cause. What is the cause? This is a very interesting question because it assesses the reliability of this new memory system.

#### Measuring the saves

Decided 21 September 2026. The transcript records the Claude harness's notice each time it saves a hook's output, "Output too large (N KB). Full output saved to: <path>", 668 times in this session so far; the smallest saved was 10KB, and Always with agency, 8.4KB, was shown whole, so the limit lies between.

1. Built 21 September 2026: a Stop hook, saved-output-count.sh, reads the transcript's last inject-always attachment, whose stdout is the whole output and whose content is the harness's notice when saved, and appends one row to saves.jsonl: the date, the division from the ONE PART IN TURN line, the size, saved or shown. Ten checks pass.
2. Built the same day: the same script with `report`, run before each prompt, hands co the tally on every tenth save, and co reports in the chat which division caused the saves and how often, with the sizes that bound the limit. The first row is written: the lexicon, 16.2KB, saved.
3. The seven pieces are cut after the count has run a week, the limit known.
