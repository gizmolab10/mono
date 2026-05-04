# Lessons

Meta-lessons distilled from the two mothballed milestones (the facet tracer and the drag rewrite). Each is a pattern that would mislead a successor on any feature, not just the one that surfaced it. The point is to spot the same shape early when it shows up somewhere new.

For the case-level writing — exactly what was tried, what failed, and why — see [the facet-tracer lessons file](../../../work/milestones/done/32.facets/lessons.md) and [the drag lessons file](../../../work/milestones/33.drag/lessons.md).

## Lessons

### A single data-erasure call in the wrong phase can cost a week

Data created by one phase and consumed by another should never be cleared by a phase in between. When the middle phase wiped intersection endpoints the downstream phase needed, two surface symptoms (phantom segments and missing pierce points) traced back to a single misplaced erasure. A save-and-restore workaround recovered some of the data and silently dropped the rest.

The pattern: a producer, a middle phase, a consumer. If the middle phase touches the producer's output even once with anything that resembles a reset, the consumer will see a corrupted, partial view of the world.

Source: facet tracer.

### Single key from birth beats multi-pass merges

When the same physical point gets discovered by different phases that don't talk to each other, every phase invents its own name for it. A merge step then reconciles the names later. Every merge rewrites a name, every downstream structure has to catch up, and any miss leaves a stale reference. The tracer kept bouncing against those stale references for weeks.

The pattern: any time a single thing has multiple names invented at different sites, expect to lose time to merges that look correct but miss one case in five. Give the thing one name from the moment it is born.

Source: facet tracer (and milestone twenty-six, which converted three merge passes into a single-key model).

### Use the angles the viewer sees, not the ones the math thinks the viewer sees

Projecting segments onto a face's tangent plane in three dimensions and computing angles there gives wrong answers, because the three-dimensional plane does not match what the viewer sees on a flat screen. The tracer needed angles measured in screen space — the angles the user can actually see — to pick the next segment correctly.

The pattern: when the answer has to match what the viewer sees, compute it in the space the viewer sees. Tangent planes, world planes, and modelled planes are all approximations of what the screen displays, and approximations cost.

Source: facet tracer.

### When each fix uncovers a deeper problem instead of shrinking the work, the architecture is wrong, not the patches

Convergence means today's bugs are smaller than yesterday's. Uncovering means today's bugs are deeper than yesterday's. The second pattern is a reset signal. The facet tracer was patched through several rounds before this pattern was named, and once it was named, the next decision was to mothball the feature rather than write the next patch.

The pattern: track whether each fix shrinks or deepens the remaining work. Two or three rounds of deepening is a strong signal to stop patching and rethink the architecture.

Source: facet tracer.

### A live pivot and one-to-one mouse tracking are in tension under a tumbled view

If the rotation pivot follows the shape's live centre and the user has tumbled the view off-axis, then a one-sided stretch (one corner moves, the opposite corner stays) renders the moving corner at less than one-to-one with the mouse. The math is mathematical: the moving corner gets the identity-plus-rotation of half the bound change, which is below one for any non-identity rotation. You cannot have both a live pivot and a perfectly tracking corner with a centre pivot.

The pattern: when two desirable behaviours are written down in user-facing terms and both feel intuitive, check whether they are mathematically compatible before promising both. Often the only way out is to give up one or pick a different pivot.

Source: drag.

### Recomputing the projection ratio every frame from current state explodes

If the face's screen-space edges are recomputed every frame from the shape's current world matrix during a drag, a positive-feedback loop forms. The bound change shifts the live pivot, which shrinks or skews the projected edges, which amplifies the next bound change. A few frames in, the corner lurches in random directions.

The pattern: when a live drag depends on a quantity derived from the shape's current state, any path where the quantity affects the next state will feed back. The fix is to capture the quantity once at drag start and hold it for the duration, or to drop the screen-space derivation in favour of a world-space one that does not depend on the shape's current matrix.

Source: drag.
