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
15. Your answer on every question is worth $1000 to me if it works
