# Deliverables

**Started:** 2025-01-13
**Status:** In progress

Before I demo a fix to Vincent, review it with Wendy. For items that are checked, I need Wendy's feedback/confirmation. I will let her know in Telegram, and then meet with her to receive it.

## Milestones

- [ ] MVP that has no bugs (we must close bug list, delivery by February) called "**golden master**"

## Testing environments

urls for review and feedback

- [ ] [Catalist](https://www.catalist.network/seriously_view?object=1768857908919x153587680602915040&space=1747073877366x313460503630839800&theme=bubble) Vincent currently points it to version of webseriously that is under construction (it is **not** frozen -- all bugs I accidentally introduce will be visible)
- [ ] [webseriously](https://webseriously.org) current work in progress

## Catalist

### Bugs

- [ ] webseriously view is taller than window
- [ ] top banner wraps badly -> places things on top of webseriously

### Questions

- [ ] do you show details on change of focus?
- [ ] is testing "connections" **vital** for final golden master?
- [ ] do we need an introductory summary of current behavior?

### Should we extend GM date beyond Wednesday January 28?

- [x] 95% confidence that breadcrumbs are always in sync in plugin
- [x] is it okay? -> after a while, resize feature becomes "reluctant" (just changes a tiny bit)
- [x] click to collapse when a child is selected
	- [x] is it okay that selection is no longer visible?
- [x] click reveal dot to expand -> changes focus when levels otherwise hide children
	- [x] not pleasant, too abrupt and disorienting
	- [x] increment levels instead?
- [x] select A in breadcrumbs, **more** than one to left of focus, switch to radial
	- [x] A is no longer visible
	- [x] need focus to change so A will still be visible
		- [x] **derive** focus from graph (radial / tree) mode
			- [x] in radial, derived focus = selected's parent
			- [x] A being selected **freezes radial view** (in order to focus on A's parent)
	- [x] cannot be done without either:
		- [x] deselect A
		- [x] change (not derive) focus (so going back to tree, focus and tree have changed)

## Webseriously

### Bugs

- [ ] click one of the multiply selected, deselects all
- [ ] click on a breadcrumb to the left of the focus -> change the focus
- [ ] radial mode -> changing the focus -> selects the focus
- [x] levels slider is ignored on increase
- [x] radial mode
	- [x] widgets overlap vertically
		- [x] when rotate ring is large
- [x] breadcrumbs
	- [x] command click on breadcrumb -> focus
	- [x] assure focus is ALWAYS shown in breadcrumbs
		- [x] do NOT make root focus by default !!!
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
		- [x] select something 3 levels inside focus. reduce # of levels, focus should change so selection remains visible. it disappears
		- [x] set levels to 1, tap RIGHT arrow. nothing selected, focus did not change
		- [x] set levels to 1, select focus. tap DOWN arrow. nothing selected, focus did not change
	- [x] click to select -> sends FOCUS event to bubble, should send SELECT
		- [x] unselect: SHIFT-click on selected
		- [x] in catalist, click A -> details shows A, click B -> details still shows A
		- [x] click recents button -> send a select event
		- [x] **No longer needed --** when selection event not passed to catalist (and hover ignored), switch between graph modes to restore

### Future Tasks

- [ ] add dot to breadcrumb -> focus
- [ ] API -> change in root
- [ ] API -> edits made in Catalist
- [ ] show recents count and index -> primary controls
- [ ] instead of reveal dot's big inner dot, enlarge stroke to indicate "hidden children here"
- [ ] implement keep graph centered on selection
- [ ] test whether two-finger no longer moves graph


