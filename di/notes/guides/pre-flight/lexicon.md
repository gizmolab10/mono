# Lexicon

The words used in this project. When writing prose, comments, log lines, or test names, use these words exactly. Do not invent synonyms; do not substitute "near-synonyms" that sound similar.

If a thing has a name here, that is its name. If you find yourself reaching for a word that's not in this file, check this file first.

[[banned words]] contains a list of words that are meaningless to me, alongside their meaningful equivalent, ones that easily convey the intended meaning.

## The world

- **smart object** (also written **SO**, also **part**) — the basic building block. The world is made of smart objects. Never call one a *block* in writing or in logs, even though "block" appears casually in some older conversation. Test scenes name their objects in plain capitals like ALPHA, BETA, CHILD.
- **part** — synonym for smart object (SO): the whole object.
- **subpart** — a piece of one smart object: a corner, an edge, a face, or a dimensional. Never write *part of part* or *element*.
- **root** — the topmost smart object. It has no parent.
- **child** — a smart object that sits inside another smart object's frame.
- **parent** — the smart object a child sits inside.

## Each smart object's three directions

- **direction** (also written **axis**) — every smart object has three of these, named x, y, and z. Each direction carries three numbers and an angle.
- **start**, **length**, **end** — the three numbers per direction. Together they describe how the smart object extends along that direction.
- **attribute** — a generic word for one of the three numbers per direction. Each attribute has flavors: a plain number, a locked number, or a number computed by a formula.
- **field** — used in two of the rule names ("locked number field", "value field"). Treat as a synonym for attribute when paired with one of those flavors. In running prose, prefer "attribute" unless the rule itself uses "field".
- **invariant** — exactly one of the three attributes per direction is invariant. Its value is recomputed from the other two via a built-in formula.
- **lock** — a flag that protects a value from being overwritten by propagation or by reverse propagation.

Do not use these words for the three numbers: *cell*, *value*. Both have been retired in favor of *attribute*.

## Formulas

- **formula** — text that computes a number. Lives on an attribute. Re-evaluated whenever something it reads changes.
- **propagation** — the recompute pass that walks formulas forward when one of their inputs changes.
- **reverse propagation** — walking a formula backward from a target number to set the one editable input that produces the target.
- **given** — a named number defined outside any smart object. Formulas can read these by name. Examples in writing: ALPHA, BETA.
- **center letter** — the bare letter `c` in a formula. Resolves to start-plus-end-over-two on the host direction. The forms `x.c`, `y.c`, `z.c` resolve the same way for a different direction.

## Repeaters

- **repeater** — a smart object marked to repeat along one of its directions.
- **run** — the direction along which a repeater repeats.
- **master** — the first child of a repeater. Sets the shape that every clone copies. Never call this a "template" — older dimensioning prose used that word, but "master" is the project's term.
- **clone** (also written **duplicate**) — a copy of the master that the repeater spawns along the run direction.
- **fire block** (one word: **fireblock**) — a gap-filler shape that the repeater drops in between clones when the firewall option is on.

## Geometry and corners

- **corner** — one of the eight points where three faces of a smart object meet.
- **edge** — a segment between two corners. Twelve per smart object.
- **face** — one of the six rectangular sides.
- **ALPHA corners** — primed in writing as A'. The naming convention for the corners on one half of the standard cube wiring.
- **BETA corners** — written without a prime, as A. The other half. Never reverse the prime convention.
- **edge AB**, **edge CG**, **face ABCD** — when describing a specific edge or face in a log line or comment, name the corners directly. Never write "edge 0", "edge 12", "face 4" or anything that needs a key dump to read.

## UI components

- **overlay** — a small region drawn ON TOP of the main details column or canvas. Used for transient messages (validation errors, popups). Lives above the regular content, not inside it.
- **banner** — the always-visible header at the top of each details sub-section. Names the sub-section and holds its action buttons.
- **status-strip warning** — diagnostic text the status strip at the bottom of the canvas shows when the placement code wants to flag a non-fatal condition for the user.

## Camera and view

- **2D mode**, **3D mode** — the camera's two viewing modes. Flat versus normal. Never call them "ortho" or "perspective" in user-facing prose.
- **canvas** — the pixel buffer the scene is rendered into. The screen contains the canvas.
- **frame** — the entire process of position computation, projection and render on the screen.
- **frustum** — the visible volume of the camera. Used in rule prose ("SO's that extend beyond the frustum").
- **render** — the last step of a frame.
- **screen** — the on-screen rectangle that holds the rendered scene.
- **tumble** — apply the scene rotation to the root object to produce part position information that can then be projected onto the screen. Caused by nothing-is-selected drag.
- **fully visible part** — an SO whose visible faces are entirely within the frustum.

## Print pipeline

- **silhouette rect** — the screen rectangle (measured in screen pixels) that exactly encloses the silhouette box after it is projected onto the screen.
- **printable area** — the area of the paper that the printer can mark. Inside the chosen sheet of paper.
- **paper** — the printed sheet.
- **margin** — the empty strip of paper between the picture and the edge of the printable area. Appears when the picture's shape and the paper's shape differ. Never call this a *band*, *bar*, *padding*, or *gutter*.
- **fit** — the scale-and-translate transform applied to the canvas so the silhouette rect fills the printable area along the limiting side and is centered on the other side.

## Units

- **screen pixels** — distance in pixels between two points after they are projected onto the screen.
- **world units** — units that the saved scene uses for length.
- **untumbled** (also **world coordinates**, **world aligned**) — coordinates expressed before the tumble is applied. These three terms mean the same thing. Use ONLY these three when talking about the pre-tumble system; do NOT introduce alternatives like "static-world", "static frame", "static room", "untumbled world", or any other variant.

## Coordinate systems

Every number in the code that carries a unit lives in exactly one of three coordinate systems. They NEVER mix with each other and they NEVER mix with anything else.

- **mm** (millimetres) — a length in the saved scene's world units, before tumble and before projection. Synonym of "world units".
- **px** (pixels) — a distance on screen, after both tumble and projection. Synonym of "screen pixels".
- **fraction** — a number between 0 and 1. The label's position along its dim line and the share of a witness line that lies inside the silhouette are both fractions.

The only ways to cross from one system to another:

- **mm → px**: apply tumble first, then projection. There is no single-step shortcut; both happen.
- **px ÷ a length in px → fraction**.
- **fraction × a length in px → px**.

Dimensionless integers — drift counters, iteration indices, sample counts, loop bounds — are NOT a coordinate system. They get no tag and they NEVER mix with mm, px, or fraction. Multiplying any such integer by a mm length or a px length without an explicit factor is a unit error.

## Dimensions

How each dim line's position and label are chosen.

- **alphabetical** — the catch-all tie-break: pick the part whose dotted ancestry path comes first alphabetically.
- **arrowhead** — the triangle drawn at each end of a dim line. Its point sits at the witness anchor.
- **box** — a 3D parallelepiped with all right angles.
- **dim line** (also written **dimension line**) — the line that runs parallel-in-3D to the axis it refers to, offset outward from the part by the witness length, with the measurement label sitting on it.
- **drop** (verb, for a label) — skip rendering the label this render. Done when no four-degrees-of-freedom combination clears every other label by the pair clearance and the silhouette box by the silhouette margin.
- **duplicate-text drop** — the rule that drops the latter of two labels with identical text.
- **excluded uniface** — a uniface whose normal is within 20° of pointing towards (or with 45° away from) the camera -> is excluded from consideration/further processing.
- **four degrees of freedom** (also written **4DOF**) — the four placement choices the placement algorithm uses per label: edge, uniface, witness index, label position.
- **in conflict** (two labels) — no pair of 4DOF combinations across both labels keeps both rectangles at the pair clearance apart while each stays on a uniface. A property of the pair, not of either label alone.
- **label** — the rectangle of text that shows a dimension's number on screen.
- **label center point** (screen) — the exact center of the label rect.
- **label position** (world along the dim line) — where along the dim line the label center point sits, in world units, measured either from (a) the first witness anchor when in the witness interior, (b) outward from the anchor point closest to the overhang.
- **label rect** (screen) — the rectangle in screen coordinates that exactly encloses the label text.
- **mark** — any rendered component of a dimensional (witness line, arrow head, dimension line, label rect).
- **overhang** — the label sits outside the witness lines. The overhang distance is measured in screen pixels along the dim line.
- **pair clearance** — the minimum screen-pixel gap between any two label rectangles. Set by the project to 15 pixels.
- **parent-over-child** — the second tie-break in the duplicate-text drop: prefer the part with the shallower ancestry path.
- **persistence** — when a label's 4DOF choice is preserved from one render to the next, and the first tie-break in the duplicate-text drop. Two sub-rules govern it:
    - **seeded placement.** inside a full placement-algorithm run, seeded by the previous render, labels that still pass strict viability stay locked at their previous values; only labels that lost viability are recomputed.
    - **drift safety.** after two consecutive renders where the placement algorithm was skipped and any check passed only by the 2-pixel tolerance, force a full placement-algorithm run on the next render regardless.
- **placement algorithm** — the procedure that picks the four placement choices for every label each render. Done once per render.
- **rotated part** — a part whose own rotation differs from the identity.
- **silhouette box** — the box that exactly encloses every part that, when tumbled and projected) is completely inside the screen (including those that are rotated), recomputed before each render. World aligned (untumbled).
- **silhouette margin** — the screen-pixel gap between the silhouette box and the first uniface box. Set by the project to 15 pixels.
- **tie-break** — when two labels tie on a placement criterion, the rule that picks the winner. Persistence, parent-over-child, and alphabetical are the three tie-breaks used in the duplicate-text drop.
- **uniface** — a face of a unface box.  Never "uniface face", never "uniface block", never "buffer".
- **uniface box** — the silhouette expanded by the silhouette margin. This is enum 1. Enum 2 expands again by the same amount. Enum 3, expands again, same amount.
- **viable enum pair** — an (edge, uniface) pair for which at least one viable value pair exists.
- **viable label** — a label with at least one viable (edge, uniface) pair. A label with no viable pair is dropped.
- **viable value pair** — a (witness length, label position) pair whose two values both sit inside the ranges allowed by the filters.
- **witness anchor** — the point where a witness line meets the dimension line. It is also the **point** of the arrowhead.
- **witness exterior** — the parts of the dim line that stick out past the witness ends. Drawn whenever the label overhangs or is wider than the dim line.
- **witness index** — value of 1 corresponds to the first uniface box, 2 the box expanded by the silhouette margin. 3 another expansion (of the 2 box).
- **witness interior** — the part of the dim line between the two witness anchors. Drawn only when the label fits between the witnesses.
- **witness length** — how far the dim line sits from the part's edge, in screen pixels.
- **witness line** — the perpendicular line at each end of a dimension. The straight projected ray from one edge endpoint outward to and past the dim line. Two per dimension. Untumbled, not necessarily screen-parallel under perspective.

## Architecture

- **topology rewrite** — the ongoing rewrite of the visible-edge pipeline. Active project work; the renderer's many logs are part of it. Leave those logs alone until the rewrite finishes.
- **serialization** — turning the in-memory scene state into the saved-file text representation, and back. Touches the formula-reference format.
- **tokenizer** — the algebra module that breaks formula text into tokens for the compiler. Lives under algebra/.
- **world pass** — union of every descendant's untumbled bounds.
- **rotation pass** — for each rotated direct child, collect its full subtree's bounds, take the eight corners, rotate them around the child's center, and grow the bounds with the rotated positions.
- **spatial index** — a fast lookup the code uses when figuring out which parts of a drawn edge are hidden behind other smart objects. Without it, every edge would have to check itself against every smart object in the scene; with it, only the few smart objects in the same neighborhood get checked.
- **post-propagate hook** — every time the system finishes recomputing formulas, this hook walks every smart object. For each one that is set up as a repeater, this hook rebuilds the repeater's clones so the number of clones exactly fills the new measurements.

## Editing and dragging

- **selection** — what the user is currently editing. A corner, an edge, a face, an attribute, or a smart object as a whole.
- **drag** — a mouse-down, move, mouse-up gesture. With a selection, edits the selection. With nothing selected, tumbles the camera.
- **editing-lock** — a toggle. While on, clicks on the canvas do nothing.
- **rotation-snap** — a toggle. While on, releasing a tumble drag animates the camera to the nearest face-aligned orientation.
- **pin** — used in two senses. As a verb in test prose ("the test pins the rule"), it means the test enforces the rule and would catch a deviation. As a UI feature, it refers to the snap-and-pin behavior in editing.
- **face-aligned** — an orientation where the camera looks straight at one of the six faces of the root SO.

## State and persistence

- **scene** — the saved world. Contains every smart object, the camera state, the givens, and a few more pieces.
- **save**, **load** — the round-trip operations on a scene.
- **undo**, **redo** — restore the world to an earlier or later state. They restore stored values; they do not recompute.
- **preference** — a user-level setting that persists across reloads through browser storage. Not part of the saved scene.
- **precision** — the snap grid used when storing values typed by the user or produced by a drag.

## Workflow words

- **refactor** — a code change that restructures without changing user-visible behaviour. Used as a noun ("the rename refactor") and a verb.
- **mocking** — substituting a fake implementation of a dependency in a test so the test does not need the real thing. Common in unit tests of the renderer's canvas-drawing geometry.
- **mock** (noun) — a small reproduction scene that triggers a reported bug. Used in place of the word "repro" in working notes.
- **profiling** — measuring the runtime cost of each part of a code path with a profiler, used to find allocation pressure or slow steps.
- **end-to-end suite, end-to-end spec** — the Playwright test suite under e2e/tests/. "Spec" is a single test file. Sometimes abbreviated as the file-path token e2e in identifiers.
- **chime** — give a brief plain-English analysis of the changes at hand. Not an audible sound. Used in chat by the user.
- **pac** — short for pros-and-cons. Means a side-by-side comparison only, not a code change. Never pad a pros-and-cons list; if there are no real cons, write "no cons found".
- **proposal** — describe the plan in plain English before executing. Used by the user to mean "tell me what you intend to do, then wait".
- **stub out** — write the empty test bodies (or the empty file structure) ready for content to be filled in later. Never call this *scaffold*.
- **needs visual confirmation** — phrase used at the end of a session note when a change needs Jonathan to open a browser and describe the image, offering approval or criticism. Never write *needs eyeball*.
- **handoff** — the running document that captures what's done, what's open, and the proposals on the table. Preserves every detail; the assistant adds a new section in the same turn it does new work.
- **map** — the running file-map document. Read instead of globbing when looking for files.
- **learn** — the running list of past mistakes. Once it has ten entries, time to distill.
- **work journal** — the running list of session entries, reverse-chronological.

## Verbs to use carefully

- **move** — always means relocate (copy and then delete the original). Never just copy.
- **add**, **insert**, **write**, **update** — used for changes to text, code, or scene state. Never write *land* in any of those senses; *land* belongs to rockets and planes.
- **do**, **perform**, **can be done** — used for the verb sense of taking an action or completing a piece of work ("the change can be done in one pass," "the renames were done"). Never write *land*, *landed*, *lands*, *landing*. Same reason: *land* belongs to rockets and planes, not to the verb of doing or completing.
- **place**, **include**, **inserted** — used when a value or piece of content has to go into the system somewhere ("the new value has to be placed somewhere," "the formula has to be included," "the entry is inserted at the bottom of the section"). Never write *absorb*, *absorbed*, *absorbs*, *absorbing*. Reason: *absorb* sounds vague and biological; *place* / *include* / *inserted* say what actually happens with no hand-waving.
- **done**, **complete** — used for finished work. Never write *ship* or *shipped*; those belong to vessels at sea or in space.
- **write code** — used for the act of producing or submitting code (the back-and-forth of editing, saving, and asking for verification). Never write *ship* or *shipped* in this sense either. The English meaning of *ship* (push code out) and the project's preferred terms do not overlap; we say *write code* instead.
- **propose** — describe the plan and wait. Never act on a proposal without explicit approval, except when the ask was already explicit.
- **more work**, **a lot of work** — used when the next step would be heavier than the current one ("that change would be more work than this turn's scope," "a lot of work to wire up the fixture"). Never write *bigger lift*, *heavy lift*, *heavy lifting*. Reason: fitness-jargon for "more work" — the project's preferred phrasing is the plain English version.

## Trust

- **mistrust point** (also **distrust point**) — a mark Jonathan adds against trust when I state something as fact without verifying it, or report work as done while steps remain. The running count tells him how hard to double-check what I say.
- **mistrust issue** — an instance of the behaviour that earns a mistrust point: an unverified claim stated as certain, an absolute drawn from a single partial check, or "done" claimed too early.
