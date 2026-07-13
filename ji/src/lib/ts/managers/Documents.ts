import { preferences, T_Preference } from './Preferences';

// The document repository. A document is a name plus the categories tagged onto
// it — deliberately small, since the phase-2 add flow decides what else it wants.
// The whole list lives in one browser-storage slot, so it survives a reload.
// This is the trimmed local-only store the db spec calls for: no backends to
// switch, no cloud, no graph model.

export interface Document_Record {
	id   : string;
	name : string;
	tags : string[];
}

// The saved list. Reading or writing this store also reads or writes the one
// browser-storage slot that holds the documents.
export const w_documents = preferences.persistent<Document_Record[]>(T_Preference.documents, []);

// Save a new document with a name and any category tags, and hand it back.
export function add_document(name: string, tags: string[] = []): Document_Record {
	const doc: Document_Record = { id: crypto.randomUUID(), name, tags };
	w_documents.update((list) => {
		console.log(`Saving a new document named "${name}" with ${tags.length} category tag(s); the saved list grows from ${list.length} to ${list.length + 1}.`);
		return [...list, doc];
	});
	return doc;
}

// Forget the document with the given internal id.
export function remove_document(id: string): void {
	w_documents.update((list) => {
		const shorter = list.filter((d) => d.id !== id);
		console.log(`Removing document with internal id ${id}: the saved list shrinks from ${list.length} to ${shorter.length}.`);
		return shorter;
	});
}
