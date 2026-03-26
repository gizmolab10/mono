# Creating a Design

## Process

Jonathan writes the core idea — the insight, the data model, the intuition. Co adds structure, detail, analysis, and critique. Then simplify together until the document is clean enough to guide implementation.

## Rules

1. **Dissolve, don't accumulate.** When a detail pertains to an existing section, put it there — don't create a new section for it.
2. **Ask "where does this belong?"** Every paragraph should live in exactly one place. If a section answers a question raised by another section, move it there.
3. **Remove what's addressed.** Once a gap is filled, the "what's missing" entry becomes clutter. Delete it.
4. **Co's additions tend toward complexity.** Expect to simplify after each round. The final document should be closer to the original insight than to the structured expansion.
5. **Risks and efforts go stale.** Re-evaluate them after design decisions are made — they often drop once the approach is specified.

## Evidence, not speculation

Every claim about WHY something works or doesn't must be labeled:
- **Evidence:** cite the code, log, or data
- **"I don't know":** if you can't point to evidence, say so and propose how to gather it

Never present a guess as a conclusion. Never propose a fix based on unverified speculation. (See always.md #18.)

## Completeness check

Before calling a design "ready for implementation":
- Every section answers what it needs to — no TBDs
- No duplicated content
- Risks and efforts reflect the current design, not earlier drafts
- Open questions are resolved or explicitly deferred with justification
- The implementation plan identifies the hard parts honestly
