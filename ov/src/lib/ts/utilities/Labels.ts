import { T_Kind, type Labels } from '../types/File';

// The five labels at the top of every guide, written back into the file.
//
// Reading them happens where the guides are gathered; this is the other direction. They
// are the one part of a guide the app itself reads, so they are never typed as free text —
// what is written here is built from what a small form was given.

// A title or a description sits inside quote marks, so a quote mark of its own is marked
// as standing for itself, and a stray line break is taken out.
function quoted(words: string): string {
	return `"${words.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`;
}

// The block itself: three dashes, the five labels in their settled order, three dashes.
export function label_block(labels: Labels, tags: string[]): string {
	return [
		'---',
		`kind: ${labels.kind}`,
		`title: ${quoted(labels.title)}`,
		`description: ${quoted(labels.description)}`,
		`tags: [${tags.join(', ')}]`,
		`date: ${labels.date}`,
		'---',
	].join('\n');
}

// --- labeling a file that has none ------------------------------------------
//
// A file that has never been labeled shows with no kind at all, and is left exactly as it is
// until someone opens it to edit. Only then is a block composed from the file's own words — its
// first heading for a title, the first thing it says for a description — and marked "stale", the
// one tag that means a person still has to look at it. Nothing is ever written to a file nobody
// asked about.
//
// The kind is guessed from where the file sits: under a designs folder it is a design, under a
// work folder it is work, and anywhere else there is nothing in the path to go on, so it starts
// at refer and the stale mark says to check.

/** The tag that says these labels were composed rather than written. */
export const NEEDS_A_LOOK = 'stale';

/** The kind a composed block starts at when its folder says nothing. */
export const KIND_UNTIL_TOLD = T_Kind.refer;

/**
 * What the folders above a file say it is, when they say anything at all. A folder called
 * design or designs makes its files designs; one called work makes them work.
 */
export function kind_from_where(path: string): T_Kind {
	if (/(^|\/)designs?(\/|$)/.test(path)) { return T_Kind.design; }
	if (/(^|\/)work(\/|$)/.test(path))     { return T_Kind.work; }
	return KIND_UNTIL_TOLD;
}

/** Today, written the way every guide writes its date. */
export function today(): string {
	const now = new Date();
	const two = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

/** Does this file carry a label block at all? */
export function has_labels(text: string): boolean {
	const lines = text.split('\n');
	if (lines[0]?.trim() !== '---') { return false; }
	return lines.findIndex((line, i) => i > 0 && line.trim() === '---') > 0;
}

/** The words of the first heading, or nothing at all if the file opens without one. */
function first_heading(text: string): string {
	for (const line of text.split('\n')) {
		const found = /^#{1,6}\s+(.*\S)\s*$/.exec(line);
		if (found) { return found[1].replace(/[*_`]/g, '').trim(); }
	}
	return '';
}

/**
 * The first thing the file actually says: the first paragraph that is not a heading, a rule,
 * a list, a quote or a chunk of code, cut at its first full stop and held to a readable
 * length. Nothing at all when the file opens with none.
 */
function first_words(text: string): string {
	let fenced = false;
	for (const line of text.split('\n')) {
		const plain = line.trim();
		if (/^(```|~~~)/.test(plain)) { fenced = !fenced; continue; }
		if (fenced || plain === '') { continue; }
		if (/^(#|-|\*|>|\||\d+\.)/.test(plain)) { continue; }
		if (plain === '---') { continue; }
		const said = plain.replace(/[*_`]/g, '').trim();
		const stop = said.indexOf('. ');
		const one = stop < 0 ? said.replace(/\.$/, '') : said.slice(0, stop);
		return one.length > 160 ? `${one.slice(0, 157).trimEnd()}...` : one;
	}
	return '';
}

/** A title from the file's own name: dashes and underscores become spaces, first letter up. */
function title_from_name(file_name: string): string {
	const words = file_name.replace(/\.md$/, '').replace(/[-_]+/g, ' ').trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The labels to give a file that has none, read off the file's own words. `today` is handed in
 * rather than asked for, so the same file always composes the same block in a test.
 */
export function labels_for(text: string, file_name: string, today: string, where = ''): { labels: Labels; tags: string[] } {
	const heading = first_heading(text);
	const title = heading === '' ? title_from_name(file_name) : heading;
	return {
		labels: {
			kind        : kind_from_where(where),
			title,
			description : first_words(text),
			date        : today,
			labeled     : true,
		},
		tags: [NEEDS_A_LOOK],
	};
}

/**
 * The whole file again with a composed label block at its top, its words left exactly as they
 * are. A file that already carries labels is handed back untouched — this only ever adds.
 */
export function with_labels_added(text: string, file_name: string, today: string, where = ''): string {
	if (has_labels(text)) { return text; }
	const { labels, tags } = labels_for(text, file_name, today, where);
	return with_labels_replaced(text, labels, tags);
}

// The whole file again, with its label block swapped for this one. A file that carries no
// labels gets one put at the very top, with its words left exactly as they are.
export function with_labels_replaced(text: string, labels: Labels, tags: string[]): string {
	const block = label_block(labels, tags);
	const lines = text.split('\n');
	const ends_at = lines[0]?.trim() === '---'
		? lines.findIndex((line, i) => i > 0 && line.trim() === '---')
		: -1;
	if (ends_at < 1) { return `${block}\n${text}`; }
	return [block, ...lines.slice(ends_at + 1)].join('\n');
}
