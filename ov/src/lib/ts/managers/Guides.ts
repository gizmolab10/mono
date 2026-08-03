import { T_Bundle, ALL_TAGS, key_of, type Guide, type Labels, type Filtered_Guide } from '../types/Guide';
import { w_project, w_kind, w_tags, w_words, w_shut, w_show_folders, w_sorts } from './Filters';
import { writable, get } from 'svelte/store';
import { Hierarchy } from './Hierarchy';
import { fresh_index, line_for, relative_address, repaired_index, with_line_added, without_line_for } from '../utilities/Index_Files';
import { file_path_of, folder_path_of, move_guide, moved_into, save_guide } from '../utilities/Saving';
import { links_in } from '../utilities/Markdown_Blocks';
import { show_status, w_includes_work, type Finding } from './Status';
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
	[T_Bundle.ov]:     import.meta.glob('../../../../../ov/notes/guides/**/*.md', { query: '?url', import: 'default', eager: true }),
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

	// What the filters and the folds leave, in the order shown. The hierarchy keeps it;
	// this hands out the very same rows, and only exists so that anything showing them
	// hears about a change. Re-worked out whenever any filter or any fold moves.
	w_showing = writable<Filtered_Guide[]>([]);

	constructor() {
		// Any of the four moves, the list is worked out again — once, here, rather than
		// in each of the places that shows it.
		for (const w of [w_project, w_kind, w_tags, w_words, w_shut, w_show_folders, w_sorts]) {
			w.subscribe(() => this.renarrow());
		}
	}

	/** Work the list out again from what the filters say right now. */
	renarrow(): void {
		this.hierarchy.narrow(get(w_project), get(w_kind), get(w_tags), get(w_words), get(w_shut), get(w_show_folders), get(w_sorts));
		this.w_showing.set(this.hierarchy.filtered_guides);
	}

	/**
	 * One guide's labels and tags have changed on disk. Put them on the record and work the
	 * list out again, so what's on screen agrees with the file without every file being read
	 * a second time.
	 */
	relabel(guide: Guide, labels: Labels, tag_names: string[]): void {
		this.hierarchy.relabel(guide, labels, tag_names);
		this.renarrow();
		debug.log(`Guide "${key_of(guide)}" relabeled: kind "${labels.kind}", title "${labels.title}", ${tag_names.length} tag(s) — the list was worked out again.`);
	}

	/**
	 * Move one guide's file into another folder. The file moves on disk first; only if that
	 * works is the app's own picture changed, so what's on screen can never claim a move that
	 * didn't happen. Its words are read from where it now is, which the dev server will hand
	 * over by full path — so no restart is needed to read it again.
	 */
	async move(guide: Guide, folder: Guide): Promise<void> {
		const name = guide.path.split('/').pop() ?? guide.name;
		const to_path = moved_into(folder.path, name);
		const from = file_path_of(guide.bundle, guide.path);
		const to   = file_path_of(folder.bundle, to_path);
		const answer = await move_guide(from, to);
		if (!answer.ok) {
			show_status(`"${guide.name}" was not moved — ${answer.why}`);
			debug.log(`Moving "${guide.name}" from ${from} to ${to} was refused — ${answer.why}. Nothing changed.`);
			return;
		}
		this.hierarchy.rehang(guide, folder, to_path, `/@fs${answer.full_path}`);
		this.renarrow();
		debug.log(`Moved "${guide.name}" from ${from} to ${to}. It now hangs under "${folder.name}", and its words are read from ${answer.full_path}.`);
		// Where the repo begins on this machine, worked out from the one full place the server
		// gave back — everything else is named from the top of the repo.
		const root = answer.full_path.slice(0, answer.full_path.length - to.length);
		await this.mend_indexes(root, from, to, name);
	}

	/**
	 * Where the repo begins on this machine, read off any guide's own address. The addresses
	 * are settled when the app's code is prepared and name the file in full, so taking the
	 * guide's place in the repo off the end leaves the top of the repo.
	 */
	private get repo_root(): string {
		const file = this.files.find((g) => g.address !== '');
		if (!file) { return ''; }
		const full = decodeURIComponent(file.address.replace(/^\/@fs/, '').split('?')[0]);
		const where = file_path_of(file.bundle, file.path);
		return full.endsWith(where) ? full.slice(0, full.length - where.length) : '';
	}

	/**
	 * Put every index file right: mend the links that point at nothing, list the files that
	 * are beside them and unnamed, and make one for any folder that has none. Nothing is
	 * written unless it would change, and every change is said in the log.
	 */
	async repair_indexes(): Promise<void> {
		const root = this.repo_root;
		if (root === '') { show_status('cannot repair — the guides have no addresses to read'); return; }

		const folders = this.hierarchy.guides.filter((g) => g.is_folder);
		const files   = this.files;
		let made = 0, mended = 0, untouched = 0, refused = 0;
		let rewritten_total = 0, removed_total = 0, added_total = 0;
		const odd: string[] = [];      // anything worth saying at the end

		for (const folder of folders) {
			const where  = folder_path_of(folder.bundle, folder.path);
			show_status(`repairing ${where}/index.md`);
			const beside = files
				.filter((f) => f.bundle === folder.bundle && f.path.split('/').slice(0, -1).join('/') === folder.path)
				.map((f) => f.path.split('/').pop() ?? '');
			const known  = new Map<string, string>();
			for (const f of files) {
				const name = f.path.split('/').pop() ?? '';
				if (beside.includes(name) || known.has(name)) { continue; }
				known.set(name, relative_address(where, file_path_of(f.bundle, f.path)));
			}

			// A folder holding only other folders is ordinary. One holding nothing at all is not.
			if (beside.length === 0 && this.hierarchy.indexes.children_of(folder.id).length === 0) {
				odd.push(`${where} holds nothing at all`);
			}

			const index_at = `${where}/index.md`;
			const text = await this.read_file(`${root}${index_at}`);
			if (text === null) {
				const fresh = fresh_index(folder.name, beside);
				const wrote = await save_guide(index_at, fresh, '');
				if (!wrote.ok) { refused += 1; odd.push(`${index_at} could not be made — ${wrote.why}`); debug.log(`Repair: ${index_at} could not be made — ${wrote.why}.`); continue; }
				made += 1;
				debug.log(`Repair: made ${index_at}, naming ${beside.length} file(s).`);
				continue;
			}

			const put_right = repaired_index(text, beside, known);
			if (put_right.text === text) { untouched += 1; continue; }
			const wrote = await save_guide(index_at, put_right.text, text);
			if (!wrote.ok) { refused += 1; odd.push(`${index_at} was not written — ${wrote.why}`); debug.log(`Repair: ${index_at} was NOT written — ${wrote.why}.`); continue; }
			mended += 1;
			for (const line of put_right.removed) { odd.push(`${index_at} named something that is nowhere: ${line.trim()}`); }
			rewritten_total += put_right.rewritten.length;
			removed_total   += put_right.removed.length;
			added_total     += put_right.added.length;
			debug.log(`Repair: ${index_at} — ${put_right.rewritten.length} link(s) sent to where the file really is${put_right.rewritten.length > 0 ? ` (${put_right.rewritten.join(', ')})` : ''}, ${put_right.removed.length} taken out${put_right.removed.length > 0 ? ` (${put_right.removed.join(' | ')})` : ''}, ${put_right.added.length} added${put_right.added.length > 0 ? ` (${put_right.added.join(', ')})` : ''}.`);
		}

		const parts = [
			`${folders.length} folder(s) looked at`,
			`${untouched} already right`,
			`${mended} mended`,
			`${made} index file(s) made`,
		];
		if (refused > 0) { parts.push(`${refused} refused`); }
		// Anything odd is said on the way out, each on its own line — several lines are read
		// as a report rather than squeezed along the bottom.
		show_status(`index files: ${parts.join(', ')}${odd.length > 0 ? `\n\nworth knowing:\n${odd.join('\n')}` : ''}`);
		debug.log(`Repair finished: ${parts.join(', ')} — ${rewritten_total} link(s) put right, ${removed_total} taken out, ${added_total} added.${odd.length > 0 ? ` ${odd.length} thing(s) worth knowing: ${odd.join(' | ')}` : ''}`);
	}

	/**
	 * Look through every guide's own words for links that lead nowhere. Nothing is changed —
	 * this only says what it found, the first few on screen and all of them in the log. A link
	 * to the web is left alone, since nothing here can judge it.
	 */
	async find_dead_links(): Promise<void> {
		const files = this.files;
		const with_work = get(w_includes_work);
		const dead: Finding[] = [];
		let looked = 0, followed = 0, unreadable = 0;

		for (const guide of files) {
			const where = file_path_of(guide.bundle, guide.path);
			show_status(`looking through ${where}`);
			const text = await this.read_file(guide.address.replace(/^\/@fs/, '').split('?')[0]);
			if (text === null) { unreadable += 1; debug.log(`Dead links: could not read ${where}.`); continue; }
			looked += 1;
			for (const link of links_in(text)) {
				// Only links to guides are judged. A link to a source file or to a folder is
				// perfectly good — the app simply never lists those, so it cannot follow them.
				const named = link.split('#')[0];
				if (named.endsWith('/')) { continue; }
				// Work notes are a different country: unless they are asked for, a link into
				// one is passed over whether it leads anywhere or not.
				if (!with_work && /(^|\/)work(\/|$)/.test(named)) { continue; }
				const ending = named.split('/').pop()?.split('.').slice(1).pop() ?? '';
				if (ending !== '' && ending.toLowerCase() !== 'md') { continue; }
				followed += 1;
				const answer = this.hierarchy.explore(guide, link);
				if (answer.guide) { continue; }
				if (answer.why === 'a heading inside this same guide') { continue; }
				dead.push({ words: `${where} → ${link} (${answer.why})`, key: key_of(guide), link });
			}
		}

		const counted = `${looked} guide(s) read, ${followed} link(s) followed, ${dead.length} leading nowhere${unreadable > 0 ? `, ${unreadable} guide(s) unreadable` : ''}${with_work ? '' : ', links into work notes passed over'}`;
		// Every one of them, each its own row in the report, so any can be opened where it sits.
		show_status(`dead links: ${counted}`, dead);
		debug.log(`Dead links: ${counted}.${dead.length > 0 ? ` They are: ${dead.map((d) => d.words).join(' | ')}` : ''}`);
	}

	/**
	 * Read one file straight off this machine, or nothing if it isn't there. Asked for a file
	 * that doesn't exist, the server hands back the app's own page rather than saying no — so
	 * anything that comes back as a web page counts as not there.
	 */
	private async read_file(full_path: string): Promise<string | null> {
		try {
			const answer = await fetch(`/@fs${full_path}`);
			if (!answer.ok) { return null; }
			if ((answer.headers.get('content-type') ?? '').includes('text/html')) { return null; }
			return await answer.text();
		} catch {
			return null;
		}
	}

	/**
	 * A moved file leaves two index files lying: the folder it left still names it, and the
	 * folder it arrived in doesn't. Both are put right here — the whole line travels, so any
	 * description written by hand travels with it. A folder with no index file is left exactly
	 * as it was, and anything that can't be mended is said plainly rather than half-written.
	 */
	private async mend_indexes(root: string, from: string, to: string, file_name: string): Promise<void> {
		const index_beside = (where: string) => `${where.split('/').slice(0, -1).join('/')}/index.md`;
		const from_index = index_beside(from);
		const to_index   = index_beside(to);
		const from_text  = await this.read_file(`${root}${from_index}`);
		const to_text    = await this.read_file(`${root}${to_index}`);
		if (from_text === null && to_text === null) {
			debug.log(`Index files: neither ${from_index} nor ${to_index} exists, so there is nothing to mend.`);
			return;
		}

		// The line that travels: the one the old index had, or a fresh one when it had none.
		let line = '';
		let from_without = '';
		if (from_text !== null) {
			const taken = without_line_for(from_text, file_name);
			line = taken.line;
			from_without = taken.text;
			if (line === '') { debug.log(`Index files: ${from_index} never named "${file_name}", so nothing was taken out of it.`); }
		}
		if (line === '') { line = line_for(file_name); }

		if (to_text !== null) {
			const { text, into_more } = with_line_added(to_text, line);
			const wrote = await save_guide(to_index, text, to_text);
			if (!wrote.ok) {
				show_status(`"${file_name}" moved, but ${to_index} was not mended — ${wrote.why}`);
				debug.log(`Index files: ${to_index} was NOT written — ${wrote.why}. It still does not name "${file_name}".`);
				return;
			}
			debug.log(`Index files: ${to_index} now names "${file_name}"${into_more ? ', under a "More" heading, since it lists files in more than one place' : ''}.`);
			if (into_more) { show_status(`"${file_name}" was listed under "More" in ${to_index}`); }
		} else {
			debug.log(`Index files: ${to_index} does not exist, so nothing was added there.`);
		}

		if (from_text !== null && from_without !== from_text) {
			const wrote = await save_guide(from_index, from_without, from_text);
			if (!wrote.ok) {
				show_status(`"${file_name}" moved, but ${from_index} still names it — ${wrote.why}`);
				debug.log(`Index files: ${from_index} was NOT written — ${wrote.why}. It still names "${file_name}".`);
				return;
			}
			debug.log(`Index files: ${from_index} no longer names "${file_name}".`);
		}
	}

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

		// The shared collection's folder is the repo itself, and every project's folder sits
		// directly inside it — so the shared one is the single top and the other four hang
		// under it. Going up one folder is then the same as stepping up this chain, which is
		// what a link between two collections needs in order to be followed.
		const shared_top = this.hierarchy.folder_at(T_Bundle.mono, '', T_Bundle.mono);

		for (const bundle of Object.values(T_Bundle)) {
			const top = this.hierarchy.folder_at(bundle, '', bundle);
			if (bundle !== T_Bundle.mono) { this.hierarchy.add_relationship(shared_top.id, top.id); }
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
		this.renarrow();
		this.w_ready.set(true);
	}

	/** How many files one collection holds. Zero means it has no guides folder yet. */
	files_in(bundle: string): number {
		return this.files.filter((g) => g.bundle === bundle).length;
	}

	/** Every kind that actually turns up in the files, in alphabetical order. */
	kinds_present(): string[] {
		const seen: string[] = [];
		for (const guide of this.files) {
			if (guide.kind && !seen.includes(guide.kind)) { seen.push(guide.kind); }
		}
		return seen.sort();
	}

	/** Every tag that actually turns up, in alphabetical order. */
	tags_present(): string[] {
		return ALL_TAGS.filter((tag) => this.hierarchy.tags.some((t) => t.name === tag)).sort();
	}

	/** Say what the reading turned up, with the counts behind every claim. */
	private say_what_was_found(read: number, failed: number, unlabeled: number, bytes: number, skipped: number): void {
		const per_bundle = Object.values(T_Bundle)
			.map((bundle) => `${bundle} ${this.files.filter((g) => g.bundle === bundle).length}`)
			.join(', ');
		const folders = this.hierarchy.guides.filter((g) => g.is_folder).length;
		const roots = this.hierarchy.indexes.roots_among(this.hierarchy.guides.map((g) => g.id));
		const root_names = roots.map((id) => this.hierarchy.guide_byID(id)?.name ?? id).join(', ');
		debug.log(`Shape: ${roots.length} top folder(s) — ${root_names}. One means the four project folders hang under the shared one, so going up from a guide can reach another project.`);
		debug.log(`Guides read: ${read} files (${per_bundle}), ${skipped} index files left out, ${failed} could not be read, hung under ${folders} folders. ${unlabeled} carry no labels at all. Kinds found: ${this.kinds_present().join(', ') || 'none'}. Tags found: ${this.tags_present().length} of the ${ALL_TAGS.length} on the closed list, across ${this.hierarchy.taggings.length} tag placements. ${bytes} characters of text passed through and none of it was kept.`);
	}

}

export const guides = new Guides();
