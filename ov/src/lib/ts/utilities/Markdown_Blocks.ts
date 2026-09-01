import type MarkdownIt from 'markdown-it';
import { CHECKBOX, svg_paths } from '../common/Core';

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

/**
 * A file's contents start at its first heading, whatever its rank — not every file opens with a
 * top-level one. Every character between the labels and that heading is left over: a stray line,
 * a run of blanks, spaces holding the heading off the left edge. It all goes the first time the
 * file is opened.
 *
 * A heading is still a heading with up to three spaces before it, which is why those count as
 * characters to take out rather than as a reason to find nothing. Four or more make it an
 * ordinary stepped-in line, and no heading at all.
 *
 * The labels themselves stay exactly as they are, and so does every line from the heading down.
 * A file with no heading is left alone: there is no saying where its words were meant to begin,
 * so nothing is thrown away on a guess.
 */
export function without_words_above_heading(text: string): string {
	const { body, skipped } = body_of(text);
	const lines = body.split('\n');
	const at = lines.findIndex((line) => /^ {0,3}#{1,6}\s/.test(line));
	if (at < 0) { return text; }                        // no heading to start the words at
	const labels = text.split('\n').slice(0, skipped);
	const from_heading = [lines[at].replace(/^ +/, ''), ...lines.slice(at + 1)];
	const put_right = [...labels, ...from_heading].join('\n');
	return put_right === text ? text : put_right;
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
	// How deep each piece sits. A heading's own number is its depth; everything under a heading
	// sits one deeper than it. Before the first heading, a piece counts as sitting under the
	// title. What that depth means on screen is decided where the page is drawn.
	let under = 1;
	// The line a table row began on, held from the row until its first cell arrives.
	let number_for_cell: number | null = null;
	for (const token of tokens) {
		// One exception to the outermost-only rule: every list item carries the one line it begins
		// on, three times over. Pressing a thing-to-be-done's box writes that single line back;
		// the two that put words back name the same line, so pressing the item itself opens that
		// one line rather than the whole list around it — whatever it wraps to on screen, and
		// whatever list it holds, since each item inside that carries its own.
		if (token.type === 'list_item_open' && token.map) {
			token.attrSet('data-line', String(token.map[0] + skipped));
			token.attrSet('data-number', String(token.map[0] + skipped + 1));
			token.attrSet('data-from', String(token.map[0] + skipped));
			token.attrSet('data-to',   String(token.map[0] + skipped + 1));
		}
		// And every row of a table carries the one line it came from, the same way. A table is
		// drawn as one piece, so without this the whole of it wears a single number and the
		// column beside the words stops counting until the table ends. The line of dashes under
		// the headings is drawn as nothing at all, so no row carries its number.
		//
		// The number goes on the row's first cell, never on the row itself: anything drawn
		// against a row becomes a cell of its own, which pushes every real cell one column
		// along and leaves the headings standing over the wrong words. The lines the row came
		// from stay on the row, so pressing anywhere along it opens that one line.
		if (token.type === 'tr_open' && token.map) {
			token.attrSet('data-line', String(token.map[0] + skipped));
			token.attrSet('data-from', String(token.map[0] + skipped));
			token.attrSet('data-to',   String(token.map[0] + skipped + 1));
			number_for_cell = token.map[0] + skipped + 1;
		}
		if (number_for_cell !== null && (token.type === 'th_open' || token.type === 'td_open')) {
			token.attrSet('data-number', String(number_for_cell));
			number_for_cell = null;
		}
		// Only the outermost pieces, and only the ones that open something or stand alone —
		// a closing tag has no words of its own to carry the numbers.
		if (token.level !== 0 || token.nesting < 0 || !token.map) { continue; }
		// The line the piece begins on, counted the way a person counts and the way Obsidian
		// does — from one, at the very first line of the file, the labels at the top counted with
		// everything else. The two below count the same file from zero, since they are what puts
		// words back.
		// A table wears no number of its own. Its rows carry them, and a number drawn against the
		// table itself is put wherever the browser decides a table's own drawing goes — which is
		// down beside the second row, over the number already standing there.
		if (token.type !== 'table_open') { token.attrSet('data-number', String(token.map[0] + skipped + 1)); }
		token.attrSet('data-from', String(token.map[0] + skipped));
		token.attrSet('data-to',   String(token.map[1] + skipped));
		if (token.type === 'heading_open') { under = Number(token.tag.slice(1)); }
		token.attrSet('data-depth', String(token.type === 'heading_open' ? under : under + 1));
	}
	return numbers_out_of_code(reader.renderer.render(tokens, reader.options, {}));
}

/**
 * A fenced chunk of code is drawn as a box holding a code element, and the reader hangs the
 * block's attributes on the inner one. That would leave a code block reachable only from
 * inside its own words, and never as the one piece it is — so the lines it came from are
 * moved out to the box around it.
 */
export function numbers_out_of_code(html: string): string {
	return html.replace(/<pre><code([^>]*?)(data-number="\d+" data-from="\d+" data-to="\d+" data-depth="\d+")([^>]*)>/g,
		(_, before, numbers, after) => `<pre ${numbers}><code${before}${after}>`);
}

// The reader leaves headings unnamed, so a link ending in "#naming" would have nothing to
// land on. Each heading is given a name made from its own words — lowercased, with anything
// that isn't a letter or a number becoming a dash — which is how the writing tools make
// them, so the links already in the files line up.
export function name_the_headings(html: string): string {
	return html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, (whole, level, already, inside) => {
		const words = inside.replace(/<[^>]*>/g, '');
		const named = words.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
		return named === '' ? whole : `<h${level} id="${named}"${already}>${inside}</h${level}>`;
	});
}

/**
 * A list item beginning with a pair of square brackets is a thing to be done, which the reader
 * knows nothing about and draws as the two brackets themselves. Each becomes a box, filled when
 * the letter x sits between them, and its item is named so the bullet beside it can come off and
 * a finished one's words can be struck through.
 */
export function boxes_for_tasks(html: string): string {
	// The shape and the slot it is given both come from the one place, so they cannot disagree.
	// Both shapes are drawn into every box; the check shows only on a finished one, which is what
	// the page's own styling decides.
	const side = CHECKBOX.size;
	const drawn = `<svg overflow='visible' width='${side}' height='${side}' viewBox='0 0 ${side} ${side}'>`
		+ `<path class='square' d='${svg_paths.checkbox()}'/>`
		+ `<path class='check' d='${svg_paths.checkmark()}'/></svg>`;
	return html.replace(/<li([^>]*)>(\s*(?:<p[^>]*>\s*)?)\[([ xX])\]\s/g,
		(_whole, already: string, between: string, inside: string) => {
			const done = inside === ' ' ? '' : ' done';
			return `<li${already} class="task${done}">${between}<span class="task-box${done}">${drawn}</span> `;
		});
}

/**
 * One line of the file with its pair of brackets turned over: empty becomes an x, an x becomes
 * empty. The step in, the bullet and every word after the brackets are handed back untouched.
 *
 * Nothing comes back for a line that is not a thing to be done, so a press that lands on a line
 * the file has since changed writes nothing.
 */
export function flipped_task(line: string): string | null {
	const hit = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+)\[([ xX])\](\s)/);
	if (!hit) { return null; }
	return `${hit[1]}[${hit[2] === ' ' ? 'x' : ' '}]${hit[3]}${line.slice(hit[0].length)}`;
}

/**
 * The markdown standing at the head of a line that the drawn page gives no width to: a heading's
 * hashes, or the bullet and brackets of a thing to be done. What follows it is the piece's own
 * first word — the one thing the box holding that piece is lined up by.
 *
 * Nothing comes back for any other line, so every other box starts exactly where it always did.
 * A heading keeps the up-to-three spaces that may stand before its hashes, since those are drawn
 * as nothing too.
 */
export function markup_prefix(line: string): string {
	const heading = line.match(/^ {0,3}#{1,6}[ \t]+/);
	if (heading) { return heading[0]; }
	const task = line.match(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[[ xX]\][ \t]/);
	return task ? task[0] : '';
}

/**
 * A line of three dashes is drawn as a rule, which is a shape the browser fills in itself and
 * will not hang a number on. It is drawn as an ordinary row instead, carrying the very same
 * numbers, and the line across it is painted where the page decides how everything else looks.
 */
export function rules_as_rows(html: string): string {
	return html.replace(/<hr([^>]*?)\s*\/?>/g, (_whole, already: string) => `<div class="rule"${already}></div>`);
}

/**
 * What the hover says over one link: the name of the file it goes to, without the folders above it
 * and without its ending — the same way a file is named everywhere else in the app.
 *
 * A link to a place in this same file names no file, and one that says outright it is on the web
 * names nothing here can put a name to, so each says what it does instead.
 */
export function words_for_link(href: string): string {
	let before = href.split('#')[0].trim();
	try { before = decodeURIComponent(before); } catch { /* a stray percent sign; the words as written will do */ }
	if (before === '')                             { return 'go to this heading'; }
	if (/^[a-z][a-z0-9+.-]*:/i.test(before))       { return 'visit link'; }
	const name = before.replace(/\/+$/, '').split('/').pop()?.replace(/\.md$/i, '') ?? '';
	return name === '' ? 'visit link' : `go to '${name}'`;
}

/** The characters that mean something else inside an attribute, spelled out. */
function spelled_out(words: string): string {
	return words.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Every link carries its own hover words, so pointing at one says where it goes rather than the
// whole page's "back to the list" — the hint watcher always takes the nearest words under the
// cursor.
export function mark_the_links(html: string): string {
	return html.replace(/<a\s([^>]*)>/g, (_whole, already: string) => {
		const found = /href\s*=\s*"([^"]*)"/.exec(already);
		return `<a data-tip="${spelled_out(words_for_link(found ? found[1] : ''))}" ${already}>`;
	});
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

// The whole page for one guide, built out of the file's own text: labels taken off the top,
// every outermost piece stamped with the lines it came from, headings named, things to be done
// given their boxes, links marked.
//
// Everything a drawn guide knows comes from here, so drawing it again after a change is the
// same call on the changed text — never a patch of what is already on screen.
export function page_of(reader: MarkdownIt, text: string): string {
	const { body, skipped } = body_of(text);
	return mark_the_links(rules_as_rows(boxes_for_tasks(name_the_headings(stamp_blocks(reader, plain_links(body), skipped)))));
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
