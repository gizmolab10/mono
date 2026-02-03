# Resume

Where we are in Design Intuition.

---
## Milestones

- [ ] [5 smart objects](milestones/5.smart.objects.md) == SO (Attributes)
	- [ ] hits manager USES 3d, if it fails
- [ ] 6 mouse editing of SO (selection corners, drag)
- [ ] 7 dimensions (terminators, text, dimension and extension lines)
	- [ ] edit dimensions -> renders the change
- [ ] 8 hierarchy of SO
- [ ] 9 **persistence** — save/load scene state
- [ ] 10 **controls UI** — actual buttons in the toolbar
- [ ] 11. **details**: attributes

### Ideas

- [ ] ask it the right qs -> lean i nto learning
	- [ ] are you leading me d own the garden path?


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

---
## Current State

**Milestone 5 in progress.** Smart objects foundation:

- `Smart_Object.ts` — extends Identifiable, optional O_Scene ref
- `Attribute.ts` — name/value boilerplate
- Decision: SO is primary, O_Scene is rendering detail

The app has:

- Panel layout with controls, details, graph regions
- Separators with fillets for rounded corners
- Quaternion-based 3D rendering (two nested cubes, drag to rotate)
- RBush hit detection with hover/click/long-click/double-click
- VitePress docs at docs.designintuition.app
- Main app at designintuition.app
