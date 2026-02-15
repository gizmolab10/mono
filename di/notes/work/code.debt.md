# Code Debt

offer a proposal for the first unchecked item

- [x] Render is gigantic. can it be simplified (eg, with helpers, factories, ...), or split into two classes? three...?
	- extracted R_Dimensions.ts (~270 lines), R_Angulars.ts (~290 lines), R_Grid.ts (~120 lines)
	- Render.ts: 1797 → 939 lines
	- remaining candidates: Occlusion + Intersections (coupled)
- [ ] use codegraph
---
- [ ] pac: in all code files, use tabs that are 4 (not 2) spaces
- [ ] tweak dimensionals
	- [ ] tab between dimensionals
	- [ ] arrow-key nudging (±unit of precision)
- [ ] color inheritance
	- [ ] assign the color to the selected SO
	- [ ] make all children inherit the color of their parent
