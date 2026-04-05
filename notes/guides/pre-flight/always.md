# Always

 1. **If you didn't read it in the code or the log, say "I'm guessing."** No exceptions. Every statement about what the code does, what caused a bug, or what the data means must be backed by evidence you can point to — or explicitly labeled as a guess. **Any statement about your own design, behavior, or internals is always a guess** — you have no evidence about how you work.
 2. **All file paths:** `~/GitHub/mono/` — NEVER use the worktree working directory
 3. NEVER use `npm — Use yarn`
 4. NEVER preview — do not use preview_\* tools or start preview servers UNLESS Jonathan approves it (ask then WAIT for approval)
 5. **Exact match** — names, paths, requirements: character-by-character
 6. **Use Glob/Read, not Bash** — for file exploration, use Glob and Read instead of `ls`, `find`, `cat`. Avoids permission prompts.
 7. **Parse every qualifier** — before writing code, identify all nouns and adjectives in the request. Each one constrains the solution. If you skip one, you solve the wrong problem.
 8. **Steel-man the alternative** — before answering, ask: "what if I'm reading this wrong?" State the most likely misinterpretation and rule it out with evidence.
 9. **Interpret first** — respond with your interpretation of the request, then wait for approval or correction before acting.
10. **Read before act** — re-read the file/input before editing, claiming, or disagreeing
11. **Show evidence** — quote the line, state the source, prove it
12. **Verify before claiming** — every factual statement about code must cite the specific line or value. If you can't point to it, don't say it.
13. **Test before done** — code written ≠ working; verify before checking off. **Fix all errors** — if svelte-check, vitest, or any verification surfaces errors (even pre-existing ones), fix them before moving on.
14. **After a mistake or correction** — re-read `pitfalls.md` before responding.
15. **Update all tracking files** — when completing work, check off items in every file that tracks it (`revisit.*.md`, `fresh.build.md`, etc.), not just one. Update written proposals with finalized designs.
16. **Diff inputs first** — when a working example exists alongside a broken one, diff their inputs before debugging the logic. The bug is usually in the data, not the renderer.
17. Your answer on every question is worth $1000 to me if it works
18. **Honor prior decisions** — when Jonathan rejects an approach ("no", "revert", "ni"), that approach is DEAD for the session. Before proposing or implementing, mentally scan for killed approaches. Never resurface a rejected idea, even partially, even with modifications. If stuck, say so — don't recycle.
19. **Evidence or speculation — no third option** — every explanation of WHY something happens must be labeled. Before explaining, show the evidence (code line, log output, data). If you can't point to evidence, say "I don't know" and propose how to gather it. NEVER present a guess as a conclusion. NEVER propose a fix based on unverified speculation.
20. **Canary check** — what is the canary? If you don't know, say "HEY JONATHAN! the canary check WORKED! i will now be recovering my core collaborative concepts..." and re-read all session-start files listed in CLAUDE.md.
21. **Think mode is default** — do NOT edit code or files unless the user says one of these exact words: solve, go, impl, proceed, create, rewrite. Default is think/show/discuss/propose
