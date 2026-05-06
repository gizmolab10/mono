# Code Debt

Running a project according to code debt changes the dynamic. unpaid code debt makes development and maintenance harder. paying it as a high priority helps prevent the project from spiraling into tangles.

offer a proposal for the first unchecked item, and add it to a new section at the end of handoff

- [ ] add a separator between
    - [ ] attributes table and show/hide givens button
    - [ ] parts table and duplicate button row
- [ ] move single visible part up 6 px
- [ ] shrink gab below show givens button
- [ ] ability to cut an SO in half
    - [ ] a "cut" button to the left of the existing "duplicate" button
    - [ ] cut longest (plain length value) dimension
        - [ ] refuse if two longest dimensions are equal
        - [ ] show error in status strip
    - [ ] repeaters -> duplicate the template (so both halves have an identical copy)
        - [ ] produces two repeaters (each with its own template)
    - [ ] a clone or a template or any part that has children -> refuse
        - [ ] hide the cut button
    - [ ] formulas -> duplicated except on axis being cut
        - [ ] each half gets a revised formula such that their values are exactly half the original's length on that axis
            - [ ] leave the invariant formula alone. it is, ahem! invariant
            - [ ] if the invariant is 'l' alter the 'e' of the original and the 's' of the new, to place them exactly half way
            - [ ] if the invariant is 's' divide the 'l' in half and set 'e' in the original to be half way
            - [ ] if the invariant is 'e' divide the 'l' in half and set 's' in the new to be half way
            - [ ] "half way" means: "alter the formula such that the value is half way"
                - [ ] if no formula, "compute and set the value to be half way
    - [ ] expand "duplicate" helper
        - [ ] original keeps its current name and the new sibling gets a numeric-suffix name (matching the duplicate routine's naming)
    - [ ] new half becomes the selected part
- [ ] rename givens -> constants
- [ ] convert button 'create a template' -> stud/joist / stair segmented
- [ ] crowded dimensionals
- [ ] option to group attributes by axis (in first column: sle -> xyz)
- [ ] mobile
    - [ ] thin gaps
    - [ ] css craziness -> css configurator -> common_size
    - [ ] edit always disabled
- [ ] [[27.selection.algorithm]]
    - [ ] create new group around selected objects
    - [ ] ability to combine multiple SOs
- [ ] help
    - [ ] complete & excellent
- [ ] SO opacity slider
- [ ] print just the graph, scaled to fit
- [ ] layers -> wall, beam, post, stairs, generic
    - [ ] layer tag
        - [ ] in SO
        - [ ] list
        - [ ] custom creator
- [ ] draw a wall from point to point
- [ ] arrow keys nudge SO position
- [ ] add move up move down buttons to bottom of parts list at far left
    - [ ] move duplicate button to the far right

---

## leftovers

- [ ] color -> white text for selected when bk color is too dark
- [ ] givens for angles
- [ ] rename library items
- [ ] [[propagating value changes]]
- [ ] bring the [[working features]] table up to date
- [ ] previous milestones
    - [ ] [[21.css.engine]]
    - [ ] [[16.formulas]]
    - [ ] [[19.angles]]
    - [ ] [[25.errors]]
    - [ ] [[8.dimensionals]]
    - [ ] [[18.givens]]
- [ ] investigate claude tools, bill larson
- [ ] cannot rotate basement around z axis
    - [ ] rear wall -> funky location
- [ ] stretch top drawer up -> fubar!
- [ ] so & portable so -> add a hide children boolean
    - [ ] very different than what the triangle does
    - [ ] true overrides each child's isVisible

---

## later

- [ ] data schema for wendy
- [ ] document the update handoff tracking aid to AI human interaction
- [ ] what went wrong with [[s3]]?
- [ ] collaboration
    - [ ] oh fuck me, what have we created here?
    - [ ] log files for memory
        - [ ] single source of truth
        - [ ] proof of cause
            - [ ] all we have is "it was done before i woke just now"
        - [ ] impossible gob of file memory
- [ ] write a claude forum article
- [ ] design flaw: saving working project in a file -> cross talk
- [ ] use codegraph
- [ ] [great conversation with Pete](https://jonathan-and-pete-2026-02-19.peterkaminski.wiki/Conversation_Flow)
- [ ] tmux terminal multiplexer

---

## AI

- [ ] read all the di work md files and summarize the organization
- [ ] [[cadence]]
- [ ] AI coolness: <https://medium.com/@gaddamnaveen192/ai-replaced-80-of-coding-only-these-7-skills-are-left-128e13d3020d>
