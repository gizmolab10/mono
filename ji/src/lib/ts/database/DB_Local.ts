import { DB_Common } from './DB_Common';
import { T_Storage, T_Record } from './DB_Records';
import { preferences } from '../managers/Preferences';

// The local storage. Record lists live in browser storage, namespaced by this
// storage so they never collide with another's. The blob seam currently also
// uses browser storage, keyed by document id — a stand-in until blobs move to
// real files on disk (proposal step 4).

export class DB_Local extends DB_Common {
	readonly storage = T_Storage.local;

	protected load_list<T>(record: T_Record): T[] {
		return preferences.readDB<T>(this.storage, record);
	}

	protected save_list<T>(record: T_Record, list: T[]): void {
		preferences.writeDB<T>(this.storage, record, list);
	}

	write_blob(document_id: string, content: string): void {
		preferences.writeDB<string>(this.storage, `blob/${document_id}`, [content]);
		// console.log(`Stored the bytes for document ${document_id} (${content.length} character(s)) in browser storage.`);
	}

	read_blob(document_id: string): string | null {
		const held = preferences.readDB<string>(this.storage, `blob/${document_id}`);
		return held.length > 0 ? held[0] : null;
	}

	delete_blob(document_id: string): void {
		preferences.removeDB(this.storage, `blob/${document_id}`);
	}
}
