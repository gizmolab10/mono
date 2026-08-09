# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md)  file has what's finished iand the [[current context]] you can't read off the code. 

## Animate the list as the tags move it

### Success

1. Opening or shutting a tag area slides the pills beside it to their new places rather than jumping them.
2. A pill that arrives fades in where it belongs; one that goes fades out where it stood.
3. Nothing moves that did not move before, and the list still answers a press mid-slide.
4. The type check and the tests are clean.

### The shape of it

Opening one tag area is the biggest jump on the screen: the area grows from one word to a run of segments, the pills after it wrap onto another row, and every file row below jumps down by that much at once. Nothing about it is wrong — it is simply instant, so the eye has to find its place again.

Svelte draws this for us. A keyed loop takes an `animate:flip`, which measures where each thing was, where it lands, and slides between the two; the pills already loop over the tag areas by name, so the key is there. What arrives and what goes take `transition:fade`.

**The order.** The tag areas first, since that is the jump being complained about.

**What will not get done.** The file rows and the count above. Neither jumps at all.

**Decision.** The wrapped tag rows never change height mid-slide. So nothing below the pills moves while a slide runs, and nothing that measures the page can read a size that is about to change. If a slide ever did change that height, the pills would have to be given a fixed number of rows rather than the height being animated.

**No risk found.**
