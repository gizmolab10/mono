# Code Debt

Running a project according to code debt changes the dynamic. unpaid code debt makes development and maintenance harder. paying it as a high priority helps prevent the project from spiraling into tangles.

offer a proposal for the first unchecked item, and add it to a new section at the end of handoff

- [ ] make the hover color a light version of accent
    - [ ] define a new writable s_hover_color
    - [ ] colors.lighterBy(w_accent_color, 0.5)
    - [ ] App.svelte line 10 and Configuration line 140, add a new prop (s_hover_color) 
    - [ ] propose a guardrail so very dark accents still produce a distinct hover.
- [ ] remove rule 10 from crowded dims, and re-implement
- [ ] move the scaling slider row to the bottom above the build / guides row
- [ ] cabinetry SOs do not stretch
- [ ] cannot read guides or scaling when accent is too dark
    - [ ] turn sliders and text white
    - [ ] thumb button drag color -> not accent
- [ ] OPTION key shows ***invisible*** SOs using x-ray
    - [ ] hover -> name popup
    - [ ] dimensionals too
- [ ] move guides slider to next to help
- [ ] convert button 'create a template' -> stud/joist / stair segmented

## tom

- [ ] http://littlecloudvineyard.com/
## soon

- [ ] option to group attributes by axis (in first column: sle -> xyz)
- [ ] can't edit a dimensional
    - [ ] falls apart (drawer)
- [ ] select a part, undo -> fucks with many parts. relaunch fixes
    - [ ] HINT: problem is with snapshot/load_scene
- [ ] ref -> target is also a formula
    - [ ] disappear on relaunch -> kitchen wall
- [ ] measure basement
- [ ] print
    - [ ] wrong when zoomed in (clipped)
    - [ ] blurry, need the other solution

---
## big

- [ ] read the app code base and write a formal, machine-readable specification, that when followed by you can reproduce the app
- [ ] move logic driven design -> alongside always
    - [ ] convert to instructions that can do the heavy lifting
- [ ] layers -> wall, beam, post, stairs, generic
    - [ ] layer tag
        - [ ] in SO
        - [ ] list
        - [ ] custom creator
- [ ] draw a wall from point to point
- [ ] mobile
    - [ ] thinner gaps
    - [ ] still too wide
    - [ ] css craziness -> css configurator -> common_size
    - [ ] edit always disabled
- [ ] [[27.selection.algorithm]]
    - [ ] create new group around selected objects
    - [ ] ability to combine multiple SOs
- [ ] help
    - [ ] complete & excellent


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

- [ ] allow segmented to flex to fill (selected part attr/ang/rep)
- [ ] SO opacity slider
- [ ] arrow keys nudge SO position
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
