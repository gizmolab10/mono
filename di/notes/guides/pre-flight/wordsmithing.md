# Wordsmithing — the five word-and-voice homes

The map of where word-and-voice truth lives. Pointers only; the truth stays in the named files. `always.md` calls this file.

| Home                 | Called on               | Owns                                           | If it fails                            | Cost                   |
| -------------------- | ----------------------- | ---------------------------------------------- | -------------------------------------- | ---------------------- |
| `lexicon.md`      | session start           | the agreed meaning of each term                | misunderstanding, wasted time          | ~1500 each session     |
| `always.md`       | every reply, read first | the behavior rules, and the map to these homes | a rule is skipped — rework, lost trust | ~700 each reply        |
| `voice.md`           | while writing prose     | tone and style (first person, casual, short)   | stiff, jargon-heavy, or long replies   | ≈5000 on<br>precheck   |
| `banned words.md` | at send and after       | the never-use words and their swaps            | misunderstanding, wasted time          | ≈5000 on<br>stop-check |

### The enforcer

- `di/.claude/hooks/` — runs precheck before send and the stop-checks after; reverts on demand. It is the gate for banned and voice. Cost ~150 a reply, ~5000 when it bounces a reply back for a rewrite.

### Notes

- lexicon feeds banned and voice; those two are its enforced subsets.
- always points here; this file points to the four content files — two hops, no content duplicated.
- the live risk is a stale pointer or a restated rule — either makes the map lie. Keep this file pointers-only, and check each pointer still resolves.
- Cost and Bounce/rewrite are rough guesses, not measured — order of magnitude only. Cost is the steady spend each turn; Bounce/rewrite is the extra full turn a check forces when it rejects a reply.
