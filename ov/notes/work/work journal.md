---
kind: refer
title: "Work"
description: "What's been finished, newest first"
tags: [journal]
date: 2026-08-10
---
# Work

What's been finished, newest first.

## 2026-08-14 — a box that stands inside the piece it is changing

Opening a piece for changing moved its words. A heading jumped bigger-to-smaller and light-to-heavy;
the hashes and the `- [ ]` took width the drawn page spends on nothing, so every first word slid
right; and the row number in the left lane went up for one kind of piece and down for another.

**The first tries were arithmetic, and arithmetic was the wrong tool.** I copied the piece's
lettering onto the box, measured the markup at the head of the line and stood it out to the left,
took off half the leading, hung the number off the box, then off the box's place. Each one fixed
some pieces and moved others, because each rested on my own model of where a given kind of piece
hangs its number — and every kind hangs it somewhere slightly different.

**The log said it outright.** The first thing to be done in a list read right while every other one
was two pixels low. That first one's number is drawn by the list, not by the item, and the list was
never touched. So the rule was there all along: a number that never leaves the element that draws it
never moves.

**So the box stands inside the piece now**, with the piece's own words held out of sight behind it.
The piece keeps its place, its lettering, its gaps and its number; the box inherits the lot. The
code that copied the lettering, the code that slid the box onto the piece's place, and four kinds of
box styling all went. What is left is measured, never reasoned about: the markup's own width, and
whatever is left over between where the words stood and where the box begins them.

**A thing to be done can hold a list of its own**, and that list has nothing to do with the one line
being changed — so it comes back out to stand below the box while the item's own words are away.

**Two faults in the hits manager, either of which stops every press landing.** It marks that a
rebuild is queued, waits, then clears the mark — and the clearing sat after the waiting rather than
inside it, so a wait that never came back left the mark standing, and a standing mark turns away
every later request. Since a target asks for a rebuild the moment it arrives, nothing would ever be
measured again. And redrawing the fold marks adds rows and pointers across the whole page without
telling the manager anything.

## 2026-08-13 — the details column folds the way everything else does

The column's two things — preferences and repair — each wore a banner: a full-width block with the
title inside it, a fill arriving under the cursor, and a rounded shape drawn behind. Every other
folding thing in the app is a line across with the word standing on it, masking the line behind it.
Both are that now, and the banner's own drawing is gone.

**The column became one stack of sections.** The page color runs from the first line down to the
last; the column's own gap above that first line, and whatever is left below the last, stand on the
accent. A closing line is drawn under the last section only while it is open — folded, it stands
one gap tall with its own hairline, and nothing below it draws another line.

**A section can now hold a different gap below what it shows.** Above its contents it gives back
half its own line, since a gap is measured from a line's middle; below them the line that bounds
the gap belongs to whatever comes next, and is not this section's to give back. The details column
asks for that half on top of the gap above, so both sides draw as one gap and the contents sit
centred.

**Three faults of my own, found on screen.** The word handed to the line was never bound, so the
line was given nothing and no word appeared. The word and its section shared one name, and the
manager keeps one target per name, so the section threw the word's away. And the column's width
changes when it is shown or hidden with no window resize to report it — which the manager's own
self-check named exactly, down to the eight pixels across and eight down.

## 2026-08-13 — the manager pays its own way, and a file is called a file

Reading the wiring back showed three costs it had added. The hovered target was written to a store
on every move of the cursor, and every target listened, so ~75 callbacks ran where two elements
changed. Scrolling rebuilt every rectangle, and each reading makes the browser settle its layout.
And each target arriving asked for a full rebuild of its own, so forty rows cost forty rebuilds of
forty rectangles.

**All three are gone.** The hover is said only when the answer changes, and the manager stamps the
two elements itself — nothing listens for it any more. A run of things arriving joins one waiting
rebuild. A scroll hands over the distance scrolled and every rectangle inside that box is moved by
exactly that, reading nothing from the browser: asking which targets sit inside walks up from each
element, which forces no layout.

**Against the old per-control wiring it is now about even** — better while the cursor moves, since
the old code walked the page building class-name lists on every move in four places; slightly worse
while scrolling, which used to cost nothing.

**The manager checks itself.** Every rectangle is held rather than read, so anything that moves
without saying so leaves a control answering for a strip of the page it no longer stands on — and
nothing on screen shows it. While the cursor rests on a target, its rectangle is read afresh once a
second; a difference raises a box naming the target, its kind, the element, both readings, how far
off in each direction, and the three ways to tell the manager. All three faults in the wiring
session were that one fault in different clothes.

**A file is called a file.** The record for one guide was `Guide` and a filtered row was
`Filtered_Guide`, in a folder called `File.ts`, held by a manager called `Files`, for a list that
holds work notes as well as guides. Both are now `File` and `Filtered_File`, the field on a row is
`file`, and two more names that had drifted went with them: where a file sits is a `File_Site`, and
where a pill stands in a wrapping row is a `Pill_Placement`. The word *guide* stays wherever it
means a guide.

## 2026-08-13 — one manager decides what the cursor is on

Every control used to watch the cursor for itself: its own press, its own hover rule, its own hint,
and a rule walking up the page to work out whether a press had landed on something that answers.
One manager decides now. The cursor is fed in once at the top of the app; it asks its own structure
which targets hold that point and hands the press to one of them. A control beats a section, which
beats the file's own words — and within one kind the one standing in the smaller area wins, since
sections sit inside sections.

**What moved over.** Twenty-two buttons, thirteen segments, both stepper pairs, every field, nine
sections, every row of the list, and two whole areas — the file's words, and the count row with the
rows under it. Each says its name, what a press does and what to show while the cursor is on it,
and carries no handler, no `:hover` rule and no hint of its own. The rule that walked the page is
gone, file and tests.

**Three faults the wiring turned up, each found by measuring rather than guessing.** Pressing one
tag reacted on another: a shut tag area keeps its tags at full size inside a box of no width, so
four areas' tags stacked on one strip of the page. A target can now say it is out of sight and hold
no place at all — the same thing `pointer-events: none` already tells the browser. Pressing a
folder's triangle turned it over twice: the triangle handed its press to the manager and the row
behind it never heard about that, so it fired its own. And the tags section answered nothing,
because the whole filter form is a section too and covered it.

**Every rectangle is measured once and remembered**, so everything that moves one says so: a word
moved onto a line, a fold, a tag area finishing its slide, the list scrolling, the file's words
scrolling, the window resizing. A target arriving among others is measured again one drawing later,
since the first reading is taken before the browser has laid the run out.

**Elsewhere.** A section's lower gap is the whole gap again — it was giving back half of a line it
draws at its top, so the count row shrank whenever it drew one. The picked tags in the count row
are cut to the space beside the count, at whole words, ending in an ellipsis. The editor's own
folds are remembered between visits. And the two filter drawings were named for the screens they
belong to: `Browse_Filters` and `Editor_Filters`.

## 2026-08-13 — a gap is measured from a line's middle, and nothing paints over a control

A line has thickness, so its edges move whenever that thickness changes; its middle does not. Every gap around a line is now measured from there — half the line is given back — so the same gap reads the same under the hair and under the heavy one. A section holds it above and below alike. Folded, it holds the one gap and nothing else, whatever gap it holds when open; a section asking for no gap at all stands flat, and the editor's label form does exactly that, so the words below it draw no line of their own and two heavy lines never touch.

**The title's slot was a number unrelated to any gap.** It is worked out now from the title's own line of words with that one gap above and below it, said once and read by both the title and the line that closes it off.

**Everything that can be pressed stands in front of the words around it.** One rule gives every button a place on the controls layer. The file's own sticky title had claimed that same layer, and being later in the document it painted over a word hanging down off the line above — so the title moved one layer down. It still covers the words running under it.

**Finding that took a measurement, twice.** Walking up from the word showed nothing above it that could cover it; asking which element actually stands at the word's lowest point named the title. Guessing had already failed on the same fault once.

**The fade of the hover.** Every hover fill arrives and goes over a third of a second, said once in the global stylesheet over the elements that take one, so no component carries its own copy of the timing. Crossing a row of pills used to flash each one in turn.

## 2026-08-12 — both colors are chosen now, and a word masks the line with its own shape

The page color used to be worked out from the accent. It is a choice of its own, remembered like the accent and picked beside it, so moving one leaves the other where it was put. Everything read off both — the hover, the readable text, the mild accent, the banner — is worked out in one place whenever either moves. The hover became a lean from the page a third of the way toward the accent, lifted a tenth toward white, so it holds for whichever pair is picked, light page or dark.

**A word on a line masks it with a pill.** The mask was a rectangle standing behind a pill-shaped word, which showed two ways: the line stopping short of the curve with a crescent of page color between, or the curve eating the middle of the line and leaving two square horns. One shape for both, and both went.

**A lit section says its own color to everything inside it.** Whatever paints itself to mask the line — a word, a name riding above a pill — reads that value, so it still matches while the section is filled. Finding this took a measurement: the log showed the word reading the right color and painting white anyway, because a second rule for "pressable, because the area around it says so" outranked it and painted white on purpose.

**A section's bare background answers a press and fills under the cursor**, the gap above and below its contents included. The two halves disagreed at first — the fill lit everywhere but inside the rows, the press worked only inside them — because each asked a different question of a different element. Both ask the section now, through a question narrower than the one deciding the way back to the list: a whole area is a background, not a thing that answers.

**Whatever sits between a file's labels and its first heading is offered for removal.** The words start at that heading, whatever its rank — not every file opens with a top-level one — and spaces holding a heading off the left edge count as characters to take out. Nothing is written unless the button is pressed; dismissing the line is the answer no. Holding a step mark or an arrow key stops at a file that raised something, and one more press goes on.

## 2026-08-12 — a word on a line is now the caller's own, and a bar only lends it a place

A section's line used to build the word that folds it, style it, and light it. It now takes made things instead: a caller writes its own control, hands over the element and where it wants to stand — left, middle or right — and the line only finds it a place. All eight clickable titles moved out, three in the file form and four in the filters and one in the search. With them went the line's `title`, its `onclick`, its hover styling, and the clear strip that made a two-pixel line worth aiming at.

**One thing to know about handing over a made element.** A caller writes its button out of sight, and the browser makes it one drawing later — so the line is handed nothing on the first drawing and the button on the next. That arrival is itself a change, so the line is told at once; nobody has to touch anything.

**The picking control and both clears moved onto their own lines**, standing at the middle. Each takes the fold word's own text size and edge, so the two boxes are the same height. Folded, whatever stands at the middle goes with what it acts on — the fold word stays, since it is the way back.

**A row of tags holds a gap above itself only when a name rides above a pill in its topmost line.** Which pills are in that line is measured: the run wraps, so nothing but measuring says. The reckoning lives in one place and is proved without a page.

**A bug of two halves.** The fill and the press disagreed: the fill lit everywhere but inside the rows, the press worked only inside them. They were asking different questions of different elements. Both now ask the section, and the question is narrower than the one that decides the way back to the list — a whole area is a background, not a thing that answers.

**Elsewhere.** A `+` in the editor's top row makes a file beside the one open and opens it, labeled to match the filters so it is one of the files on screen. A link ending `.ts` or `.svelte` hands off to VSCode at the line it names. The tags picking control gained **any but** — a file shows only if it wears none of the picked tags.

## 2026-08-11 — the tags row says how it is picking, and the guides were counted again

The tags row's `all` button became a control of four: **any of** and **all of** are states, remembered between visits; **clear** and **invert** are presses that change what is picked and never read as picked. The editor's own tags row got the two presses alone, since a file wears the tags it wears. All three rows' clear grays and answers nothing when there is nothing to clear.

**The decision the proposal left open.** With every picked tag required, the tags row cannot set its own filter aside: a tag worth offering is one worn by a file that already wears them all. So the picked tags stay in the question there, and a tag that would empty the list grays out.

**A defect I made and the log named.** The row's list of tags is worked out from the things it names, and it named the project, the kind and the words. My change made it read the picked tags too, so it went stale the moment they moved — pills vanished and stayed vanished. It names them now.

**The kinds are down to six and two were renamed.** `step` became `howto`, `wire` became `arch`, across eighty-three guide files, the app's own list, and the three notes that spell the six out.

**The assessment of mono's guides was a month stale.** It named eight folders including one that is gone, and a dozen files by names they no longer have. Every one of the 55 files is now listed under its real folder with its own brief, and every file name in it is a working link — 57 of them, each checked against disk. The thin and partial lists were re-checked file by file: one of the two "cut at a STOP marker" claims was wrong.

**Eighty log lines a session went.** The tag-area timing, the remembered settings, the three folding lines and the row count — each had settled its own question and none had been asked again. What stayed reports a decision whose values could still surprise, or a fault.

## 2026-08-11 — work notes joined the files, and every row learned its line number

A work note used to be a country the app could see into but never enter: links pointed at them and failed, and the dispatcher refused to hand one over. Now each project's work folder stands beside its guides, holding the notes at its top — and only those, since anything deeper would triple the list. They read, write, rename and go like any guide.

**The kinds are six.** `work` went, since a folder now says it; `step` became `howto`. Twenty-seven guide files were relabelled, along with the app's list and the two notes that spell the six out.

**A dispatcher button in the top row.** Changing the dispatcher's code used to mean walking to the hub. The button asks it to start over, then asks it for the guides every second and a half until it answers. Nothing is said in the status line — the button's own face is the whole report.

**Things to be done are boxes now.** A list item beginning with a pair of brackets draws as a rounded square: outlined while still to do, filled with a green check when done, its words struck through. Pressing one turns that single line's brackets over and writes the file back — the same road every other change takes. An item holding a list of its own gets the soft pointer a heading gets.

**Every row shows the line it begins on.** The number counts the rows shown, from one, with the labels left out; the two numbers that put words back still count the file itself. A line the reader draws as nothing — a blank line, a rule — gets a row of its own so the column has no holes, and where a list and its first item both name one row, the second claim is dropped.

**One constant holds the whole left lane.** It says where the numbers' right edge stands; the pointer is one gap past that, the words one gap past the pointer, and the title's step-out reads the same sum. Four rules that used to carry their own numbers now read from the one.

**Two lessons, both about measuring.** Asked why a soft pointer's neighbour jumped on hover, I measured inside the hover event — where the hover style is not on the element yet — and read the old picture twice, then reported that nothing moved. Measured two frames later it really was still, so the fault was in the painting: an edge on a fractional pixel is rounded afresh each repaint. Whole pixels and a paint surface of its own cured it. The second lesson is older and I repeated it: I asked Jonathan to paste the log. It is on disk, and reading it is the one thing I can always do.

## 2026-08-09 — every line on the list screen now owns the gap around it

The filters drew five lines by hand, each in a bare wrapper with the row it named as a sibling — so the gap between a line and its own row came from the stack rather than from either. All five are sections now, and the count row with them. The stack's own spacing went to zero in the same edit; without that, every row would have grown by one gap.

**Two sources of spacing were still stacking.** The content box put its own gap between the filters, the count and the list, on top of each section's own. The list screen now stacks its three parts flush.

**A section that holds subsections stands flat when folded.** It holds no gap of its own when it is open, so holding one when folded was a gap that existed in only one of the two states — and whatever follows holds its own already.

**The table header's line moved to the top of its row.** It ran through the middle of the words, so half that row stood between the count row and the line anyone actually measures to. The words now ride the line and take no height at all, the way a word on any other line does — which is what makes the gap above measurable to the line and the rows below stand clear under it. Two things had to follow: the header as a whole stands in front of the line, since lifting it made a world of its own that nothing inside could reach out of; and the line itself stepped back a layer, so a word drawn on it from outside is never painted over.

**Where guessing failed, the app measured.** Three rounds of reasoning about which gap was too big produced nothing; one round of asking the page for real numbers named both culprits at once.

## 2026-08-09 — the editor became four files, and the page stopped blinking

The editor was 1,941 lines and held four whole things that had nothing to say to each other. It is now 448: the top row, the way back to the list, and the two things the parts share — the whole file's text, and the line along the bottom that speaks up briefly. **Search** took the search row and the highlighting (239 lines). **File_Filters** took a guide's own labels (287). **File_Content** took reading the file, drawing it, folding it, and the box that changes one piece (1,052). Nothing on screen was meant to move.

**The rule about clicking bare space became Hit_Empty_Space**, named for what it answers rather than for one caller's purpose. It was called Leaving, which named no subject; then Leave_Editor, which named the caller — three components ask the same question and one of them may one day not be leaving anything.

**Names that had drifted.** The manager that holds every guide became Files. The list's filters became List_Filters, a file's own became File_Filters — the app calls both "filters" and the two were one keystroke apart. Browse and Editor moved up into the frame folder, since each is a whole screen; the status line moved down into content, since it is one thing the box shows.

**Typing in the search field re-read the file from disk on every letter.** Working the list out again handed the editor a fresh record of the very same file, and the read was tied to that record rather than to the file's place. Five letters, five reads, five redrawings — which is what blinked. The place is now one piece of text, the same from one record to the next, so nothing stirs. Proved by making the app measure: the log alternated read, measurement, read, measurement.

**A smaller blink underneath it.** Clearing the highlighted words folded away whatever piece had been opened to reach them, and the next place — usually inside that very piece — opened it again. The two answers are now worked out together, so a piece is only ever folded when the next place is somewhere else.

## 2026-08-08 — nothing is written to a file nobody asked about

A file added to the guides used to be given labels the moment the app read it — a hundred guesses made at launch, none of them looked at. Now a file with no labels is left exactly as it is and reads `---` in its kind column. The labels are composed the first time someone opens that file to edit: title and description from its own words, kind read off the folder it sits in, marked stale. The judging is the collaborator's, done on one file while it is in front of a person; correcting it is Jonathan's, on the file he is already looking at.

**A folder called design or designs makes its files designs**, one called work makes them work. Only the plural spelling was recognised at first, so ov's own design folder fell through — four tests now cover both spellings and the case where a word merely starts the same.

**A seventh area of tags: progress** — proposal, construct and done, joined by stale and think, which left `other`. The other six areas gather tags by what a guide is about; this one gathers by where a guide stands in its own life.

**A `none` button in the kinds row** leaves only the files carrying no labels at all, which is how they are found so they can be opened and given some. It grays out when every file the other filters leave already has labels. Those files also sort first rather than last: an empty kind used to be treated as a blank and pushed to the bottom, and it is a real state, not a missing one.

**The way back to the list grew.** The bare space among the label rows joins the two top rows, and the whole of it lights at once — one flag, so pointing at either end lights both. Two areas are left out, because a press already means something there: the run of tag areas shuts them all, and the line above them folds them away.

**A word on a line now shows its edge whenever it can be pressed**, and takes the hover fill only when the cursor is actually on that bar. Told to light by the area around it, it takes white instead. The kinds in the label form gained a line of their own that folds them away and then reads which kind the guide is.

**The file holding what a guide is became File.** It says what any file in the picture is — its kinds, its tags, its collections, its labels — so naming it after one of those was the wrong scale. Fourteen imports followed; one reached for it by a short name rather than the full path and had to be caught by the type check.

**The line between rows starts well in from the left.** Under the first column it is painted rather than drawn as an edge, which is how it can begin part-way across without the words beside it moving.

**One marker was drawn in the wrong place.** The words box reports how far down it starts from the box that wraps it — near zero — while the marker over its scrollbar was placed against the whole view, which starts far higher. Both now sit in the same box. The bar's own lane starts below the line across the page, and the marker moved and shortened to match.

## 2026-08-08 — a guide says what it is, once

Two questions were being asked about every guide, and they were the same question. One was asked by the folder a file sat in — a path under `designs` made it a design. The other was asked by the file's own words. Two answers meant two places to look and two ways to be wrong, and a whole picking row that carried nothing the kinds could not carry.

**Design and work joined the kinds**, so there are seven: the first five say how a guide reads, the last two say what it is about. That is a real difference and it is fine — a file is one of the seven, and the question is asked once.

**What went with the purpose row.** Its own remembered setting, its own toggling rule (the last one on could not be turned off — a rule that existed only because purpose was not a kind), and the side-by-side layout that measured two pickers against the width of the box so they could share a bar. Projects now has its own bar like kinds and tags.

**The sweep was small.** Three files sit under a designs folder across all five collections; they had said explain, refer and specify, and now say design. No file gained `work`: the app never lists work notes at all, so the kind is there for when they are swept in.

## 2026-08-08 — one ladder of names, and a top that holds still

Every kind of measurement now uses the same nine words — micro, faint, tiny, small, normal, big, fat, huge, pill — and a kind simply leaves out any step it has no use for. Before this, a gap called its middle `default`, a font called its middle `base`, a height called its middle `control`, and reaching for a size meant opening the file to check what this one happens to call it. Now it is one decision: pick the kind, pick the step.

**Only names changed.** Every number is exactly what it was, so nothing on screen moved. 267 lines across 21 files, plus the file of constants itself; the styling names follow the same ladder, so `--font-tiny` and `--gap-tiny` read as the same step of two ladders — which is what they are.

**Separator and thickness turned out to be one thing** — both are the thickness of a drawn line — so they collapsed into thickness, which gained the separator's heaviest step rather than losing any of its own.

**One real break came out of it.** The word for the typeface and the word for the middle text size became the same, and the one set from code wins, so every word on the page would have fallen back to Times. The typeface has a name of its own now.

**The top of a file is a fixture.** The title stands in a slot of fixed height, and the line beneath it belongs to the page rather than to the title — so the line stays whether the title is shown, folded, or open for changing, and everything after it always begins at the same place. Before, the line was the title's own bottom edge: folding the title took it away, and opening the title took it away again.

**A piece opened for changing holds what follows.** The box standing in for a piece is never quite that piece's height — different spacing above, a hair of room held inside it, whole-pixel rounding — so rather than accounting for each of those, the box measures where the piece below it stood and sets the room under itself to whatever puts it back. A subheading's box does the same for its own top, since the room above a subheading depends on what came before it. Both say in the log how far off they were.

**A heading is a row now.** Its fold mark used to be placed by two numbers that measured against different things — one against the heading's height, one against the mark's own — so neither could do the job alone and both were tuning knobs. The row holds the mark level with the words, and nothing says how far down it goes.

## 2026-08-07 — the disk is the only source of files

Overview used to learn which guides exist by scanning the five collections when its code was prepared. That scan is gone. The dispatcher — the small server on this machine that the log lines go to — is asked what is on disk, and that list is the whole picture: read in one pass, nothing settled in advance.

**Why it had to go.** Scanning put every guide into the dev server's own watched set, so writing to one reloaded the page under you. Renaming did it, moving did it, even mending an index did it. Two of those had a deliberate restart in them as well, from the days when a moved file really was invisible until the app started again; both are gone, and with them the routine that did the restarting.

**What it costs.** The dispatcher is required now. Without it there are no guides at all, so the screen says "the dispatcher is not answering — start it, then reload" rather than sitting empty. That is honest: the app could not save, move or delete anything without it either.

**One bug this settled on the way.** While the old scan and the new list both existed, a file moved since the code was prepared showed twice — once at its old place with no labels, once at its new one. With one source there is nothing left to disagree.

**A ⤴ button beside the trash.** It opens a new message addressed to Jonathan, the guide's name for a subject and its whole words in the body. Nothing is written, moved or thrown away by it. ji has one too, at the left of its help button, opening an empty message.

**ji's chat stopped hiding itself.** While the AI was unreachable the chat was replaced by a note — which left nothing on screen that would call the AI, so nothing ever noticed it come back, and the note sat there forever. The chat is always there now, with the note above it saying to ask anyway; asking is itself what finds out. The every-few-seconds check that watches the connection also runs while the chat is showing, and is counted rather than switched, so leaving the chat no longer takes it away from the AI store.

**Two of the standing rule files were renamed** — replying became response, working became agency — with every mention updated, the hook that loads them included.

## 2026-08-07 — a guide can be named, thrown away, and marked up

**The file's name is a field now.** It reads as plain words in the middle of the top row, takes a pill-shaped edge and the hover color when pointed at, and turns white while being typed in. Leaving it or pressing Return gives the file that name; Escape puts the old one back.

**Renaming used to close the view, and no longer does.** A guide is named by where it sits, so renaming moves it — and the view, still asking for the old place, found nothing and shut. Two things were wrong: the rename ended by restarting the whole app, which is no longer needed now that the app asks the disk what files exist; and the app's picture changed a full second before anything said so, while links in other guides were being mended. The move is now announced the moment the file lands, and whatever is reading that guide follows it — the stack of guides reached by links too.

**Throwing a guide away.** A trash mark sits at the right of the second row. Pressing it puts `delete "<name>"?` in the row itself, with a cross where the trash was to keep the guide; the name steps aside, since the question already says which file it means. Saying yes deletes the file, takes its line out of the index beside it, drops it from the list and goes back there. The dispatcher gained a delete route with the same refusals as moving: it must be a guide, inside the repo, and actually there.

**A new file no longer needs a relaunch.** The app's list of files is settled when its code is prepared, so anything added since was invisible. The dispatcher now says what is on disk, and the app reads whatever its prepared list missed. A file arriving with no labels gets a block composed from its own words — its first heading for a title, the first thing it says for a description — written to the file and marked `stale`, since no machine can judge which of the five kinds it really is.

**Editing gained a few hands.** A chunk of code is one piece now: the reader hung its line numbers on the words inside rather than the box around them, so only the words could be reached. Command with b, i or a hyphen makes what is picked heavy, slanted or struck through, and again undoes it — one star is slanted, two are heavy, three are both, so slanting heavy words adds to them rather than half-undoing them. Typing a bracket, brace or quote with words picked wraps them, and typing it again unwraps.

**The five kinds were renamed** to specify, step, wire, explain and refer, across a hundred guide files, the app's own list, and the two notes that spell them out.

## 2026-08-06 — the bars are catchable, and the thumb never a speck

Every bar was six pixels — chosen against the browser's heavy grey strip and overshot, so a bar was hard to catch and its thumb was a thread. They are fifteen now, and how thick they are is said once and read everywhere.

**What the earlier round got wrong.** The app-wide form of a bar's rule matches nothing at all, so deleting each box's own rule handed every bar back to the browser at its full default width. Each scrolling box has to name itself. A name inside those rules does work, though — that was the untested half of the old lesson — so all four bars read the one published thickness instead of a number typed out four times.

**A floor under the thumb.** The browser sets a thumb's length from how much of the contents fit on screen, so a long file shrank it to a speck. It is now never shorter than a fifth of its lane.

**Both thumbs at once.** To see whether that floor does anything, the list and the file both draw a thin marker where the browser alone would have put the thumb, laid over the real one — and only while the two differ. The arithmetic is one tested piece both views share. One bug fell out of it: folding a section changes how tall the words are but not the box holding them, so nothing told the marker to look again; folding now says so itself.

## 2026-08-06 — the way out is the whole top of the view

The way back to the list was a small circle at the far left — a lot of aim to demand for the commonest move in the app. It is gone. The two rows above the heavy line are one block now, and a press anywhere in it that isn't on something answering for itself goes back to the list. The things that answer are the step marks, the search field, the count between its marks, and the file's name. Escape still does the same, and the words themselves are left alone so nothing typed is lost by a stray press.

**The rule is proved without a page.** Walking up from the thing pressed to the block it sits in, every tag name and class name met along the way is gathered, and any one of them being a control settles it. That list of names is what the eight new tests exercise — the empty space leads back, each control does not, capitals read the same as small letters.

**Lighting only the empty part.** A block lights on its own whenever the cursor is anywhere inside it, controls included, which would have promised a way out where there wasn't one. So the same rule that decides a press also decides the light: the cursor is followed, and the block lights only while it is over empty space. The lit color reaches the box's left, right and top edges, since the space a box holds around its contents is part of the area being offered.

## 2026-08-05 — reading a file became editing a file

The reading view had a button that turned editing on and off, and a good half of it only ran while that was on. Editing is what the view is for, so the switch is gone: every file opens ready to change, a click on any piece opens that piece, the label form is always there, and the piece is named for what it now does. The way back is the close cross and the Escape key — a click on the words can no longer throw away what is being typed. The rename button went too, though the handler behind it stayed for whatever asks next.

**The top rows were rearranged, twice.** The search takes the first row now, with the count and its two step marks appearing beside the field once there is something to look for. The row below carries the way out at its far left, then the step marks, then the folders above the file, with the file's name pinned to the middle of the whole width so nothing beside it can shift the name. The file's own name row is gone.

**One pixel of drift.** Going from the list to a file and back moved everything a pixel. The search row was one pixel taller than the list's own top row, having been padded to stop it growing when the step marks arrive. The marks are now held to the row's height — they still show whole, since they are allowed to spill — and both rows are the same height again.

## 2026-08-05 — one search, wherever you are

The words looked for in the list and the words looked for inside a file were two separate fields, each forgotten on the way to the other. They are one value now, with which place is lit held beside it. Words typed in the list are already in the field when a file opens, and the first place they turn up is lit; stepping to the next file carries them along; and both come back after a reload. The consequence is deliberate and worth knowing: typing while reading also narrows the list behind it.

**Folding a section stopped fighting the title.** Folding the top heading used to force every section below it folded, which meant a section's own soft pointer could be pressed and nothing would happen. A file now follows the shared title fold until the reader presses one of its own section pointers; from that press the file keeps its own folds, so a single section can be opened while the title stays folded. Stepping to the next file still finds everything folded.

## 2026-08-05 — a file's own sections fold

Every heading below the first now carries a small soft pointer out in the left margin, the way Obsidian draws one: turned down while its section shows, sideways while folded. Pressing it hides everything that heading owns — up to the next heading of its own level or higher, so folding an outer one takes the inner ones with it. The top heading carries one too, folding every section at once, and it reads as open while any single one is still open. The folds belong to the file being read, so opening another starts with everything shown.

**Where the marks had to live.** They were being made from the start — the log said nine of them — but nothing showed, because a box that scrolls clips whatever sits outside it and each mark is placed left of its heading. The left inset moved from outside the box to inside it, and the marks now sit in that lane; the words did not move.

**The lesson, again.** Two rounds of guessing were wasted before one logged line said how many pieces were seen and how many marks were made. That answered it at once. Where the screen is the only witness, log the numbers rather than reason about the source.

## 2026-08-05 — the filters fold behind a word, like everything else

The button that hid the picking rows sat beside the search field, the last thing in the app still working that way. It is gone; the search field takes the whole row, and a heavy line under it carries one word that folds the whole set at a press anywhere along it. Shown, the word is just `filters`; folded, it says what every row holds — `filters ➜ designs, di, rule` — leaving out any row narrowing nothing, since "all" is not worth the room. The plain heavy line below the rows, and the gap under the word, are there only while the rows are.

## 2026-08-05 — the step marks became a piece of their own

The two fat triangles that walk from one file to the next were written out inside the reading view — shapes, sizes, the repeating hold, and the markup. They are now one piece anywhere can use, taking whether it can go back or forward, what to do for each, whether it runs up-and-down, whether both show even when one leads nowhere, and the hover words. The reading view uses it twice: once between the close cross and the edit button, and once either side of the search count. Seven tests cover which way each mark points, when it is drawn, when it answers, and the hold — one step at the press, a patter after the pause, never two beats at once, safe to release when nothing is held.

**Two small things while editing.** A piece's own words end with the blank line that separates it from the next; that line is now kept out of the box and put back on saving, so the file is unchanged either way, and the box no longer opens two lines tall for one line of words. And pressing the bar beside the words used to take the cursor off the box, which closed it — so scrolling threw you out of the piece. A press in the bar's lane is now noted and the box takes the cursor straight back.

## 2026-08-05 — the reading view reads like a page

**The words look like a page now.** Paragraphs step in and stand a gap apart, the six heading levels wear the colors Obsidian gives them, and a hairline runs under the top heading with room below it. Punctuation is left exactly as the file writes it — no curling quotes — so a piece never looks one way on the page and another in the box that edits it. That box now matches a paragraph's size, leading, spacing and step-in, and draws no edge at all, so opening and leaving a piece moves nothing.

**The top of the view was rearranged.** The button row keeps the close cross and the edit and rename buttons at its left, and the folders above the file at its right. The row below carries the file's name alone, twice the ordinary size, with the two step triangles at its far left. What the file is labeled — its kind and tags — moved to the line under the search row, which reads `okf ➜ rule, session, team` whether the label form is open or shut, and folds that form away when pressed; the OKF button is gone.

**Every scrollbar is 6px with an accent thumb and no track.** This took far too long, and the lesson is worth keeping: a scrollbar's own styling cannot read the sizes pushed onto the page — a name there silently falls back to the browser's fat bar — and the universal form of the rule never matched at all. Both bars are now styled by naming their own element, with plain numbers. Two places were also holding back a hardcoded 20px for a bar that no longer needs it.

**The collections stand on their own.** Each project used to hang under the shared folder on screen as well as on disk, so shutting mono took all four with it. The walk now starts at all five; the chain on disk is kept, since following a link from one project into another climbs it.

## 2026-08-04 — the tags gathered into areas, and every name shortened

Twenty-four tags in one flat row was more than an eye could scan. They now sit in six areas — ai, code, fix, harness, other, ux — each standing as a single pill that folds its tags away behind its own name. Shut, a pill reads its area's name, or the names of whatever inside it is picked, so a filter on is never invisible; a picked tag also fills the thin ring between the pill's two borders. Open, a cross takes the left end and the tags run as one unbroken row of segments at the right, with the area's name straddling the top edge over the cross. Opening one leaves the others as they are, picking a tag leaves it open, and which are open is remembered — the filters and the label form share one memory, so an area left open in one is open in the other. A tag nothing is left wearing simply goes; with one left the area steps aside and that tag stands as a plain pill; with none left the area is gone.

**Every word cut to its shortest true form.** The five kinds are now rule, howto, wiring, why and lookup. Fourteen tags were renamed — architecture became wire, collaboration became team, philosophy became vision, and testing, debugging, migration, refactoring, porting, code-style and session-start all lost their endings. Alphabetical order everywhere now ignores capitals, so UX sits between tools and vision rather than ahead of everything.

**One trap this sprung.** A tag picked last visit and since renamed narrows the list to nothing while no longer showing anywhere — nothing left to click to undo it. Anything remembered that is no longer on either closed list is now let go at launch.

**The separators earned their keep.** One bar can carry several words, spread evenly along it or held to its two ends; a word can be a button, and since a bar is two pixels tall a clear strip the height of an ordinary control lies along it so pointing anywhere lights the word and clicking anywhere presses it. Every filter row now folds away behind its own word, which then reads what is picked — `purpose ➜ designs` — and those folds are remembered.

## 2026-08-02 — guides can be moved, and handed to Obsidian

**Dragging a file into another folder.** With the folders on screen, a file can be picked up and dropped on any folder — the folder lights on the accent as the cursor crosses it, and its own folder never lights. The file moves on disk first; only if that works is the picture on screen changed, so nothing here can claim a move that didn't happen. A move can cross collections, since the four project folders hang under the shared one. Reading a moved guide needs no restart: its words come from wherever it now sits.

Four refusals, proved against the write server directly: a name already taken in the new folder, a folder that isn't there, a file that isn't there, and any path outside the guides folders.

**One bug worth remembering.** The drop did nothing at first: it let go of the file being carried before asking whether the file could land, so the answer was always no. Ask first, then let go.

**Handing a guide to Obsidian.** The repo is itself a vault, so a guide's place counting from the top of the repo is also its place in the vault. Command-clicking a file in the list opens it there; command with option opens it here for editing instead. Command-clicking the edit button in the reading view does the same. The hover words follow every case as the keys go down and up.

**Small things.** A "labels" toggle beside edit folds the label form away without leaving editing, and is remembered. The file that turns a guide's text into a page is now named for the markdown blocks it works with, so the word "block" means one thing in the code and another nowhere.

## 2026-08-02 — a guide can be changed from inside the app

Overview could only read. Now a guide can be edited where it is read, and the file on disk changes with it — one piece at a time, never a wholesale rewrite.

**The trap avoided.** Making the whole page typeable and turning it back into markdown on save would rewrite the entire file: every blank line, link style and indent becomes whatever the converter prefers, so a one-word fix lands as a rewritten file. Instead the page is never converted. Each outermost piece — paragraph, heading, list, quote, fenced code — is stamped as it is drawn with the lines of the file it came from, and a click opens that piece in a plain box holding the file's own words for those lines, hashes and dashes and all. Saving swaps just those lines. Every other line stays character for character what it was.

**Two guards on every write, and both refuse rather than risk.** The path must end in .md and sit inside a guides folder, and the file on disk must still read exactly as the app last saw it. Proved against the write route directly: a real write goes through leaving the file identical, a write claiming the wrong "before" text is refused, and a path outside the guides folders is refused.

**The five labels are edited as one thing**, through a small form — kind and tags picked from the app's own closed lists, never typed. After a successful write the list is told at once, so a new title or tag shows there without every file being read again.

**Getting in.** An edit toggle sits at the far left of the reading view, beside the close cross; holding the command key while clicking a file in the list opens it already editing, and the hover words say "edit" rather than "open" the moment the key goes down.

**Method.** Built in six steps, each stubbed and tested before any code: 53 tests now, covering the line numbers each piece claims, taking the labels off the top, putting typed words back in place of a run of lines, drawing a whole guide again after a change adds or removes lines, working out where a guide sits in the repo, and writing the labels back. Overview had no test runner before this; it has one now.

## 2026-08-01 — the filters fold away

A toggle at the far left of the top row hides the three picking rows — tags, kinds, projects — and their dividers, giving the list that height. The words looked for stay: the search field moved up beside the toggle and shows either way, since it is the one filter worth keeping in reach while the list is long. The choice is remembered across visits.

Two things settled while doing it: each divider now names the row *below* it rather than the one above, and the titles were cut to one word each — tags, kinds, projects.

## 2026-08-01 — searching the guide on screen

A second row under the reading view's top row holds one search field, the same pill as the list's, with the browser's own clear cross. Every keystroke lights the first place those words turn up and moves there; nothing lit is answer enough for a miss, so nothing flashes while the words are still being typed. What is typed is taken exactly as typed — a space counts like any other character, so two words are looked for together. The field belongs to the guide it was typed in, and empties when another guide opens.

**Two things came out of it.** Links now carry their own hover words, so pointing at one reads "follow this link" while the rest of the page still reads "back to the list". And the reader's habit of guessing at web addresses was turned off: it read the bare words "CLAUDE.md" as a site in Moldova, whose ending is the same two letters markdown files use, and clicking it left the app. Now only text that says outright it is a web address becomes a link.

**Left undone on purpose.** A link pointing outside the guides folders — a work note, a code file — still finds nothing. What it should do instead never came clear, so it sits in code debt rather than being half-built.

## 2026-08-01 — the links inside a guide came alive

A guide is full of links to other guides, and until now a click on one both shut the reading view and sent the browser off to the raw file. Counted across all five collections, the guides hold 505 links to a heading in the same guide, 222 to another guide, 183 to a code file or a note outside the guides, and 22 to the web. Each now does its own thing: move down the page, open that guide here, say plainly it isn't part of the picture, or open a new tab.

**Following a link.** Each guide knows the folders above it, so a link is answered by climbing that chain and taking the first guide of that name found beneath any folder on the way up. Before any of that: the heading is split off, the web spellings are put back to plain characters, and the file ending comes off — a guide is named without its ending everywhere else in the app, so the search works on plain names. An index file stops the search before it starts, since those are left out of the picture on purpose; a link naming one finds nothing, which is the right answer rather than a fault, as is a link naming a code file, whose name matches no guide.

**One top folder, not five.** For that climb to leave one project and reach another, the four project folders now hang under the shared one, since that is how they sit on disk. Every row indents one deeper, and the shared folder's count is now every matching file rather than only the shared ones.

**Headings had no names.** The markdown reader leaves them unnamed, so a link ending in "#naming" had nothing to land on. Each heading is now named after its own words — lowercased, anything that isn't a letter or number becoming a dash — which is how the writing tools make them, so the links already written in the guides line up.

**Stepping, while off the list.** Following a link puts that guide on a stack of its own, which starts empty each time reading begins from the list. While the stack holds anything the two triangles walk it rather than the list: back one down, forward one up, and the forward triangle is simply absent at the top — which is the visible sign of being off the list. Backing out past the bottom empties the stack and hands the triangles back to the list, wrapping at both ends as before. A link to a guide already on the stack backs up to it rather than adding it twice; a fresh link from partway down drops the guides above and lands on top. So the stack is always the path actually taken, and no guide is ever on it twice.

The list's own array is untouched: the count under the filters never moves because a link was followed, and a guide the filters hide still opens, because the reading view now finds a guide among all of them rather than only among the rows on screen.

## 2026-07-31 — the whole row answers, and hidden folders stop hiding

Clicking anywhere on a row now does what clicking its name used to: a file opens for reading, a folder opens or shuts. The hover hint moved with it, so the words follow the cursor across the whole row. The little triangle keeps its own click and stops it from reaching the row, so hitting the triangle on a folder doesn't toggle it twice.

A count that read "119 guides (of 135)" with nothing filtered gave away the second thing: three folders had been left shut from an earlier visit, and shutting a folder was still hiding its files even with the folders themselves off screen. Now, with the folders hidden, which ones were shut is set aside — remembered, not applied — and comes straight back the moment the folders do.

## 2026-07-30 — sorting, while the folders are hidden

With the folders off, the list is a flat run of files — and a flat run is a thing you can sort. With them on it isn't: a sort would have to either scramble the folders or sort inside each one, and neither is what anyone means by "sort by name". So sorting is offered only while the folders are hidden.

Clicking a column title walks it through three states: smallest first, largest first, then not sorting at all. More than one column can sort at once — the first decides, and each one after it only breaks a tie in the ones before, with a small number on the title saying where it comes in the order. Beside the show/hide folders button, a second button reading **unsorted** puts the list back to the order the walk gave it; it shows only when the folders are hidden, a sort is on, and there is more than one file to put in an order.

Three things settled along the way:

1. **Sorting by tags sorts on the whole string** the tags column shows — "architecture, data" — so what's on screen is exactly what it sorted by.
2. **A file with no tags sorts to the bottom**, both directions, rather than piling up at the top when the sort turns around.
3. **Turning the folders back on stops the sorting.** No sort is held in reserve, so there is never a hidden choice waiting to surprise anyone.

A project column also appears between kind and name, but only while the folders are hidden and no project is picked — with one picked, every row would read the same. When that column leaves, it stops sorting too.

## 2026-07-30 — a projects filter

Four collections of guides sit in this list, and the only way to see just one was to shut the other three folders by hand, then remember to open them again. Now a fourth control sits above the kinds, with a divider between them: an "all" segment first, then one per collection, the chosen one filled with the accent. One at a time — four collections is few enough that picking one is the whole point.

It was small, because the road was already built. The narrowing lives in the hierarchy and reads its filters from one place; this added one more to that place and one more line to the matching. Each file already carries which collection it belongs to, so there was nothing to look up.

**A project filter and a shut folder are the same idea from two directions**, and they can disagree — pick "di" while the di folder is shut and you see one folder and nothing else. They were left independent, letting the filter speak through the folder counts exactly as the other filters do. Having a project pick force its folder open would mean one control silently reaching into another.

## 2026-07-30 — two labels in the reading view's top row

Reading a guide showed its words and its name and nothing else. The two facts that put it in context — what kind of guidance it is, and what it's about — were on screen in the list and vanished the moment it opened. Now the kind sits immediately right of the two step triangles at the far left, the tags immediately left of the close button at the far right, and the name is pinned to the middle of the row itself, not centered in whatever space its neighbors leave over.

The real work was underneath. **One shared array, kept by the hierarchy** — the thing that already holds every folder, every file, and the tags on them. It holds what the filters and the folds leave, in the order shown, folders included. The list draws its rows from it and the reading view steps through it, so neither side can show something the other doesn't know about.

Each entry is a whole row, not a bare file: the guide together with the tags on it, how deep it sits, the folder chain above it, and whether it holds anything. A file doesn't carry its own tags — they're separate records linked to it — so looking them up is real work, done once as the row is built and never again.

Stepping is the reading view's own affair: moving forward or back it walks past any folder it meets until it lands on a file, wrapping at both ends. The fat triangles count files only — three folders around one file looks like four things, but there is only one guide to read.
