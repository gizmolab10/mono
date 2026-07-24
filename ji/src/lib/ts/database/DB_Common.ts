import { T_Record, T_Storage } from '../types/DB_Records';

// The persistence seam every storage fills its own way. It holds no records and
// no tree logic — those live on the Hierarchy that wraps it. A storage subclass
// only decides where the record lists and the document blobs actually live.

export abstract class DB_Common {
	abstract readonly storage: T_Storage;

	// Read / write one record kind's whole list where this storage keeps it.
	abstract load_list<T>(record: T_Record): T[];
	abstract save_list<T>(record: T_Record, list: T[]): void;

	// The blob seam: the document's bytes, by document id. Async because the bytes
	// live in IndexedDB, which is asked-and-waited-for, not instant. A text document
	// is held as its words; every other kind is held as its raw bytes, untouched.
	abstract write_blob(document_id: string, content: string | Blob): Promise<void>;
	abstract read_blob(document_id: string): Promise<string | Blob | null>;
	abstract delete_blob(document_id: string): Promise<void>;
	// Drop every stored byte belonging to this store — including orphans with no
	// matching document — and report how many were removed.
	abstract clear_blobs(): Promise<number>;
}
