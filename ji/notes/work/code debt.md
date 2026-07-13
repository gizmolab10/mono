# Coding needed

write a proposal for the first unchecked item to the top of handoff.

## work

- [ ] phase 2 -> new UX for adding documents
    - [x] add -> more file types
        - [x] pdf
        - [x] jpg
        - [x] show type in browse table
        - [ ] show all acceptable types in drop here, smaller font, below drop here, centered
    - [ ] determine design and wire in
        - [ ] add_categories.svelte for creating new
        - [ ] categories.svelte for choosing one or more
            - [ ] share with search
        - [ ] in browse
            - [ ] show tags and an 'edit tags' button
- [ ] port the diagnostic log feature from di
- [ ] remove all unused T_Preference items
- [ ] move di hooks -> mono
- [ ] front page
- [ ] write a new file: stipulations based on current code

## done

- [x] phase 2 -> database repository
    - [x] what is unsaved?
    - [x] persist more/less choice
    - [x] add an 'erase all data' button
        - [x] same row as segmented control, far right
        - [x] click -> show an 'are you sure' dialog
    - [x] port D_Data.svelte from ws
    - [x] port (rewrite) all DB code from ws
    - [x] using [[db spec]] as single source of truth
    - [x] write db proposal -> to implement [[db spec]]
    - [x] implement db proposal and track progress in db handoff
- [x] nudge text inside segmented control up 2 px
- [x] phase 1 -> new UX for adding documents
    - [x] new state store for content area (add, search, browse)
        - [x] persist new state
    - [x] button "add" next to hamburger
        - [x] convert button to segmented control
            - [x] segment corresponding to current state, bg color -> --accent
    - [x] new add.svelte in content area
        - [x] large drop here rectangle
    - [x] not wired in, not visible, just empty stubs, design TBD
    - [x] remove <- from add
    - [x] click on current operation segment -> sets w_operation to null
- [x] hamburger
    - [x] separate singleton
    - [x] rename it -> controls
    - [x] include segmented control
    - [x] move back -> main
    - [x] remove from details
    - [x] colors depend on details are hidden ->
        - [x] background
        - [x] hover
        - [x] text 
    - [x] intersection draws details below controls
    - [x] owned by intersection
    - [x] rename main -> intersection
- [x] change --text-color (white/black) — flips by background luminance; content text from bg, details text from accent
- [x] make netlify only build a single project in response to git push
- [x] button with my name as author
    - [x] click opens my other work (jonathansand.me)
    - [x] bottom right corner
- [x] when the build notes show, hide the details and the content
- [x] port preferences from di and put show details flag into it
- [x] reverse the order of the main checkboxes (retain order of sub items)
- [x] replace the 'D' button with the hamburger svg, exactly the same as di
    - [x] convert it to a snippet
    - [x] show it in the details button/banner so it is at the identical same spot
- [x] move builds button to bottom left corner of Content
    - [x] make its bg color white
- [x] add a new banner at top of details
    - [x] click on it toggles the details visibility
    - [x] when hidden, shrink details to a button with "D" on it
- [x] change 'in' to 'ji'
    - [x] push to netlify
- [x] port build notes from di
- [x] wire up public site
    - [x] github
    - [x] netlify
- [x] add ‘in’ to hub
