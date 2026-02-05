# Resume

Where we are in Design Intuition.

---
## Milestones

- [ ] 8 dimensions (terminator arrows, text, dimension and witness lines)
	- [ ] edit dimensions -> renders the change
- [ ] 9 hierarchy of SO
- [ ] 10 **persistence** — save/load scene state
- [ ] 11 **controls UI** — actual buttons in the toolbar
- [ ] 12. **details**: attributes

## What's Working

| Layer       | Status                                    |
| ----------- | ----------------------------------------- |
| Rendering   | Quaternions, wireframe, depth-based alpha |
| Layout      | Three regions: controls, details, graph   |
| Interaction | 2D (ported from ws) and 3D Hits managers  |
| Docs        | VitePress configured, new guides content  |
| Testing     | 232 tests for core types                  |
| Editing     | Select face, drag edge or vertex          |
| Build Notes | List of important steps in our progress   |

## Quick Links

- [Milestones](./milestones/)
- [Architecture](../architecture/)
- [Guides](../guides/)

---
## Current State

**Milestone 7 complete.** Edge/corner drag editing works:

- Bounds-based geometry: SO stores `x_min/max`, `y_min/max`, `z_min/max`
- Vertices derived from bounds (no stored vertex arrays)
- Ray-plane intersection projects mouse onto selected face
- Drag corner → resizes 2 dimensions; drag edge → resizes 1
- Bounds can cross (negative dimensions flip the shape)
- Hover disabled during drag/rotation

The app has:

- Panel layout with controls, details, graph regions
- Separators with fillets for rounded corners
- Quaternion-based 3D rendering (two nested cubes, drag to rotate)
- 3D hit detection for corners, edges, faces with hover/selection
- VitePress docs at docs.designintuition.app
- Main app at designintuition.app
