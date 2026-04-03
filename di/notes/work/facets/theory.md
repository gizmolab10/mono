# theoretical underpinnings of facets work

Right now i want to do a rational assessment of facets. my curiosity and vanity have driven me this far, should i call it a folly or try for the summit?

**Date:** 2026-04-03

**Reading order — companion files:**
- [handoff.md](handoff.md) — what's being worked on right now, what's blocked, what was just solved
- [done/topology.md](../done/topology.md) — how the pipeline works step by step (the *how*)
- [lessons.md](lessons.md) — mistakes not to repeat
- [designs/](designs/) — the design spec for the simpler topology rewrite
- This file — the *why* and *whether*: theory, sources, trajectory, and the folly-or-summit question

## Folly / summit?

The question at the top of this file. Here's what the evidence supports, and what it doesn't:

**Arguments for summit (keep going):**
- The hardest part — building the engine that finds faces from edges and feeds a renderer — works. Three facets trace. That's proof of concept, not just theory.
- The foundations (geometry, visibility, tracing) are individually solid and tested.
- The remaining problems are specific and diagnosable, not "everything's broken."
- Nobody else has published this, which means there's real value in finishing it — this would be a genuine contribution.

**Arguments for folly (stop):**
- A week of work has been lost to a single misplaced operation. The cost of mistakes in this domain is very high.
- The trajectory shows each fix revealing a deeper problem, with no measured convergence.
- The three open unknowns may be symptoms of a structural gap that the current approach can't close without a new idea that hasn't arrived yet.
- There's no way to estimate when it would be done. "Keep going" is open-ended.

**What the evidence can't answer:**
Whether the missing idea is close or far. Whether the next session's investigation will crack the boundary-to-interior connection or reveal yet another layer. The work so far has been honest and disciplined — not wasted — but discipline alone doesn't guarantee arrival. The question is whether you're willing to keep investing without a timeline, knowing the foundations are real but the path forward is uncharted.

### **What would actually help most:**

The gap in the pipeline isn't a gap in textbook knowledge. It's a gap in the specific problem of connecting boundary endpoints to interior intersection shapes — and no textbook covers that because almost nobody does what you're doing. The learning that matters most is the kind that happens when we look at a specific broken case together, understand exactly why it's broken, and figure out what's missing.

The collaborator can teach the theory that exists. But the part you haven't learned yet is probably the part nobody has written down — and we'd be figuring that out together, not one lecturing from a book.

### Knows / unknowns (2026-04-03)

**Known — working and solid:**

1. The geometry works. Face-face intersection, clipping a line to two quads, projecting to screen. 44 tests passing.
2. The visibility works. Edges get hidden behind faces correctly. Intersection lines survive occlusion by their own solids.
3. The tracer works. Given a correct graph, it walks the boundary and produces a closed painted region. Three facets prove this.
4. The simpler topology rewrite (April 1) was the right call. Zero to three facets, structurally cleaner.
5. The problem domain is a gap in published knowledge. No roadmap exists for building face boundaries from visible projections.

**Unknown — the open questions:**

1. How to correctly assign an intersection endpoint to the right edge when the clipper's range comparison has floating-point ambiguity. Current blocker: the clipper says a point exits through an edge that's 400 units away.
2. How to merge endpoints from adjacent faces sharing an edge when multiple intersection lines from different faces of the other solid hit the same shared edge. Topology alone can't distinguish which pairs belong together.
3. How to connect boundary endpoints (where intersection lines pierce a face's edges) to interior intersection segments (lines crossing through the middle of that face). Two disconnected subgraphs on the same face, no segments bridging them.
4. Whether these three unknowns are separate problems or symptoms of one deeper structural gap.
5. How much work remains. The trajectory is not converging in a measurable way.

### Progress vs understanding (2026-04-02)

"Asking better questions each round" was offered as encouragement, but it deserves scrutiny. The investigation has gotten more precise — early sessions shotgunned five approaches and abandoned them all; recent sessions isolate specific geometric situations (which exact edge, which face pair, which merge). That's genuine progress in *understanding*.

But understanding a problem is not the same as being close to solving it. A doctor who finally diagnoses a rare disease hasn't cured the patient. The trajectory assessment (see lessons.md) shows that each layer of understanding reveals a new structural problem underneath. That could mean you're peeling an onion and will eventually reach the center. Or it could mean the architecture is still missing a fundamental idea that no amount of refinement will supply.

The evidence doesn't say which one it is.

What it does say: the simpler topology rewrite paid off partially (zero to three facets). The current blocker is specific and diagnosable, not vague. But the "main bug" — boundary endpoints disconnected from interior intersection shapes — may need a new idea, not just a fix.

## Can the collaborator teach the theory?

Partly. Here's the honest breakdown.

**What the collaborator can do well:**
- The content of most of those books and papers is within training data. The collaborator can explain the relevant ideas in plain English, tailored to your specific problem, without you having to wade through 600-page textbooks.
- Translate academic concepts into the concrete terms of your pipeline — "here's what Appel's algorithm does, and here's how it maps to what your passes already do, and here's where you diverge."
- Work through specific geometric situations with you — "when two faces share an edge and both intersect the same face from the other solid, here's what should happen topologically and why."

**What the collaborator can't do:**
- Read new papers published after training cutoff, or patent filings not seen.
- Guarantee that knowledge of a specific algorithm is perfectly precise — details might be misremembered. Those get labeled as guesses.
- Substitute for you *seeing* the geometry. You're the visual observer. The collaborator can describe what should happen; you can see whether it actually does.

### Where to Learn

The problem you're solving — tracing closed visible regions where 3D solids intersect — sits in a gap between fields. No single source covers it end to end. But the pieces live in specific places:

**The geometry underneath (face-face intersection, clipping)**
- "Computational Geometry: Algorithms and Applications" by de Berg et al. — the standard textbook. Chapters on line arrangements and polygon overlay are directly relevant to what your passes do.
- "Geometric Tools for Computer Graphics" by Schneider & Eberly — more practical, has working formulas for segment-polygon clipping, plane-plane intersection, point-in-polygon. Reference book, not a tutorial.

**The visibility problem (what's in front of what)**
- "Computer Graphics: Principles and Practice" by Hughes et al. (the "Foley" successor) — hidden surface removal, painter's algorithm, the theoretical framework for what your occlusion clipping does.
- The original Appel (1967) and Roberts (1963) papers on hidden line elimination. Old, but they invented the exact problem you're solving: which edges are visible when solids overlap. Your pipeline is essentially a modern Appel algorithm.

**The tracing problem (turning visible segments into closed faces)**
- This is the hardest part to find written up. The closest published work is on **arrangement computation** — given a set of line segments in 2D, find all enclosed faces. CGAL's 2D Arrangements package has documentation that explains the theory. The book "CGAL Arrangements and Their Applications" by Fogel, Halperin, and Wein is the only dedicated treatment I know of.
- Euler operators and half-edge data structures (Mäntylä, "Introduction to Solid Modeling") — for understanding how faces, edges, and vertices connect topologically.

**The gap nobody covers**
What's missing from all of these: how to go from "I have visible edge segments and intersection lines in screen space" to "I can trace closed painted regions." That's the specific problem your facets pipeline solves. Academic literature assumes you either have a full boundary representation already (CAD kernel approach) or you're doing pure 2D arrangement computation (computational geometry approach). You're doing neither — you're building the boundary representation *from the visible projection*, which is backwards from how CAD kernels work.

**The closest real-world precedent**
- Hidden-line removal papers from the 1960s-70s (Appel, Loutrel, Galimberti & Montanari). They computed exactly what you're computing. The field moved to z-buffers (raster output, not us) and stopped publishing on this.
- Technical illustration software (patent literature for tools like Creo Illustrate, IsoDraw) — they solve this for generating exploded-view line drawings from CAD models. Proprietary and undocumented, but the patent filings sometimes describe the algorithms.

The honest answer: the reason no roadmap exists is that almost everyone gave up on analytical visibility and switched to hardware z-buffers. You're one of a very small number of people still solving this problem from geometry. The learning is mostly in the old papers and in doing what you're already doing — building it and finding where it breaks.


