// The link readers, kb's own: what a guide's words point at, read out of the text alone, with no
// page drawn. Files.ts reads every guide with these at launch to relate the links, and the
// drawing, ai's Markdown_Blocks.ts since step 11 of the plan, reads through Kb.ts the same two
// it always did: the labels taken off the top, and Obsidian's double brackets turned into
// ordinary links.

// The five labels at the top are taken off before reading, so the reader's line numbers
// start below them. This says both what is left and how many lines went, which is what
// puts the numbers back onto the file's own count.
export function body_of(text: string): { body: string; skipped: number } {
	const lines = text.split('\n');
	if (lines[0]?.trim() !== '---') { return { body: text, skipped: 0 }; }
	const ends_at = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
	if (ends_at < 1) { return { body: text, skipped: 0 }; }
	return { body: lines.slice(ends_at + 1).join('\n'), skipped: ends_at + 1 };
}

/**
 * Every link a guide's own words hold, in the order they are written: the address it points at,
 * and the words it reads as. Addresses that say outright they are on the web are left out, since
 * nothing here can judge them, as are the ones written inside a fenced chunk of code, which are
 * being shown rather than followed.
 *
 * Both are wanted because they are seen in different places. The address is what a link is judged
 * by; the words are the only part of it drawn on the page, so they are the only part a search
 * through those words can ever find.
 */
export type Link_In_Words = { address: string; words: string };

export function links_in(text: string): Link_In_Words[] {
	const found: Link_In_Words[] = [];
	let fenced = false;
	for (const line of text.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
		if (fenced) { continue; }
		for (const hit of line.matchAll(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
			const address = hit[2];
			if (/^[a-z][a-z0-9+.-]*:/i.test(address)) { continue; }   // says outright it is elsewhere
			found.push({ address, words: hit[1] });
		}
	}
	return found;
}

/**
 * Obsidian's own way of naming another guide is two square brackets round its name, and these
 * files are an Obsidian vault, so the form is all through them. The reader knows only the
 * ordinary form, so each one is turned into that before the words are drawn — and then the
 * finding, the mending on rename, and the dead-link check all go on knowing one shape.
 *
 * `[[name]]` becomes a link reading "name" and pointing at "name.md". A bar gives the words to
 * show instead: `[[name|say this]]`. A hash names a heading inside it, and travels along.
 *
 * Anything inside a chunk of code is left exactly as written, so a guide can show the form
 * itself without it turning into a link.
 */
export function plain_links(text: string): string {
	const one = (whole: string): string => {
		const inside = whole.slice(2, -2);
		const [before, says] = inside.split('|');
		const [name, ...rest] = before.split('#');
		const heading = rest.join('#');
		if (name.trim() === '') { return whole; }
		const where = `${encodeURIComponent(name.trim())}.md${heading === '' ? '' : `#${heading}`}`;
		return `[${(says ?? name).trim()}](${where})`;
	};
	// Split on fenced chunks and on words between single backticks, and only change what falls
	// between them — the odd pieces of the split are the untouchable ones.
	const pieces = text.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g);
	return pieces.map((piece, at) => at % 2 === 1 ? piece : piece.replace(/\[\[[^\]\n]*\]\]/g, one)).join('');
}
