import type { Tag, Tagging, Relationship, Predicate } from '../types/DB_Records';
import type { File, Labels, Filtered_File } from '../types/File';
import type { Sort } from './Filters';
import { kind_matches, tags_match, words_match, project_matches } from './Filters';
import { Indexes } from '../database/Indexes';
import { project_of, T_Bundle, in_order, key_of } from '../types/File';
import { likeliest, link_agrees, parts_of_link, resolved_from } from '../utilities/Following_Links';
import { file_path_of, reaches_under_work } from '../utilities/Saving';

/**
 * What a link says when it points at a real file below the top of a work folder — the one kind
 * this app never lists. Said in one place, since the report has its own words for the same thing
 * and printing both reads as saying it twice.
 */
export const CANNOT_FIND = 'a file this app cannot find';
import { debug } from '../common/Debug';

/**
 * Hierarchy — the folders, the files, and the tags on them.
 *
 * Ported from ji, with the store left behind. ji's version asks a database to load
 * records, save them, and hold each file's bytes; overview holds no bytes at all
 * and saves nothing — the whole structure is made fresh each launch from what the
 * guide files say about themselves. What came across is the shape: nodes, ordered
 * parent-to-child links, tags as their own records, and the walk that turns the
 * graph into a list with a depth on every row.
 */

// The one meaning a link can have here: a folder holding what's inside it.
const CONTAINS = 'contains';

export class Hierarchy {
	// What the filters and the folds leave, in the order shown, folders included. Each row
	// carries its guide together with the tags on it, how deep it sits, and the folder
	// chain above it — so the tag lookup is done once, as the row is built, and never
	// again by whoever shows it.
	filtered_files: Filtered_File[] = [];

	// How many matching files sit under each folder, by where that folder sits. Counted
	// over everything, so a shut folder still shows its full tally.
	folder_counts: Map<string, number> = new Map();
	folder_sizes: Map<string, number> = new Map();

	// Every guide, filters or no filters, by where it sits. A guide reached by following
	// a link may be one the filters hide, and the reading view has to show it all the same.
	all_files: Map<string, Filtered_File> = new Map();

	// How many files the filters leave, counted before the folds have their say — so a shut
	// folder hides files from the list without changing what the count says.
	matched_count: number = 0;

	relationships:   Relationship[] = [];
	predicates:      Predicate[]    = [];
	taggings:        Tagging[]      = [];
	files:           File[]         = [];
	tags:            Tag[]          = [];

	indexes = new Indexes();

	// One instant lookup per kind of question: a node by its id, and a folder by the
	// path it sits at, so building the structure never scans the whole list.
	private folders_byPath = new Map<string, File>();
	private files_byID    = new Map<string, File>();

	// --- making nodes ---------------------------------------------------------

	private next_id = 0;

	private fresh_id(): string {
		this.next_id += 1;
		return `n${this.next_id}`;
	}

	private register(guide: File): File {
		this.files.push(guide);
		this.files_byID.set(guide.id, guide);
		return guide;
	}

	/** A folder: a do-nothing node whose contents are linked under it. */
	add_folder(bundle: T_Bundle, path: string, name: string): File {
		return this.register({
			id: this.fresh_id(), name, bundle, path, address: '', is_folder: true, is_design: false, size: 0,
			kind: '', title: name, description: '', use_when: [], date: '', labeled: false,
		});
	}

	/** A file, carrying whatever labels were read off its top. */
	add_file(bundle: T_Bundle, path: string, name: string, address: string, labels: Labels, is_design = false, size = 0): File {
		return this.register({
			id: this.fresh_id(), name, bundle, path, address, is_folder: false, is_design, size, ...labels,
		});
	}

	/** The folder at this path inside a collection, made the first time it is asked for. */
	folder_at(bundle: T_Bundle, path: string, name: string): File {
		const where = `${bundle}/${path}`;
		const found = this.folders_byPath.get(where);
		if (found) { return found; }
		const folder = this.add_folder(bundle, path, name);
		this.folders_byPath.set(where, folder);
		return folder;
	}

	// --- links and tags -------------------------------------------------------

	add_predicate(type: string): Predicate {
		const predicate: Predicate = { id: this.fresh_id(), type };
		this.predicates.push(predicate);
		return predicate;
	}

	/** The one link-meaning with this type, made only the first time it is asked for. */
	predicate_for(type: string): Predicate {
		return this.predicates.find((p) => p.type === type) ?? this.add_predicate(type);
	}

	/**
	 * Link a parent to a child, at the end of the child order. Find-or-create: the same
	 * parent to the same child is one link, never two.
	 */
	add_relationship(parent_id: string, child_id: string): Relationship {
		const predicate_id = this.predicate_for(CONTAINS).id;
		const found = this.relationships.find((r) => r.predicate_id === predicate_id && r.parent_id === parent_id && r.child_id === child_id);
		if (found) { return found; }
		const relationship: Relationship = {
			id: this.fresh_id(), predicate_id, parent_id, child_id,
			sort_order: this.relationships.filter((r) => r.parent_id === parent_id).length,
		};
		this.relationships.push(relationship);
		return relationship;
	}

	/** Find-or-create by name: two tags of one name are one tag, never two. */
	add_tag(name: string): Tag {
		const found = this.tags.find((t) => t.name === name);
		if (found) { return found; }
		const tag: Tag = { id: this.fresh_id(), name };
		this.tags.push(tag);
		return tag;
	}

	/** Place a tag on a guide. Find-or-create: the same pair is one link, never two. */
	add_tagging(tag_id: string, file_id: string): Tagging {
		const found = this.taggings.find((t) => t.tag_id === tag_id && t.file_id === file_id);
		if (found) { return found; }
		const tagging: Tagging = { id: this.fresh_id(), tag_id, file_id };
		this.taggings.push(tagging);
		return tagging;
	}

	/**
	 * Put new labels and tags on one guide, in place. Called after its file is written, so
	 * the list shows the new title and tags without every file being read again.
	 */
	relabel(guide: File, labels: Labels, tag_names: string[]): void {
		guide.kind        = labels.kind;
		guide.title       = labels.title || guide.name;
		guide.description = labels.description;
		guide.use_when    = labels.use_when ?? [];
		guide.date        = labels.date;
		guide.labeled     = true;
		this.taggings = this.taggings.filter((t) => t.file_id !== guide.id);
		for (const name of tag_names) { this.add_tagging(this.add_tag(name).id, guide.id); }
		this.reindex();
	}

	/**
	 * One guide's file has moved on disk. Hang it under its new folder, and tell it where it
	 * now sits and where its words can be read from. The link to its old folder goes, so it
	 * is never under two.
	 */
	rehang(guide: File, folder: File, path: string, address: string): void {
		const contains = this.predicate_for(CONTAINS).id;
		this.relationships = this.relationships.filter((r) => !(r.predicate_id === contains && r.child_id === guide.id));
		guide.bundle  = folder.bundle;
		guide.path    = path;
		guide.address = address;
		this.add_relationship(folder.id, guide.id);
		this.reindex();
	}

	/**
	 * One guide's file is gone from disk, so it goes from the picture too: the guide itself, the
	 * link to the folder holding it, and every tag it wore. Nothing else is touched — a folder
	 * left holding nothing simply shows as empty.
	 */
	forget(guide: File): void {
		this.files = this.files.filter((one) => one.id !== guide.id);
		this.files_byID.delete(guide.id);
		this.relationships = this.relationships.filter((r) => r.child_id !== guide.id && r.parent_id !== guide.id);
		this.taggings = this.taggings.filter((t) => t.file_id !== guide.id);
		this.reindex();
	}

	/** Rebuild the lookups from the current tag links and folder links. */
	reindex(): void {
		this.indexes.rebuild(this.taggings, this.relationships);
	}

	// --- the reads ------------------------------------------------------------

	file_byID(id: string): File | null { return this.files_byID.get(id) ?? null; }

	/** The name of every tag on one guide. */
	tag_names_of(file_id: string): string[] {
		const by_id = new Map(this.tags.map((t) => [t.id, t.name]));
		return this.indexes.tags_of(file_id).map((id) => by_id.get(id) ?? '').filter((n) => n !== '');
	}

	/**
	 * Walk from each root down, gathering every node with its depth and the folder
	 * chain above it. The one thing the walk must never do is follow a node back into
	 * itself, so the guard is "already on the chain I'm walking now" — a real loop.
	 */
	list_files(): Filtered_File[] {
		const by_id = new Map(this.tags.map((t) => [t.id, t.name]));
		const listed: Filtered_File[] = [];

		// Every collection stands at the top of the list in its own right. On disk each project
		// sits inside the shared one, and that chain is kept so a link written in one project
		// can be answered in another — but on screen shutting the shared folder must not take
		// the projects with it, so the walk starts at all five and the shared one does not
		// lead them.
		const tops = this.files.filter((g) => g.is_folder && g.path === '');
		const top_ids = new Set(tops.map((g) => g.id));
		const roots = tops.length > 0
			? tops.map((g) => g.id)
			: this.indexes.roots_among(this.files.map((g) => g.id));

		const walk = (id: string, depth: number, ancestors: string[]): void => {
			if (ancestors.includes(id)) {
				const guide = this.file_byID(id);
				debug.log(`Walk: "${guide?.name ?? id}" already sits above itself on this branch (depth ${depth}) — a loop, so not following it deeper.`);
				return;
			}
			const guide = this.file_byID(id);
			const children = this.indexes.children_of(id);
			if (guide) {
				listed.push({
					file: guide,
					key: key_of(guide),
					tag_names: this.indexes.tags_of(id).map((t) => by_id.get(t) ?? '').filter((n) => n !== '').sort(in_order),
					depth,
					ancestor_keys: ancestors.map((a) => { const up = this.file_byID(a); return up ? key_of(up) : ''; }),
					has_children: children.length > 0,
				});
			}
			// A collection never leads another, even though it holds it on disk.
			for (const edge of children) {
				if (top_ids.has(edge.child_id)) { continue; }
				walk(edge.child_id, depth + 1, [...ancestors, id]);
			}
		};
		for (const root of roots) { walk(root, 0, []); }

		return listed;
	}

	// --- following a link out of a guide --------------------------------------

	/** The folders above one guide, nearest first, up to the top. */
	/** The folder one guide hangs under, or nothing for a root. */
	folder_holding(guide: File): File | null {
		const up = this.indexes.relationships_by_child.get(guide.id);
		if (!up || up.length === 0) { return null; }
		return this.file_byID(up[0].parent_id);
	}

	private ancestry_of(id: string): string[] {
		const chain: string[] = [];
		let at = id;
		for (let steps = 0; steps < 50; steps++) {
			const up = this.indexes.relationships_by_child.get(at);
			if (!up || up.length === 0) { break; }
			at = up[0].parent_id;
			if (chain.includes(at)) { break; }        // a loop; stop rather than circle
			chain.push(at);
		}
		return chain;
	}

	/**
	 * Every file named this, anywhere under one folder, nearest first. Folders are not answers.
	 *
	 * All of them rather than the first, since two files can share a name under one folder and
	 * only one of them stands where the link says. Handing back the first would give a link
	 * pointing at the far one the near one, and refuse.
	 */
	private files_named_under(folder_id: string, name: string): File[] {
		const answers: File[] = [];
		const waiting = [folder_id];
		const seen = new Set<string>([folder_id]);
		while (waiting.length > 0) {
			const at = waiting.shift()!;
			for (const edge of this.indexes.children_of(at)) {
				const child = this.file_byID(edge.child_id);
				if (!child) { continue; }
				if (!child.is_folder && child.name === name) { answers.push(child); }
				if (child.is_folder && !seen.has(child.id)) { seen.add(child.id); waiting.push(child.id); }
			}
		}
		return answers;
	}

	/**
	 * Follow a link written inside one guide. Ascending the ancestry is the same as
	 * going up a folder, so the nearest folder that holds a guide of that name wins —
	 * first match, no further looking.
	 *
	 * A refusal comes back twice over: `why` names the kind of refusal in a few words, and
	 * `says` is the whole account — the same sentence the log gets, naming the link, the file
	 * of that name that does exist and where it sits. A press shows `says`, since a person
	 * looking at a link that will not open wants the reason, not the category.
	 */
	explore(from: File, link: string): { file: File | null; heading: string; why: string; says: string } {
		const [before, ...rest] = link.split('#');
		const heading = rest.join('#');
		// Step zero: a guide is named without its ending everywhere else in the app, so the
		// ending comes off here and everything after this works on plain names.
		const wanted_path = decodeURIComponent(before.trim()).replace(/\.md$/i, '');
		const parts = parts_of_link(wanted_path);
		const name = parts[parts.length - 1] ?? '';

		if (wanted_path === '') {
			return { file: null, heading, why: 'a heading inside this same guide', says: '' };
		}
		if (name.toLowerCase() === 'index') {
			const says = `Link from "${from.name}" names an index file ("${wanted_path}") — those are left out of the picture, so nothing opens.`;
			debug.log(says);
			return { file: null, heading, why: 'an index file, which is left out of the picture', says };
		}

		// A link naming folders has to land under exactly those folders. Without this, a link out
		// to a work note — which the app never lists — ends on whichever guide happens to share its
		// last word, and pressing it opens the very file it was written in.
		//
		// Asked of the file's whole path, counting from the top of the repo. A file's path inside
		// its own collection has the project and the notes and files folders stripped off it, so a
		// link written the long way round — `../../../di/notes/guides/…` — could never agree with
		// anything, and every one of them read as dead.
		//
		// A file of that name whose path disagrees is passed over, never taken as the answer. Two
		// files can share a name — a work note and the guide drawn out of it, say — and the nearer
		// one is often the file being read. Stopping at it would refuse a link to the other and
		// name the file itself as the reason. The first one passed over is held for the message,
		// which is worth more than "not found" when a file of that name plainly exists.
		const chain = this.ancestry_of(from.id);
		let elsewhere: string | null = null;
		for (let step = 0; step < chain.length; step++) {
			for (const found of this.files_named_under(chain[step], name)) {
				const whole = file_path_of(found.bundle, found.path);
				if (!link_agrees(parts, whole)) {
					if (elsewhere === null) { elsewhere = whole; }
					continue;
				}
				debug.log(`Link from "${from.name}" to "${wanted_path}": found "${found.name}" in ${found.bundle} after climbing ${step + 1} folder(s) of the ${chain.length} above it.`);
				return { file: found, heading, why: '', says: '' };
			}
		}
		if (elsewhere !== null) {
			const says = `Link from "${from.name}" to "${wanted_path}": nothing named "${name}" stands where the link says. The nearest of that name sits at ${elsewhere} — nothing opens.`;
			debug.log(says);
			return { file: null, heading, why: 'a file outside the guides', says };
		}
		// Nothing of that name stands under any folder above this file. A link that says outright
		// it is on the web never reaches here — a press opens one of those in a new tab — so every
		// link that gets this far names a file, and the honest answer is that it was not found.
		const points_at = resolved_from(file_path_of(from.bundle, from.path), before);
		const says = `Link from "${from.name}" to "${wanted_path}": no file named "${name}" under any of the ${chain.length} folders above it. It points at ${points_at}${reaches_under_work(points_at) ? ', which sits below the top of a work folder — this app lists none of those' : ''}. Nothing opens.`;
		debug.log(says);
		return { file: null, heading, why: CANNOT_FIND, says };
	}

	/**
	 * Which file a dead link most likely meant — for a report to name, never for a press to open.
	 * Nothing is opened and nothing is written by this, so a good guess is what is wanted; the
	 * exact rule above still answers every press, and refuses.
	 *
	 * Every file of that name is looked at, wherever it sits. Most shared words first; where two
	 * share as many, the closer one wins, counted in folder steps from the file the link is written
	 * in. Where two are equal on both, nothing comes back and the report says how many there were.
	 */
	likely_meant(from: File, link: string): { path: string | null; of: number; name: string } {
		const wanted = decodeURIComponent(link.split('#')[0].trim()).replace(/\.md$/i, '');
		const parts = parts_of_link(wanted);
		const name = parts[parts.length - 1] ?? '';
		if (name === '') { return { path: null, of: 0, name }; }
		const paths: string[] = [];
		for (const row of this.all_files.values()) {
			if (row.file.is_folder || row.file.name !== name) { continue; }
			paths.push(file_path_of(row.file.bundle, row.file.path));
		}
		const here = file_path_of(from.bundle, from.path);
		const path = likeliest(parts, here, paths);
		debug.log(`Link from "${from.name}" to "${wanted}": ${paths.length} file(s) named "${name}" — ${path === null ? (paths.length === 0 ? 'none to offer' : 'two of them equally likely, so none is offered') : `the likeliest is ${path}`}.`);
		return { path, of: paths.length, name };
	}

	// --- narrowing ------------------------------------------------------------

	/**
	 * Does one row survive the three filters? Folders never match on their own — they
	 * come back only by holding something that did.
	 */
	private matches(row: Filtered_File, projects: string[], kind: string, tags: string[], words: string, picking: string): boolean {
		if (row.file.is_folder) { return false; }
		if (!project_matches(projects, project_of(row.file))) { return false; }
		if (!kind_matches(kind, row.file.kind, row.file.labeled)) { return false; }
		if (!tags_match(picking, tags, row.tag_names)) { return false; }
		if (!words_match(words, row.file.name, row.file.title, row.file.description)) { return false; }
		return true;
	}

	/**
	 * Work out what shows, and keep it. The whole walk is looked through, so a match
	 * inside a shut folder is still found and every folder on the way to it is kept —
	 * shutting a folder hides what is inside it, never the folder itself. What survives
	 * both the filters and the folds is kept in `filtered_files`, in the order shown,
	 * folders included, and the tally of matching files under each folder beside it.
	 */
	/**
	 * What one row reads as, for the column being sorted by. An empty value sorts last
	 * whichever way the sort runs, so blanks never scatter through the list.
	 */
	private sort_key(row: Filtered_File, by: string): string {
		// A file with no labels reads "---" in its kind column, and sorts where those three
		// dashes would — ahead of every word — rather than being treated as a blank and pushed
		// to the bottom. It is a real state, not a missing one.
		if (by === 'kind')    { return row.file.kind || '!'; }
		if (by === 'project') { return project_of(row.file); }
		if (by === 'name')    { return row.file.name; }
		// Numbers compared as words put 9 after 80; padded to a fixed width they order right.
		if (by === 'size')    { return String(row.file.size).padStart(12, '0'); }
		return row.tag_names.join(', ');
	}

	narrow(projects: string[], kind: string, tags: string[], words: string, shut: string[], show_folders: boolean = true, sorts: Sort[] = [], picking: string = ''): void {
		const all = this.list_files();
		this.all_files = new Map(all.map((r) => [r.key, r]));
		// Logs are mined, never read — they neither show nor count in browse.
		const readable = all.filter((r) => r.file.is_folder || (r.file.name !== 'log' && r.file.name !== 'log.md'));
		const closed = new Set(shut);
		// A shut folder only hides things while the folders are on screen. With them off the
		// list is a flat run of every file, so which folders were left shut is set aside —
		// remembered, not applied — and comes back the moment the folders do.
		const open_rows = show_folders
			? readable.filter((r) => !r.ancestor_keys.some((a) => closed.has(a)))
			: readable;

		const matched = readable.filter((r) => this.matches(r, projects, kind, tags, words, picking));
		this.matched_count = matched.length;
		const keep = new Set(matched.map((r) => r.key));
		for (const r of matched) { for (const a of r.ancestor_keys) { keep.add(a); } }

		// With the folders turned off the list is a flat run of files, every one at the far
		// left — there is nothing left to indent under. The folders still decide what a shut
		// fold hides; they just aren't drawn, and nothing steps in from the edge.
		this.filtered_files = open_rows
			.filter((r) => keep.has(r.key))
			.filter((r) => show_folders || !r.file.is_folder)
			.map((r) => show_folders ? r : { ...r, depth: 0 });


		// How many matching files sit under each folder — counted over the whole walk, so
		// a shut folder still shows its full tally. Only files count; the folders between
		// are the structure holding them.
		this.folder_counts = new Map<string, number>();
		this.folder_sizes = new Map<string, number>();
		for (const r of matched) {
			for (const a of r.ancestor_keys) {
				this.folder_counts.set(a, (this.folder_counts.get(a) ?? 0) + 1);
				this.folder_sizes.set(a, (this.folder_sizes.get(a) ?? 0) + r.file.size);
			}
		}

		// Sorting only makes sense on a flat run of files, so it applies only while the
		// folders are hidden. The columns apply in the order they were picked: the first
		// decides, and each one after it only breaks a tie in the ones before it. A blank
		// goes to the bottom of its column whichever way that column runs.
		if (!show_folders && sorts.length > 0) {
			this.filtered_files = [...this.filtered_files].sort((a, b) => {
				for (const sort of sorts) {
					const one = this.sort_key(a, sort.by);
					const two = this.sort_key(b, sort.by);
					if (one === two) { continue; }                 // a tie — on to the next column
					if (one === '') { return 1; }                  // blanks last, both ways
					if (two === '') { return -1; }
					return sort.up ? in_order(one, two) : in_order(two, one);
				}
				return 0;
			});
			const said = sorts.map((s) => `${s.by} ${s.up ? 'smallest' : 'largest'} first`).join(', then ');
			const blanks = sorts.map((s) => `${this.filtered_files.filter((r) => this.sort_key(r, s.by) === '').length} with no ${s.by}`).join(', ');
			debug.log(`Sorted by ${said} — ${this.filtered_files.length} rows (${blanks}; blanks go to the bottom).`);
		}

		const folders_shown = this.filtered_files.filter((r) => r.file.is_folder).length;
		debug.log(`Narrowed: project(s) "${projects.join(', ') || 'all'}", kind "${kind || 'all'}", ${picking || 'any of'} the tags [${tags.join(', ') || 'any'}], words "${words || 'none'}", ${shut.length} folder(s) shut (${show_folders ? 'hiding what they hold' : 'set aside, since the folders are off screen'}), folders ${show_folders ? 'shown' : 'hidden'} — ${matched.length} of ${all.length} rows match; showing ${this.filtered_files.length}, of which ${folders_shown} are folders. ${this.folder_counts.size} folder(s) hold at least one match.`);
	}

	/** The files wearing one tag. */
	filter_by_tag(tag_id: string): File[] {
		const wanted = new Set(this.indexes.files_withTag(tag_id));
		return this.files.filter((g) => wanted.has(g.id));
	}

	/** The files that carry no tag at all. */
	untagged(): File[] {
		const ids = new Set(this.indexes.untagged_among(this.files.filter((g) => !g.is_folder).map((g) => g.id)));
		return this.files.filter((g) => ids.has(g.id));
	}
}
