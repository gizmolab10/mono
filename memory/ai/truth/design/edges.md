# Edges

Which line each thing on ai's page is drawn with. The lines come from core's thickness ladder in `Constants.ts`, pushed to the html as css variables: huge 7.78, the separator between sections; fat 3.33; big 1.67; normal 1.11, `--thick`; small 0.75, said flat, the edge many buttons are drawn with; faint 0.56, `--thick-faint`; micro 0.28, `--thick-micro`. Made at the consolidation of 15 September 2026 from that day's decisions in [decisions](../decisions.md).

## Who wears what

- **A clickable**, the pill button that folds a section away, four of them: faint.
- **An information element**, the six fields and the four title tools: faint. The tools are white, the information clickable's size, the arrow the plain one.
- **The file section's steppers** in the controls row: a faint stroke, black, since core's accent stroke vanishes on the accent the section sits on.
- **The area's name on a big pill**: micro, black; it sits a micro gap lower since 15 September 2026.
- **The back links foot line**, carrying the word that folds the pills: normal, the thin one. The section's own edge is thick while the pills show and thin while they are folded. The word keeps its place folded or shown.
- **The way back**, the round white button holding the svg cross between the hamburger and the file's section: normal.
- **A big pill's own two edges**: 0.7 and 0.5, said flat in `Big_Pill.svelte`, not from the ladder.

## What the browser draws

A browser rounds an edge to whole device pixels. On a screen with one device pixel per css pixel, faint and micro both draw one pixel; on a screen with two, each draws half a css pixel. The two rungs differ in the file, not on screen.
