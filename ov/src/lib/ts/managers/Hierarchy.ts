import type { Tag, Tagging, Relationship, Predicate } from '../types/DB_Records';
import type { Guide, Labels, Filtered_Guide } from '../types/File';
import type { Sort } from './Filters';
import { kind_matches } from './Filters';
import { Indexes } from '../database/Indexes';
import { T_Bundle, in_order, key_of } from '../types/File';
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
	filtered_guides: Filtered_Guide[] = [];

	// How many matching files sit under each folder, by where that folder sits. Counted
	// over everything, so a shut folder still shows its full tally.
	folder_counts: Map<string, number> = new Map();

	// Every guide, filters or no filters, by where it sits. A guide reached by following
	// a link may be one the filters hide, and the reading view has to show it all the same.
	all_guides: Map<string, Filtered_Guide> = new Map();

	// How many files the filters leave, counted before the folds have their say — so a shut
	// folder hides files from the list without changing what the count says.
	matched_count: number = 0;

	relationships:   Relationship[] = [];
	predicates:      Predicate[]    = [];
	taggings:        Tagging[]      = [];
	guides:          Guide[]        = [];
	tags:            Tag[]          = [];

	indexes = new Indexes();

	// One instant lookup per kind of question: a node by its id, and a folder by the
	// place it sits, so building the structure never scans the whole list.
	private folders_byPath = new Map<string, Guide>();
	private files_byID    = new Map<string, Guide>();

	// --- making nodes ---------------------------------------------------------

	private next_id = 0;

	private fresh_id(): string {
		this.next_id += 1;
		return `n${this.next_id}`;
	}

	private register(guide: Guide): Guide {
		this.guides.push(guide);
		this.files_byID.set(guide.id, guide);
		return guide;
	}

	/** A folder: a do-nothing node whose contents are linked under it. */
	add_folder(bundle: T_Bundle, path: string, name: string): Guide {
		return this.register({
			id: this.fresh_id(), name, bundle, path, address: '', is_folder: true, is_design: false,
			kind: '', title: name, description: '', date: '', labeled: false,
		});
	}

	/** A file, carrying whatever labels were read off its top. */
	add_guide(bundle: T_Bundle, path: string, name: string, address: string, labels: Labels, is_design = false): Guide {
		return this.register({
			id: this.fresh_id(), name, bundle, path, address, is_folder: false, is_design, ...labels,
		});
	}

	/** The folder at this place inside a collection, made the first time it is asked for. */
	folder_at(bundle: T_Bundle, path: string, name: string): Guide {
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
	add_tagging(tag_id: string, guide_id: string): Tagging {
		const found = this.taggings.find((t) => t.tag_id === tag_id && t.guide_id === guide_id);
		if (found) { return found; }
		const tagging: Tagging = { id: this.fresh_id(), tag_id, guide_id };
		this.taggings.push(tagging);
		return tagging;
	}

	/**
	 * Put new labels and tags on one guide, in place. Called after its file is written, so
	 * the list shows the new title and tags without every file being read again.
	 */
	relabel(guide: Guide, labels: Labels, tag_names: string[]): void {
		guide.kind        = labels.kind;
		guide.title       = labels.title || guide.name;
		guide.description = labels.description;
		guide.date        = labels.date;
		guide.labeled     = true;
		this.taggings = this.taggings.filter((t) => t.guide_id !== guide.id);
		for (const name of tag_names) { this.add_tagging(this.add_tag(name).id, guide.id); }
		this.reindex();
	}

	/**
	 * One guide's file has moved on disk. Hang it under its new folder, and tell it where it
	 * now sits and where its words can be read from. The link to its old folder goes, so it
	 * is never under two.
	 */
	rehang(guide: Guide, folder: Guide, path: string, address: string): void {
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
	forget(guide: Guide): void {
		this.guides = this.guides.filter((one) => one.id !== guide.id);
		this.files_byID.delete(guide.id);
		this.relationships = this.relationships.filter((r) => r.child_id !== guide.id && r.parent_id !== guide.id);
		this.taggings = this.taggings.filter((t) => t.guide_id !== guide.id);
		this.reindex();
	}

	/** Rebuild the lookups from the current tag links and folder links. */
	reindex(): void {
		this.indexes.rebuild(this.taggings, this.relationships);
	}

	// --- the reads ------------------------------------------------------------

	guide_byID(id: string): Guide | null { return this.files_byID.get(id) ?? null; }

	/** The name of every tag on one guide. */
	tag_names_of(guide_id: string): string[] {
		const by_id = new Map(this.tags.map((t) => [t.id, t.name]));
		return this.indexes.tags_of(guide_id).map((id) => by_id.get(id) ?? '').filter((n) => n !== '');
	}

	/**
	 * Walk from each root down, gathering every node with its depth and the folder
	 * chain above it. The one thing the walk must never do is follow a node back into
	 * itself, so the guard is "already on the chain I'm walking now" — a real loop.
	 */
	list_guides(): Filtered_Guide[] {
		const by_id = new Map(this.tags.map((t) => [t.id, t.name]));
		const listed: Filtered_Guide[] = [];

		// Every collection stands at the top of the list in its own right. On disk each project
		// sits inside the shared one, and that chain is kept so a link written in one project
		// can be answered in another — but on screen shutting the shared folder must not take
		// the projects with it, so the walk starts at all five and the shared one does not
		// lead them.
		const tops = this.guides.filter((g) => g.is_folder && g.path === '');
		const top_ids = new Set(tops.map((g) => g.id));
		const roots = tops.length > 0
			? tops.map((g) => g.id)
			: this.indexes.roots_among(this.guides.map((g) => g.id));

		const walk = (id: string, depth: number, ancestors: string[]): void => {
			if (ancestors.includes(id)) {
				const guide = this.guide_byID(id);
				debug.log(`Walk: "${guide?.name ?? id}" already sits above itself on this branch (depth ${depth}) — a loop, so not following it deeper.`);
				return;
			}
			const guide = this.guide_byID(id);
			const children = this.indexes.children_of(id);
			if (guide) {
				listed.push({
					guide,
					key: key_of(guide),
					tag_names: this.indexes.tags_of(id).map((t) => by_id.get(t) ?? '').filter((n) => n !== '').sort(in_order),
					depth,
					ancestor_keys: ancestors.map((a) => { const up = this.guide_byID(a); return up ? key_of(up) : ''; }),
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
	folder_holding(guide: Guide): Guide | null {
		const up = this.indexes.relationships_by_child.get(guide.id);
		if (!up || up.length === 0) { return null; }
		return this.guide_byID(up[0].parent_id);
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

	/** The first file named this, anywhere under one folder. Folders are not answers. */
	private file_named_under(folder_id: string, name: string): Guide | null {
		const waiting = [folder_id];
		const seen = new Set<string>([folder_id]);
		while (waiting.length > 0) {
			const at = waiting.shift()!;
			for (const edge of this.indexes.children_of(at)) {
				const child = this.guide_byID(edge.child_id);
				if (!child) { continue; }
				if (!child.is_folder && child.name === name) { return child; }
				if (child.is_folder && !seen.has(child.id)) { seen.add(child.id); waiting.push(child.id); }
			}
		}
		return null;
	}

	/**
	 * Follow a link written inside one guide. Ascending the ancestry is the same as
	 * going up a folder, so the nearest folder that holds a guide of that name wins —
	 * first match, no further looking.
	 */
	explore(from: Guide, link: string): { guide: Guide | null; heading: string; why: string } {
		const [before, ...rest] = link.split('#');
		const heading = rest.join('#');
		// Step zero: a guide is named without its ending everywhere else in the app, so the
		// ending comes off here and everything after this works on plain names.
		const wanted_path = decodeURIComponent(before.trim()).replace(/\.md$/i, '');
		const parts = wanted_path.split('/').filter((p) => p !== '' && p !== '.');
		const name = parts[parts.length - 1] ?? '';

		if (wanted_path === '') {
			return { guide: null, heading, why: 'a heading inside this same guide' };
		}
		if (name.toLowerCase() === 'index') {
			debug.log(`Link from "${from.name}" names an index file ("${wanted_path}") — those are left out of the picture, so nothing opens.`);
			return { guide: null, heading, why: 'an index file, which is left out of the picture' };
		}

		const chain = this.ancestry_of(from.id);
		for (let step = 0; step < chain.length; step++) {
			const found = this.file_named_under(chain[step], name);
			if (found) {
				debug.log(`Link from "${from.name}" to "${wanted_path}": found "${found.name}" in ${found.bundle} after climbing ${step + 1} folder(s) of the ${chain.length} above it.`);
				return { guide: found, heading, why: '' };
			}
		}
		debug.log(`Link from "${from.name}" to "${wanted_path}": no guide named "${name}" under any of the ${chain.length} folders above it — nothing opens.`);
		return { guide: null, heading, why: 'external link' };
	}

	// --- narrowing ------------------------------------------------------------

	/**
	 * Does one row survive the three filters? Folders never match on their own — they
	 * come back only by holding something that did.
	 */
	private matches(row: Filtered_Guide, project: string, kind: string, tags: string[], words: string): boolean {
		if (row.guide.is_folder) { return false; }
		if (project !== '' && row.guide.bundle !== project) { return false; }
		if (!kind_matches(kind, row.guide.kind, row.guide.labeled)) { return false; }
		if (tags.length > 0 && !tags.some((tag) => row.tag_names.includes(tag))) { return false; }
		const looking_for = words.trim().toLowerCase();
		if (looking_for !== '' && !`${row.guide.title} ${row.guide.description}`.toLowerCase().includes(looking_for)) { return false; }
		return true;
	}

	/**
	 * Work out what shows, and keep it. The whole walk is looked through, so a match
	 * inside a shut folder is still found and every folder on the way to it is kept —
	 * shutting a folder hides what is inside it, never the folder itself. What survives
	 * both the filters and the folds is kept in `filtered_guides`, in the order shown,
	 * folders included, and the tally of matching files under each folder beside it.
	 */
	/**
	 * What one row reads as, for the column being sorted by. An empty value sorts last
	 * whichever way the sort runs, so blanks never scatter through the list.
	 */
	private sort_key(row: Filtered_Guide, by: string): string {
		// A file with no labels reads "---" in its kind column, and sorts where those three
		// dashes would — ahead of every word — rather than being treated as a blank and pushed
		// to the bottom. It is a real state, not a missing one.
		if (by === 'kind')    { return row.guide.kind || '!'; }
		if (by === 'project') { return row.guide.bundle; }
		if (by === 'name')    { return row.guide.name; }
		return row.tag_names.join(', ');
	}

	narrow(project: string, kind: string, tags: string[], words: string, shut: string[], show_folders: boolean = true, sorts: Sort[] = []): void {
		const all = this.list_guides();
		this.all_guides = new Map(all.map((r) => [r.key, r]));
		const closed = new Set(shut);
		// A shut folder only hides things while the folders are on screen. With them off the
		// list is a flat run of every file, so which folders were left shut is set aside —
		// remembered, not applied — and comes back the moment the folders do.
		const open_rows = show_folders
			? all.filter((r) => !r.ancestor_keys.some((a) => closed.has(a)))
			: all;

		const matched = all.filter((r) => this.matches(r, project, kind, tags, words));
		this.matched_count = matched.length;
		const keep = new Set(matched.map((r) => r.key));
		for (const r of matched) { for (const a of r.ancestor_keys) { keep.add(a); } }

		// With the folders turned off the list is a flat run of files, every one at the far
		// left — there is nothing left to indent under. The folders still decide what a shut
		// fold hides; they just aren't drawn, and nothing steps in from the edge.
		this.filtered_guides = open_rows
			.filter((r) => keep.has(r.key))
			.filter((r) => show_folders || !r.guide.is_folder)
			.map((r) => show_folders ? r : { ...r, depth: 0 });

		// How many matching files sit under each folder — counted over the whole walk, so
		// a shut folder still shows its full tally. Only files count; the folders between
		// are the structure holding them.
		this.folder_counts = new Map<string, number>();
		for (const r of matched) {
			for (const a of r.ancestor_keys) { this.folder_counts.set(a, (this.folder_counts.get(a) ?? 0) + 1); }
		}

		// Sorting only makes sense on a flat run of files, so it applies only while the
		// folders are hidden. The columns apply in the order they were picked: the first
		// decides, and each one after it only breaks a tie in the ones before it. A blank
		// goes to the bottom of its column whichever way that column runs.
		if (!show_folders && sorts.length > 0) {
			this.filtered_guides = [...this.filtered_guides].sort((a, b) => {
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
			const blanks = sorts.map((s) => `${this.filtered_guides.filter((r) => this.sort_key(r, s.by) === '').length} with no ${s.by}`).join(', ');
			debug.log(`Sorted by ${said} — ${this.filtered_guides.length} rows (${blanks}; blanks go to the bottom).`);
		}

		const folders_shown = this.filtered_guides.filter((r) => r.guide.is_folder).length;
		debug.log(`Narrowed: project "${project || 'all'}", kind "${kind || 'all'}", tags [${tags.join(', ') || 'any'}], words "${words || 'none'}", ${shut.length} folder(s) shut (${show_folders ? 'hiding what they hold' : 'set aside, since the folders are off screen'}), folders ${show_folders ? 'shown' : 'hidden'} — ${matched.length} of ${all.length} rows match; showing ${this.filtered_guides.length}, of which ${folders_shown} are folders. ${this.folder_counts.size} folder(s) hold at least one match.`);
	}

	/** The guides wearing one tag. */
	filter_by_tag(tag_id: string): Guide[] {
		const wanted = new Set(this.indexes.files_withTag(tag_id));
		return this.guides.filter((g) => wanted.has(g.id));
	}

	/** The guides that carry no tag at all. */
	untagged(): Guide[] {
		const ids = new Set(this.indexes.untagged_among(this.guides.filter((g) => !g.is_folder).map((g) => g.id)));
		return this.guides.filter((g) => ids.has(g.id));
	}
}
