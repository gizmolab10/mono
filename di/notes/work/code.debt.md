# Code Debt

- [x] bugs in controls:
	- [x] imperial when active has a white outline around the blue border and the blue border is slightly taller than the button without the blue. metric and other
	- [x] units should render with only 1 decimal point of precision
	- [x] 2D should render in (ahem) 2D
- [x] move precision and units to details
- [x] add a controls button "show/hide dimensionals" a boolean
- [x] convert precision into a segmented control whose segment titles depend on the units system
	- [x] imperial: whole, 1/2, 1/4, 1/8, 1/16, 1/32, 1/64
	- [x] others: whole, 1, 2, 3
	- [x] constrain the SOT values accordingly
- [x] add button "show/hide dimensionals" a boolean that render reacts to
- [x] make the height of units system button consistent with other buttons
- [ ] **bug**: steppers hop up and down
- [ ] ability to drag the current SO
- [ ] ability to Export/import to file
- [ ] tweak dimensionals
	- [ ] **bug**: dimensionals sometimes do not extend outward from SO
	- [ ] Tab between dimensionals
	- [ ] Arrow-key nudging (±1/64" or ±1mm)
	- [ ] Constraint propagation

