/**
 * A scrollbar's thumb is drawn by the browser, its length taken from how much of the contents
 * fit on screen. A very long file or list shrinks it to a speck, so it is held to a floor —
 * never shorter than a share of its lane.
 *
 * Where the browser would have put it, left alone, is drawn as a thin marker over the real
 * one, so both can be seen at once. This works that marker out; nothing is worth drawing when
 * the two agree.
 */

/** The thumb is never shorter than this share of its lane. */
export const SHORTEST_PART = 5;

export type Free_Thumb = { top: number; length: number; shows: boolean };

/**
 * Where the browser alone would draw the thumb, and whether that differs from what is really
 * drawn. `lane` is the height on screen, `all` the full height of the contents, `scrolled` how
 * far down they are, and `above` the height of anything sitting over the lane.
 */
export function free_thumb(lane: number, all: number, scrolled: number, above = 0): Free_Thumb {
	const none = { top: above, length: 0, shows: false };
	if (lane <= 0 || all <= lane + 1) { return none; }       // everything fits: no bar at all
	const length = lane * lane / all;
	const floor  = lane / SHORTEST_PART;
	return {
		top    : above + (scrolled / all) * lane,
		length,
		shows  : length < floor - 1,                          // only worth drawing when they differ
	};
}
