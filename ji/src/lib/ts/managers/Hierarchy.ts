import { Document, S_Document, T_DocumentExtension, T_DocumentFamily, READY_KINDS, NEEDS_CONVERTING } from '../types/Document';
import type { Tag, Tagging, Relationship, Predicate } from '../types/DB_Records';
import type { DB_Common } from '../database/DB_Common';
import { T_Record } from '../types/DB_Records';
import { Persistence } from '../types/Persistence';
import { db_changed } from '../types/Signal';
import { debug } from '../common/Debug';
import { Indexes } from '../database/Indexes';

// Any stored record. They all carry a unique id, and ids never collide across the
// kinds, so one id lookup can hold every record and each id resolves to the one
// kind its reference expects.
export type DB_Record = Document | Tag | Tagging | Relationship | Predicate;

// A document paired with the ids of the tags on it — what a listing returns.
// A thing linked to more than one parent is listed once per parent, so the same
// document can come back more than once, each time with its own depth and chain.
export interface Listed_Document {
	document     : Document;
	tag_ids      : string[];
	depth        : number;      // how many folders deep it sits (a root is 0)
	ancestor_ids : string[];    // the folder chain above it, root-first
	is_echo      : boolean;     // a second-or-later home — reads lighter, an "also here"
	has_children : boolean;     // holds anything nested under it (folder contents, or a duplicate under its original) — so it can open and close
}

// The store's records and the living tree over them. It owns the in-memory record
// lists, the dirty bookkeeping, and the indexes; it holds the document lifecycle
// (create / add / replace / add-folder / erase) and the tree operations (the walk,
// find-or-create, the tag graph, the delete cascades). Where the records and the
// document blobs actually live is the DB it wraps — it asks the DB to load, save,
// and hold bytes, and nothing more.

export class Hierarchy {
	documents:     Document[]     = [];
	tags:          Tag[]          = [];
	taggings:      Tagging[]      = [];
	relationships: Relationship[] = [];
	predicates:    Predicate[]    = [];

	persistence = new Persistence();
	indexes     = new Indexes();

	// Two instant lookups: a document by its name, and any record by its id. Both are
	// one-to-one — names are unique across the store, ids across every kind. Rebuilt
	// on load and on delete; a newly made record adds itself.
	private documents_byName = new Map<string, Document>();
	private records_byID     = new Map<string, DB_Record>();

	constructor(private db: DB_Common) {}

	// --- load & save ---------------------------------------------------------

	// Load every record kind from storage, then rebuild the indexes.
	fetch_all(): void {
		this.documents     = this.db.load_list<Document>(T_Record.documents);
		this.tags          = this.db.load_list<Tag>(T_Record.tags);
		this.taggings      = this.db.load_list<Tagging>(T_Record.taggings);
		this.relationships = this.db.load_list<Relationship>(T_Record.relationships);
		this.predicates    = this.db.load_list<Predicate>(T_Record.predicates);
		this.persistence.clear_all();
		this.rebuild_lookups();
		this.reindex();
	}

	// Rebuild both lookups from the current records. Cheap and only on load or a
	// delete; the hot paths (a drop's name check, the viewer's id fetch) never
	// rebuild — they read. The id lookup holds every record kind.
	private rebuild_lookups(): void {
		this.documents_byName = new Map(this.documents.map((d) => [d.name ?? '', d]));
		this.records_byID     = new Map();
		for (const record of [...this.documents, ...this.tags, ...this.taggings, ...this.relationships, ...this.predicates]) {
			this.records_byID.set(record.id, record);
		}
	}

	// Save one record kind's whole list and mark it clean.
	persist(record: T_Record): void {
		this.db.save_list(record, this.list_forRecord(record));
		this.persistence.clear(record);
		db_changed();
	}

	// Rebuild the in-memory lookups from the current tagging and relationship rows.
	reindex(): void {
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

	// --- the document lifecycle ----------------------------------------------

	// The shared start of every new document: a fresh id and the fields every one
	// carries. What makes it a file or a folder is passed in.
	private create_document(name: string, fields: Partial<Document>): Document {
		const id = crypto.randomUUID();
		return { id, name, storage: this.db.storage, status: S_Document.ready, metadata: {}, ...fields };
	}

	// The shared finish: add it to the list and save.
	private register_document(document: Document): Document {
		this.documents.push(document);
		this.documents_byName.set(document.name ?? '', document);
		this.records_byID.set(document.id, document);
		this.persistence.mark_dirty(T_Record.documents, document.id);
		this.persist(T_Record.documents);
		debug.log(`the document list is now ${this.documents.length} long.`);
		return document;
	}

	// What the dropped file itself told us — kept together so the three can't be
	// mixed up, and so a caller without a real file (the tests) can leave them out.
	// Missing values fall back: the date to now, the family to what the extension implies.
	async add_document(name: string, extension: T_DocumentExtension, content: string | Blob,
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
		await this.db.write_blob(document.id, content);
		// Whether the reading tool will take this file as it stands, or whether it has
		// to be turned into something else first (a clip transcribed, a picture
		// re-saved, markup stripped). Logged so a document that will need extra work
		// later says so the moment it arrives.
		const handover = (status === S_Document.ready) ? 'already plain words'
			: NEEDS_CONVERTING.has(extension) ? 'must be converted before the reading tool will take it'
			: 'the reading tool will pull its words out itself';
		debug.log(`Added document "${name}" (${extension}), dated ${new Date(last_modified_date).toISOString()}, ${size ?? 'unknown'} bytes, reported as "${reported_type || 'nothing'}" -> family ${family}, ${handover}.`);
		return this.register_document(document);
	}

	// Take a newly dropped file into a document we already hold: its facts and its
	// bytes are brought up to date, while the document itself — its id, its tags,
	// and the folder it sits in — stays exactly where it was.
	async replace_document(document: Document, extension: T_DocumentExtension, content: string | Blob,
		from_file: { last_modified_date?: number; size?: number; reported_type?: string } = {}): Promise<Document> {
		const was_size = document.size;
		document.extension          = extension;
		document.last_modified_date = from_file.last_modified_date ?? Date.now();
		document.size               = from_file.size;
		document.reported_type      = from_file.reported_type ?? '';
		document.family             = Document.family_of(document.reported_type, extension);
		document.status             = READY_KINDS.has(extension) ? S_Document.ready : S_Document.needsText;
		document.blob_id            = document.id;
		await this.db.write_blob(document.id, content);
		this.persistence.mark_dirty(T_Record.documents, document.id);
		this.persist(T_Record.documents);
		debug.log(`Replaced the contents of "${document.name}" — was ${was_size ?? 'unknown'} bytes, now ${document.size ?? 'unknown'}; its tags and its folder are untouched.`);
		return document;
	}

	// A folder is a do-nothing document: no bytes and no extension — its family
	// marks it as a folder, and its contents are linked under it by relationships.
	add_folder(name: string): Document {
		const document = this.create_document(name, { family: T_DocumentFamily.folder, last_modified_date: null });
		debug.log(`Added folder "${name}".`);
		return this.register_document(document);
	}

	// Wipe this store: every stored byte (orphans included), then every record
	// list, then the indexes. Only this active store is touched; others are not.
	async erase_all(): Promise<void> {
		const had = this.documents.length;
		await this.db.clear_blobs();   // wipes the whole byte-database; it logs its own outcome
		this.documents     = [];
		this.tags          = [];
		this.taggings      = [];
		this.relationships = [];
		this.predicates    = [];
		this.documents_byName.clear();
		this.records_byID.clear();
		this.persistence.clear_all();
		for (const record of Object.values(T_Record)) { this.persist(record); }
		this.reindex();
		debug.log(`Erased the ${this.db.storage} store: removed ${had} document(s) and every tag and link; byte-database cleared.`);
	}

	// --- the three reads -----------------------------------------------------

	// Walk the document graph from each root down, gathering each document with
	// its tags. A thing linked to more than one parent is listed once under EACH
	// parent — so a kept-both new item shows both under its folder and under its
	// original. The only thing the walk must never do is follow a thing back into
	// itself, so the guard is "already on the chain I'm walking now" (a real loop),
	// not "seen anywhere" (which would hide the second home). When a thing appears
	// more than once, one appearance is its home and the rest read as echoes: the
	// home is the one reached through a "contains" link (its folder), so the folder
	// place is solid and the duplicate place is the lighter "also here".
	list_documents(): Listed_Document[] {
		const contains_id = this.predicates.find((p) => p.type === 'contains')?.id ?? null;
		const document_ids = this.documents.map((d) => d.id);
		const roots = this.indexes.roots_among(document_ids);
		const ordered: Array<Listed_Document & { via_contains: boolean }> = [];

		const walk = (id: string, depth: number, ancestors: string[], via_contains: boolean): void => {
			if (ancestors.includes(id)) {
				const document = this.document_byID(id);
				debug.log(`Tree walk: "${document?.name ?? id}" already sits above itself on this branch (depth ${depth}) — a loop, so not following it deeper.`);
				return;
			}
			const document = this.document_byID(id);
			const children = this.indexes.children_of(id);
			const has_children = children.length > 0;   // holds anything nested — a folder's files, or a duplicate under its original — so it can open and close
			if (document) { ordered.push({ document, tag_ids: this.indexes.tags_of(id), depth, ancestor_ids: ancestors, is_echo: false, has_children, via_contains }); }
			for (const edge of children) { walk(edge.child_id, depth + 1, [...ancestors, id], edge.predicate_id === contains_id); }
		};
		for (const root of roots) { walk(root, 0, [], true); }   // a root has no parent link — it is its own home

		// Of a thing's several appearances, its home is the one reached through a
		// folder ("contains") link; failing that, the first one walked. Every other
		// appearance is an echo.
		const counts = new Map<string, number>();
		for (const row of ordered) { counts.set(row.document.id, (counts.get(row.document.id) ?? 0) + 1); }
		const home_at = new Map<string, number>();
		ordered.forEach((row, i) => {
			if ((counts.get(row.document.id) ?? 0) < 2) { return; }        // shown once — no echo, no home to pick
			const chosen = home_at.get(row.document.id);
			if (chosen === undefined) { home_at.set(row.document.id, i); return; }
			if (row.via_contains && !ordered[chosen].via_contains) { home_at.set(row.document.id, i); }
		});

		return ordered.map((row, i) => {
			const many = (counts.get(row.document.id) ?? 0) >= 2;
			const is_echo = many && home_at.get(row.document.id) !== i;
			if (is_echo) { debug.log(`Tree walk: "${row.document.name}" shown again under a second parent (depth ${row.depth}) — the lighter "also here".`); }
			return { document: row.document, tag_ids: row.tag_ids, depth: row.depth, ancestor_ids: row.ancestor_ids, is_echo, has_children: row.has_children };
		});
	}

	// The documents wearing one tag.
	filter_by_tag(tag_id: string): Document[] {
		const wanted = new Set(this.indexes.documents_withTag(tag_id));
		return this.documents.filter((d) => wanted.has(d.id));
	}

	// The documents that carry no tag at all.
	untagged(): Document[] {
		const ids = new Set(this.indexes.untagged_among(this.documents.map((d) => d.id)));
		return this.documents.filter((d) => ids.has(d.id));
	}

	// The document with this name anywhere in the store — the place it sits does not
	// matter. This is what decides whether a dropped file is one we already hold: a
	// document is unique by its name across the whole store. A map lookup, so a big
	// folder drop stays fast no matter how many documents are already held.
	document_byName(name: string): Document | null {
		return this.documents_byName.get(name) ?? null;
	}

	// A record by its id. A document id resolves to a Document, a tag id to a Tag,
	// and so on — the reference's own kind is what it holds, so a typed getter casts
	// to that one kind and the caller never meets the union. (Only the document
	// getter is needed today; a tag / relationship one is a one-liner when it is.)
	document_byID(id: string): Document | null { return (this.records_byID.get(id) as Document) ?? null; }

	// The document with this name sitting in one particular place — inside the named
	// folder, or at the top level when no folder is given. Used to tell whether a
	// dropped folder is the same folder already here (by the files it holds).
	document_named(name: string, parent_id: string | null): Document | null {
		const here = (parent_id === null)
			? new Set(this.indexes.roots_among(this.documents.map((d) => d.id)))
			: new Set(this.indexes.children_of(parent_id).map((edge) => edge.child_id));
		return this.documents.find((d) => here.has(d.id) && d.name === name) ?? null;
	}

	// --- find-or-create: meanings and links ----------------------------------

	add_predicate(type: string): Predicate {
		const predicate: Predicate = { id: crypto.randomUUID(), type };
		this.predicates.push(predicate);
		this.records_byID.set(predicate.id, predicate);
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
	// Find-or-create: the same parent → child under the same meaning is one link,
	// never two — asking for it again hands back the one that's already there.
	add_document_relationship(predicate_id: string, parent_id: string, child_id: string): Relationship {
		const found = this.relationships.find((r) => r.predicate_id === predicate_id && r.parent_id === parent_id && r.child_id === child_id);
		if (found) { return found; }
		const siblings = this.indexes.children_of(parent_id).length;
		const relationship: Relationship = { id: crypto.randomUUID(), predicate_id, parent_id, child_id, isDocument: true, sort_order: siblings };
		this.relationships.push(relationship);
		this.records_byID.set(relationship.id, relationship);
		this.persist(T_Record.relationships);
		this.reindex();
		return relationship;
	}

	// --- the tag graph -------------------------------------------------------

	// Find-or-create by name: two tags of one name are one tag, never two.
	add_tag(name: string): Tag {
		const found = this.tags.find((t) => t.name === name);
		if (found) { return found; }
		const tag: Tag = { id: crypto.randomUUID(), name };
		this.tags.push(tag);
		this.records_byID.set(tag.id, tag);
		this.persist(T_Record.tags);
		return tag;
	}

	// Place a tag on a document (the many-to-many link). Find-or-create: the same
	// tag on the same document is one link, never two — asking again hands back the
	// one that's already there.
	add_tagging(tag_id: string, document_id: string): Tagging {
		const found = this.taggings.find((t) => t.tag_id === tag_id && t.document_id === document_id);
		if (found) { return found; }
		const tagging: Tagging = { id: crypto.randomUUID(), tag_id, document_id };
		this.taggings.push(tagging);
		this.records_byID.set(tagging.id, tagging);
		this.persist(T_Record.taggings);
		this.reindex();
		return tagging;
	}

	// Take a tag off a document (remove the one link between them).
	remove_tagging(tag_id: string, document_id: string): void {
		const before = this.taggings.length;
		this.taggings = this.taggings.filter((t) => !(t.tag_id === tag_id && t.document_id === document_id));
		this.rebuild_lookups();
		this.persist(T_Record.taggings);
		this.reindex();
		debug.log(`Removed tag ${tag_id} from document ${document_id}; tagging links went from ${before} to ${this.taggings.length}.`);
	}

	// --- delete cascade ------------------------------------------------------

	// Remove a document and everything that points at it, then its bytes.
	async delete_document(document_id: string): Promise<void> {
		this.taggings      = this.taggings.filter((t) => t.document_id !== document_id);
		this.relationships = this.relationships.filter((r) => r.parent_id !== document_id && r.child_id !== document_id);
		this.documents     = this.documents.filter((d) => d.id !== document_id);
		await this.db.delete_blob(document_id);
		this.rebuild_lookups();
		this.persist(T_Record.taggings);
		this.persist(T_Record.relationships);
		this.persist(T_Record.documents);
		this.reindex();
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
		for (const id of doomed) { await this.db.delete_blob(id); }
		this.rebuild_lookups();
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
		this.rebuild_lookups();
		this.persist(T_Record.taggings);
		this.persist(T_Record.relationships);
		this.persist(T_Record.tags);
		this.reindex();
	}
}
