# Resume

Where we are in Design Intuition.

---
## Milestones

- [ ] 5 smart objects == SO (attributes)
- [ ] 6 mouse editing of SO (selection corners, drag)
- [ ] 7 dimensions (terminators, text, dimension and extension lines)
- [ ] 8 hierarchy of SO
- [ ] 9 **Persistence** — save/load scene state
- [ ] 10 **Controls UI** — actual buttons in the toolbar


## Current State

**Milestone 4 complete.** The app has:

- Panel layout with controls, details, graph regions
- Separators with fillets for rounded corners
- Quaternion-based 3D rendering (two nested cubes, drag to rotate)
- RBush hit detection with hover/click/long-click/double-click
- VitePress docs at docs.designintuition.app
- Main app at designintuition.app

## What's Working

| Layer | Status |
|-------|--------|
| Rendering | Quaternions, wireframe, depth-based alpha |
| Layout | Three regions, separators, fillets |
| Interaction | Hits manager ported from ws |
| Docs | VitePress, dual Netlify deploy |
| Testing | 206 tests for core types |


## Quick Links

- [Milestones](./milestones/)
- [Architecture](../architecture/)
- [Guides](../guides/)
