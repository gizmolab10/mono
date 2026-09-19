import { customizations } from '../common/Customizations';
import { is_drawing } from './Drawings';
import type { Labels } from '../common/Kb';

export { is_drawing };

// Composing labels, ai's since step 12 of the plan: the labels an unlabeled file, one the db
// holds no row for, is given the first time it is opened for editing, read off its own words.
// Plain work on text, needing nothing on screen. Edit_Markdown.svelte calls it and writes the
// answer to the db; nothing is ever written to the file itself.
//
// An unlabeled file shows with no kind at all, and is left exactly as it is until someone opens
// it to edit. Only then are its labels composed — its first heading for a title, the first thing
// it says for a description — and marked "stale", the one tag that means a person still has
// to look at it.
//
// The kind is not guessed from where the file sits: no folder name says how a file reads, so a
// composed file starts at kind_when_new and the stale mark says to check.

/** The tag that says these labels were composed rather than written. */
export const NEEDS_A_LOOK = 'stale';

/**
 * What the folders above a file say it is: nothing. A designs folder used to make its files
 * designs, and that kind is gone — every folder now says nothing about how a file reads, so
 * kind_when_new is the answer for all of them and the stale mark asks for a real answer.
 */
export function kind_from_where(_path: string): string {
	return customizations.kind_when_new;
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
	const words = file_name.replace(/\.(md|svg)$/i, '').replace(/[-_]+/g, ' ').trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The labels to give an unlabeled file, read off the file's own words. `today` is handed in
 * rather than asked for, so the same file always composes the same labels in a test. A drawing
 * has no words to read: its title is its name, it says nothing, and it is a howto, journaled,
 * with no stale mark, since there is nothing in it for a person to check.
 */
export function labels_for(text: string, file_name: string, today: string, where = ''): { labels: Labels; tags: string[] } {
	if (is_drawing(file_name)) {
		return {
			labels: { kind: customizations.kind_when_drawn, title: title_from_name(file_name), description: '', use_when: [], date: today, labeled: true },
			tags: [customizations.tag_when_drawn],
		};
	}
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
		tags: [customizations.tag_when_new, NEEDS_A_LOOK],
	};
}
