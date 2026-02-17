# Competition

Landscape around Design Intuition — who's nearby, what they do differently.

---

## Closest Competitors (browser-based, indie/open-source, parametric)

| Tool | Stack | Status | Price | Vibe |
|---|---|---|---|---|
| [CADmium](https://github.com/CADmium-Co/CADmium) | Rust -> WASM, SvelteKit, Three.js | Early prototype | Free/OSS | Closest cousin — local-first, browser, sketch+extrude, code-first option. Targets hobbyist 3D printing. |
| [Chili3D](https://github.com/xiangechen/chili3d) | TypeScript, OpenCascade -> WASM, Three.js | Alpha | Free/OSS | Full BREP kernel in browser. STEP/IGES import. More traditional CAD feel. |
| [SolveSpace](https://solvespace.com) | C++, constraint solver | Mature, desktop | Free/OSS | Parametric constraint-based. No browser version. Minimal UI, functional. |

## Adjacent (different angle, overlapping audience)

| Tool | Angle | Price |
|---|---|---|
| [Plasticity](https://www.plasticity.xyz/) | "CAD for artists" — NURBS, G2-continuous fillets, beautiful UI. Desktop only. | $150 indie |
| [Shapr3D](https://www.shapr3d.com) | Gesture-based modeling, iPad/Mac/Win. Parametric + direct. Polished UX. | Free tier, $38/mo pro |
| [Onshape](https://www.onshape.com) | Full browser-based professional CAD. Version control built in. | Free personal, $$$$ pro |

## What DI Does Differently

- **No BREP kernel** — mesh/wireframe with algebraic constraints, not OpenCascade
- **Intuition-first** — hand-tweaking, visual feedback, artist sensibility over engineering precision
- **Orientation system** — quaternion-based, trig redistribution, fixed/variable derived from bounds
- **Algebra engine** — compiler, eval, reverse propagation, constraint system — all custom
- **Graph-native** — scene is a graph (inherited from ws), not a feature tree

## The Gap

Plasticity is pretty but not parametric. Onshape is parametric but corporate. CADmium is the closest spiritually but leans hobbyist/3D-print. Nobody's doing "parametric CAD as art tool with algebraic constraints in the browser."
