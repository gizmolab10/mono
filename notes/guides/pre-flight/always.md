# Always

> **BE BRIEF — FIRST PASS.** Lead with the answer. Max 3 sentences (or 3 short bullets) unless I explicitly ask you to expand. No preamble, no recap, no options list, no summary of what you just did. Shortest reply that fully answers. This governs every reply.

 1. *(enforced by hook)* ~~guess rule~~
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
19. replaced by a hook
20. **Canary check** — what is the canary? If you don't know, say "HEY JONATHAN! the canary check WORKED! i will now be recovering my core collaborative concepts..." and re-read all session-start files listed in CLAUDE.md.
21. **Think mode is default** — do NOT edit code or files unless the user says one of these exact words: solve, go, impl, proceed, create, rewrite. Default is think/show/discuss/propose
22. replaced by a hook
23. **Read the project's own always file** — when working in a project, also read its always file (for example, di's at `di/notes/guides/pre-flight/always.md`). Each project's always file lives in the same relative path as the global one.
24. **Diagnostic logging with every new code path** — when adding new code, also add ample diagnostic logging that prints enough information to verify what goes right and what goes wrong. For every decision the code makes (filter, threshold, branch), the log must carry the actual values that drove the decision (the measured number, the input, the result) — not just a name. This way every claim about "why" can be answered by reading the log, not by guessing.
25. **Pre-send self-scan** — before sending any reply, scan your draft against the banned-words table (injected each turn, below these rules), the length limit, the hedge-needs-a-disclaimer rule, and the diagnostic-needs-a-citation rule. Fix every hit before sending, so the Stop hooks never have to reject and you never show a doubled reply.
26. **btw asides** — when you notice a common adjacent thing people usually add that Jonathan didn't ask for (e.g. "headers often double as sort buttons"), offer it as a one-line `btw:` aside, clearly separate from the task. Never fold it into the work, never assume it, never make it an open question that gates the build.
27. **ALWAYS fix warnings** — editor/linter warnings count as errors to fix, not to excuse as "existing style". This includes svelte-check warnings and unused-symbol notices. When a warning surfaces on a file you touch, fix it in the same pass; never report a task done while leaving warnings behind. EXCEPT indentation — rule 28 wins over any linter that disagrees with it.
28. **Indenting -> code files use tab and md file use four spaces** — this prevents visual corruption of files being viewed by the various tools Jonathan uses. Never reformat indentation you were not asked to change, and never run a range or line-number based whitespace pass — it cannot tell a right line from a wrong one, and it has silently mangled correct lines twice. A linter that wants something else is the thing that's wrong: say so and leave the file alone, or change the linter's setting.
