/**
 * The two rows above a file's words are mostly empty, and that empty space is the way back to
 * the list. A press only counts as "leave" when it lands on none of the things that answer for
 * themselves — the step marks, the search field, the count between the marks, and the file's
 * own name.
 *
 * The rule is written over plain names so it can be proved without a page: walking up from the
 * thing pressed to the row it sits in, every tag name and every class name met along the way is
 * gathered, and any one of them being a control settles it.
 */

/** Things that answer a press themselves, by what they are. */
export const CONTROL_TAGS = ['button', 'input', 'textarea', 'select', 'a'];

/** Things that answer a press themselves, by what they are called. */
export const CONTROL_CLASSES = ['view-name', 'rename-field', 'hit-count'];

/** Did the press land on something that answers for itself? */
export function landed_on_a_control(names: string[]): boolean {
	return names.some((name) => {
		const plain = name.toLowerCase();
		return CONTROL_TAGS.includes(plain) || CONTROL_CLASSES.includes(plain);
	});
}

/**
 * Every tag name and class name from the thing pressed up to the row it sits in, the row itself
 * left out — the row is the empty space, not a control.
 */
export function names_up_to(hit: Element | null, row: Element): string[] {
	const found: string[] = [];
	let at: Element | null = hit;
	while (at && at !== row) {
		found.push(at.tagName.toLowerCase(), ...at.classList);
		at = at.parentElement;
	}
	return found;
}
