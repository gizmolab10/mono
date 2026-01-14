# Deliverables


**Started:** 2025-01-13**Status:** Tracking


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

- [ ] **cannot reproduce** -- sometimes (rarely) title is same color as background
- [ ] **cannot reproduce** -- in catalist, focus on main argument, then focus on its parent. FUBAR
- [ ] click in background of graph deselects everything
  - [ ] should it NOT do that until the rubber band INCLUDES some widgets and then alter the selection?

## Webseriously

### Bugs

- [ ] sliding the levels does not update the number
  - [ ] the tree graph shows a different number of levels
  - [ ] command + set the levels to 12
- [ ] editing is NOT disabled, which may cause:
  - [ ] clicking around sometimes doesn’t select things on the first click
  - [ ] edit a widget. click background. rubber band another widget. editing remains active
- [x] no breadcrumbs in catalist
- [x] must send select event

### Change Requests

- [x] double-click should be disabled
- [ ] click on a breadcrumb should select, NEVER focus (adding a dot is unnecessary)
  - [ ] remove breadcrumb mode selector. default to "selection" and perfect it
  - [ ] breadcrumbs have duplicates for selection mode
  - [ ] right now, click on a breadcrumb sends a select event, it shouldn't
- [ ] remove the force graph to, from preferences
- [ ] remove the static-dynamic selector, always dynamic
- [ ] make numbers for lists the default
- [ ] little button to visit this material

### Work in Progress

- [ ] static-dynamic focus
- [ ] experimental breadcrumb mode

### Future Tasks

- [ ] support change in root
- [ ] implement keep the graph centered on the selection
- [ ] support edits made in Catalist (API is **incomplete**)
- [ ] do we need an introductory summary of current behavior?


## Under Construction

### Little round button to visit this material

#### **Questions:**





1. Where does the button go? — in the build notes overlay, at the bottom left corner
2. What does "visit" mean? — open a url (to be determined)
3. ws-only or also Bubble plugin? — ws only

#### Tasks:

- [x] add a round button component to bottom left corner of build notes component
- [ ] devise a url for presenting this content
  - [ ] move deliverables to ws/notes/guides
  - [ ] deploy
    - [x] a. Update .vitepress/config.ts with multi-project sidebar
    - [ ] b. Create Netlify site for mono-docs
    - [ ] c. Configure rewrites so `/ws/` → `projects/ws/notes/`, `/di/` → `projects/di/notes/`, `/mono/` → `notes/`
    - [ ] d. Update `update-project-docs.sh` to build unified docs
    - [ ] e. Point `docs.webseriously.org` to mono-docs Netlify
    - [ ] f. Update hub config with new public URLs
    - [ ] g. Retire separate ws-docs and di-docs Netlify sites
- [ ] wire up the handle click logic



