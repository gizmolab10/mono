import type { Tag, Tagging, Relationship, Predicate } from '../types/DB_Records';
import { Document, S_Document, T_DocumentExtension, T_DocumentFamily, READY_KINDS } from '../types/Document';
import { T_Record, T_Storage } from '../types/DB_Records';
import { Persistable } from '../types/Persistable';
import { db_changed } from '../types/Signal';
import { debug } from '../common/Debug';
import { Indexes } from './Indexes';

// A document paired with the ids of the tags on it — what a listing returns.
export interface Listed_Document {
	document     : Document;
	tag_ids      : string[];
	depth        : number;      // how many folders deep it sits (a root is 0)
	ancestor_ids : string[];    // the folder chain above it, root-first
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

	// The blob seam: the document's bytes, by document id. Async because the bytes
	// live in IndexedDB, which is asked-and-waited-for, not instant.
	abstract write_blob(document_id: string, content: string): Promise<void>;
	abstract read_blob(document_id: string): Promise<string | null>;
	abstract delete_blob(document_id: string): Promise<void>;
	// Drop every stored byte belonging to this store — including orphans with no
	// matching document — and report how many were removed.
	abstract clear_blobs(): Promise<number>;

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

	// The shared start of every new document: a fresh id and the fields every one
	// carries. What makes it a file or a folder is passed in.
	private create_document(name: string, fields: Partial<Document>): Document {
		const id = crypto.randomUUID();
		// A drop hands us no original path, so the source is this document's own
		// place in the store — stable, and unique across storages.
		const url = `ji://${this.storage}/${id}`;
		return { id, name, url, storage: this.storage, status: S_Document.ready, metadata: {}, ...fields };
	}

	// The shared finish: add it to the list and save.
	private register_document(document: Document): Document {
		this.documents.push(document);
		this.persistable.mark_dirty(T_Record.documents, document.id);
		this.persist(T_Record.documents);
		debug.log(`the document list is now ${this.documents.length} long.`);
		return document;
	}

	// What the dropped file itself told us — kept together so the three can't be
	// mixed up, and so a caller without a real file (the tests) can leave them out.
	// Missing values fall back: the date to now, the family to what the extension implies.
	async add_document(name: string, extension: T_DocumentExtension, content: string,
		from_file: { last_modified_date?: number; size?: number; reported_type?: string } = {}): Promise<Document> {
		const last_modified_date = from_file.last_modified_date ?? Date.now();
		const reported_type      = from_file.reported_type ?? '';
		const size               = from_file.size;
		const family             = Document.family_of(reported_type, extension);
		// Plain text and markdown are already readable words; everything else waits
		// for a text-extraction step before it can be searched or read by a model.
		const status = READY_KINDS.has(extension) ? S_Document.ready : S_Document.needsText;
		const document = this.create_document(name, { extension, last_modified_date, status, family, size, reported_type });
		document.blob_id = document.id;
		await this.write_blob(document.id, content);
		debug.log(`Added document "${name}" (${extension}), dated ${new Date(last_modified_date).toISOString()}, ${size ?? 'unknown'} bytes, reported as "${reported_type || 'nothing'}" -> family ${family}, ${status === S_Document.ready ? 'text already readable' : 'still needs its text pulled out'}.`);
		return this.register_document(document);
	}

	// A folder is a do-nothing document: no bytes and no extension — its family
	// marks it as a folder, and its contents are linked under it by relationships.
	add_folder(name: string): Document {
		const document = this.create_document(name, { family: T_DocumentFamily.folder, last_modified_date: null });
		debug.log(`Added folder "${name}".`);
		return this.register_document(document);
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

	// The one relationship-meaning with this type, made only the first time it is
	// asked for. Reusing it keeps a folder drop from piling up duplicate meanings.
	predicate_for(type: string): Predicate {
		const found = this.predicates.find((p) => p.type === type);
		if (found) { return found; }
		debug.log(`No "${type}" relationship-meaning yet — making the first one.`);
		return this.add_predicate(type);
	}

	// Link a parent to a child under a predicate, at the end of the child order.
	add_document_relationship(predicate_id: string, parent_id: string, child_id: string): Relationship {
		const siblings = this.indexes.children_of(parent_id).length;
		const relationship: Relationship = { id: crypto.randomUUID(), predicate_id, parent_id, child_id, isDocument: true, sort_order: siblings };
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

		const walk = (id: string, depth: number, ancestors: string[]): void => {
			if (visited.has(id)) { return; }
			visited.add(id);
			const document = by_id.get(id);
			if (document) { ordered.push({ document, tag_ids: this.indexes.tags_of(id), depth, ancestor_ids: ancestors }); }
			for (const edge of this.indexes.children_of(id)) { walk(edge.child_id, depth + 1, [...ancestors, id]); }
		};
		for (const root of roots) { walk(root, 0, []); }

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
	async delete_document(document_id: string): Promise<void> {
		this.taggings      = this.taggings.filter((t) => t.document_id !== document_id);
		this.relationships = this.relationships.filter((r) => r.parent_id !== document_id && r.child_id !== document_id);
		this.documents     = this.documents.filter((d) => d.id !== document_id);
		await this.delete_blob(document_id);
		this.persist(T_Record.taggings);
		this.persist(T_Record.relationships);
		this.persist(T_Record.documents);
		this.reindex();
		// debug.log(`Deleted document ${document_id}: documents ${before} → ${this.documents.length}, plus its tagging and relationship rows and its blob.`);
	}

	// Delete a document and everything under it — its files, and any folder within,
	// all the way down — plus every tag link and every relationship that touched any
	// of them, and each one's bytes. For a plain file (no children) this removes just
	// that one document, so it is the single delete the row's trash always calls.
	async delete_subtree(document_id: string): Promise<void> {
		const doomed = new Set<string>();
		const collect = (id: string): void => {
			if (doomed.has(id)) { return; }
			doomed.add(id);
			for (const edge of this.indexes.children_of(id)) { collect(edge.child_id); }
		};
		collect(document_id);
		this.taggings      = this.taggings.filter((t) => !doomed.has(t.document_id));
		this.relationships = this.relationships.filter((r) => !doomed.has(r.parent_id) && !doomed.has(r.child_id));
		this.documents     = this.documents.filter((d) => !doomed.has(d.id));
		for (const id of doomed) { await this.delete_blob(id); }
		this.persist(T_Record.taggings);
		this.persist(T_Record.relationships);
		this.persist(T_Record.documents);
		this.reindex();
		debug.log(`Deleted a group of ${doomed.size} document(s) starting at ${document_id}, plus their tag links, relationships, and bytes.`);
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

	// Wipe this store: every stored byte (orphans included), then every record
	// list, then the indexes. Only this active store is touched; others are not.
	async erase_all(): Promise<void> {
		const had = this.documents.length;
		await this.clear_blobs();   // wipes the whole byte-database; it logs its own outcome
		this.documents     = [];
		this.tags          = [];
		this.taggings      = [];
		this.relationships = [];
		this.predicates    = [];
		this.persistable.clear_all();
		for (const record of Object.values(T_Record)) { this.persist(record); }
		this.reindex();
		debug.log(`Erased the ${this.storage} store: removed ${had} document(s) and every tag and link; byte-database cleared.`);
	}
}
