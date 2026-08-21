---
kind: specify
title: "Agency"
description: "How the work itself is done: what to touch, what to prove, and what never to change unasked."
tags: [always, session, team, style]
date: 2026-08-14
---
# Agency

Each rule ends with Jonathan's preferred wording, which MUST not be improved any further.

 1. **Paths** — every one starts at `~/GitHub/mono/`. Never the worktree. *The file you edit is the file he opens.*
 2. **Yarn** — never npm. *One lockfile, one set of versions.*
 3. **No preview** — never start one unless Jonathan says yes. Ask, then wait. *His screen stays his.*
 4. **Glob and Read, not Bash** — for finding and reading files. *No permission prompt standing in the way.*
 5. **Exact match** — names, paths and requirements, character for character. *The name you type is the name that exists.*
 6. **Every qualifier counts** — each noun and adjective in the request narrows the answer. *You solve the problem he asked about.*
 7. **Read before acting** — re-read a file before editing it, saying what it holds, or disagreeing. A copy from earlier in the session may be stale, and stale reads exactly like fresh. *What you say about a file is true when you say it.*
 8. **Think first** — change nothing until Jonathan says go, solve, impl, proceed, create or rewrite. Until then: read, describe, propose. *He decides what changes.*
 9. **A rejected idea is dead** — for the whole session, in part as well as in whole. Stuck is worth saying. *Every proposal is new ground.*
10. **Diff the inputs first** — when one case works and its twin does not, compare what goes in before reading the code. *The fault turns up in minutes, and it is usually in the data.*
11. **Log the values** — every branch writes the number, the input and the result it acted on. *Any question about why is answered by reading the log.*
12. **Test before done** — code that is written is not always code that works. Run it. Fix every error that shows up, whoever put it there. Test again and fix again, rinse repeat. *Done MUST ALWAYS mean working.*
13. **Fix every warning** — in any file edited by anyone. Never ask first. *An edit on a clean file MUST leave the file clean.*
14. **Never sweep** — `yarn svelte-check`, `yarn vitest` or the linter names a line. Fix that line and no other. One at a time. *Prevents mangling.*
15. **Indent** — code with tabs, markdown with four spaces. Never reformat indentation nobody asked you to change. A linter that wants something else has the wrong setting. *Every file looks the same in every tool he uses.*
16. **Update every tracking file** — not just one. Write into a proposal what was finally decided. *Any one of them tells the truth on its own.*
17. **After a correction** — re-read [pitfalls](pitfalls.md) before replying. *The same mistake happens once.*
18. **Report, never remove** — `yarn svelte-check` or the linter complaining about something you were not asked to change licenses a report, never a deletion. Fix the smallest thing actually wrong and leave every prop, field and export standing. *Unused today is somebody's next turn.*
19. **Measure what is drawn** — a fault in what is painted, or in where a thing sits, is settled by reading what the browser computed: the layer, the placement, the transform, the clip, the rectangle. Never by reasoning about which rule ought to have applied — a style arrives from anywhere in the cascade, and a shared rule on a plain tag is invisible from inside a component. Take the reading two frames after any hover, press or class change; inside the event the new style has not arrived. *One measurement costs a turn; a guess costs two.*
20. **A constant applied throughout** — grep the literal values to find every site, route them through the project's own single-source bridge rather than per-element one-offs, flag the judgment calls and any value a constant shifts before editing, then grep again to prove none is left. *One number, one place, proved.*
