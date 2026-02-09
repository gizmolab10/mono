# Code Debt

- [ ] add new child -> wrong dimensions
	- [ ] algorithm: using smallest length of parent, divide that in half, use that for all dimensions
- [ ] hidden line clipping
- [ ] logarithmic scaling slider
- [ ] ability to drag the current SO
- [ ] ability to export/import to/from file
- [ ] tweak dimensionals
	- [ ] tab between dimensionals
	- [ ] arrow-key nudging (±unit of precision)

## Done

- [x] selecting often fails
- [x] rename test -> hit_test
- [x] algebra fails 1" + 2" -> 1'
- [x] convert Stores into a class
- [x] move precision and units to details
- [x] new children spontaneously appear
- [x] steppers hop up and down in build notes
- [x] convert Orientation functions into a class
- [x] dimensionals sometimes do not extend outward from SO
- [x] add a controls button "show/hide dimensionals" a boolean
- [x] add button "show/hide dimensionals" a boolean that render reacts to
- [x] make the height of units system button consistent with other buttons
- [x] bugs in controls:
	- [x] imperial when active has a white outline around the blue border and the blue border is slightly taller than the button without the blue. metric and other
	- [x] units should render with only 1 decimal point of precision
	- [x] 2D should render in (ahem) 2D
- [x] convert precision into a segmented control whose segment titles depend on the units system
	- [x] imperial: whole, 1/2, 1/4, 1/8, 1/16, 1/32, 1/64
	- [x] others: whole, 1, 2, 3
	- [x] constrain the SOT values accordingly
- [x] cruft
	- [x] consolidate redundancy
	- [x] simplify over-engineering
	- [x] remove inconsistencies
	- [x] ameliorate structural risks

