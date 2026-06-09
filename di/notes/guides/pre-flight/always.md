# Always (di)

Rules specific to the di project. Read alongside the global always file at `~/GitHub/mono/notes/guides/pre-flight/always.md` and the project file at `~/GitHub/mono/di/CLAUDE.md`.

1. **Lexicon enforcement** — every prose response goes through `di/.claude/hooks/precheck.sh` before sending. The lexicon and banned-substitutions table at `di/notes/guides/development/learn/lexicon.md` is the source of truth for word choice.
2. **Yarn, never npx** — every package binary call uses yarn.
3. **Snap hook for reverts** — `di/.claude/hooks/snap.sh` handles file reverts; never restore files manually.
4. **Read on load** — these four `di` files
    - [ ] `notes/work/now/learn.md`
    - [ ] `notes/guides/pre-flight/lexicon.md`
    - [ ] `notes/work/now/handoff.md`
    - [ ] `CLAUDE.md`.
5. **Implication** — Before stating a conclusion, ask yourself: if this is true, what else must be true? Follow the chain. If the chain leads to a contradiction or something you know is false, your premise is wrong — do not state it.
6. **Analyze defined terms** — for every defined term named in the task or the spec, quote its definition and write one sentence stating what the definition requires of the inputs and the outputs. Then verify the code you are about to write or use matches that requirement. Cite the line and file for the definition and the line and file for the code. Apply rule 5 to definitions, not just to claims.
7. **Diagnostic logging with every new code path** — when adding new code, also add ample diagnostic logging that prints enough information to verify what goes right and what goes wrong. For every decision the code makes (filter, threshold, branch), the log must carry the actual values that drove the decision (the measured number, the input, the result) — not just a name. This way every claim about "why" can be answered by reading the log, not by guessing.
8. **Past mistakes that should never be repeated**
    - [ ] **Don't act on guesses.** When the data shows something unexpected, investigate — don't guess the cause and write code. Two wrongs: acting on a guess, and not waiting for approval before making the change.
    - [ ] **Stop speculating about what's on screen.** When the user says something is or isn't on screen, that's evidence. The job is to find the code that contradicts that evidence, not to argue with it.
    - [ ] **Never pad a pac.** If there are no real cons, say so. Fabricating cons to make a pros-and-cons list look balanced is dishonest and wastes time.
    - [ ] **Get the real-browser evidence before writing more code.** When a fix needs visual confirmation in a real browser, the very first move is to wire the diagnostic that shows what the real browser actually sees. Read it before writing more code. The print-feature work in May 2026 burned almost two days because plausible-sounding fixes were written and handed back for retest instead of putting diagnostic logs in early and reading the numbers from the user's actual browser. Worse, the underlying rule was based on a wrong model of how the picture gets onto the canvas. Tests against the wrong rule kept passing while the picture stayed wrong. Five minutes of evidence-gathering would have saved most of the two days.
    - [ ] **Confidence levels are set too high. Require more care, more relevant data, far less guessing.** Each "plausible fix" should not be written and handed back without the evidence to back it. The bar for writing code is: there is data that points specifically at the change, the change has been described in plain English first, and the reasoning chain from data to fix is short and verifiable. When any of those is missing, the right move is to ask for more data, not to write code on faith.
