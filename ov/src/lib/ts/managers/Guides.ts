import { T_Bundle, ALL_TAGS, type Guide, type Labels } from '../types/Guide';
import { Hierarchy } from './Hierarchy';
import { writable } from 'svelte/store';
import { debug } from '../common/Debug';

/**
 * Guides — every guide file in the four collections, hung on the structure.
 *
 * Overview reaches outside its own folder on purpose: the guides are the thing it
 * is a picture of. What travels with the app is only their addresses, never a word
 * of their text. At launch each file is read once, the five labels off its top are
 * kept, and everything else is let go — nothing is held on to and nothing is saved.
 */

// One sweep per collection, so which collection a file belongs to is known without
// having to read it out of the address. These patterns must be written out in full —
// the build reads them literally and cannot follow a name. Asking for the address
// rather than the text is what keeps the files themselves out of the app.
const addresses: Record<T_Bundle, Record<string, string>> = {
	[T_Bundle.mono]:   import.meta.glob('../../../../../notes/guides/**/*.md',    { query: '?url', import: 'default', eager: true }),
	[T_Bundle.di]:     import.meta.glob('../../../../../di/notes/guides/**/*.md', { query: '?url', import: 'default', eager: true }),
	[T_Bundle.ws]:     import.meta.glob('../../../../../ws/notes/guides/**/*.md', { query: '?url', import: 'default', eager: true }),
	[T_Bundle.ji]:     import.meta.glob('../../../../../ji/notes/guides/**/*.md', { query: '?url', import: 'default', eager: true }),
};

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

// The tags line reads like [one, two]. Anything not on the closed list is dropped, and
// said so — an invented tag is exactly what the closed list exists to catch.
function tags_from(line: string, where: string): string[] {
	const inside = value_after(line).replace(/^\[/, '').replace(/\]$/, '');
	const named = inside.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
	const kept = named.filter((t) => ALL_TAGS.includes(t));
	const dropped = named.filter((t) => !ALL_TAGS.includes(t));
	if (dropped.length > 0) {
		debug.log(`Guide "${where}" names ${dropped.length} tag(s) that are not on the closed list of ${ALL_TAGS.length}: ${dropped.join(', ')}. They are ignored.`);
	}
	return kept;
}

/**
 * Read the labels off one file's text. The block is the lines between the first row
 * of three dashes and the next one. Everything below is dropped on the floor here —
 * this is the only place a file's text is ever seen, and it does not survive the call.
 */
function labels_from(text: string, where: string): { labels: Labels; tags: string[] } {
	const lines = text.split('\n');
	const has_block = lines[0]?.trim() === '---';
	const ends_at = has_block ? lines.findIndex((line, i) => i > 0 && line.trim() === '---') : -1;
	const block = (has_block && ends_at > 0) ? lines.slice(1, ends_at) : [];

	let kind = '', title = '', description = '', date = '';
	let tags: string[] = [];
	for (const line of block) {
		if (line.startsWith('kind:'))        { kind        = value_after(line); }
		if (line.startsWith('title:'))       { title       = value_after(line); }
		if (line.startsWith('description:')) { description = value_after(line); }
		if (line.startsWith('date:'))        { date        = value_after(line); }
		if (line.startsWith('tags:'))        { tags        = tags_from(line, where); }
	}
	return { labels: { kind, title, description, date, labeled: block.length > 0 }, tags };
}

class Guides {

	hierarchy = new Hierarchy();

	// Flips to true once every file has been read. Anything showing the guides watches
	// this, since at first launch there is nothing yet to show.
	w_ready = writable(false);

	/** Every file, folders left out. */
	get files(): Guide[] {
		return this.hierarchy.guides.filter((g) => !g.is_folder);
	}

	/**
	 * Read every file once, keep its labels, let its text go. Each file is hung under a
	 * folder for its collection and one for each folder in its path, so the shape of the
	 * folders comes out of the addresses rather than being written down anywhere.
	 */
	async load(): Promise<void> {
		const marker = '/notes/guides/';
		let read = 0, failed = 0, unlabeled = 0, bytes = 0, skipped = 0;

		for (const bundle of Object.values(T_Bundle)) {
			const top = this.hierarchy.folder_at(bundle, '', bundle);
			for (const [whole_path, address] of Object.entries(addresses[bundle])) {
				const at = whole_path.indexOf(marker);
				const path = at < 0 ? whole_path : whole_path.slice(at + marker.length);
				const parts = path.split('/');
				const name = parts[parts.length - 1].replace(/\.md$/, '');

				// An index file only lists what sits beside it — the folders here do that job,
				// so it would say nothing the list doesn't already show. Left out entirely, not
				// merely hidden, so the counts never include one.
				if (name === 'index') { skipped += 1; continue; }

				// Walk down the folders in the path, making each the first time it's met.
				let parent = top;
				for (let i = 0; i < parts.length - 1; i++) {
					const so_far = parts.slice(0, i + 1).join('/');
					const folder = this.hierarchy.folder_at(bundle, so_far, parts[i]);
					this.hierarchy.add_relationship(parent.id, folder.id);
					parent = folder;
				}

				let text = '';
				try {
					const answer = await fetch(address);
					if (!answer.ok) { throw new Error(`the server answered ${answer.status}`); }
					text = await answer.text();
				} catch (e) {
					failed += 1;
					debug.log(`Could not read the guide "${bundle}/${path}" from ${address}: ${e instanceof Error ? e.message : e}. It is left out.`);
					continue;
				}

				bytes += text.length;
				const { labels, tags } = labels_from(text, `${bundle}/${path}`);
				if (!labels.labeled) { unlabeled += 1; }
				const guide = this.hierarchy.add_guide(bundle, path, name, address, {
					...labels,
					title: labels.title || name,
				});
				this.hierarchy.add_relationship(parent.id, guide.id);
				for (const tag of tags) {
					this.hierarchy.add_tagging(this.hierarchy.add_tag(tag).id, guide.id);
				}
				read += 1;
				// text goes out of scope here — nothing keeps it
			}
		}

		this.hierarchy.reindex();
		this.say_what_was_found(read, failed, unlabeled, bytes, skipped);
		this.w_ready.set(true);
	}

	/** Every kind that actually turns up in the files, in the order the files gave them. */
	kinds_present(): string[] {
		const seen: string[] = [];
		for (const guide of this.files) {
			if (guide.kind && !seen.includes(guide.kind)) { seen.push(guide.kind); }
		}
		return seen;
	}

	/** Every tag that actually turns up, kept in the closed list's order. */
	tags_present(): string[] {
		return ALL_TAGS.filter((tag) => this.hierarchy.tags.some((t) => t.name === tag));
	}

	/**
	 * Narrow the files by the three filters. A chosen kind must match. Chosen tags widen
	 * rather than narrow — a file matches if it carries any one of them, since a file
	 * usually carries only one or two and asking for all of three would find nothing.
	 * The words are looked for in the title and the description, ignoring case.
	 */
	filtered(kind: string, tags: string[], words: string): Guide[] {
		const looking_for = words.trim().toLowerCase();
		return this.files.filter((guide) => {
			if (kind !== '' && guide.kind !== kind) { return false; }
			if (tags.length > 0) {
				const worn = this.hierarchy.tag_names_of(guide.id);
				if (!tags.some((tag) => worn.includes(tag))) { return false; }
			}
			if (looking_for !== '') {
				const haystack = `${guide.title} ${guide.description}`.toLowerCase();
				if (!haystack.includes(looking_for)) { return false; }
			}
			return true;
		});
	}

	/** Say what the reading turned up, with the counts behind every claim. */
	private say_what_was_found(read: number, failed: number, unlabeled: number, bytes: number, skipped: number): void {
		const per_bundle = Object.values(T_Bundle)
			.map((bundle) => `${bundle} ${this.files.filter((g) => g.bundle === bundle).length}`)
			.join(', ');
		const folders = this.hierarchy.guides.filter((g) => g.is_folder).length;
		debug.log(`Guides read: ${read} files (${per_bundle}), ${skipped} index files left out, ${failed} could not be read, hung under ${folders} folders. ${unlabeled} carry no labels at all. Kinds found: ${this.kinds_present().join(', ') || 'none'}. Tags found: ${this.tags_present().length} of the ${ALL_TAGS.length} on the closed list, across ${this.hierarchy.taggings.length} tag placements. ${bytes} characters of text passed through and none of it was kept.`);
	}

}

export const guides = new Guides();
