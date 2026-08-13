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

/**
 * Things that answer a press themselves, by what they are called. The last three are whole areas
 * rather than single controls: the run of tag areas has its own meaning for a press on its bare
 * space — it shuts every area — the line above it folds them away, and one tag area answers a
 * press anywhere on it while it is shut. None of the three counts as the way out.
 */
export const CONTROL_CLASSES = ['view-name', 'rename-field', 'hit-count', 'tags-row', 'section-bar', 'pill-slot'];

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

/**
 * Is the cursor on empty space right now, rather than on something that answers? Asked by every
 * row that is a way back to the list, so all of them agree on what counts as empty.
 */
export function over_empty(event: MouseEvent): boolean {
	const row = event.currentTarget as HTMLElement;
	return !landed_on_a_control(names_up_to(event.target as HTMLElement | null, row));
}

/**
 * The single things that take a press of their own, with no whole areas among them. A tag area
 * counts: shut, the whole of it answers a press.
 */
export const THINGS_THAT_ANSWER = [...CONTROL_TAGS, 'pill-slot'];

/** Did the press land on one of those? */
export function landed_on_a_thing(names: string[]): boolean {
	return names.some((name) => THINGS_THAT_ANSWER.includes(name.toLowerCase()));
}

/**
 * Is the cursor on the bare background of the area it is in? A different question from the one
 * above: this one asks only whether some single thing is under the cursor, so the areas named in
 * CONTROL_CLASSES — which are backgrounds themselves — do not stop the walk. A section whose own
 * background does something asks this.
 */
export function over_nothing(event: MouseEvent): boolean {
	const area = event.currentTarget as HTMLElement;
	return !landed_on_a_thing(names_up_to(event.target as HTMLElement | null, area));
}
