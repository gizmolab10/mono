# Deliverables

**Started:** 2025-01-13
**Status:** In progress

Before I demo a fix to Vincent, review it with Wendy. For items that are checked, I need Wendy's feedback/confirmation. I will let her know in Telegram, and then meet with her to receive it.

## Milestones

- [ ] MVP that has no bugs (we must close the bug list, delivery by February) called "**golden master**"

## Testing environments

The urls for review and feedback

- [ ] [Catalist](https://www.catalist.network/seriously_view?object=1768857908919x153587680602915040&space=1747073877366x313460503630839800&theme=bubble) Vincent currently has this pointing to the version of webseriously that is under construction (it is **not** frozen).
- [ ] [webseriously](https://webseriously.org) current work in progress

## Catalist

### Bugs

- [ ] webseriously view is taller than the window
- [ ] top banner wraps badly -> places things on top of webseriously

### Questions

- [ ] do you show details on change of focus?
- [ ] is testing "connections" **vital** for final golden master?
- [ ] do we need an introductory summary of current behavior?

### Should we extend the GM date beyond Wednesday January 28?

- [ ] is it okay that, after a while, the resize feature becomes "reluctant" (just changes a tiny bit)?
- [ ] click to collapse when a child is selected
	- [ ] is it okay that the selection is no longer visible?
- [ ] click reveal dot to expand sometimes must (but never does) change focus (for levels)
	- [ ] no!! increment the levels instead
- [ ] 95% confidence that breadcrumbs are always in sync in plugin
- [ ] select A in breadcrumbs, to the left of focus, switch to radial
	- [ ] need focus to change so A will still be visible
		- [ ] **derive** focus from graph (radial / tree) mode
			- [ ] in radial, derived focus = selected's parent
	- [ ] ignored - focus is wrong

## Webseriously

### Bugs

- [ ] levels slider is ignored on increase
- [x] radial mode
	- [x] widgets overlap vertically
		- [x] when rotate ring is large
- [x] breadcrumbs
	- [x] command click on breadcrumb -> focus
	- [x] assure focus is ALWAYS shown in breadcrumbs
		- [x] do NOT make root the focus by default !!!
- [x] at launch, restore recents is broken
- [x] "<" and ">" are ignored. should bump depth levels
- [x] HITS detector location data -> out of date
	- [x] **need --** reproduction steps
- [x] unselect: SHIFT-click on background
- [x] w_rubberband_grabs WTF?
- [x] selection
	- [x] multiple
		- [x] shift key + click
		- [x] shift key + arrow key
	- [x] assure selection is always visible
		- [x] select something 3 levels inside focus. reduce # of levels, focus should change so the selection remains visible. it disappears
		- [x] set levels to 1, tap RIGHT arrow. nothing selected, focus did not change
		- [x] set levels to 1, select the focus. tap DOWN arrow. nothing selected, focus did not change
	- [x] click to select -> sends FOCUS event to bubble, should send SELECT
		- [x] unselect: SHIFT-click on selected
		- [x] in catalist, click A -> details shows A, click B -> details still shows A
		- [x] click recents button -> send a select event
		- [x] **No longer needed --** when selection event not passed to catalist (and hover ignored), switch between graph modes to restore

### Future Tasks

- [ ] show recents count and index in primary controls
- [ ] instead of reveal dot's big inner dot, enlarge stroke to indicate "hidden children here"
- [ ] support change in root
- [ ] implement keep the graph centered on the selection
- [ ] support edits made in Catalist (API is **incomplete**)
- [ ] test whether two-finger no longer moves the graph


