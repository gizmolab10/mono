/**
 * A drawn file is a flat run of pieces — paragraphs, headings, lists, quotes, code. A heading
 * "owns" everything after it up to the next heading of its own level or higher, and that run
 * is what folding a section hides.
 *
 * The levels are read off the drawn page: one for the top heading, two for the next, and so
 * on, with a zero for anything that is not a heading at all.
 */

/** The pieces one heading owns: the first after it, and one past the last. */
export function section_span(levels: number[], at: number): [number, number] {
	const mine = levels[at] ?? 0;
	if (mine === 0) { return [at + 1, at + 1]; }              // not a heading: owns nothing
	for (let n = at + 1; n < levels.length; n++) {
		const level = levels[n];
		if (level > 0 && level <= mine) { return [at + 1, n]; }
	}
	return [at + 1, levels.length];
}

/** Every heading below the top one — the ones that carry a mark in the margin. */
export function foldable_headings(levels: number[]): number[] {
	const found: number[] = [];
	levels.forEach((level, at) => { if (level >= 2) { found.push(at); } });
	return found;
}

/**
 * A heading's own words: the pieces after it up to the very next heading, whatever its level.
 * Folding the top heading hides only these, so the headings below it stay on screen — shown
 * folded — rather than disappearing with it.
 */
export function own_words(levels: number[], at: number): [number, number] {
	if ((levels[at] ?? 0) === 0) { return [at + 1, at + 1]; }
	for (let n = at + 1; n < levels.length; n++) {
		if (levels[n] > 0) { return [at + 1, n]; }
	}
	return [at + 1, levels.length];
}

/** The top headings — the ones whose mark folds or unfolds every other at a press. */
export function top_headings(levels: number[]): number[] {
	const found: number[] = [];
	levels.forEach((level, at) => { if (level === 1) { found.push(at); } });
	return found;
}

/**
 * Whether every section below the top is folded away. The top heading's own mark reads this:
 * with any one of them still open, the top reads as open too.
 */
export function all_folded(levels: number[], folded: number[]): boolean {
	const below = foldable_headings(levels);
	return below.length > 0 && below.every((at) => folded.includes(at));
}

/**
 * Which pieces are out of sight, given which headings are folded. A heading inside a folded
 * section is hidden along with everything it owns, so folding an outer one takes the inner
 * ones with it whether or not they were folded themselves.
 */
export function hidden_pieces(levels: number[], folded: number[]): Set<number> {
	const out = new Set<number>();
	for (const at of folded) {
		// A top heading hides only its own words; the headings below it stay on screen, shown
		// folded. Every other heading hides everything it owns, deeper headings included.
		const [from, to] = levels[at] === 1 ? own_words(levels, at) : section_span(levels, at);
		for (let n = from; n < to; n++) { out.add(n); }
	}
	return out;
}
