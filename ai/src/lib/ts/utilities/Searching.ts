/**
 * Which piece a search has to open, and which it can fold away again.
 *
 * A guide's sections can be folded. When the words looked for turn up inside a folded piece,
 * that piece is shown while its place is highlighted, and folded again once nothing highlighted
 * is inside it.
 *
 * Done in the wrong order that blinks: every keystroke folded the piece away and then opened the
 * same one again. So the two answers are worked out together, from the piece that is open now and
 * the piece the next place needs — and a piece is only ever folded when the next place is
 * somewhere else.
 */

export type Opening = {
	/** The piece to fold away again, or nothing when the one open should stay open. */
	fold: HTMLElement | null;
	/** The piece to open, or nothing when it is already open or none is needed. */
	show: HTMLElement | null;
};

/**
 * `open_now` is the piece a search opened last time, if any. `wanted` is the piece holding the
 * next place, or nothing when there is no next place. Both answers come back at once, so nothing
 * can fold a piece it is about to open.
 */
export function what_to_open(open_now: HTMLElement | null, wanted: HTMLElement | null): Opening {
	if (open_now === wanted) { return { fold: null, show: null }; }
	return { fold: open_now, show: wanted };
}
