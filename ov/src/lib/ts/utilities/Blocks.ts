import type MarkdownIt from 'markdown-it';

// Where each piece of a drawn guide came from in the file it was read out of.
//
// A block is one whole piece standing on its own lines — a paragraph, heading, list,
// table, quote, fenced code. As the page is built, each top-level block is given two
// numbers saying which lines of the file it covers, so an edit can later put words
// back exactly where they came from and touch nothing else.
//
// The numbers are counted from zero, and the second is one past the last line — the
// same way the markdown reader hands them over, and the same way a run of lines is
// taken out of a list. No arithmetic in between, so there is nothing to get wrong.

export type Block_Lines = { from: number; to: number };

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

// The file's own words for one block: the run of lines it was stamped with, given back
// exactly as they sit in the file. Asking for lines the file doesn't have gives back only
// the ones it does; asking for nothing gives nothing.
export function lines_between(text: string, from: number, to: number): string {
	if (to <= from) { return ''; }
	return text.split('\n').slice(Math.max(0, from), to).join('\n');
}

// The whole file again, with one run of lines swapped for what was typed. Every other
// line is handed back untouched, character for character — that is the whole point.
export function with_lines_replaced(text: string, from: number, to: number, typed: string): string {
	if (to <= from) { return text; }
	const lines = text.split('\n');
	const first = Math.max(0, from);
	if (first >= lines.length) { return text; }
	const after = lines.slice(Math.min(to, lines.length));
	return [...lines.slice(0, first), ...typed.split('\n'), ...after].join('\n');
}

// Does the file still read the way it did when the piece was opened? Asked before writing:
// if the answer is no, the numbers are stale and the save is refused rather than risked.
export function still_reads(text: string, from: number, to: number, as_opened: string): boolean {
	if (to <= from) { return false; }
	const lines = text.split('\n');
	if (to > lines.length) { return false; }
	return lines_between(text, from, to) === as_opened;
}

// Turn markdown into a page whose every top-level block carries the lines it came from.
// Blocks sitting inside other blocks are left unstamped for now: their line ranges are
// the easiest to get wrong, so they wait until the plain ones are proven.
export function stamp_blocks(reader: MarkdownIt, markdown: string, skipped: number): string {
	const tokens = reader.parse(markdown, {});
	for (const token of tokens) {
		// Only the outermost pieces, and only the ones that open something or stand alone —
		// a closing tag has no words of its own to carry the numbers.
		if (token.level !== 0 || token.nesting < 0 || !token.map) { continue; }
		token.attrSet('data-from', String(token.map[0] + skipped));
		token.attrSet('data-to',   String(token.map[1] + skipped));
	}
	return reader.renderer.render(tokens, reader.options, {});
}

// The reader leaves headings unnamed, so a link ending in "#naming" would have nothing to
// land on. Each heading is given a name made from its own words — lowercased, with anything
// that isn't a letter or a number becoming a dash — which is how the writing tools make
// them, so the links already in the guides line up.
export function name_the_headings(html: string): string {
	return html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, (whole, level, already, inside) => {
		const words = inside.replace(/<[^>]*>/g, '');
		const named = words.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
		return named === '' ? whole : `<h${level} id="${named}"${already}>${inside}</h${level}>`;
	});
}

// Every link carries its own hover words, so pointing at one says "follow this link" rather
// than the whole page's "back to the list" — the hint watcher always takes the nearest words
// under the cursor.
export function mark_the_links(html: string): string {
	return html.replace(/<a\s/g, '<a data-tip="follow this link" ');
}

// The whole page for one guide, built out of the file's own text: labels taken off the top,
// every outermost piece stamped with the lines it came from, headings named, links marked.
//
// Everything a drawn guide knows comes from here, so drawing it again after a change is the
// same call on the changed text — never a patch of what is already on screen.
export function page_of(reader: MarkdownIt, text: string): string {
	const { body, skipped } = body_of(text);
	return mark_the_links(name_the_headings(stamp_blocks(reader, body, skipped)));
}
