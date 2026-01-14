# Deliverables


**Started:** 2025-01-13

**Status:** Tracking


Before I even demo a fix to Vincent, review it with Wendy. For items that are marked as **fixed**, they need Wendy's feedback, so she wants me to let her know in Telegram.

## Milestones

- [ ] MVP that has no bugs (we must close the bug list, delivery by February)

## Testing environments

The urls for review and feedback

- [ ] [Catalist](https://www.catalist.network/version-test/seriously_view?object=1759366865929x617964618791821700&space=1759365279523x305705732516610050) Vincent currently has this pointing to the version of webseriously that is under construction (it is **not** frozen).
- [ ] [webseriously](https://webseriously.org)

## Catalist

### Bugs

- [ ] webseriously view is taller than the window
- [ ] top banner wraps badly (places things on top of webseriously) when window too narrow

### Questions

- [ ] \
  - [ ] \
  - [ ] or just disable rubber band

## Webseriously

### Bugs

- [x] no breadcrumbs in catalist
- [x] must send select event
- [x] sometimes (rarely) title is same color as background
- [x] in catalist, focus on main argument, then focus on its parent. FUBAR
- [x] little button to visit this material missing from netlify and public
- [ ] editing is NOT disabled, which may cause:
  - [ ] clicking around sometimes doesn’t select things on the first click
  - [ ] edit a widget. click background. rubber band another widget. editing remains active
- [ ] sliding the levels does not update the number
  - [ ] the tree graph shows a different number of levels
  - [ ] command + set the levels to 12
- [ ] click on A, then click on B, sometimes A still indicates it is selected
- [ ] in every widget the title is not vertically centered
- [ ] build notes steppers ignored

### Change Requests

- [x] disable double-click
- [ ] disable rubber band


- [ ] remove the static-dynamic selector, always dynamic


- [ ] remove the force graph to, from preferences
- [ ] make numbers for lists the default
- [ ] fix multiple selection behavior
  - [ ] shift key + click
  - [ ] shift key + arrow key
- [ ] click on a breadcrumb should select, NEVER focus (adding a dot is unnecessary)
  - [ ] remove breadcrumb mode selector. default to "selection" and perfect it
  - [ ] breadcrumbs have duplicates for selection mode
  - [ ] right now, click on a breadcrumb sends a select event, it shouldn't


- [ ] click in background of graph deselects everything
  - [ ] NOT do that until the rubber band INCLUDES some widgets and then alter the selection

### Work in Progress

- [ ] static-dynamic focus
- [ ] experimental breadcrumb mode

### Future Tasks

- [ ] support change in root
- [ ] implement keep the graph centered on the selection
- [ ] support edits made in Catalist (API is **incomplete**)
- [ ] do we need an introductory summary of current behavior?


