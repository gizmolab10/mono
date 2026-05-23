# Dimensionals — library research (2026-05-20)

Research done on whether any browser-compatible constraint-satisfaction library beats the custom four-DOF search shape described in [dimensionals.md](di/notes/guides/development/rules/dimensionals.md) rule 23 within the 25-millisecond cold-run budget. Conclusion was: **stick with the custom shape**. This file keeps the findings so the decision is revisitable when browser tooling changes.

## Top-line

No off-the-shelf library fits the problem AND the budget. The shape of the problem — two discrete DOFs (edge, direction) plus two continuous DOFs (witness length, slidable position) per label — sits in an awkward gap. Most JS solvers handle one type or the other, not both. The general-purpose ones that handle both are too heavy for the browser at this budget.

## What was evaluated

| Library | License | Mixed DOF? | Browser-ready | Performance fit | Determinism | Bundle | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Custom (greedy + repair + stochastic)** | ours | yes | yes | designed for it | yes (seeded PRNG) | few KB | active |
| **cola.js / WebCoLa** | MIT | no (continuous only) | yes | I AM GUESSING 50–200 ms for a mixed-DOF retrofit; "works well under 100 nodes" per docs | not fully deterministic | ~100 KB | maintained, slow cadence |
| **d3-labeler** | BSD | no (continuous only) | yes | I AM GUESSING 100–500 ms for 100 labels at 1000 sweeps | seedable if PRNG swapped | <10 KB | unmaintained since ~2014 |
| **d3fc-label-layout** | MIT | no (greedy or annealing over fixed boxes) | yes | I AM GUESSING comparable to d3-labeler | not deterministic out of box | ~20 KB | maintained |
| **Z3 WebAssembly (z3-solver)** | MIT | yes | yes BUT needs SharedArrayBuffer + COOP/COEP headers | cold init alone is hundreds of ms; I AM GUESSING full solve 1–10 s, far over budget | yes | I AM GUESSING 5–10 MB WASM | actively maintained |
| **Google OR-Tools (WASM)** | Apache-2 | yes (CP-SAT) | NO official browser build | n/a | yes | n/a | OR-Tools active; WASM build not |
| **csp.js** | MIT | NO — discrete only | yes | n/a | yes | <10 KB | abandoned / educational |
| **MiniSat.js / logic-solver** | MIT | NO — pure SAT | yes | n/a | yes | 200–500 KB | partial maintenance |
| **d3-force (quadtree collision)** | ISC | no (continuous only) | yes | I AM GUESSING 50–200 ms to converge for 100 nodes | not deterministic by default | ~30 KB | actively maintained |
| **Leaflet / Mapbox label-collision plugins** | BSD-ish | partial (anchor choice from fixed set) | yes | hides overlapping labels rather than solving placement | yes | small | maintained |

## Why no library beats the custom shape

The problem is structured enough that a pure force layout (continuous) doesn't express the discrete edge-and-direction choice without bolting it on by hand — which is most of the work. And it's tight enough on time that a full-blown constraint engine eats the frame budget on cold initialization before any solving begins.

The two halves the custom shape handles cleanly:

- The discrete part — picking the (edge, direction) per label — is naturally a greedy step with optional repair and stochastic finish. Bounded, deterministic, exactly the right tool for a small discrete search.
- The continuous part — picking (witness length, slidable position) inside a chosen pair — is a tiny optimization over a bounded rectangle, handled fine by a 5-by-5 grid sample.

A specialised constraint engine would do the same work, but with multi-megabyte download cost and async cold init.

## Upgrade path, if ever needed

Keep the architecture (greedy seed plus repair plus stochastic finish). Swap the continuous inner loop for a small specialised quadratic-programming solver — for example, lift the gradient-projection routine from cola.js. This gets sub-grid precision without changing the outer shape.

Do NOT adopt a general-purpose constraint engine — the cold-init cost alone disqualifies them at the current 25-millisecond budget.

## Determinism helpers

Rule 21 of the spec says the search is deterministic — same scene plus same view plus same remembered values produces the same chosen values per label. Two small helpers make that practical.

### The seeded pseudo-random number generator (a linear congruential generator)

The stochastic finish step (rule 23) makes random switches and accepts the ones that reduce conflicts. If the random source is non-deterministic, the same scene produces a different layout each run, and the slot-determinism test fails. So a seedable generator is used in place of the browser's built-in random function.

The recipe is simple: keep a running 32-bit number. To produce the next value, multiply the running number by a fixed constant, add another fixed constant, and let the result wrap around inside 32 bits. The new running number is the next "random" output. The output looks random because the multiply-and-add scrambles bits aggressively, but it's fully determined by the starting number (the seed).

Two adjustments:

- A starting number of zero locks the generator at zero (the multiply produces zero, the add produces the same constant, which after wraparound can repeat). The constructor bumps a zero seed to 1.
- When the seed comes in as a string, it's first turned into a 32-bit number by the string hash below.

Implementation: [Seeded_Random.ts](../../../src/lib/ts/common/Seeded_Random.ts).

### The string hash (FNV-1a)

When the seed needs to be derived from scene contents (a part-name list, a camera-orientation list, anything text-shaped), the helper turns the string into a 32-bit number first.

The recipe:

1. Start with a fixed initial number (called the "offset basis" — a value chosen for good mixing properties).
2. For each character in the string, mix in the character's code by XOR (a bit-by-bit "exactly one of these is on?" operation). The XOR makes the running number jump around the 32-bit space rather than just creeping in one direction.
3. After each XOR, multiply by a fixed constant (called the "prime"). The multiply spreads each bit's influence across the whole running number, so similar strings end up far apart.
4. Let the result wrap around inside 32 bits at each step.
5. The final running number is the hash.

Why this one and not something simpler. The naive alternative — sum the character codes — puts similar strings near each other in output space. Two scenes that differ by one character would seed the random generator from nearly the same starting number, and the stochastic finish would explore nearly the same sequence of switches. The XOR-then-multiply spreads similar inputs to far-apart outputs, so a one-character change in the seed string produces a very different random sequence. Cost is twenty lines of code and two arithmetic operations per character.

The pair of constants (offset basis and prime) and the order of operations (XOR-then-multiply, rather than multiply-then-XOR) are an established recipe used widely in hash-table libraries. The name attached to this exact recipe is FNV-1a, after its three creators Glenn Fowler, Landon Curt Noll, and Kiem-Phong Vo. The "1a" denotes the variant where the XOR comes before the multiply — the variant with slightly better avalanche behaviour than the original FNV-1 (which multiplies first). The recipe and the property it guarantees are what matter here, not the name; the attribution is included so a future reader can look up the published constants and confirm them. See [Fowler-Noll-Vo hash function on Wikipedia](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function) for the published recipe and recommended constants.

Implementation: [Seeded_Random.hash_string](../../../src/lib/ts/common/Seeded_Random.ts) at the bottom of the file.

## Sources

- [OR-Tools WebAssembly request, issue 4443](https://github.com/google/or-tools/issues/4443)
- [z3-solver on npm](https://www.npmjs.com/package/z3-solver)
- [Z3 in the browser discussion](https://github.com/Z3Prover/z3/discussions/6551)
- [WebCola](https://github.com/tgdwyer/WebCola) — gradient-projection layout, continuous only
- [D3-Labeler](https://github.com/tinker10/D3-Labeler) — simulated-annealing label positions
- [d3fc-label-layout](https://github.com/ColinEberhardt/d3fc-label-layout)
- [csp.js (discrete only)](https://github.com/njoubert/csp.js)
- [d3-force](https://www.npmjs.com/package/d3-force)
- [Leaflet.LabelTextCollision](https://github.com/yakitoritabetai/Leaflet.LabelTextCollision)
- [Mapbox variable label placement](https://docs.mapbox.com/help/troubleshooting/optimize-map-label-placement/)
