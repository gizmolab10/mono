import type { Tag, Tagging, Relationship, Predicate } from '../types/DB_Records';
import { T_Bundle, type Guide, type Labels, type Listed_Guide } from '../types/Guide';
import { Indexes } from '../database/Indexes';
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
	guides:        Guide[]        = [];
	tags:          Tag[]          = [];
	taggings:      Tagging[]      = [];
	relationships: Relationship[] = [];
	predicates:    Predicate[]    = [];

	indexes = new Indexes();

	// One instant lookup per kind of question: a node by its id, and a folder by the
	// place it sits, so building the structure never scans the whole list.
	private guides_byID    = new Map<string, Guide>();
	private folders_byPath = new Map<string, Guide>();

	// --- making nodes ---------------------------------------------------------

	private next_id = 0;

	private fresh_id(): string {
		this.next_id += 1;
		return `n${this.next_id}`;
	}

	private register(guide: Guide): Guide {
		this.guides.push(guide);
		this.guides_byID.set(guide.id, guide);
		return guide;
	}

	/** A folder: a do-nothing node whose contents are linked under it. */
	add_folder(bundle: T_Bundle, path: string, name: string): Guide {
		return this.register({
			id: this.fresh_id(), name, bundle, path, address: '', is_folder: true,
			kind: '', title: name, description: '', date: '', labeled: false,
		});
	}

	/** A file, carrying whatever labels were read off its top. */
	add_guide(bundle: T_Bundle, path: string, name: string, address: string, labels: Labels): Guide {
		return this.register({
			id: this.fresh_id(), name, bundle, path, address, is_folder: false, ...labels,
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

	/** Rebuild the lookups from the current tag links and folder links. */
	reindex(): void {
		this.indexes.rebuild(this.taggings, this.relationships);
	}

	// --- the reads ------------------------------------------------------------

	guide_byID(id: string): Guide | null { return this.guides_byID.get(id) ?? null; }

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
	list_guides(): Listed_Guide[] {
		const by_id = new Map(this.tags.map((t) => [t.id, t.name]));
		const roots = this.indexes.roots_among(this.guides.map((g) => g.id));
		const listed: Listed_Guide[] = [];

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
					tag_names: this.indexes.tags_of(id).map((t) => by_id.get(t) ?? '').filter((n) => n !== ''),
					depth,
					ancestor_ids: ancestors,
					has_children: children.length > 0,
				});
			}
			for (const edge of children) { walk(edge.child_id, depth + 1, [...ancestors, id]); }
		};
		for (const root of roots) { walk(root, 0, []); }

		return listed;
	}

	/** The guides wearing one tag. */
	filter_by_tag(tag_id: string): Guide[] {
		const wanted = new Set(this.indexes.guides_withTag(tag_id));
		return this.guides.filter((g) => wanted.has(g.id));
	}

	/** The guides that carry no tag at all. */
	untagged(): Guide[] {
		const ids = new Set(this.indexes.untagged_among(this.guides.filter((g) => !g.is_folder).map((g) => g.id)));
		return this.guides.filter((g) => ids.has(g.id));
	}
}
