# Code debt

write a proposal for JUST the first unchecked item (ignore sll the others)  to the top of handoff. success first.

## work

- [ ] eliminate purpose
    - [ ] add 'design' and 'work' to kinds
    - [ ] add to 'fix' area's tagset -> propose, coding, done
        - [ ] rename fix -> progress
- [ ] loc where labels are added when detected as missing
- [ ] mark 'stale' all guide files that contain completed tasks, phases, steps
- [ ] filters
    - [ ] animate their relayout on list files
    - [ ] click in area below separator -> rules
        - [ ] click closes that section
        - [ ] hover lights up the clickable sep title
        - [ ] tags area is different
- [ ] add (find and) replace in edit
- [ ] for work files -> support for check lists
- [ ] button to add a sibling to the current viewed file and open it for editing
- [ ] whitespace around almond in header's thin line --gap-tight
- [ ] OKF
    - [ ] the title label is not the file name, why?
    - [ ] what is 'says' label for?
        - [ ] make 'says' multi-line, auto-adjust height
    - [ ] click file name -> edit in place
        - [ ] ie, centered -> typing is a bitch?

- [ ] new unified look
    - [ ] search, n of m steppers
    - [ ] navigation and name and ancestry
    - [ ] filters
    - [ ] content

## Next — mark the guides that are talking about finished work

### Success

1. Every guide whose words are a list of completed tasks, phases or steps wears the `stale` tag.
2. Nothing else is changed in those files — only the tag line.
3. The count is said plainly: how many were looked at, how many were marked.
4. A guide already marked is left alone rather than marked twice.

### The shape of it

A guide that reads as a checklist of things already done is a record, not guidance — it wants a rewrite, and `stale` is the tag that says so. The judging cannot be automated: a file full of ticked boxes might be a finished plan or a live one. So the pass is: find the candidates by what is in them, list them for a person, and mark only what that person confirms.

One word covers both on purpose. `stale` already means "this has fallen behind what it describes", and a file that is a list of finished work has fallen behind in exactly that way — it describes doing rather than done. A second tag would split one idea in two and leave a reader deciding which applies, which is how a closed list stops being readable.

## done

- [x] one ladder of names across every kind of measurement
    - [x] separator folded into thickness, the two being the same thing
    - [x] the styling names follow the same ladder
    - [x] the typeface got a name of its own, so it stops fighting the middle text size
- [x] the top of a file reads as one fixture — a fixed slot for the title, a line across the page below it
    - [x] the line belongs to the page, not to the title, so folding or opening the title never takes it away
    - [x] a piece opened for changing holds the piece below it exactly where it stood
- [x] the dispatcher's list is the app's whole picture — no build-time scan of the guide folders
    - [x] nothing reloads the page when a guide is written, renamed, moved or thrown away
    - [x] with the dispatcher not answering, the screen says so rather than sitting empty
- [x] editor: a ⤴ button right of the trash, opening a message with the guide's words
- [x] moving a file no longer restarts the app
- [x] mo/pre-flight — replying became response, working became agency
- [x] ji — a ⤴ button left of help; the chat stays on screen while the AI is unreachable
- [x] a file added to the guides shows without a relaunch
    - [x] the dispatcher says what is on disk; the app reads anything its prepared list missed
    - [x] a file with no labels gets a block composed from its own words, marked stale
- [x] editor — the file name is a field that reads as plain words until pointed at
    - [x] leaving it, or Return, renames the file; Escape puts the old name back
    - [x] the view follows the file to its new place rather than shutting
- [x] editor — a trash mark at the right of the second row
    - [x] pressing it asks `delete "<name>"?` in the row itself, the name stepping aside
    - [x] the dispatcher gained a delete route, with the same refusals as moving
- [x] editor — code blocks can be edited, and command-b/i/hyphen mark up what is picked
    - [x] typing a bracket or a quote with words picked wraps them, and again unwraps
- [x] rename the five kinds — specify, step, wire, explain, refer
- [x] rename list files -> files, edit file -> edit
- [x] svg
    - [x] circle slash -> the opposite of whatever it overlays
    - [x] filter unichar -> several horizontal lines of decreasing length
- [x] scrollbars in list are too thin
    - [x] one place says how thick, every scrolling box reads it
    - [x] a thumb never shorter than a fifth of its lane
    - [x] both thumbs drawn at once — the floored one, and a marker where the browser would have put it
- [x] wider hover&click area around every sep = thickness
- [x] edit — the file name centered in what the folders leave over
- [x] list — the project column and the count read at the label size
- [x] put success at the top of the proposal
- [x] remove close button from edit
    - [x] click anywhere in the two rows
    - [x] other than the controls and the file name
    - [x] goes to the list
    - [x] hovering the empty part lights the whole area, out to the box's edges
- [x] one search for both list and edit
    - [x] same words, same lit place, surviving the walk between them and a reload
- [x] a section's own soft pointer works while the title is folded
- [x] edit file
    - [x] search row above, controls row below
    - [x] ancestry beside the steppers
    - [x] same row height as the list, so nothing shifts on the way in and out
    - [x] move close button to far right, adjusting other buttons
    - [x] H1 soft pointer should also open/fold its own para content
    - [x] remove the rename button, leave its handler as is
- [x] rename view file -> edit file
    - [x] remove the edit button and the is editing state
    - [x] rewrite the code to remove executed when 'is editing' == false
- [x] add show/hide soft_pointer for H2 - 6
    - [x] in left-side margin, as with obsidian
    - [x] H1 -> toggles all
- [x] in list files, move show/hide filter button into **sep** below search box (clickable and hoverable)
    - [x] clickable title says 'filters', unicode bold arrow, and comma separated list:
        - [x] purposes, projects, kind, tags
    - [x] when showing filters, keep both **seps**
        - [x] this new one
        - [x] the current unlabeled below the filters
- [x] convert the two fat triangles in the view guide -> Steppers.svelte component
    - [x] prop isVertical, alwaysShowBoth
- [x] hover on seg -> make border around title pill border-box
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

- [ ] separator
    - [ ] new prop for gap -> whitespace around line (strips parallel to it)
    - [ ] where do reach and spacer get used?
- [ ] work has different tags — propose, design, progress, vital — area 'work'
- [ ] checkbox in details preferences to show/hide tooltips
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

