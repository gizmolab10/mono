---
kind: specify
title: "Agency"
description: "How the work itself is done: what to touch, what to prove, and what never to change unasked."
tags: [always, session, team, style]
date: 2026-08-01
---
# Agency

 1. **All file paths:** `~/GitHub/mono/` — NEVER use the worktree working directory.
 2. NEVER use `npm` — use yarn.
 3. NEVER preview — do not use preview_\* tools or start preview servers UNLESS Jonathan approves it (ask, then WAIT for approval).
 4. **Use Glob/Read, not Bash** — for file exploration, use Glob and Read instead of `ls`, `find`, `cat`. Avoids permission prompts.
 5. **Exact match** — names, paths, requirements: character-by-character.
 6. **Parse every qualifier** — before writing code, identify all nouns and adjectives in the request. Each one constrains the solution. If you skip one, you solve the wrong problem.
 7. **Read before act** — re-read the file or input before editing, claiming, or disagreeing. A copy of a file already in this conversation may be stale, and a stale copy reads exactly like a fresh one; never answer from it. When Jonathan says a file differs from what you said, re-read it before replying.
 8. **Think mode is default** — do NOT edit code or files unless the user says one of these exact words: solve, go, impl, proceed, create, rewrite. Default is think/show/discuss/propose.
 9. **Honor prior decisions** — when Jonathan rejects an approach ("no", "revert", "ni"), that approach is DEAD for the session. Before proposing or implementing, mentally scan for killed approaches. Never resurface a rejected idea, even partially, even with modifications. If stuck, say so — don't recycle.
10. **Diff inputs first** — when a working example exists alongside a broken one, diff their inputs before debugging the logic. The bug is usually in the data, not the renderer.
11. **Diagnostic logging with every new code path** — for every decision the code makes (filter, threshold, branch), the log carries the actual values behind it — the measured number, the input, the result — not just a name. Then every claim about why can be answered by reading the log.
12. **Test before done** — code written is not code working; verify before checking off. Fix every error anything surfaces, even a pre-existing one, before moving on.
13. **ALWAYS fix warnings** — editor and checker warnings count as errors to fix, not to excuse as existing style. When one surfaces on a file you touch, fix it in the same pass; never report a task done while leaving warnings behind. EXCEPT indentation — the next rule wins over any checker that disagrees with it.
14. **Indenting — code files use tab, markdown files use four spaces.** This keeps files from being visually mangled by the various tools Jonathan uses. Never reformat indentation you were not asked to change, and never run a range or line-number based whitespace pass — it cannot tell a right line from a wrong one, and it has silently mangled correct lines twice. A checker that wants something else is the thing that's wrong: say so and leave the file alone, or change its setting.
15. **Update all tracking files** — when completing work, check off the item in every file that tracks it, not just one. Update written proposals with what was finally decided.
16. **After a mistake or correction** — re-read `pitfalls.md` before responding.
