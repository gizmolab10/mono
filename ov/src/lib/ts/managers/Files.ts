import { address_of_file, delete_file, file_path_of, folder_path_of, files_on_disk, move_file, moved_into, path_of_address, reaches_under_work, site_of_file, read_file, renamed_path, save_file } from '../utilities/Saving';
import { kind_matches, tags_match, words_match, T_Picking, UNLABELED, w_project, w_kind, w_tags, w_tag_picking, w_words, w_shut, w_show_folders, w_sorts } from './Filters';
import { fresh_index, line_for, relative_address, renamed_address, repaired_index, with_line_added, without_line_for } from '../utilities/Index_Files';
import { blank_file, free_name, has_labels, labels_from, today, KIND_UNTIL_TOLD, NAME_UNTIL_TOLD, TAG_WHEN_NEW } from '../utilities/Labels';
import { T_Bundle, T_Kind, ALL_TAGS, in_order, key_of, type File, type Labels, type Filtered_File } from '../types/File';
import { links_in, plain_links } from '../utilities/Markdown_Blocks';
import { resolved_from } from '../utilities/Following_Links';
import { show_status, type Finding } from './Status';
import { CANNOT_FIND, Hierarchy } from './Hierarchy';
import { writable, get } from 'svelte/store';
import { debug } from '../common/Debug';

/**
 * Guides — every guide file in the four collections, hung on the structure.
 *
 * Overview reaches outside its own folder on purpose: the guides are the thing it
 * is a picture of. What travels with the app is only their addresses, never a word
 * of their text. At launch each file is read once, the five labels off its top are
 * kept, and everything else is let go — nothing is held on to and nothing is saved.
 */

// Which files exist is asked of the dispatcher, never scanned at build time. ScanningF
// even mending an index — reloaded the whole page under you. Nothing here is settled when the
// app's code is prepared, so a file added, moved or thrown away shows straight away.


/**
 * Every address one file's words point at, the double-bracket form turned into the ordinary one
 * first — the same order the dead-link check reads them in. A guide written the short way, naming
 * only `[[a name]]`, holds no ordinary link at all, so reading the raw text finds nothing in it.
 */
function addresses_in(text: string): string[] {
	return links_in(plain_links(text)).map((one) => one.address);
}

class Files {

	hierarchy = new Hierarchy();

	// Flips to true once every file has been read. Anything showing the guides watches
	// this, since at first launch there is nothing yet to show.
	w_ready = writable(false);

	// True when the dispatcher did not answer at launch. It is the only thing that
	// knows what is on disk, so without it there is nothing to show at all — and the screen
	// says so rather than sitting empty.
	w_no_server = writable(false);

	// Every markdown file the dispatcher found, counting from the top of the repo — including the
	// ones the app never lists. Only the dead-link check reads it, and only to tell a link naming
	// a real file it cannot open from a link naming nothing at all.
	paths_on_disk = new Set<string>();

	// Said whenever a guide moves from one path to another, with where it sat and where it now
	// sits. Whatever keeps track of which guide is being read hands in its own answer here, so
	// this file never has to know about the reading view — which would be a circle, since the
	// reading view already knows about the guides.
	moved_to: ((was: string, now: string) => void) | null = null;

	// What the filters and the folds leave, in the order shown. The hierarchy keeps it;
	// this hands out the very same rows, and only exists so that anything showing them
	// hears about a change. Re-worked out whenever any filter or any fold moves.
	w_showing = writable<Filtered_File[]>([]);

	// --- which guides point at which ------------------------------------------
	//
	// A guide says what it points at, and nothing says what points at it — so one can be
	// rewritten, moved or thrown away without ever seeing who was relying on it.
	//
	// The links are gathered at launch, out of the very text each file's labels are read from:
	// that text is in hand for one moment and let go straight after, so taking the links out of
	// it there costs one more look at words already read. Nothing of the text is kept but the
	// addresses. The dead-link check cannot fill this — it reads every file and runs only when
	// asked, so a guide would say nothing points at it whenever nobody had asked lately.
	//
	// Where each link points is worked out once loading has finished, since answering a link
	// needs every guide already hung on the structure.
	links_from = new Map<string, string[]>();

	// Which guides point at each one, by where they sit. Worked out from the above, and again
	// whenever one file's own links change.
	w_pointing_at = writable(new Map<string, string[]>());

	/** The guides that point at this one, in the order they were read. */
	pointing_at(key: string): string[] {
		return get(this.w_pointing_at).get(key) ?? [];
	}

	/**
	 * Work out afresh which guides point at which, from the links every one of them holds.
	 * Each link is answered by the same following that answers a press, so a link naming a file
	 * the app never lists counts for nothing here, exactly as it does there.
	 */
	relate_the_links(): void {
		const pointing = new Map<string, string[]>();
		let answered = 0, unanswered = 0;
		let nowhere = 0;
		for (const [from, links] of this.links_from) {
			const guide = this.hierarchy.all_files.get(from)?.file;
			// Every guide is findable by where it sits once the narrowing has run. One that is not
			// says this was asked too early, which is silent otherwise: no link is followed, no
			// link fails, and every guide simply has nothing pointing at it.
			if (!guide) { nowhere += 1; continue; }
			for (const link of links) {
				const found = this.hierarchy.explore(guide, link).file;
				if (!found) { unanswered += 1; continue; }
				answered += 1;
				const at = key_of(found);
				if (at === from) { continue; }                    // a guide pointing at itself says nothing
				const already = pointing.get(at) ?? [];
				if (!already.includes(from)) { pointing.set(at, [...already, from]); }
			}
		}
		this.w_pointing_at.set(pointing);
		debug.log(`Links: ${this.links_from.size} guide(s) hold links${nowhere > 0 ? `, ${nowhere} of which could not be found by where they sit — asked too early` : ''}. ${answered} of ${answered + unanswered} link(s) name a guide the app lists, so ${pointing.size} guide(s) have something pointing at them.`);
	}

	/**
	 * One guide's own words have changed, so the links it holds are gathered again and everything
	 * worked out afresh. Only this one file is read — the rest are already gathered.
	 */
	links_changed(key: string, text: string): void {
		this.links_from.set(key, addresses_in(text));
		this.relate_the_links();
	}

	/** One guide now sits somewhere else, so its links are filed under where it now is. */
	moved(was: string, now: string): void {
		const links = this.links_from.get(was);
		if (links === undefined) { return; }
		this.links_from.delete(was);
		this.links_from.set(now, links);
		this.relate_the_links();
	}

	/** One guide is gone, so nothing it pointed at hears from it any more. */
	forget_links(key: string): void {
		if (!this.links_from.delete(key)) { return; }
		this.relate_the_links();
	}

	constructor() {
		// Any of the four moves, the list is worked out again — once, here, rather than
		// in each of the places that shows it.
		for (const w of [w_project, w_kind, w_tags, w_tag_picking, w_words, w_shut, w_show_folders, w_sorts]) {
			w.subscribe(() => this.renarrow());
		}
	}

	/** Work the list out again from what the filters say right now. */
	renarrow(): void {
		this.hierarchy.narrow(get(w_project), get(w_kind), get(w_tags), get(w_words), get(w_shut), get(w_show_folders), get(w_sorts), get(w_tag_picking));
		this.w_showing.set(this.hierarchy.filtered_files);
	}

	/**
	 * One guide's labels and tags have changed on disk. Put them on the record and work the
	 * list out again, so what's on screen agrees with the file without every file being read
	 * a second time.
	 */
	relabel(guide: File, labels: Labels, tag_names: string[]): void {
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
	async move(guide: File, folder: File): Promise<void> {
		const name = guide.path.split('/').pop() ?? guide.name;
		const to_path = moved_into(folder.path, name);
		const from = file_path_of(guide.bundle, guide.path);
		const to   = file_path_of(folder.bundle, to_path);
		const answer = await move_file(from, to);
		if (!answer.ok) {
			show_status(`"${guide.name}" was not moved — ${answer.why}`);
			debug.log(`Moving "${guide.name}" from ${from} to ${to} was refused — ${answer.why}. Nothing changed.`);
			return;
		}
		const was_key = key_of(guide);
		this.hierarchy.rehang(guide, folder, to_path, address_of_file(answer.full_path));
		this.renarrow();
		// A guide is named by where it sits, so anything reading this one has to follow it. The
		// links it holds are named by where it sits too, and every link written relative to it
		// now points somewhere else, so both are worked out again.
		this.moved(was_key, key_of(guide));
		this.moved_to?.(was_key, key_of(guide));
		debug.log(`Moved "${guide.name}" from ${from} to ${to}. It now hangs under "${folder.name}", and its words are read from ${answer.full_path}.`);
		// Where the repo begins on this machine, worked out from the one full path the server
		// gave back — everything else is named from the top of the repo.
		const root = answer.full_path.slice(0, answer.full_path.length - to.length);
		await this.mend_indexes(root, from, to, name);
		show_status(`"${guide.name}" moved into "${folder.name}".`);
	}

	/**
	 * Where the repo begins on this machine, read off any guide's own address. The addresses
	 * are settled when the app's code is prepared and name the file in full, so taking the
	 * guide's path in the repo off the end leaves the top of the repo.
	 */
	private get repo_root(): string {
		const file = this.files.find((g) => g.address !== '');
		if (!file) { return ''; }
		const full = path_of_address(file.address);
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

		const folders = this.hierarchy.files.filter((g) => g.is_folder);
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
			const text = await this.content_of(`${root}${index_at}`);
			if (text === null) {
				const fresh = fresh_index(folder.name, beside);
				const wrote = await save_file(index_at, fresh, '');
				if (!wrote.ok) { refused += 1; odd.push(`${index_at} could not be made — ${wrote.why}`); debug.log(`Repair: ${index_at} could not be made — ${wrote.why}.`); continue; }
				made += 1;
				debug.log(`Repair: made ${index_at}, naming ${beside.length} file(s).`);
				continue;
			}

			const put_right = repaired_index(text, beside, known);
			if (put_right.text === text) { untouched += 1; continue; }
			const wrote = await save_file(index_at, put_right.text, text);
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
	 * Give one guide's file a different name, and mend every link that named the old one.
	 *
	 * The links are gathered first, while the old name still answers, so nothing has to be
	 * guessed afterwards. Then the file moves; only if that works are the links written and
	 * the app's own picture changed — so a refused rename leaves everything as it was.
	 *
	 * Answers with where the guide now sits, since a guide is named by that and anything reading
	 * it has to follow. Nothing changed answers with nothing.
	 */
	async rename(guide: File, new_name: string): Promise<string> {
		const named = new_name.trim().replace(/\.md$/i, '');
		const was_name = guide.name;
		const was_key  = key_of(guide);       // where it sat, so anything reading it can follow
		if (named === '' || named === was_name) { return ''; }

		const folder = this.hierarchy.folder_holding(guide);
		if (!folder) { show_status(`"${was_name}" hangs under no folder, so it cannot be renamed`); return ''; }
		const from = file_path_of(guide.bundle, guide.path);
		const to_path = renamed_path(guide.path, named);
		const to = file_path_of(guide.bundle, to_path);

		// Every path at which another guide names this one, found while the old name still answers.
		const mends: Array<{ where: string; address: string; text: string; changed: string; how_many: number }> = [];
		for (const other of this.files) {
			const at = path_of_address(other.address);
			const text = await this.content_of(at);
			if (text === null) { continue; }
			let changed = text;
			let how_many = 0;
			// Mending works on addresses alone, and one address named twice is mended once.
			for (const link of new Set(links_in(text).map((one) => one.address))) {
				const found = this.hierarchy.explore(other, link);
				if (!found.file || found.file.id !== guide.id) { continue; }
				const whole_old = `](${link})`;
				if (!changed.includes(whole_old)) { continue; }
				const whole_new = `](${renamed_address(link, named)})`;
				how_many += changed.split(whole_old).length - 1;
				changed = changed.split(whole_old).join(whole_new);
			}
			if (how_many > 0) { mends.push({ where: file_path_of(other.bundle, other.path), address: at, text, changed, how_many }); }
		}

		const answer = await move_file(from, to);
		if (!answer.ok) {
			show_status(`"${was_name}" was not renamed — ${answer.why}`);
			debug.log(`Renaming "${was_name}" to "${named}" was refused — ${answer.why}. Nothing changed.`);
			return '';
		}

		this.hierarchy.rehang(guide, folder, to_path, address_of_file(answer.full_path));
		guide.name = named;
		this.renarrow();
		// Said at once, before the slow work of mending links: a guide is named by where it
		// sits, and anything reading this one is still asking for the old site. Waiting until
		// the end would leave it asking for a full second, which is long enough for the reading
		// view to give up and shut itself.
		this.moved_to?.(was_key, key_of(guide));
		debug.log(`Renaming: "${was_name}" sat at "${was_key}" and now sits at "${key_of(guide)}".`);

		let mended = 0, refused = 0;
		for (const mend of mends) {
			const wrote = await save_file(mend.where, mend.changed, mend.text);
			if (wrote.ok) { mended += 1; debug.log(`Renaming: ${mend.where} now names "${named}" in ${mend.how_many} link(s).`); }
			else { refused += 1; debug.log(`Renaming: ${mend.where} was NOT written — ${wrote.why}. It still names "${was_name}".`); }
		}
		// The index beside it names the old file. The whole line travels, with only the file it
		// points at changed, so any description written by hand stays.
		const root = answer.full_path.slice(0, answer.full_path.length - to.length);
		const index_at = `${to.split('/').slice(0, -1).join('/')}/index.md`;
		const index_text = await this.content_of(`${root}${index_at}`);
		if (index_text !== null) {
			const taken = without_line_for(index_text, `${was_name}.md`);
			if (taken.line === '') {
				debug.log(`Renaming: ${index_at} never named "${was_name}", so nothing was changed there.`);
			} else {
				const line = taken.line.replace(/\(([^)]+)\)/, (_whole, address: string) => `(${renamed_address(address, named)})`);
				const put_back = with_line_added(taken.text, line);
				const wrote = await save_file(index_at, put_back.text, index_text);
				if (wrote.ok) { debug.log(`Renaming: ${index_at} now names "${named}".`); }
				else { debug.log(`Renaming: ${index_at} was NOT written — ${wrote.why}. It still names "${was_name}".`); }
			}
		}
		show_status(`"${was_name}" is now "${named}" — ${mended} file(s) mended${refused > 0 ? `, ${refused} refused` : ''}.`);
		debug.log(`Renamed "${was_name}" to "${named}": the file moved from ${from} to ${to}, ${mended} file(s) had links mended${refused > 0 ? `, ${refused} refused` : ''}. Nothing is restarted — the moved file is read from where it now sits.`);
		return key_of(guide);
	}

	/**
	 * Throw one guide's file away, and take its line out of the index beside it. Only if the
	 * file itself goes is the app's own picture changed, so a refusal leaves everything as it
	 * was. Says whether it went.
	 *
	 * Links in other guides that named it are left alone: they now lead nowhere, and the dead
	 * link report is what finds those.
	 */
	async delete_one(guide: File): Promise<boolean> {
		const where = file_path_of(guide.bundle, guide.path);
		const answer = await delete_file(where);
		if (!answer.ok) {
			show_status(`"${guide.name}" was not thrown away — ${answer.why}`);
			debug.log(`Deleting "${guide.name}" was refused — ${answer.why}. Nothing changed.`);
			return false;
		}
		const root = this.repo_root;
		const index_at = `${where.split('/').slice(0, -1).join('/')}/index.md`;
		const index_text = root === '' ? null : await this.content_of(`${root}${index_at}`);
		if (index_text !== null) {
			const taken = without_line_for(index_text, `${guide.name}.md`);
			if (taken.line === '') {
				debug.log(`Deleting: ${index_at} never named "${guide.name}", so nothing was changed there.`);
			} else {
				const wrote = await save_file(index_at, taken.text, index_text);
				if (wrote.ok) { debug.log(`Deleting: ${index_at} no longer names "${guide.name}".`); }
				else { debug.log(`Deleting: ${index_at} was NOT written — ${wrote.why}. It still names "${guide.name}".`); }
			}
		}
		this.forget_links(key_of(guide));
		this.hierarchy.forget(guide);
		this.renarrow();
		show_status(`"${guide.name}" was thrown away.`);
		debug.log(`Deleted "${guide.name}": ${where} is gone, and it is out of the list.`);
		return true;
	}

	/**
	 * A new guide in the same folder as one already open. It arrives named "unnamed", labeled
	 * as something to refer to and marked as the one being worked on — so it never shows up
	 * unlabeled and nobody has to go back and label it.
	 *
	 * Everything is done here that a restart would otherwise be needed for: the file is written,
	 * hung under the same folder, given its tag, and named in the index beside it. Hands back
	 * the new guide so the view can open it, or nothing when the file was refused.
	 */
	async create_beside(guide: File): Promise<File | null> {
		const folder = this.hierarchy.folder_holding(guide);
		if (!folder) { show_status(`"${guide.name}" hangs under no folder, so nothing can be made beside it`); return null; }
		const folder_path = guide.path.split('/').slice(0, -1).join('/');
		const beside = this.files.filter((one) => one.bundle === guide.bundle
			&& one.path.split('/').slice(0, -1).join('/') === folder_path);
		const name = free_name(NAME_UNTIL_TOLD, beside.map((one) => one.name));

		// Labeled to match whatever the list is filtered by, so the new guide is one of the files
		// on screen and can be opened straight away. A kind nobody picked, or the one that means
		// "no kind at all", leaves it at refer; tags nobody picked leave it wearing the one that
		// says it is being worked on. Under any-but the picked tags are the ones to keep off it,
		// so only that one tag goes on.
		const wanted_kind = get(w_kind);
		const kind = wanted_kind === '' || wanted_kind === UNLABELED ? KIND_UNTIL_TOLD : wanted_kind as T_Kind;
		const picked = get(w_tag_picking) === T_Picking.but ? [] : get(w_tags);
		const tags = picked.length === 0 ? [TAG_WHEN_NEW] : picked;

		const path = renamed_path(guide.path, name);
		const where = file_path_of(guide.bundle, path);
		const text = blank_file(name, today(), kind, tags);
		// Nothing on disk is what the app expects to find, which is how the server is told to
		// make the file rather than change one.
		const wrote = await save_file(where, text, '');
		if (!wrote.ok) {
			show_status(`"${name}" was not made — ${wrote.why}`);
			debug.log(`Making "${name}" at ${where} was refused — ${wrote.why}. Nothing changed.`);
			return null;
		}

		const address = address_of_file(renamed_path(path_of_address(guide.address), name));
		const made = this.hierarchy.add_file(guide.bundle, path, name, address, {
			kind, title: name, description: '', date: today(), labeled: true,
		}, guide.is_design);
		this.hierarchy.add_relationship(folder.id, made.id);
		for (const tag of tags) { this.hierarchy.add_tagging(this.hierarchy.add_tag(tag).id, made.id); }
		// The folder link and the tags are only arrays until this is called; the walk that fills
		// the list reads the lookups, so without it the new guide is hung nowhere the list can see.
		this.hierarchy.reindex();
		this.renarrow();

		// The index beside it names every file in the folder, so it names this one too.
		const index_at = `${where.split('/').slice(0, -1).join('/')}/index.md`;
		const root = this.repo_root;
		const index_text = root === '' ? null : await this.content_of(`${root}${index_at}`);
		if (index_text !== null) {
			const added = with_line_added(index_text, line_for(`${name}.md`));
			const said = await save_file(index_at, added.text, index_text);
			if (said.ok) { debug.log(`Making: ${index_at} now names "${name}".`); }
			else { debug.log(`Making: ${index_at} was NOT written — ${said.why}. It does not name "${name}".`); }
		}

		show_status(`"${name}" was made.`);
		debug.log(`Made "${name}": ${where} exists, is labeled kind "${kind}" with tag(s) [${tags.join(', ')}] — taken from the filters — and sits at "${key_of(made)}" in the list.`);
		return made;
	}

	/**
	 * Look through every guide's own words for links that lead nowhere. Nothing is changed —
	 * this only says what it found, the first few on screen and all of them in the log. A link
	 * to the web is left alone, since nothing here can judge it.
	 */
	async find_dead_links(): Promise<void> {
		const files = this.files;
		const dead: Finding[] = [];
		let looked = 0, followed = 0, unreadable = 0, deeper = 0;

		for (const guide of files) {
			const where = file_path_of(guide.bundle, guide.path);
			show_status(`looking through ${where}`);
			const text = await this.content_of(path_of_address(guide.address));
			if (text === null) { unreadable += 1; debug.log(`Dead links: could not read ${where}.`); continue; }
			looked += 1;
			// Obsidian's own `[[name]]` is turned into the ordinary form first, exactly as the
			// drawing does it. Read raw, none of those was seen at all — and a link the check
			// cannot see is one it can never call dead.
			for (const { address: link, words: reads_as } of links_in(plain_links(text))) {
				// Only links to guides are judged. A link to a source file or to a folder is
				// perfectly good — the app simply never lists those, so it cannot follow them.
				const named = link.split('#')[0];
				if (named.endsWith('/')) { continue; }
				// A work note is one of the files now, so a link into one is judged like any other.
				// The one kind left out is a link pointing at a real file this app cannot find: the
				// files below the top of a work folder, which it lists none of. Judging those would
				// call every one of them dead when the fault is only that the app cannot reach them.
				//
				// Two things have to be true, and each was a bug of its own. Where the link points
				// is worked out from the file it sits in, since a link written inside a work folder
				// names no work folder itself. And a file has to be there — a link written from a
				// work note as though it sat among the guides, `collaborate/organize.md`, points at
				// a spot under that work folder where nothing is, and that is dead like any other.
				const points_at = resolved_from(where, named);
				if (reaches_under_work(points_at) && this.paths_on_disk.has(points_at)) { deeper += 1; continue; }
				const ending = named.split('/').pop()?.split('.').slice(1).pop() ?? '';
				if (ending !== '' && ending.toLowerCase() !== 'md') { continue; }
				followed += 1;
				const answer = this.hierarchy.explore(guide, link);
				if (answer.file) { continue; }
				if (answer.why === 'a heading inside this same guide') { continue; }
				// Nothing answers this link exactly, so the likeliest file of that name is named
				// beside it. Nothing is opened by that and nothing written — it is a suggestion for
				// a person to judge, which is why a guess is welcome here and refused on a press.
				const guess = this.hierarchy.likely_meant(guide, link);
				const says = guess.path !== null ? `did you mean "${guess.path}"?`
					: guess.of > 1 ? `${guess.of} files carry that name, none of them likelier than another`
					: `cannot find "${guess.name}"`;
				// Where the two say the same thing, only one of them is written.
				const both = answer.why === CANNOT_FIND ? says : `${answer.why} — ${says}`;
				// A space is written into a link as %20, which is three characters to read past on
				// every row. It is shown as the space it is.
				//
				// What a press looks for is the words the link reads as, never its address: the
				// address lives in what the link points at, and only the words are ever drawn on
				// the page — so a search through those words could never find an address.
				const reads = link.replace(/%20/g, ' ');
				dead.push({ words: `${where} → ${reads} (${both})`, key: key_of(guide), link, find: reads_as });
			}
		}

		const counted = `${looked} file(s) read, ${followed} link(s) followed, ${dead.length} leading nowhere${unreadable > 0 ? `, ${unreadable} file(s) unreadable` : ''}${deeper > 0 ? `, ${deeper} pointing at files this app cannot find` : ''}`;
		// Every one of them, each its own row in the report, so any can be opened where it sits.
		show_status(`dead links: ${counted}`, dead);
		debug.log(`Dead links: ${counted}.${dead.length > 0 ? ` They are: ${dead.map((d) => d.words).join(' | ')}` : ''}`);
	}

	/**
	 * Read one file's words, or nothing if it isn't there. The dispatcher hands them over rather
	 * than the dev server: the dev server will not accept a name holding a question mark, however
	 * that mark is written, and answers with the app's own page instead of the file.
	 */
	private async content_of(full_path: string): Promise<string | null> {
		const answer = await read_file(full_path);
		return answer.text;
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
		const from_text  = await this.content_of(`${root}${from_index}`);
		const to_text    = await this.content_of(`${root}${to_index}`);
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
			const wrote = await save_file(to_index, text, to_text);
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
			const wrote = await save_file(from_index, from_without, from_text);
			if (!wrote.ok) {
				show_status(`"${file_name}" moved, but ${from_index} still names it — ${wrote.why}`);
				debug.log(`Index files: ${from_index} was NOT written — ${wrote.why}. It still names "${file_name}".`);
				return;
			}
			debug.log(`Index files: ${from_index} no longer names "${file_name}".`);
		}
	}

	/** Every file, folders left out. */
	get files(): File[] {
		return this.hierarchy.files.filter((g) => !g.is_folder);
	}

	/**
	 * Read every guide once, keep its labels, let its text go. The dispatcher says what
	 * is on disk; that list is the whole truth, so nothing here is settled when the app's code
	 * is prepared, and a file added, moved or thrown away shows straight away.
	 *
	 * Each file is hung under a folder for its collection and one for each folder in its path,
	 * so the shape of the folders comes out of where the files sit rather than being written
	 * down anywhere.
	 */
	async load(): Promise<void> {
		let read = 0, failed = 0, unlabeled = 0, bytes = 0, skipped = 0;

		// The shared collection's folder is the repo itself, and every project's folder sits
		// directly inside it — so the shared one is the single top and the other four hang
		// under it. Going up one folder is then the same as stepping up this chain, which is
		// what a link between two collections needs in order to be followed.
		const shared_top = this.hierarchy.folder_at(T_Bundle.mono, '', T_Bundle.mono);

		const on_disk = await files_on_disk();
		if (on_disk.paths.length === 0) {
			this.w_no_server.set(true);
			debug.log('Guides: the dispatcher did not answer, so there are no guides to show — it is the only thing that knows what is on disk.');
			this.w_ready.set(true);
			return;
		}
		this.w_no_server.set(false);
		// Every markdown file the dispatcher found, whether or not the app lists it. The dead-link
		// check needs the ones it does not list — those below the top of a work folder — so it can
		// tell a link naming a real file it cannot open from a link naming nothing at all.
		this.paths_on_disk = new Set(on_disk.paths);

		for (const where of on_disk.paths) {
			const site = site_of_file(where);
			if (!site) { continue; }
			const name = where.split('/').pop()?.replace(/\.md$/, '') ?? '';

			// An index file only lists what sits beside it — the folders here do that job, so it
			// would say nothing the list doesn't already show. Left out entirely, not merely
			// hidden, so the counts never include one.
			if (name === 'index') { skipped += 1; continue; }

			const top = this.hierarchy.folder_at(site.bundle, '', site.bundle);
			if (site.bundle !== T_Bundle.mono) { this.hierarchy.add_relationship(shared_top.id, top.id); }
			const done = await this.hang_one_file(site.bundle, site.path, address_of_file(`${on_disk.root}${where}`), site.is_design, top);
			read      += done.read;
			failed    += done.failed;
			unlabeled += done.unlabeled;
			bytes     += done.bytes;
		}

		this.hierarchy.reindex();
		this.say_what_was_found(read, failed, unlabeled, bytes, skipped);
		this.renarrow();
		// Answering a link needs every guide findable by where it sits, and that map is filled by
		// the narrowing — so this comes after it, never before.
		this.relate_the_links();
		this.w_ready.set(true);
	}


	/**
	 * Read one file and hang it under the folders its path names, making each folder the first
	 * time it is met. The path begins with "designs" for a design and "work" for a work note, so
	 * the three purposes can never collide — and each of those two gets a folder of its own,
	 * standing beside the guides inside its project.
	 */
	private async hang_one_file(bundle: T_Bundle, path: string, address: string, is_design: boolean, top: File): Promise<{ read: number; failed: number; unlabeled: number; bytes: number }> {
		const under = is_design ? 'designs' : path.startsWith('work/') ? 'work' : '';
		const inside = under === '' ? path : path.slice(under.length + 1);
		const roof = under === '' ? top : this.hierarchy.folder_at(bundle, under, under);
		if (under !== '') { this.hierarchy.add_relationship(top.id, roof.id); }
		const parts = inside.split('/');
		const name = parts[parts.length - 1].replace(/\.md$/, '');
		let parent = roof;
		for (let i = 0; i < parts.length - 1; i++) {
			const so_far = under === '' ? parts.slice(0, i + 1).join('/') : `${under}/${parts.slice(0, i + 1).join('/')}`;
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
			debug.log(`Could not read the guide "${bundle}/${path}" from ${address}: ${e instanceof Error ? e.message : e}. It is left out.`);
			return { read: 0, failed: 1, unlabeled: 0, bytes: 0 };
		}
		// A file that has never been labeled is left exactly as it is. It shows in the list with
		// nothing in its kind column, and gets a block composed for it the first time someone
		// opens it to edit — nothing is written to a file nobody asked about.
		if (!has_labels(text)) {
			debug.log(`Guides: "${bundle}/${path}" carries no labels. It is left as it is and will be given some the first time it is opened for editing.`);
		}
		const { labels, tags } = labels_from(text, `${bundle}/${path}`);
		const guide = this.hierarchy.add_file(bundle, path, name, address, {
			...labels,
			title: labels.title || name,
		}, is_design);
		this.hierarchy.add_relationship(parent.id, guide.id);
		for (const tag of tags) {
			this.hierarchy.add_tagging(this.hierarchy.add_tag(tag).id, guide.id);
		}
		// The one moment this file's whole text is in hand. What it points at is taken out of it
		// here; where those links lead is worked out once every guide is hung on the structure.
		this.links_from.set(key_of(guide), addresses_in(text));
		return { read: 1, failed: 0, unlabeled: labels.labeled ? 0 : 1, bytes: text.length };
	}

	/**
	 * Which files are still within reach, with one filter set aside.
	 *
	 * A picking row grays out what would leave nothing — but it must not judge itself: with a
	 * kind picked, every other kind would look empty if its own choice were counted. So each
	 * row asks this question with its own filter left out, and the answer says which of its
	 * words would still find something.
	 */
	private within_reach(without: 'project' | 'kind' | 'tags'): File[] {
		const project  = get(w_project);
		const kind     = get(w_kind);
		const tags     = get(w_tags);
		const picking  = get(w_tag_picking);
		const words    = get(w_words);
		// The tags row is the one that cannot set its own filter fully aside. With every picked
		// tag required, a tag worth offering is one worn by a file that already wears them all —
		// so the picked tags stay in the question, and a tag that would empty the list grays out.
		const set_aside = without === 'tags' && picking !== T_Picking.all;
		return this.files.filter((guide) => {
			if (without !== 'project' && project !== '' && guide.bundle !== project) { return false; }
			if (without !== 'kind' && !kind_matches(kind, guide.kind, guide.labeled)) { return false; }
			if (!set_aside && !tags_match(picking, tags, this.hierarchy.tag_names_of(guide.id))) { return false; }
			if (!words_match(words, guide.name, guide.title, guide.description)) { return false; }
			return true;
		});
	}

	/** How many files one collection still has within reach of the other filters. */
	files_in(bundle: string): number {
		return this.within_reach('project').filter((g) => g.bundle === bundle).length;
	}

	/** Every kind still within reach of the other filters, in alphabetical order. */
	kinds_present(): string[] {
		const seen: string[] = [];
		for (const guide of this.within_reach('kind')) {
			if (guide.kind && !seen.includes(guide.kind)) { seen.push(guide.kind); }
		}
		return seen.sort(in_order);
	}

	/** How many files carrying no labels at all are within reach of the other filters. */
	unlabeled_within_reach(): number {
		return this.within_reach('kind').filter((guide) => !guide.labeled).length;
	}

	/** Every tag still within reach of the other filters, in alphabetical order. */
	tags_present(): string[] {
		const worn = new Set<string>();
		for (const guide of this.within_reach('tags')) {
			for (const tag of this.hierarchy.tag_names_of(guide.id)) { worn.add(tag); }
		}
		return ALL_TAGS.filter((tag) => worn.has(tag)).sort(in_order);
	}

	/** Say what the reading turned up, with the counts behind every claim. */
	private say_what_was_found(read: number, failed: number, unlabeled: number, bytes: number, skipped: number): void {
		const per_bundle = Object.values(T_Bundle)
			.map((bundle) => `${bundle} ${this.files.filter((g) => g.bundle === bundle).length}`)
			.join(', ');
		const folders = this.hierarchy.files.filter((g) => g.is_folder).length;
		const roots = this.hierarchy.indexes.roots_among(this.hierarchy.files.map((g) => g.id));
		const root_names = roots.map((id) => this.hierarchy.file_byID(id)?.name ?? id).join(', ');
		debug.log(`Shape: ${roots.length} top folder(s) — ${root_names}. One means the four project folders hang under the shared one, so going up from a guide can reach another project.`);
		debug.log(`Guides read: ${read} files (${per_bundle}), ${skipped} index files left out, ${failed} could not be read, hung under ${folders} folders. ${unlabeled} carry no labels at all. Kinds found: ${this.kinds_present().join(', ') || 'none'}. Tags found: ${this.tags_present().length} of the ${ALL_TAGS.length} on the closed list, across ${this.hierarchy.taggings.length} tag placements. ${bytes} characters of text passed through and none of it was kept.`);
	}

}

export const files = new Files();
