import { ALL_TAGS, T_Kind, type Labels } from '../types/File';
import { debug } from '../common/Core';

// The labels at the top of every guide — read off a file's text, and written back into it.
//
// Both directions live here, since both are plain work on text and neither needs anything else
// to be on screen. They are the one part of a guide the app itself reads, so they are never
// typed as free text — what is written here is built from what a small form was given.

// A title or a description sits inside quote marks, so a quote mark of its own is marked
// as standing for itself, and a stray line break is taken out.
function quoted(words: string): string {
	return `"${words.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`;
}

// The block itself: three dashes, the labels in their settled order, three dashes. The occasions
// line is written only by a file that names any, so a file that names none is left as it was.
export function label_block(labels: Labels, tags: string[]): string {
	const when = labels.use_when ?? [];
	return [
		'---',
		`kind: ${labels.kind}`,
		`title: ${quoted(labels.title)}`,
		`description: ${quoted(labels.description)}`,
		...(when.length > 0 ? [`use_when: [${when.join(', ')}]`] : []),
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
// The kind is not guessed from where the file sits: no folder name says how a file reads, so a
// composed block starts at refer and the stale mark says to check.

/** The tag that says these labels were composed rather than written. */
export const NEEDS_A_LOOK = 'stale';

/** The kind a composed block starts at when its folder says nothing, which every folder does. */
export const KIND_UNTIL_TOLD = T_Kind.analyze;

/**
 * What the folders above a file say it is: nothing. A designs folder used to make its files
 * designs, and that kind is gone — every folder now says nothing about how a file reads, so the
 * fallback stands for all of them and the stale mark asks for a real answer.
 */
export function kind_from_where(_path: string): T_Kind {
	return KIND_UNTIL_TOLD;
}

// --- a guide made from nothing ----------------------------------------------

/** The name a new guide is given until it is given a real one. */
export const NAME_UNTIL_TOLD = 'unnamed';

/** The tag a new guide wears: it is the one being worked on. */
export const TAG_WHEN_NEW = 'now';

/**
 * The whole of a brand new guide: a full block of labels and a heading holding its name.
 * It is labeled from the moment it exists, so it never shows as unlabeled and nobody has to
 * go back and label it. Its brief is left empty, for whoever writes the first sentence.
 *
 * The kind and the tags come from outside, since what a new guide should wear is decided by
 * what the list is filtered by — a guide labeled otherwise would be made and then hidden.
 */
export function blank_file(name: string, date: string, kind: string, tags: string[]): string {
	const labels: Labels = { kind, title: name, description: '', use_when: [], date, labeled: true };
	return `${label_block(labels, tags)}\n# ${name}\n`;
}

/**
 * A name no file in the folder answers to. The plain one when it is free, then the same name
 * with a number after it, counting up from two. Capitals are ignored, since two names that
 * differ only in case are one file on this machine.
 */
export function free_name(wanted: string, taken: string[]): string {
	const used = new Set(taken.map((one) => one.toLowerCase()));
	if (!used.has(wanted.toLowerCase())) { return wanted; }
	for (let next = 2; ; next += 1) {
		const tried = `${wanted} ${next}`;
		if (!used.has(tried.toLowerCase())) { return tried; }
	}
}

/** Today, written the way every guide writes its date. */
export function today(): string {
	const now = new Date();
	const two = (n: number) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

// The months, spelled out, for a date a person reads rather than one a file carries.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A moment written out for reading: the day, the month by name, the year, then the clock — twelve
 * hours with the half of the day said, since that is how it is read aloud.
 */
export function moment_written_out(when: Date): string {
	const hour = when.getHours();
	const shown = hour % 12 === 0 ? 12 : hour % 12;
	const minutes = String(when.getMinutes()).padStart(2, '0');
	return `${when.getDate()} ${MONTHS[when.getMonth()]}, ${when.getFullYear()} at ${shown}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
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
export function title_from_name(file_name: string): string {
	const words = file_name.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim();
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
			use_when    : [],
			date        : today,
			labeled     : true,
		},
		tags: [TAG_WHEN_NEW, NEEDS_A_LOOK],
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
// Pull one label's value off a line, with the surrounding quotes taken off if it has them.
function value_after(line: string): string {
	const at = line.indexOf(':');
	if (at < 0) { return ''; }
	let value = line.slice(at + 1).trim();
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		value = value.slice(1, -1);
	}
	return value;
}

/**
 * The tags a file names, whichever of the two shapes it writes them in.
 *
 * `tags: [one, two]` on one line is what this app writes. Obsidian writes the other shape, one
 * name to a line under a bare `tags:` — and it rewrites a file into that shape the moment the
 * tags are touched there. A reader that knew only the first found nothing after the colon and
 * gave the file no tags at all, silently, since nothing was dropped: nothing was read.
 *
 * Anything not on the closed list is dropped, and said so — an invented tag is exactly what the
 * closed list exists to catch.
 */
function tags_from(lines: string[], at: number, where: string): string[] {
	const inside = value_after(lines[at]).replace(/^\[/, '').replace(/\]$/, '');
	const named = inside.length > 0
		? inside.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
		: names_below(lines, at);
	const kept = named.filter((t) => ALL_TAGS.includes(t));
	const dropped = named.filter((t) => !ALL_TAGS.includes(t));
	if (dropped.length > 0) {
		debug.log(`Guide "${where}" names ${dropped.length} tag(s) that are not on the closed list of ${ALL_TAGS.length}: ${dropped.join(', ')}. They are ignored.`);
	}
	return kept;
}

/**
 * The names written one to a line under a bare `tags:`, each beginning with a dash and standing
 * further in than the label itself. It stops at the first line that is neither — the next label,
 * or the end of the block.
 */
function names_below(lines: string[], at: number): string[] {
	const named: string[] = [];
	for (let on = at + 1; on < lines.length; on += 1) {
		const line = lines[on];
		if (!/^\s+-\s/.test(line)) { break; }
		const name = line.replace(/^\s+-\s*/, '').trim();
		if (name.length > 0) { named.push(name); }
	}
	return named;
}

/**
 * The occasions a file names, in either structure: `use_when: [one, two]` on the one line, which is
 * what this app writes, or one to a line below a bare `use_when:`, which is what Obsidian leaves
 * behind. Unlike tags there is no closed list — these are phrases, kept exactly as written.
 */
function phrases_from(lines: string[], at: number): string[] {
	const inside = value_after(lines[at]).replace(/^\[/, '').replace(/\]$/, '');
	const named = inside.length > 0
		? inside.split(',').map((one) => one.trim())
		: names_below(lines, at);
	return named.filter((one) => one.length > 0);
}

/**
 * Read the labels off one file's text. The block is the lines between the first row
 * of three dashes and the next one. Everything below is dropped on the floor here —
 * this is the only place a file's text is ever seen, and it does not survive the call.
 */
export function labels_from(text: string, where: string): { labels: Labels; tags: string[] } {
	const lines = text.split('\n');
	const has_block = lines[0]?.trim() === '---';
	const ends_at = has_block ? lines.findIndex((line, i) => i > 0 && line.trim() === '---') : -1;
	const block = (has_block && ends_at > 0) ? lines.slice(1, ends_at) : [];

	let kind = '', title = '', description = '', date = '';
	let tags: string[] = [];
	let use_when: string[] = [];
	for (let at = 0; at < block.length; at += 1) {
		const line = block[at];
		if (line.startsWith('kind:'))        { kind        = value_after(line); }
		if (line.startsWith('title:'))       { title       = value_after(line); }
		if (line.startsWith('description:')) { description = value_after(line); }
		if (line.startsWith('date:'))        { date        = value_after(line); }
		if (line.startsWith('use_when:'))    { use_when    = phrases_from(block, at); }
		if (line.startsWith('tags:'))        { tags        = tags_from(block, at, where); }
	}
	return { labels: { kind, title, description, use_when, date, labeled: block.length > 0 }, tags };
}
