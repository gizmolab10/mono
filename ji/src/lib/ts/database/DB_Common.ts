import { T_Record, T_Storage, T_DocumentKind } from './DB_Records';
import { debug } from '../common/Debug';
import type { Document, Tag, Tagging, Relationship, Predicate } from './DB_Records';
import { Persistable } from './Persistable';
import { Indexes } from './Indexes';
import { db_changed } from './Signal';

// A document paired with the ids of the tags on it — what a listing returns.
export interface Listed_Document {
	document : Document;
	tag_ids  : string[];
}

// The shared base every storage inherits. It owns the in-memory record lists,
// the dirty bookkeeping, and the indexes, and defines load-all / save-all, the
// per-record hooks, the three reads, and the delete cascade. A storage subclass
// only decides where the record lists and the document blobs actually live —
// the four abstract methods below.

export abstract class DB_Common {
	abstract readonly storage: T_Storage;

	documents:     Document[]     = [];
	tags:          Tag[]          = [];
	taggings:      Tagging[]      = [];
	relationships: Relationship[] = [];
	predicates:    Predicate[]    = [];

	persistable = new Persistable();
	indexes     = new Indexes();

	// --- the seams a storage fills its own way -------------------------------

	// Read / write one record kind's whole list where this storage keeps it.
	protected abstract load_list<T>(record: T_Record): T[];
	protected abstract save_list<T>(record: T_Record, list: T[]): void;

	// The blob seam: the document's bytes, by document id.
	abstract write_blob(document_id: string, content: string): void;
	abstract read_blob(document_id: string): string | null;
	abstract delete_blob(document_id: string): void;

	// --- load & save ---------------------------------------------------------

	// Load every record kind from storage, then rebuild the indexes.
	fetch_all(): void {
		this.documents     = this.load_list<Document>(T_Record.documents);
		this.tags          = this.load_list<Tag>(T_Record.tags);
		this.taggings      = this.load_list<Tagging>(T_Record.taggings);
		this.relationships = this.load_list<Relationship>(T_Record.relationships);
		this.predicates    = this.load_list<Predicate>(T_Record.predicates);
		this.persistable.clear_all();
		this.reindex();
		// debug.log(`Loaded from the ${this.storage} storage: ${this.documents.length} document(s), ${this.tags.length} tag(s), ${this.taggings.length} tagging(s), ${this.relationships.length} relationship(s).`);
	}

	// Save one record kind's whole list and mark it clean.
	protected persist(record: T_Record): void {
		this.save_list(record, this.list_forRecord(record));
		this.persistable.clear(record);
		db_changed();
	}

	private reindex(): void {
		this.indexes.rebuild(this.taggings, this.relationships);
	}

	private list_forRecord(record: T_Record): any[] {
		switch (record) {
			case T_Record.documents:     return this.documents;
			case T_Record.tags:          return this.tags;
			case T_Record.taggings:      return this.taggings;
			case T_Record.relationships: return this.relationships;
			case T_Record.predicates:    return this.predicates;
		}
	}

	// --- per-record create hooks ---------------------------------------------

	// Save a new document: write its bytes through the blob seam, add the record.
	add_document(name: string, kind: T_DocumentKind, content: string): Document {
		const id = crypto.randomUUID();
		const document: Document = { id, blob_id: id, name, storage: this.storage, kind, date: Date.now(), metadata: {} };
		this.write_blob(id, content);
		this.documents.push(document);
		this.persistable.mark_dirty(T_Record.documents, id);
		this.persist(T_Record.documents);
		// debug.log(`Added document "${name}" (${kind}); the document list is now ${this.documents.length} long.`);
		return document;
	}

	add_tag(name: string): Tag {
		const tag: Tag = { id: crypto.randomUUID(), name };
		this.tags.push(tag);
		this.persist(T_Record.tags);
		// debug.log(`Added tag "${name}"; the tag list is now ${this.tags.length} long.`);
		return tag;
	}

	// Place a tag on a document (the many-to-many link).
	add_tagging(tag_id: string, document_id: string): Tagging {
		const tagging: Tagging = { id: crypto.randomUUID(), tag_id, document_id };
		this.taggings.push(tagging);
		this.persist(T_Record.taggings);
		this.reindex();
		// debug.log(`Tagged document ${document_id} with tag ${tag_id}; ${this.taggings.length} tagging link(s) total.`);
		return tagging;
	}

	// Take a tag off a document (remove the one link between them).
	remove_tagging(tag_id: string, document_id: string): void {
		const before = this.taggings.length;
		this.taggings = this.taggings.filter((t) => !(t.tag_id === tag_id && t.document_id === document_id));
		this.persist(T_Record.taggings);
		this.reindex();
		debug.log(`Removed tag ${tag_id} from document ${document_id}; tagging links went from ${before} to ${this.taggings.length}.`);
	}

	add_predicate(type: string): Predicate {
		const predicate: Predicate = { id: crypto.randomUUID(), type };
		this.predicates.push(predicate);
		this.persist(T_Record.predicates);
		return predicate;
	}

	// Link a parent to a child under a predicate, at the end of the child order.
	add_relationship(predicate_id: string, parent_id: string, child_id: string): Relationship {
		const siblings = this.indexes.children_of(parent_id).length;
		const relationship: Relationship = { id: crypto.randomUUID(), predicate_id, parent_id, child_id, sort_order: siblings };
		this.relationships.push(relationship);
		this.persist(T_Record.relationships);
		this.reindex();
		// debug.log(`Linked parent ${parent_id} → child ${child_id} at position ${siblings}; ${this.relationships.length} edge(s) total.`);
		return relationship;
	}

	// --- the three reads -----------------------------------------------------

	// Walk the document graph from each root down, gathering each document with
	// its tags. A visited set makes the walk acyclic (never loop back).
	list_documents(): Listed_Document[] {
		const by_id = new Map(this.documents.map((d) => [d.id, d]));
		const document_ids = this.documents.map((d) => d.id);
		const roots = this.indexes.roots_among(document_ids);
		const visited = new Set<string>();
		const ordered: Listed_Document[] = [];

		const walk = (id: string): void => {
			if (visited.has(id)) { return; }
			visited.add(id);
			const document = by_id.get(id);
			if (document) { ordered.push({ document, tag_ids: this.indexes.tags_of(id) }); }
			for (const edge of this.indexes.children_of(id)) { walk(edge.child_id); }
		};
		for (const root of roots) { walk(root); }

		// debug.log(`Listed ${ordered.length} document(s) by walking from ${roots.length} root(s).`);
		return ordered;
	}

	// The documents wearing one tag.
	filter_by_tag(tag_id: string): Document[] {
		const wanted = new Set(this.indexes.documents_withTag(tag_id));
		const matches = this.documents.filter((d) => wanted.has(d.id));
		// debug.log(`Filter by tag ${tag_id}: ${matches.length} matching document(s).`);
		return matches;
	}

	// The documents that carry no tag at all.
	untagged(): Document[] {
		const ids = new Set(this.indexes.untagged_among(this.documents.map((d) => d.id)));
		return this.documents.filter((d) => ids.has(d.id));
	}

	// --- delete cascade ------------------------------------------------------

	// Remove a document and everything that points at it, then its bytes.
	delete_document(document_id: string): void {
		this.taggings      = this.taggings.filter((t) => t.document_id !== document_id);
		this.relationships = this.relationships.filter((r) => r.parent_id !== document_id && r.child_id !== document_id);
		this.documents     = this.documents.filter((d) => d.id !== document_id);
		this.delete_blob(document_id);
		this.persist(T_Record.taggings);
		this.persist(T_Record.relationships);
		this.persist(T_Record.documents);
		this.reindex();
		// debug.log(`Deleted document ${document_id}: documents ${before} → ${this.documents.length}, plus its tagging and relationship rows and its blob.`);
	}

	// Remove a tag and everything that points at it.
	delete_tag(tag_id: string): void {
		this.taggings      = this.taggings.filter((t) => t.tag_id !== tag_id);
		this.relationships = this.relationships.filter((r) => r.parent_id !== tag_id && r.child_id !== tag_id);
		this.tags          = this.tags.filter((t) => t.id !== tag_id);
		this.persist(T_Record.taggings);
		this.persist(T_Record.relationships);
		this.persist(T_Record.tags);
		this.reindex();
		// debug.log(`Deleted tag ${tag_id} and its tagging and relationship rows.`);
	}

	// Wipe this store: every document's bytes, then every record list, then the
	// indexes. Only this active store is touched; other stores are untouched.
	erase_all(): void {
		const had = this.documents.length;
		for (const document of this.documents) { this.delete_blob(document.id); }
		this.documents     = [];
		this.tags          = [];
		this.taggings      = [];
		this.relationships = [];
		this.predicates    = [];
		this.persistable.clear_all();
		for (const record of Object.values(T_Record)) { this.persist(record); }
		this.reindex();
		debug.log(`Erased the ${this.storage} store: removed ${had} document(s) and every tag, link, and blob.`);
	}
}
