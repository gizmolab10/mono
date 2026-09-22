# Agency

Each rule ends with Jonathan's preferred wording, which MUST not be improved any further. (also see [[pre-flight/always|always]])

 1. **Paths** — every one starts at `~/GitHub/mono/`. Never the worktree, with one exception: a session sweeping the whole repo unsupervised works in its own worktree, so nothing moves under Jonathan while he works in the repo itself. *The file co edits is the file he opens.*
 2. **Yarn** — never npm. *One lockfile, one set of versions.*
 3. **No preview** — never start one unless Jonathan says yes. Ask, then wait. *His screen stays his.*
 4. **Glob and Read, not Bash** — for finding and reading files. *No permission prompt standing in the way.*
 5. **Exact match** — names, paths and requirements, character for character. *The name co types is the name that exists.*
 6. **Every qualifier counts** — each noun and adjective in the request narrows the answer. *Co solves the problem he asked about.*
 7. **Think first** — change nothing until Jonathan says go, solve, impl, proceed, create or rewrite. A request listed in the shorthand is performed at once; any other, co presents its interpretation and waits for his approval. Until then: read, describe, propose. *He decides what changes.*
 8. **A rejected idea is dead** — for the whole session, in part as well as in whole. Stuck is worth saying. *Every proposal is new ground.*
 9. **Diff the inputs first** — when one case works and its twin does not, compare what goes in before reading the code. *The fault turns up in minutes, and it is usually in the data.*
10. **Log the values** — every branch writes the number, the input and the result it acted on. *Any question about why is answered by reading the log.*
11. **Test before done** — code that is written is not always code that works. Run it. Fix every error that shows up, whoever put it there. Test again and fix again, rinse repeat. *Done MUST ALWAYS mean working.*
12. **Fix every warning** — in any file edited by anyone. Never ask first. *An edit on a clean file MUST leave the file clean.*
13. **Never sweep** — `yarn svelte-check`, `yarn vitest` or the linter names a line. Fix that line and no other. One at a time. *Prevents mangling.*
14. **Indent** — code with tabs, markdown with four spaces. Never reformat indentation nobody asked co to change. A linter that wants something else has the wrong setting. *Every file looks the same in every tool he uses.*
15. **Update every tracking file** — not just one. Write into a proposal what was finally decided. *Any one of them tells the truth on its own.*
16. **After a correction** — re-read [pitfalls](pitfalls.md) before replying. *The same mistake happens once.*
17. **Report, never remove** — `yarn svelte-check` or the linter complaining about something co was not asked to change licenses a report, never a deletion. Fix the smallest thing actually wrong and leave every prop, field and export unchanged. *Unused today is somebody's next turn.*
18. **Measure what is drawn** — a fault in what is painted, or in where a thing sits, is settled by reading what the browser computed: the layer, the placement, the transform, the clip, the rectangle. Never by reasoning about which rule ought to have applied — a style arrives from anywhere in the cascade, and a shared rule on a plain tag is invisible from inside a component. Take the reading two frames after any hover, press or class change; inside the event the new style has not arrived. *One measurement costs a turn; a guess costs two.*
19. **Guide prose is a draft** — everything co writes into a rule, Jonathan rewrites within minutes, and the rewrite is the decision. Write it short and hand it over; length spent polishing is wasted twice. *Jonathan finishes it.*
20. **A constant applied throughout** — search the code for the number itself, to find every place it is written. Have each of those places read the one file that holds the number, and take out the copies written onto single elements. Before editing, say which calls are judgment and which values the constant would change. Search again afterwards: no copy is left. *One number, one place, proved.*
21. **A named destination exists** — a file named as where content goes, and not there, is made before the content is written. *If a file is mentioned as a destination for content and it is not there, create it.*
22. **Read the implementation** — before writing `if (x())`, read `x()`: its return type and what it calls, the whole chain. A pattern in one function says nothing about the next, and existing code may be wrong. When proposing code, quote the signature. *Method names lie, implementations don't.*
23. **Show the gate** — on a `go`, the reply begins the answer to "what was checked before the first edit?" — the plan's lines quoted, the search's full file list, the hypotheses under test. *The output is the gate. If it's missing or thin, the step was skipped.*
24. **A reply exists** — at turn end, if a reply is not on screen, send one: work finished, work blocked, or nothing to do. When a tool call fails, say so in one line, eg "I lack permission". One exception: a turn opened by a hook, with no real fault to report, sends exactly "hooks report clean". *A reply is on screen at every turn's end.*
