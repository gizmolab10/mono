import { T_Storage, T_Record } from '../types/DB_Records';
import { preferences } from '../managers/Preferences';
import { DB_Common } from './DB_Common';
import { debug } from '../common/Debug';

// The local storage. The small record lists live in browser storage, namespaced
// by this storage so they never collide with another's. A document's bytes live
// in IndexedDB, which holds far more than browser storage's ~5MB — keyed by this
// storage plus the document id.
//
// The blob plumbing sits here: the browser always has IndexedDB, so it is used;
// node (the tests) has none, so an in-memory map stands in — detected by whether
// the global exists.

const BLOB_DB    = 'ji-blobs';
const BLOB_STORE = 'blobs';

const has_idb = typeof indexedDB !== 'undefined';
const memory  = new Map<string, string>();   // the node-test stand-in

let open_promise: Promise<IDBDatabase> | null = null;

// Open (and first-time create) the blob database once; later calls share it.
function open_blob_db(): Promise<IDBDatabase> {
	if (open_promise) { return open_promise; }
	open_promise = new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(BLOB_DB, 1);
		request.onupgradeneeded = () => { request.result.createObjectStore(BLOB_STORE); };
		request.onsuccess       = () => resolve(request.result);
		request.onerror         = () => reject(request.error);
	});
	return open_promise;
}

// Run one read-or-write against the blob store and settle when it finishes.
function run_blob<T>(mode: IDBTransactionMode, body: (store: IDBObjectStore) => IDBRequest): Promise<T> {
	return open_blob_db().then((db) => new Promise<T>((resolve, reject) => {
		const tx      = db.transaction(BLOB_STORE, mode);
		const request = body(tx.objectStore(BLOB_STORE));
		tx.oncomplete = () => resolve(request.result as T);
		tx.onerror    = () => reject(tx.error);
	}));
}

export class DB_Local extends DB_Common {
	readonly storage = T_Storage.private;

	protected load_list<T>(record: T_Record): T[] {
		return preferences.readDB<T>(this.storage, record);
	}

	protected save_list<T>(record: T_Record, list: T[]): void {
		preferences.writeDB<T>(this.storage, record, list);
	}

	private blob_key(document_id: string): string {
		return `${this.storage}/blob/${document_id}`;
	}

	// Store a document's bytes, overwriting any already there.
	async write_blob(document_id: string, content: string): Promise<void> {
		const key = this.blob_key(document_id);
		if (!has_idb) { memory.set(key, content); return; }
		await run_blob<void>('readwrite', (store) => store.put(content, key));
		debug.log(`Stored bytes for "${key}" (${content.length} character(s)) in IndexedDB.`);
	}

	// Read a document's bytes, or null when nothing is stored.
	async read_blob(document_id: string): Promise<string | null> {
		const key = this.blob_key(document_id);
		if (!has_idb) { return memory.has(key) ? memory.get(key)! : null; }
		const held = await run_blob<string | undefined>('readonly', (store) => store.get(key));
		return held ?? null;
	}

	// Drop a document's bytes. A missing key is a no-op.
	async delete_blob(document_id: string): Promise<void> {
		const key = this.blob_key(document_id);
		if (!has_idb) { memory.delete(key); return; }
		await run_blob<void>('readwrite', (store) => store.delete(key));
	}

	// Drop every stored byte — the whole byte-database, so nothing survives no
	// matter what key or object store it was written under (old schemes included),
	// and the disk space is reclaimed at once. Our own connection is closed and
	// forgotten first (a delete is blocked while a connection is open), so the
	// next save re-opens a fresh, empty database. Reports which way it went, so a
	// block by another open tab is visible rather than silently masked.
	async clear_blobs(): Promise<number> {
		if (!has_idb) {
			const removed = memory.size;
			memory.clear();
			return removed;
		}
		if (open_promise) {
			const db = await open_promise;
			db.close();
			open_promise = null;
		}
		return new Promise<number>((resolve, reject) => {
			const request = indexedDB.deleteDatabase(BLOB_DB);
			request.onsuccess = () => { debug.log(`Deleted the whole byte-database "${BLOB_DB}" — every stored byte gone, space reclaimed.`); resolve(1); };
			request.onblocked = () => {
				const where = (typeof location !== 'undefined') ? location.host : 'this app';
				const message = `Couldn't clear the stored files — another browser tab still has this app open (${where}) and is holding the storage. Close your other tabs showing ${where}, then click erase again.`;
				debug.log(message);
				if (typeof alert !== 'undefined') { alert(message); }
				resolve(0);
			};
			request.onerror   = () => { debug.log(`Failed to delete "${BLOB_DB}": ${request.error?.message ?? 'unknown reason'}.`); reject(request.error); };
		});
	}
}
