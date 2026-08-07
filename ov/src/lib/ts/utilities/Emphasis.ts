/**
 * Making a run of words heavy, slanted or struck through while a piece is open for editing.
 *
 * Markdown says it with a mark either side: two stars for heavy, one for slanted, two squiggles
 * for struck through. This works out the new words and where the picking should sit afterwards
 * — nothing here touches the screen, so it can be proved on its own.
 *
 * Pressing again takes the marks off, whether they sit inside the picking or just outside it,
 * so the same press is both the on and the off.
 */

export const HEAVY   = '**';
export const SLANTED = '*';
export const STRUCK  = '~~';

export type Marked = { text: string; from: number; to: number };

/** How long a run of this one character a stretch of words opens with, and ends on. */
function run_at_the_start(words: string, letter: string): number {
	let n = 0;
	while (words[n] === letter) { n += 1; }
	return n;
}

function run_at_the_end(words: string, letter: string): number {
	let n = 0;
	while (words[words.length - 1 - n] === letter && n < words.length) { n += 1; }
	return n;
}

/**
 * Is this marker already on, given a run of that many marks either side?
 *
 * Stars stack: one is slanted, two are heavy, three are both — so heavy reads as on from two
 * up, and slanted from any odd count. That is what lets one press add slant to heavy words
 * rather than half-undoing them. Squiggles do not stack, so two or more simply reads as on.
 */
function already_on(run: number, mark: string): boolean {
	if (mark[0] !== '*') { return run >= mark.length; }
	return mark.length === 2 ? run >= 2 : run % 2 === 1;
}

/**
 * Put the marker around what is picked, or take it off if it is already there. With nothing
 * picked, the pair is put in and the cursor left between the two halves, ready to type.
 */
export function toggle_emphasis(text: string, from: number, to: number, mark: string): Marked {
	const picked = text.slice(from, to);
	const width = mark.length;
	const letter = mark[0];

	// Nothing picked: put the pair in and stand between them.
	if (picked === '') {
		return { text: text.slice(0, from) + mark + mark + text.slice(from), from: from + width, to: from + width };
	}

	// The marks sit inside what is picked.
	const opens = run_at_the_start(picked, letter);
	const ends  = run_at_the_end(picked, letter);
	if (Math.min(opens, ends) > 0 && picked.length > opens + ends) {
		if (already_on(Math.min(opens, ends), mark)) {
			const bare = picked.slice(width, picked.length - width);
			return { text: text.slice(0, from) + bare + text.slice(to), from, to: from + bare.length };
		}
		return wrapped(text, from, to, picked, mark);
	}

	// The marks sit just outside what is picked.
	const outside = Math.min(run_at_the_end(text.slice(0, from), letter), run_at_the_start(text.slice(to), letter));
	if (outside > 0 && already_on(outside, mark)) {
		return {
			text : text.slice(0, from - width) + picked + text.slice(to + width),
			from : from - width,
			to   : to - width,
		};
	}

	return wrapped(text, from, to, picked, mark);
}

/**
 * The marks that come in pairs: typing the left one while words are picked puts it before them
 * and its partner after, rather than throwing the words away. A quote mark is its own partner.
 */
const PAIRS: Record<string, string> = {
	'[' : ']',
	'(' : ')',
	'{' : '}',
	'"' : '"',
	"'" : "'",
};

/** The mark that closes this one, or nothing at all if it does not come in a pair. */
export function partner_of(letter: string): string {
	return PAIRS[letter] ?? '';
}

/**
 * Put a pair of marks around what is picked, or take them off again if they are already there
 * — inside the picking or just outside it. The picking stays on the same words either way.
 * Nothing happens when nothing is picked: there the mark is simply typed, as it always was.
 */
export function surround(text: string, from: number, to: number, opener: string): Marked | null {
	const closer = partner_of(opener);
	if (closer === '' || from === to) { return null; }
	const picked = text.slice(from, to);

	// The pair sits inside what is picked.
	if (picked.length > 2 && picked.startsWith(opener) && picked.endsWith(closer)) {
		const bare = picked.slice(1, picked.length - 1);
		return { text: text.slice(0, from) + bare + text.slice(to), from, to: from + bare.length };
	}

	// The pair sits just outside what is picked.
	if (text.slice(from - 1, from) === opener && text.slice(to, to + 1) === closer) {
		return { text: text.slice(0, from - 1) + picked + text.slice(to + 1), from: from - 1, to: to - 1 };
	}

	return {
		text : text.slice(0, from) + opener + picked + closer + text.slice(to),
		from : from + opener.length,
		to   : to + opener.length,
	};
}

/** Put the marker either side of what is picked, the picking moving with it. */
function wrapped(text: string, from: number, to: number, picked: string, mark: string): Marked {
	return {
		text : text.slice(0, from) + mark + picked + mark + text.slice(to),
		from : from + mark.length,
		to   : to + mark.length,
	};
}
