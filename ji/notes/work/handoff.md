# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — mildly softer triangles (round the pointer's corners)

First unchecked in [code debt](code%20debt.md): **mildly softer triangles** — a six-point shape with three highly-curved corners and three barely-curved sides.

**Where it stands.** The folder mark is now `soft_pointer` in `utilities/SVG_Paths.ts` — a plain straight-sided isosceles pointer (one tip in the given direction, the two back corners 90° apart). The sides are straight and the corners are sharp; this item softens just the corners.

### Proposal

Give `soft_pointer` a corner-radius knob (default small). Keep its three tips where they are, but at each tip pull back a short distance along both sides to two points — six points in all — then round the tip with a short bezier between that pair. The three sides between corners stay straight (hardly curved); only the corners round. One number controls how soft. Mirror the change in `soft_pointer_bounds` (already sharing `soft_pointer_points`, so extend that shared builder). Straight corners at radius 0 keep today's look.

**Steel-man the misread.** "Sides hardly curved" could tempt bulging the sides like the old `fat_polygon` — but the note pairs it with "corners highly curved", so the sides stay near-straight and only the corners soften.

**Success.** The folder pointer keeps its shape and size but its three corners are gently rounded, the sides still read as straight, tunable by one knob.

**Open question for Jonathan:** how soft — just enough to take the sharp edge off, or clearly rounded nubs?

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.
