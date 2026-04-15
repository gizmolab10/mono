# Code Debt

Running a project according to code debt changes the dynamic. unpaid code debt makes development and maintenance harder. paying it as a high priority helps prevent the project from spiraling into tangles.

offer a proposal for the first unchecked item

- [x] duplicate button -> recursive
- [x] visible children button -> new column, before eye column
- [ ] givens for angles
- [ ] 5x for select hover too thick
- [ ] [[cadence]]
- [ ] layout of separators needs larger/uniform gaps
- [ ] rename library items
- [ ] don't like the drag dots, only appear on hover, allow appear on not quite forward most facing face
- [x] after drag, mouse up -> repositions / jumps / unintuitive / unexpected / feels unreliable & inconsistent
- [ ] remove FaceLabel?
- [ ] increase font size for face labels
- [ ] redo for undo
- [ ] read all the di work md files and summarize the organization
- [ ] AI coolness: https://medium.com/@gaddamnaveen192/ai-replaced-80-of-coding-only-these-7-skills-are-left-128e13d3020d
- [ ] performance issues?
- [x] add "3 of 24" at right of edit title when not showing parts
    - [x] move to left of title input, when not showing parts
    - [x] add new first column to parts table, for sibling number, when showing parts
- [ ] color
    - [ ] hover color
        - [x] lines
            - [x] lines fatter and colored red
            - [x] hue shift from lines color
        - [ ] dots: larger white filled circular bordered
    - [ ] white text for selected when bk color is too dark
    - [ ] cross is too faint in attributes table
    - [ ] hand cursor (over hover dot, selected face) -- otherwise pointer
- [ ] [[propagating value changes]]

---

## leftovers

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

- [ ] [wendy](data schema for wendy)
- [ ] document the update handoff tracking aid to AI human interaction
- [ ] [[three.dimensions]] revisit Intersection detection when object count grows
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

# handoff

The issue: the face plane is computed from the child's rotated face (correct for screen tracking), but the local edge vectors come from the child's un-rotated vertices (parent-space). When the child has its own rotation, the decomposition maps screen displacement to an un-rotated direction. The child moves along parent axes instead of along its visible face edges.

The fix: rotate the local edge vectors by the child's orientation before using them in the decomposition result.

Read [Drag.ts](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/index.html?id=238a8563-63a1-4fa4-ab3d-883cbe79e8fa&parentId=1&origin=d72592df-8897-417d-ac84-1bc7b6bf5a45&swVersion=4&extensionId=Anthropic.claude-code&platform=electron&vscode-resource-base-authority=vscode-resource.vscode-cdn.net&parentOrigin=vscode-file%3A%2F%2Fvscode-app&session=0c915fda-7c3b-40a5-ab93-2fa1ba36e856#) (lines 503-552)

The local edges need to be rotated by the child's orientation so the bounds-space delta follows the child's rotated axes.

Edit [Drag.ts](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/index.html?id=238a8563-63a1-4fa4-ab3d-883cbe79e8fa&parentId=1&origin=d72592df-8897-417d-ac84-1bc7b6bf5a45&swVersion=4&extensionId=Anthropic.claude-code&platform=electron&vscode-resource-base-authority=vscode-resource.vscode-cdn.net&parentOrigin=vscode-file%3A%2F%2Fvscode-app&session=0c915fda-7c3b-40a5-ab93-2fa1ba36e856#)

Added 8 lines

Bash Verify compilation

IN

cd /Users/sand/GitHub/mono/di && yarn svelte-check 2>&1 | tail -6

OUT

$ /Users/sand/GitHub/mono/node_modules/.bin/svelte-check
Loading svelte-check in workspace: /Users/sand/GitHub/mono/di
Getting Svelte diagnostics...

svelte-check found 0 errors and 0 warnings
Done in 13.22s.

Clean. The local edge vectors used in the decomposition result are now rotated by the child's orientation. When a child is rotated, the bounds-space delta will follow the child's rotated face edges instead of the parent's axis-aligned directions.

For un-rotated children, the orientation is identity and the rotation is a no-op — same behavior as before.

the adjustments made to formulas are lengthy sequences of arithmetic ops. i want the formulas as simple as reasonable. proposal

Prompt is too long