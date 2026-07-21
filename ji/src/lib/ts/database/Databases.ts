import { preferences, T_Preference } from '../managers/Preferences';
import { Hierarchy } from '../managers/Hierarchy';
import { T_Storage } from '../types/DB_Records';
import { db_changed } from '../types/Signal';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import { DB_Common } from './DB_Common';
import { DB_Local } from './DB_Local';

// One storage backend paired with the tree that owns its records.
interface Store {
	db        : DB_Common;
	hierarchy : Hierarchy;
}

// The registry. Holds one live backend-and-tree per storage, tracks which is
// active, remembers the choice, and rebuilds on a switch. Only the local storage
// is built now; the remote (firestore) slot is left open — adding it is one more
// case here plus its subclass, no base changes.

class Databases {
	private cache: Map<T_Storage, Store> = new Map();
	private ordered: T_Storage[] = [T_Storage.private];   // the ring; remote joins later

	w_storage: Writable<T_Storage>;
	// The active store's tree — where the records and every operation on them live.
	// A store, so views reach it as `$w_hierarchy.X`; its value changes only when
	// the active storage changes, never on an ordinary edit.
	w_hierarchy: Writable<Hierarchy>;
	// The active persistence backend — used for the document bytes (read_blob).
	active: DB_Common;

	constructor() {
		const saved = (preferences.read<T_Storage>(T_Preference.database) ?? T_Storage.private);
		const store = this.store_forBackend(saved);
		store.hierarchy.fetch_all();
		this.w_storage   = writable<T_Storage>(saved);
		this.active      = store.db;
		this.w_hierarchy = writable<Hierarchy>(store.hierarchy);
	}

	// One live backend-and-tree per storage, built on first use.
	private store_forBackend(storage: T_Storage): Store {
		if (!this.cache.has(storage)) {
			const db: DB_Common = new DB_Local();   // only the local backend for now
			this.cache.set(storage, { db, hierarchy: new Hierarchy(db) });
		}
		return this.cache.get(storage)!;
	}

	// Switch the active storage: make it active, load its data, save the choice.
	change_storage(storage: T_Storage): void {
		const store = this.store_forBackend(storage);
		store.hierarchy.fetch_all();
		this.active = store.db;
		preferences.write(T_Preference.database, storage);
		this.w_storage.set(storage);
		this.w_hierarchy.set(store.hierarchy);   // the active store's tree changed
		db_changed();                            // the active store's contents changed
	}

	// Step to the next storage in the ring.
	change_toNext(): void {
		const at = this.ordered.indexOf(this.active.storage);
		const next = this.ordered[(at + 1) % this.ordered.length];
		this.change_storage(next);
	}
}

export const databases = new Databases();

// The active store's tree, two ways to reach it:
//   - `$w_hierarchy` in a Svelte component (reactive; re-runs on a store switch)
//   - the plain `h` in ordinary code (Drop and the like), kept in step by the same store
export const w_hierarchy = databases.w_hierarchy;
export let h: Hierarchy;
w_hierarchy.subscribe((value) => { h = value; });
