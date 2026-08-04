import type { Tagging, Relationship } from '../types/DB_Records';

// The in-memory lookups, ported from ji. Never saved — rebuilt from the records
// after any change. Each is a fast lookup so a read jumps to its answer instead of
// scanning every row. From these come the roots and the untagged set.

export class Indexes {
	tagging_by_tag:          Map<string, string[]>       = new Map();  // tag id → guide ids
	tagging_by_guide:        Map<string, string[]>       = new Map();  // guide id → tag ids
	relationships_by_parent: Map<string, Relationship[]> = new Map();  // parent id → child edges (sorted)
	relationships_by_child:  Map<string, Relationship[]> = new Map();  // child id → parent edges

	// Rebuild every lookup from the current record lists.
	rebuild(taggings: Tagging[], relationships: Relationship[]): void {
		this.tagging_by_tag.clear();
		this.tagging_by_guide.clear();
		this.relationships_by_parent.clear();
		this.relationships_by_child.clear();

		for (const t of taggings) {
			this.push(this.tagging_by_tag, t.tag_id, t.guide_id);
			this.push(this.tagging_by_guide, t.guide_id, t.tag_id);
		}
		for (const r of relationships) {
			this.push(this.relationships_by_parent, r.parent_id, r);
			this.push(this.relationships_by_child, r.child_id, r);
		}
		// keep each parent's children in sort order for the walk
		for (const edges of this.relationships_by_parent.values()) {
			edges.sort((a, b) => a.sort_order - b.sort_order);
		}
	}

	// The child edges under one parent, already sorted.
	children_of(parent_id: string): Relationship[] {
		return this.relationships_by_parent.get(parent_id) ?? [];
	}

	// The tag ids on one guide.
	tags_of(guide_id: string): string[] {
		return this.tagging_by_guide.get(guide_id) ?? [];
	}

	// The guide ids wearing one tag.
	files_withTag(tag_id: string): string[] {
		return this.tagging_by_tag.get(tag_id) ?? [];
	}

	// Roots of a graph: the given node ids that never appear as a child.
	roots_among(node_ids: string[]): string[] {
		return node_ids.filter((id) => !this.relationships_by_child.has(id));
	}

	// The given ids with no tagging record.
	untagged_among(guide_ids: string[]): string[] {
		return guide_ids.filter((id) => !this.tagging_by_guide.has(id));
	}

	private push<V>(map: Map<string, V[]>, key: string, value: V): void {
		if (!map.has(key)) { map.set(key, []); }
		map.get(key)!.push(value);
	}
}
