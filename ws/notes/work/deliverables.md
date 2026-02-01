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

\`### Bugs

- [ ] webseriously view is taller than window
- [ ] top banner wraps badly -> places things on top of webseriously

### Questions

- [ ] do you show details on change of focus?
- [ ] is testing "connections" **vital** for final golden master?
- [ ] do we need an introductory summary of current behavior?

### Should we extend GM date beyond Friday January 30?

- [ ] yes

## Webseriously

### Bugs

- [x] shift-click one of the multiply selected, deselects all
- [x] click on a breadcrumb to the left of the focus -> change the focus
- [x] radial mode -> changing the focus -> selects the focus
- [x] send vincent the ws logo
- [x] remove cluster pager from Visibility, etc
- [x] click background in radial -> HANG
- [x] click in breadcrumb left of focus, change the selection
  - [x] details should say selection, not focus
- [x] **firefox**
  - [x] next and previous buttons not visible
  - [x] reveal dots not visible
  - [x] preferences details accent color dot's border is broken
  - [x] levels slider is incorrectly drawn

### Future Tasks

- [ ] details banners hover wrong for traits and data
- [ ] add dot to breadcrumb -> focus
- [ ] API -> change in root
- [ ] API -> edits made in Catalist
- [ ] show recents count and index -> primary controls
- [ ] instead of reveal dot's big inner dot, enlarge stroke to indicate "hidden children here"
- [ ] implement keep graph centered on selection
- [ ] test whether two-finger no longer moves graph
