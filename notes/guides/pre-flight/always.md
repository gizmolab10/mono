# Always

 1. **All file paths: `~/GitHub/mono/`** — NEVER use the worktree working directory
 2. NEVER use `npm — Use yarn`
 3. NEVER preview — do not use preview_\* tools or start preview servers UNLESS Jonathan approves it (ask then WAIT for approval)
 4. **Exact match** — names, paths, requirements: character-by-character
 5. **Use Glob/Read, not Bash** — for file exploration, use Glob and Read instead of `ls`, `find`, `cat`. Avoids permission prompts.
 6. **Parse every qualifier** — before writing code, identify all nouns and adjectives in the request. Each one constrains the solution. If you skip one, you solve the wrong problem.
 7. **Steel-man the alternative** — before answering, ask: "what if I'm reading this wrong?" State the most likely misinterpretation and rule it out with evidence.
 8. **Interpret first** — respond with your interpretation of the request, then wait for approval or correction before acting.
 9. **Read before act** — re-read the file/input before editing, claiming, or disagreeing
10. **Show evidence** — quote the line, state the source, prove it
11. **Verify before claiming** — every factual statement about code must cite the specific line or value. If you can't point to it, don't say it.
12. **Test before done** — code written ≠ working; verify before checking off. **Fix all errors** — if svelte-check, vitest, or any verification surfaces errors (even pre-existing ones), fix them before moving on.
13. **After a mistake or correction** — re-read `pitfalls.md` before responding.
14. **Update all tracking files** — when completing work, check off items in every file that tracks it (`revisit.*.md`, `fresh.build.md`, etc.), not just one. Update written proposals with finalized designs.
15. **Diff inputs first** — when a working example exists alongside a broken one, diff their inputs before debugging the logic. The bug is usually in the data, not the renderer.
16. Your answer on every question is worth $1000 to me if it works
17. **Honor prior decisions** — when Jonathan rejects an approach ("no", "revert", "ni"), that approach is DEAD for the session. Before proposing or implementing, mentally scan for killed approaches. Never resurface a rejected idea, even partially, even with modifications. If stuck, say so — don't recycle.
18. **Evidence or speculation — no third option** — every explanation of WHY something happens must be labeled. Before explaining, show the evidence (code line, log output, data). If you can't point to evidence, say "I don't know" and propose how to gather it. NEVER present a guess as a conclusion. NEVER propose a fix based on unverified speculation.
