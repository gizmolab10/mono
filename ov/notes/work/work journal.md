# Work

What's been finished, newest first.

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
