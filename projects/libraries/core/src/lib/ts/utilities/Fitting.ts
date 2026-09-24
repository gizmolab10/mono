/**
 * How much of a run of words fits in the space there is for it.
 *
 * A run is cut at a whole word, never inside one, and the comma before a dropped word goes with
 * it. What is left ends in an ellipsis, so the reader can see that something was cut.
 *
 * How wide a string is drawn is asked of whoever is drawing it, so this can be proved without a
 * page.
 */

/** The one mark that says a run was cut. */
export const ELLIPSIS = '…';

/** What stands between two words in a run. */
export const BETWEEN = ', ';

/**
 * The words that fit, joined, with an ellipsis where any were dropped. The whole run comes back
 * untouched when it fits; where not even the first word fits, the ellipsis alone.
 */
export function words_that_fit(words: string[], room: number, width_of: (text: string) => number): string {
	const whole = words.join(BETWEEN);
	if (words.length === 0 || width_of(whole) <= room) { return whole; }
	for (let count = words.length - 1; count > 0; count -= 1) {
		const shown = words.slice(0, count).join(BETWEEN) + ELLIPSIS;
		if (width_of(shown) <= room) { return shown; }
	}
	return ELLIPSIS;
}
