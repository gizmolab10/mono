# Coding needed

write a proposal for the first unchecked item to the top of handoff.

## work

- [ ] make netlify only build a single project in response to git push
- [ ] new UX for adding documents
    - [ ] button in controls "add"
    - [ ] new add.svelte in content area
    - [ ] new state store for content area (add, search, browse)
    - [ ] large drop here rectangle
    - [ ] add categories.svelte panel for tags
        - [ ] categories panel for choosing one or more
    - [ ] database repository
- [ ] change --text-color (white/black)
    - [ ] depending on luminance of bk color

## done

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
