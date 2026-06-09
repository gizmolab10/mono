# Creating a Design

## Process

Jonathan writes the core idea — the insight, the data model, the intuition. Co adds structure, detail, analysis, and critique. Then simplify together until the document is clean enough to guide implementation.

## Rules

1. **Dissolve, don't accumulate.** When a detail pertains to an existing section, put it there — don't create a new section for it.
2. **Ask "where does this belong?"** Every paragraph should live in exactly one place. If a section answers a question raised by another section, move it there.
3. **Remove what's addressed.** Once a gap is filled, the "what's missing" entry becomes clutter. Delete it.
4. **Co's additions tend toward complexity.** Expect to simplify after each round. The final document should be closer to the original insight than to the structured expansion.
5. **Risks and efforts go stale.** Re-evaluate them after design decisions are made — they often drop once the approach is specified.
6. **Quote the architect's compound terms intact.** When the architect uses a compound term (for example, "silhouette box" or "silhouette rect"), restate it intact. Never paraphrase to the bare head word — the bare word names nothing in the architect's vocabulary and the substitution erases distinctions the architect was careful to make.
7. **Emotional signals are problem reports, not redesign authority.** A reaction from the architect ("egads", "this is terrible", "no") points at a gap between the work and the spec. Investigate why the output does not match the spec. Do not switch design assumptions in response to the reaction unless the architect explicitly says to.

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
- Any plan whose acceptance criterion is human visual inspection states a rejection branch — what happens when the inspector rejects. Without it, a rejection stalls into an ad-hoc decision; with it, the plan is self-contained
- Ultimate criterion for completeness: the design is:
    - rock solid (completely logical)
    - tight (no clutter, no fluff)
    - consistent
    - achieves the stated objectives
    - reliable as guidance for building tests and writing code
