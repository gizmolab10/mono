# Code debt

write a proposal for the first unchecked item to the top of handoff.

## work

- [ ] OKF
    - [ ] the title label is not the file name, why?
    - [ ] what is 'says' label for?
        - [ ] make 'says' multi-line, auto-adjust height
    - [ ] click file name -> edit in place
        - [ ] ie, centered -> typing is a bitch?
- [ ] filters
    - [ ] animate their relayout on list files
    - [ ] click in area below separator -> rules
        - [ ] click closes that section
        - [ ] hover lights up the clickable sep title
        - [ ] tags area is different

## done

- [x] editing an md block
    - [x] make the font and linespacing same as while just viewing
- [x] add an anything llm button to the hub, top row, far left "LLM"
- [x] the top clickable sep should say 'okf' when editing is turned on and nothing when it is off
- [x] implement [[tags hierarchy]]
- [x] drag and drop -> update both index files
- [x] when folders are visible, implement drag and drop to move files from one folder to another
- [x] steps to annotate for okf a file when adding it to the guides
- [x] mark each listed guide regarding
    - [x] match of: name or content
    - [x] on click of the matched-content
        - [x] copy search to view's search
        - [x] on return to browse, clear the view's search
- [x] count all the .md files
- [x] while holding both command and option keys down, click on a file name opens it in obsidian
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

## soon

- [ ] svg
    - [ ] circle slash -> the opposite of whatever it overlays
    - [ ] filter -> several horizontal lines of decreasing length
    - [ ] convert the two fat triangles in the view guide -> Steppers.svelte component
        - [ ] prop isVertical, alwaysShowBoth
- [ ] separator
    - [ ] new prop for gap -> whitespace around line (strips parallel to it)
    - [ ] where do reach and spacer get used?
- [ ] work has different tags — propose, design, progress, vital — area 'work'
- [ ] checkbox in details preferences to show/hide tooltips
- [ ] button to add a sibling to the current viewed file and open it for editing
    - [ ] not need a relaunch of the server for adding a file
- [ ] click and hold on a header opens the filters. does nothing if they are open

### content

- [ ] bring okf up to date
    - [ ] revise okf.md to read like a guide file
- [ ] do all the guide files read like a guide file?
    - [ ] propose to remove material that is no longer relevant
- [ ] work on murky

## postpone

- [ ] incorporate work, source code, hooks and CLAUDE
    - [ ] can each file get okf labels at the top?
    - [ ] add more kinds and tags?
- [ ] follow a link that points outside the guides folders (a work note, a code file)
    - [ ] abandoned for now, the shape of it was never clear
- [ ] encapsulate in a new file ts/common/okf.md
    - [ ] for open source
    - [ ] ALL the kinds, tags, project 2-char names
    - [ ] and associated logic

- [ ] when a link's target is an anchor, add the anchor to the fifo

