// Where the names above a run of tag areas fall.
//
// An area shows its own name riding above its top edge when it is open, when one tag is all that
// is left of it, or when something inside it is picked. That name reaches up out of the pill, so
// the run it sits in holds a gap above itself to keep the name off whatever runs overhead.
//
// Only a name in the topmost line reaches anything: a name on a later line has the line of pills
// above it to sit against. The pills wrap, so which line each is on is measured rather than
// reasoned out — and it is measured here, over plain numbers, so it can be proved without a page.

/** One pill in the run: how far its top sits from the top of the run, and whether it wears a name. */
export type Pill_Place = { top: number; named: boolean };

/**
 * Two pills count as being on the same line when their tops are within this many pixels of each
 * other. A browser puts a line's pills at the very same height, but a measurement can come back a
 * fraction out, and a fraction is not a new line.
 */
const SAME_LINE = 1;

/** Does any pill in the topmost line of this run wear a name? */
export function names_ride_in(pills: Pill_Place[]): boolean {
	if (pills.length === 0) { return false; }
	const highest = Math.min(...pills.map((one) => one.top));
	return pills.some((one) => one.named && one.top - highest < SAME_LINE);
}

/** The same, read off a drawn run: each pill's own top, and whether a name is drawn inside it. */
export function places_of(row: HTMLElement): Pill_Place[] {
	return ([...row.children] as HTMLElement[]).map((one) => ({
		top   : one.offsetTop,
		named : one.querySelector('.area-name') !== null,
	}));
}
