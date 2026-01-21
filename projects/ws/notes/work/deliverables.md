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

### Bugs

- [ ] webseriously view is taller than the window
- [ ] top banner wraps badly (places things on top of webseriously) when window too narrow


## Webseriously

### Bugs

- [x] no breadcrumbs in catalist
- [x] must send select event
- [x] sometimes (rarely) title is same color as background
- [x] in catalist, focus on main argument, then focus on its parent. FUBAR
- [x] little button to visit this material missing from netlify and public
- [x] **fixed** -- build notes steppers ignored
- [ ] restore recents is broken
- [ ] need to test two-finger no longer moves the graph
- [ ] click to collapse when a child is selected -> this is okay
- [ ] in catalist, click A -> details shows A, click B -> details still shows A
- [ ] reveal children should change focus, doesn't
- [ ] click breadcrumb to left of focus -> is ignored
- [ ] when selection event not passed to catalist (and hover ignored), switch between graph modes to restore
- [ ] in radial mode
	- [ ] widgets overlap vertically
	- [ ] not show details of focus
- [x] **fixed** -- editing is NOT disabled in 0.3.3, which may cause:
	- [x] clicking around sometimes doesn’t select things on the first click
	- [x] edit a widget. click background. rubber band another widget. editing remains active
- [x] **fixed** -- sliding the levels does not update the number
	- [x] **fixed** -- the tree graph shows a different number of levels
	- [x] **fixed** -- command + set the levels to 12
- [x] **fixed** -- in every widget the title is not vertically centered
- [ ] **cannot replicate** -- click on A, then click on B, sometimes A still indicates it is selected

### Change Requests

- [x] disable double-click
- [x] **fixed** -- disable rubber band
- [x] **fixed** -- remove the static-dynamic selector, always dynamic
- [x] **fixed** -- remove the breadcrumbs focus/selection/recents. always selection
- [x] **fixed** -- search input field is too wide
- [x] **fixed** -- remove the force graph to, from preferences
- [x] **fixed** -- make numbers for lists the default
- [ ] select A, more than one level below focus, switch to radial, expected focus to change so A will still be visible
	- [ ] make focus derived from radial vs. tree modes
- [x] **fixed** -- click in background of graph deselects everything
	- [ ] **for standalone only --** NOT do that until the rubber band INCLUDES some widgets and then alter the selection
- [x] **fixed** -- click on a breadcrumb should select, NEVER focus (adding a dot is unnecessary)
	- [x] **fixed** -- remove breadcrumb mode selector. default to "selection" and perfect it
	- [ ] **declined, unreasonable** -- right now, click on a breadcrumb sends a select event, it shouldn't
	- [+] **cannot replicate** -- breadcrumbs have duplicates
- [+] **fixed** -- assure selection is always visible
	- [+] **fixed** -- select something 3 levels inside focus. reduce # of levels, focus should change so the selection remains visible. it disappears
	- [+] **fixed** -- set levels to 1, tap RIGHT arrow. nothing selected, focus did not change
	- [+] **fixed** -- set levels to 1, select the focus. tap DOWN arrow. nothing selected, focus did not change
	- [ ] tap DOWN arrow. should not change focus
- [ ] fix multiple widget selection behavior
	- [ ] shift key + click
	- [ ] shift key + arrow key

### Work in Progress

- [+] **fixed** -- static-dynamic focus
- [+] **fixed** -- experimental breadcrumb mode

### Future Tasks

- [ ] support change in root
- [ ] implement keep the graph centered on the selection
- [ ] support edits made in Catalist (API is **incomplete**)
- [ ] do we need an introductory summary of current behavior?


