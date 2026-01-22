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

## Webseriously

### Bugs

- [ ] click to select -> sends FOCUS event to bubble, should send SELECT
	- [ ] in catalist, click A -> details shows A, click B -> details still shows A
	- [ ] when selection event not passed to catalist (and hover ignored), switch between graph modes to restore
	- [ ] click recents button -> send a select event
- [ ] unselect: shift click on selected, click background
- [ ] at launch, restore recents is broken
- [ ] reveal children should change focus, doesn't
- [ ] click breadcrumb to left of focus -> is ignored
- [ ] in radial mode
	- [ ] widgets overlap vertically
	- [ ] not show details of focus
- [ ] need to test whether two-finger no longer moves the graph

### Change Requests


- [ ] click on a breadcrumb -> select (NEVER focus -- adding a dot is unnecessary)
- [+] assure selection is always visible
	- [+] select something 3 levels inside focus. reduce # of levels, focus should change so the selection remains visible. it disappears
	- [+] set levels to 1, tap RIGHT arrow. nothing selected, focus did not change
	- [+] set levels to 1, select the focus. tap DOWN arrow. nothing selected, focus did not change
	- [ ] tap DOWN arrow -> should not change focus
- [ ] fix multiple widget selection behavior
	- [ ] shift key + click
	- [ ] shift key + arrow key
- [ ] select A, more than one level below focus, switch to radial, expected focus to change so A will still be visible
	- [ ] **derive** focus from graph (radial / tree) mode

### Work in Progress

- [+] static-dynamic focus
- [+] experimental breadcrumb mode

### Future Tasks

- [ ] support change in root
- [ ] implement keep the graph centered on the selection
- [ ] support edits made in Catalist (API is **incomplete**)
- [ ] do we need an introductory summary of current behavior?


