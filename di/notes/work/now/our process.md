# our process

- [ ] spec
- [ ] tests
- [ ] code
- [ ] tuning (includes debugging)

## our tuning process is terrible

- [ ] circles
- [ ] adds complexity
- [ ] blurs mental vision
- [ ] terrible feedback loop

## improved feedback loop

- [ ] simplify the spec to its basics
    - [ ] consider each added complexity
- [ ] draw them in a force diagram
- [ ] where do we shine?

## shine

**1. Where we shine (how we split the work)**

You own _taste and intent_; I own _execution and documentation_. Concretely:

- **You decide**: what "natural" feels like, what to cut, which flows matter, what's annoying when you use it on your own files. Judgment calls have no right answer in code — that's you.
- **I produce**: working variations fast, the cross-platform plumbing, edge cases, refactors, and honest pushback ("this adds a mode, modes are friction"). I'm cheap to ask, so treat me as a fast option-generator, not a committee.
- **The loop**: debugging, logic and geometry do not come easily for me. You will guide the debugging by asking questions. You will handle the logic and geometry.

1. i have an idea
2. you research it
3. we bat it around (pac, chime, spec, edit)
4. i say go and we iterate (test, code, spec)
5. eventually we snarl up in weeks of circles
6. i stop and realize we are playing to our weakness
    1. complex designs are beyond us, there is no magic bullet, accept it and move on
        1. facets
        2. dimensionals
7. simplify dimensionals (reduce its complexity, d'oh!)
    1. slider depth
    2. perfect dimensions flag off first
        1. always testing dimensions flag on
8. rethink my strategy
9. slider
    1. number of dimensions
    2. largest first

## vocabulary

We put fierce energy into being stuck. Seemed to me our vocabularies need synching, clarity and single truth. Now we need to go further. We have lexicon, banned, voice, always and hooks. Needs tidying.

meaning, bans, tone, behavior, enforcement

## dimensions flag off

- [ ] proposal: gather many use cases
    - [ ] for each one, we need:
        - [ ] selected part
        - [ ] status string
        - [ ] screenshot
        - [ ] log
- [ ] each one is essentially a bug, so each is a bug report
- [ ] we need a collection system. decide:
    - [ ] a standard bug tracking system?
    - [ ] just a folder schema, each folder is a report

### proposal

The collection is in one folder -> `work/now/bugs`. Each bug is one numbered subfolder inside it. No tracker, no tooling — the folders are the system.

- One folder per bug, named `NNN short-slug` (e.g. `007 label crosses part`): the number is discovery order, the slug is the one-line summary.
- Three fixed files in each, the names always the same so anything can find them:
    - `screenshot.png` — i will supply this
    - `log.txt` — the render log -> `mono/logs/dimensionals.log`
    - `data.json` — containing these four fields
        - `part` — full hierarchy name
        - `status` — the status-string text, copied word for word from the screenshot
        - `bug` — description of what is wrong
        - `expected` — description of what it should be
    - use the log and image to create the meta content, leaving the bug and expected fields empty
- A top `index.md` lists every report: number, slug, one line, and open or fixed.
- Each bug subfolder then becomes the starting point of an investigation.
    - Is the spec, test or code wrong
    - propose a fix, wait for Jonathan's approval
    - write the fixes and ask for visual confirmation
    - Upon approval, the fixed report moves into `work/now/bugs/done/` subfolder, so the open pile is exactly what is left to pursue.

Why this over a tracker: it lives in the repo beside the code, every report is plain files you can open and diff, and there is nothing to install or maintain — the lightest thing that still pins each case down with all three artifacts.

## force diagram

A separate canvas that draws our scoring equation as bubbles and arrows. It is documentation — it explains the equation, it does not run it. Nothing in it is live: no numbers, no values, no headings. Every part is a fixed symbol. An AI writes a text file; the canvas displays it.

### what the equation is

"Our scoring equation" ranks where a dimension label sits. It adds and subtracts seven things into one number; highest wins:

1. how much of the dimension line stays visible between the anchors (reward)
2. how far off-center the label sits along that line (penalty)
3. how long the two perpendicular witness lines are (penalty)
4. how much those witness lines cut through the part's outline (penalty)
5. how much room there is before the canvas edge (reward)
6. whether the label sits on the back side, away from the camera (heavy penalty)
7. whether the label faces flat-on to the camera (reward)

Source: the seven combine in `di/src/lib/ts/render/Dimension_Placement.ts` at line 3017.

### the building blocks

Two kinds of part:

- A VALUE — a leaf. Nothing arrows into it; one or more arrows leave it. The seven scored things, the lengths, and the directions are all values.
- An OPERATION — a junction. One or more arrows in, exactly one arrow out. The operations the formula needs: add, multiply, average, square, and floor-at-zero.

Three rules that hold across the whole picture:

- Every operation has one or more arrows in and one out — except the final add, the score itself, which has many arrows in and none out. It is the end of the tree.
- Every value has no arrows in and one or more out. A value used in several places forks to several arrows — the outward direction does this, feeding more than one comparison.
- A distinctive visual form belongs to genuine geometry only — a direction or axis. Operations, methods, and logic get none; each is a plain bubble told apart by the word inside.

Settled specifics:

- MAX is never a two-rival chooser here. Both times it appears it is floor-at-zero — the bigger of zero and one thing — so it draws as a floor-at-zero clamp on a single input.
- A DIRECTION is the only genuinely geometric value. The fat triangle is REJECTED — how a direction draws is reopened and undecided. Until decided, a direction is a plain bubble named for its role — outward, toward-camera, front-face — like any other value.
- Comparing two directions is its own junction, AGREEMENT: two directions in, one how-aligned result out.
- A CONSTANT shows as its fixed number always — twenty, two, two hundred, one, fifty thousand, five hundred. Hovering one makes its name appear; the number stays put, and the name is the only active part. (Screenshot and print come later, as a separate feature.)

Still open (for review): how a direction draws (the fat triangle is rejected), and whether each operation's label is a word or a symbol.

### three pieces to build

1. A new standalone canvas showing the score picture. built on our arrow and label rendering code. it lives apart from the model.
2. A format an AI can write by hand. One line per bubble. Each line says whether the thing helps or hurts the score, a short name, a plain-English description, and how strongly it counts. 
3. First such file -> describes today's seven-term score.

### the language (proposed, not final)

```text
score "Label Placement Score"
reward  visible-line    "how much of the line shows between anchors"
penalty off-center      "how far the label drifts from the middle"      strength 20
penalty witness-length  "how long the two perpendicular lines are"      strength 2
penalty cuts-outline    "how much those lines cross the part"           strength 200
reward  edge-room       "room before the canvas edge"                   strength 1
penalty back-side       "label sitting away from the camera"            strength 50000
reward  faces-camera    "label facing flat to the camera"              strength 500
```

The canvas draws each line as a bubble, an arrow from each bubble into one central score bubble, a plus or minus on the arrow for reward or penalty, and the strength as a label on the arrow.

### existing rendering pieces to reuse

There is no bubbles-and-arrows canvas today, but di already has these that draw to the screen:

1. The main canvas engine — owns the surface and has a ready-made arrow helper. `Render.ts`
2. The dimension renderer — draws lines, arrowheads, white-boxed number labels. The white box is already a bubble. `Dimension_Renderer.ts`
3. The angle renderer — draws arcs and arrowheads. `R_Angulars.ts`
4. The axis renderer — draws stem-plus-head arrow shapes. `R_Axes.ts`
5. The grid renderer — draws the dashed reference grid. `R_Grid.ts`
6. The top-level canvas wrapper that hosts it all and handles resizing and clicks. `Graph.svelte`

### open questions

- [ ] Does the text form feel right, or should it read more like sentences?
- [x] Should the strength numbers show on screen? DECIDED: yes — each constant shows its number always; hovering reveals the name.

#### What changed:

- **New third rule:** a distinctive visual form is reserved for genuine geometry only — a direction or axis. Operations, methods, and logic get no form; each is a plain bubble told apart by its word.
- **The direction line:** the fat triangle is rejected; how a direction draws is reopened. For now a direction is a plain named bubble like any other value.
- **The agreement line** drops "triangles" — just two directions in.
- **The still-open list** now reads: how a direction draws, and whether each operation's label is a word or a symbol.
- **The open-question wording** lost the banned word — now "text form".

Constants and the two arrow rules stand unchanged.

Ripple to flag, not chased yet: that same rename broke other path references — including the lexicon path I just fixed inside the word-check hook, which now points at a notes folder that no longer exists. Say the word and I reconcile them.
