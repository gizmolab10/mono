# New design for dimensionals

The dimensionals are still challenging to interpret. Might be easier if they are co-planar.

## Uniface rules

1. One of the continuous degrees of freedom, the witness index, can become a discrete enum range of values (1, 2 and 3) , for computing the witness line length (rule 6). Doing so might make the dimensions seem more sensible, related. I picture a projection outward onto the unifaces, all dimensions in one layer, like a shadow cast from the real onto the uniface. Simpler math and logic.
2. 4DOF with only one continuous degree of freedom -> the position of the dimension label, which still needs complicated avoidance rules (see below). The other 3 are edge, uniface, and witness index.
3. Compute witness length so as to place its dimension line in the plane of a uniface. witness index says which uniface box. if no such length exists without conflict, drop the label.
4. For rotated parts, the silhouette box is rotated the same -> the rotated part and all its subparts.
    1. The label center point is placed on a uniface, the dimension line is placed on the plane parallel to the rotated silhouette box, which also passes through the label center point.
    2. when rotated parts overlap, nothing special is done
5. rules not mentioned here carry over from the original spec ([[dimensionals rules]]): repeater integration (rule 18), x-ray mode (rule 13), persistence across paints (rule 19), performance budget (rule 20), drop semantics (rules 4, 11, 12), dim-line drawing (rules 5, 6, 7), label centering (rules 7, 10), in-place editing (rules 14, 15, 17), deterministic tie-breaks (rules 4, 21), and test hooks (rules 16, 25). none of these appear in the uniface design.

## Avoidance rules

6. Every pair of labels must be at least silhouette margin apart, computed using their text rectangles.
7. Every label must not be placed on a witness anchor, witness line, or dimension line, nor within the silhouette box.
8. For a label that conflicts everywhere, increment its witness index and try again. If the witness index exceeds the cap, drop the label.
9. The pair clearance and the silhouette margin are both set to 15 pixels. This is intentional.


## What is missing?

1. **DONE** The cap on the witness index is not committed. Rule 1 says the enum has values "1 and 2 and maybe 3". The lexicon already committed to 3. The rule needs to drop the "maybe".

2. **DONE** Typo in rule 4 sub-point 1: "the dimension line is place" — the correct word is "placed".

3. **DONE** Rule 4 sub-point 1 says the label center point sits "on the unrotated root uniface box" but does not pick which of the six unifaces of that box holds it.

4. **DONE** Rule 4 has no edge case for a scene with no unrotated parts — there is no root uniface box in that case, so the rule has nothing to anchor on.

5. Rule 5 references "[[dimensionals rules]]" — a placeholder link with no target. The rules it refers to were moved to mothballs under the name "dimensionals stipulations". Either repoint the link or list the carried rules here.

6. **DONE** Rule 6 uses the bare number "15 screen pixels" — name the term "pair clearance" from the lexicon and let the number live in one place.

7. **DONE** Rule 7 uses the bare word "silhouette" — ambiguous after the lexicon split. The right word is "silhouette box".

8. **DONE** Rule 8 says "increment its witness enum" — the lexicon calls this "witness index". Word mismatch.

9. **DONE** Rule 8 does not say what happens when the witness index reaches the cap and the label still conflicts. Rule 3 implies "drop" but rule 8 is silent.

10. Rule 5 says "rules not mentioned here carry over" and lists ten broad areas — but the actual carry-over rules are not pulled in or linked. The reader cannot tell which rule text governs each carried area.


**DONE which value becomes the discrete enum, and how many values it takes.** rule 1 promotes one continuous degree of freedom to an enum of "1 and 2 and maybe 3". it does not name which degree of freedom (witness length is the obvious read, but unsaid) and does not commit on whether the enum has two values or three.

**DONE what the other three degrees of freedom are.** rule 2 says four degrees of freedom with only one of them continuous (the label's slidable position along the dim line). the three discrete ones are not enumerated. likely read: which silhouette edge of the part, which uniface contains the dim line, which enum level — but the spec is silent.

**DONE the new word "silhouette" collides with the old one.** rule 3 says silhouette is a world-3D box that exactly encloses every part. the running design already uses the word "silhouette" for a convex hull of projected leaf-part vertices. two different things now share one word. spec needs to pick: one wins, or the two get renamed apart.

**DONE how the 15-screen-pixel expansion turns into world units.** rule 4 expands the silhouette by 15 screen pixels to make the first uniface. under perspective, "15 screen pixels" is not one world-units distance — every face needs its own per-paint shift so the projected face sits at the right screen-pixel margin. the master spec does not say how to compute it. the recipe lived in the secondary doc, which is no longer master, so it has to come into the master.

**DONE reconcile the 15 with the existing 10.** rule 4 says 15 screen pixels. the running pipeline uses 10 screen pixels for the silhouette margin. one number is the new design's intent — the spec needs to pick.

**DONE rotated parts have an algorithm — rule 5 — with 4 detail holes inside it:**
    1. "enough to sit outside" is a criterion, not a number — the minimum gap from the root uniface box is undefined
    2. the word "silhouette" is used in two senses (the global 3D box of rule 3, and the local part-plus-subparts of rule 5) — same word, two meanings, needs disambiguation
    3. does the root uniface box's silhouette include rotated parts, or only non-rotated parts (rule 3 says "every part" but rotated parts have their own thing)
    4. what happens when two rotated parts' uniface boxes overlap.

**DONE "embedded in a uniface" is undefined.** rule 6 says compute witness length so the dim line is embedded in a uniface. on the surface? inside the volume? the spec needs to pick.

**DONE the enum cap and the fallback.** rule 9 increments the witness enum when a label conflicts everywhere. the spec does not name the cap or what happens when the cap is hit and conflict remains — drop the label, or fall back to the older free-placement search?

**DONE which existing rules survive — the big carry-over question.** the running design has rules for repeater integration, x-ray mode, persistence across paints, performance budget, drop semantics, dim-line drawing, label centering, in-place editing, deterministic tie-breaks, and test hooks. none of these appear in the uniface design. each one needs to carry over verbatim, get rewritten, or get explicitly dropped — and the spec needs to say which.

**DONE rule 4 uses "uniface" for the whole expanded structure, not for a single face.** rule 4 says "Uniface is defined as the silhouette expanded by 15 screen pixels. This is enum 1. Enum 2 expands again by the same amount." the chosen vocabulary is: the whole expanded structure is the uniface box; one of its six closed-surface faces is a uniface. so rule 4 is defining the uniface box, not a uniface. and the role of the enum levels under the chosen vocabulary is unsettled — does each enum level spawn its own uniface box (so enum 2 is a second, more-expanded box with its own six unifaces), or do the enums sit per-uniface within one box (each uniface has an enum-1 position and an enum-2 position)? rule 4 needs to be rewritten to match the chosen vocabulary and to nail down the enum semantics.

partial progress already done in the code: per-part hulls replaced the combined hull for the witness pushback. that's geometry-only — not the uniface box, not the picking rule.

### Proposal for transition

two readings of "transition" — evolve the master spec, and roll out the code. the spec evolution gates the code, so do it first.

**spec transition — close the gaps above in order.** each gap is one or two sentences of decision. bundle the decisions as version 2 of the master spec, with a "decisions taken" section at the end. once version 2 is approved, add a companion that maps every rule of the running design onto its uniface successor — three buckets: carry over verbatim, rewrite, drop.

**code transition — only after the spec is closed.** three steps, each runnable in the app at every step.

- **step 1 — uniface box builder, nothing calls it yet.** add a helper that, given the camera and the painted non-rotated leaf parts, returns the uniface box: a world-axis-aligned box plus, for each of its six unifaces, the world-units shift that places it at the configured screen-pixel margin past the projected silhouette. recompute every paint. new unit tests cover the bounding box, the per-uniface shift, and the screen-pixel-margin invariant.
- **step 2 — first uniface placements for non-rotated parts, behind a flag, default off.** for each non-rotated part and each axis, pick the first viable uniface (no smart picking yet) and place the dim line on it. emit the same placement shape today's pipeline emits so the repair pass, stochastic finish, drop policy, and persistence layer all swallow it unchanged. add a button to the painter toggle so the visual diff is one click. fill the twelve todo tests as the gating contract.
- **step 3 — refinement, then flip the default to on.** smarter uniface picking (closest, least-crowded, or stability-preferring — pick the one that settles visually). one-dimensional conflict resolution per uniface for same-axis labels that share one. drop the 200-pixel witness cap for non-rotated parts (the cap stays on for rotated parts until their algorithm shows up).

rotated parts get their own uniface box per rule 5 of the master spec — same algorithm shape (build the rotated silhouette around the part and its subparts, expand to sit outside the root uniface box), implemented after the root uniface box code is stable.
