# Deliverables


**Started:** 2025-01-13

**Status:** Tracking


Before I even demo a fix to Vincent, review it with Wendy. For items that are marked as **fixed**, they need Wendy's feedback, so she wants me to let her know in Telegram.

## Milestones

- [ ] MVP that has no bugs (we must close the bug list, delivery by February)

## Testing environments

The urls for review and feedback

- [ ] [Catalist](https://www.catalist.network/seriously_view?object=1768857908919x153587680602915040&space=1747073877366x313460503630839800&theme=bubble) Vincent currently has this pointing to the version of webseriously that is under construction (it is **not** frozen).
- [ ] [webseriously](https://webseriously.org)

## Catalist

### Bugs and Questions

- [ ] webseriously view is taller than the window
- [ ] top banner wraps badly (places things on top of webseriously) when window too narrow
- [ ] click to collapse when a child is selected -> okay that the selection is no longer visible?
- [ ] testing "connections" is vital for final golden master

## Webseriously

### Bugs

- [x] unselect: SHIFT-click on background
- [x] w_rubberband_grabs WTF?
- [ ] HITS detector location data -> out of date
	- [ ] **need --** reproduction steps
- [ ] reveal children sometimes must (but never does) change focus (for levels)
- [ ] at launch, restore recents is broken
- [ ] **DEFER --** need to test whether two-finger no longer moves the graph
- [ ] "<" and ">" are ignored. should bump depth levels
- [ ] select A, more than one level below focus, switch to radial, expected focus to change (it didn't) so A will still be visible
	- [ ] **derive** focus from graph (radial / tree) mode
- [ ] breadcrumbs
	- [ ] **FUBAR --** out of date in plugin
	- [ ] click breadcrumb to left of focus -> is ignored
- [ ] in radial mode
	- [ ] widgets overlap vertically
	- [ ] not show details of focus
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

- [ ] support change in root
- [ ] implement keep the graph centered on the selection
- [ ] support edits made in Catalist (API is **incomplete**)
- [ ] do we need an introductory summary of current behavior?


