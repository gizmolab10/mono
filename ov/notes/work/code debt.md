# Code debt

do not write a proposal for the first unchecked item to the top of handoff.

## work

- [ ] add search to view guides, a new second row
- [ ] add a toggle button top left hide/show filters
- [ ] encapsulate in in ts//common/okf.md
    - [ ] ALL the kinds, tags, project 2-char names
    - [ ] and associated logic

## postpone

- [ ] when a link's target is an anchor, add the anchor to the fifo
- [ ] incorporate work files, hooks and CLAUDE
- [ ] add editing ability

## done

- [x] bring internal hyperlinks to life
- [x] translate md -> html, and display the html in the view document
- [x] delay showing the app until hierarchy is loaded
- [x] add two labels in the top row of view guide
    - [x] kind at immediate right of fat triangles
    - [x] tags to the immediate left of close button
- [x] add show/hide folders button at far left of counts row, keep the counts centered
- [x] add another segmented control/filter -> projects
    - [x] above kinds
    - [x] sep between them
- [x] add sorting to filters, only when hiding folders
    - [x] click on header label (kind, name, or tags)
        - [x] once to sort ascending, again for descending
    - [x] add a button next to hide show folders "unsorted"
        - [x] appears only when (a) folders are hidden and (b) any of the sorts are invoked
- [x] each row -> expand the clickable and tt responder to the entire row
