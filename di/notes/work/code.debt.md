# Code Debt

offer a proposal for the first unchecked item


- [ ] hover/click should hit the front most SO
	- [ ] performance analysis?
- [ ] ability to drag the current SO
	- [x] click on a face and drag it
	- [x] ignore drag when applied to the root SO
	- [x] constrain movement within the plane of the front-most facing face OF THE PARENT SO
	- [ ] movement does not follow mouse
		- [ ] need to project mouse movement (2d vector) onto this plane (different vector)
		- [ ] compute the new x,y,z 
- [ ] hide occluded dimensionals
- [ ] 2D needs to be a "infinite zoom" projection
---
- [ ] in all code files, use 4-space tabs (not 2-)
- [ ] tweak dimensionals
	- [ ] tab between dimensionals
	- [ ] arrow-key nudging (±unit of precision)
- [ ] color inheritance
	- [ ] assign the color to the selected SO
	- [ ] make all children inherit the color of their parent

## Done
