# Code debt

write a proposal for the first unchecked item to the top of handoff.

## work

- [ ] convert the two fat triangles in the view guide -> Steppers.svelte component
- [ ] for each tag the user choses, remove it from every row's tag column cell
- [ ] checkbox in details preferences to show/hide tooltips
- [ ] bring okf up to date
- [ ] work on murky
- [ ] click and hold on a header opens the filters. does nothing if they are open
- [ ] new prop for separator gap -> whitespace around line (strips parallel to it)

## done

- [x] steps to annotate for okf a file when adding it to the guides
- [x] mark each listed guide regarding
    - [x] match of: name or content
    - [x] on click of the matched-content
        - [x] copy search to view's search
        - [x] on return to browse, clear the view's search
- [x] count all the .md files

## postpone

- [ ] incorporate work files, hooks and CLAUDE
    - [ ] each file gets okf at the top
    - [ ] decide on kinds and tags
- [ ] follow a link that points outside the guides folders (a work note, a code file) — abandoned for now, the shape of it was never clear
- [ ] encapsulate in a new file ts/common/okf.md
    - [ ] for open source
    - [ ] ALL the kinds, tags, project 2-char names
    - [ ] and associated logic

- [ ] when a link's target is an anchor, add the anchor to the fifo

## done

- [x] add editing ability
    - [x] stamp each piece with the lines it came from
    - [x] click a piece to edit it, in the file's own words
    - [x] swap those lines, leaving every other line untouched
    - [x] draw the guide again from the changed text
    - [x] a route that accepts writes, with two refusals
    - [x] the five labels edited through their own form
- [x] add a toggle button top left hide/show filters
- [x] add search to view guides, a new second row
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
