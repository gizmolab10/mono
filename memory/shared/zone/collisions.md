# Collisions

Conduct's collision rule in conventions.md, Always rule 9 until 22 September 2026: when two rules collide, one must go, and co reports each collision so the pair can be rewritten as one rule. This is where the reports go. Each entry names the two rules, what happened, and the smallest rewrite that would end it.

## a never-word inside a standard technical term (9 September 2026)

**The rules.** Response 13, Always rule 2 until 22 September 2026: a standard technical term any programmer knows is used as it is, never spelled out in other words. lexicon.md's *margin* entry: never *bar*. The hook matches the never-word wherever it appears. **What happened.** gallery's proposal says "the browser's address bar", the standard term, and the hook reported bar. **A rewrite.** The hook skips a never-word that sits inside a standard technical term, or the entry says the ban is for the margin sense only, which the hook cannot judge.

## sweep, one word for three acts (8 September 2026)

**The rules.** agency.md 13, "Never sweep": a checker names a line, fix that line and no other. agency.md 1: "a session sweeping the whole repo unsupervised", scanning everything for work. handbook.md's redefinition rule: "sweep old-sense uses", replace one named word everywhere. conventions.md's table gives glob the meaning "sweep the disk for files". **What happened.** Co took the handbook's word for replacing door with bridge and wrote "swept" in a reply. Jonathan read agency 13's sense, the forbidden one. The word cannot be obeyed and forbidden at once. **A rewrite.** One act keeps the word. The others say what they do: "fix that line and no other" for 13, "reads the whole repo" for 1, "replace every old-sense use" for the handbook, "find files by pattern" for glob.

## a path segment that is a banned word (7 September 2026)

**The two rules.** lexicon.md's *global* entry: never *main* for cross-project. The banned-words hook: a banned word written into any file blocks the edit. **What happened.** `svelte/main/`, `main.ts`, `core/main.css` and mj's `Main.ts` are file and folder names, and a proposal that names them fires the hook. Earlier the same day: *Claude* and the words in the banned-words table itself, when a file quotes them. **A rewrite.** The hook skips a banned word inside a code span, a link, or a path; the rule stays for prose.

## Bash for reading, or Glob and Read (7 September 2026)

**The two rules.** agency.md rule 4: Glob and Read, not Bash, for finding and reading files — no permission prompt in the way. This session's auto mode: do the work through Bash wherever it can — cat, sed, grep, python — and reach for the dedicated tools only when Bash cannot. **What happened.** Every read this session went through Bash. **A rewrite.** Rule 4 says which of the two it means when the session is in auto mode, or says the reason — the prompt — and lets the mode decide.

## one action per Bash call, and a heredoc that holds code (7 September 2026)

**The two rules.** The batching hook: a Bash command joining actions with `;`, `&&` or `||` is blocked. Writing code or prose through Bash — a python heredoc, say — where the text itself holds a semicolon. **What happened.** A pac and a svelte file were both blocked as batched commands, since the hook reads the heredoc's contents as the command. The way round was the Write tool, or a scratchpad file spliced in by a python script that holds no semicolon. **A rewrite.** The hook stops reading at a heredoc marker; or the rule says plainly that code and prose go through Write and Edit, never a heredoc.
