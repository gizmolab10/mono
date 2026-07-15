import type { Tagging, Relationship } from './DB_Records';

// The in-memory indexes. Never saved — rebuilt from the stored records on load
// and after any change. Each is a fast lookup so a read jumps to its answer
// instead of scanning every row. From these come the derived roots and the
// untagged set.

export class Indexes {
	tagging_by_tag:            Map<string, string[]>       = new Map();  // tag id → document ids
	tagging_by_document:       Map<string, string[]>       = new Map();  // document id → tag ids
	relationships_by_parent:   Map<string, Relationship[]> = new Map();  // parent id → child edges (sorted)
	relationships_by_child:    Map<string, Relationship[]> = new Map();  // child id → parent edges

	// Rebuild every index from the current record lists.
	rebuild(taggings: Tagging[], relationships: Relationship[]): void {
		this.tagging_by_tag.clear();
		this.tagging_by_document.clear();
		this.relationships_by_parent.clear();
		this.relationships_by_child.clear();

		for (const t of taggings) {
			this.push(this.tagging_by_tag, t.tag_id, t.document_id);
			this.push(this.tagging_by_document, t.document_id, t.tag_id);
		}
		for (const r of relationships) {
			this.push(this.relationships_by_parent, r.parent_id, r);
			this.push(this.relationships_by_child, r.child_id, r);
		}
		// keep each parent's children in sort order for the walk
		for (const edges of this.relationships_by_parent.values()) {
			edges.sort((a, b) => a.sort_order - b.sort_order);
		}
		// debug.log(`Indexes rebuilt: ${taggings.length} tagging link(s), ${relationships.length} relationship edge(s), ${this.relationships_by_parent.size} parent(s) with children.`);
	}

	// The child edges under one parent, already sorted.
	children_of(parent_id: string): Relationship[] {
		return this.relationships_by_parent.get(parent_id) ?? [];
	}

	// The tag ids on one document.
	tags_of(document_id: string): string[] {
		return this.tagging_by_document.get(document_id) ?? [];
	}

	// The document ids wearing one tag.
	documents_withTag(tag_id: string): string[] {
		return this.tagging_by_tag.get(tag_id) ?? [];
	}

	// Roots of a graph: the given node ids that never appear as a child.
	roots_among(node_ids: string[]): string[] {
		const roots = node_ids.filter((id) => !this.relationships_by_child.has(id));
		// debug.log(`Roots: ${roots.length} of ${node_ids.length} node(s) have no parent.`);
		return roots;
	}

	// Untagged documents: the given ids with no tagging record.
	untagged_among(document_ids: string[]): string[] {
		const untagged = document_ids.filter((id) => !this.tagging_by_document.has(id));
		// debug.log(`Untagged: ${untagged.length} of ${document_ids.length} document(s) carry no tag.`);
		return untagged;
	}

	private push<V>(map: Map<string, V[]>, key: string, value: V): void {
		if (!map.has(key)) { map.set(key, []); }
		map.get(key)!.push(value);
	}
}
