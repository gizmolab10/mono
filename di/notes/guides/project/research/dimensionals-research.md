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
