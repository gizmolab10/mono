import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import { DB_Common } from './DB_Common';
import { DB_Local } from './DB_Local';
import { T_Storage } from './DB_Records';
import { preferences, T_Preference } from '../managers/Preferences';

// The registry. Holds one live storage instance per kind, tracks which is
// active, remembers the choice, and rebuilds on a switch. Only the local
// storage is built now; the remote (firestore) slot is left open — adding it
// is one more case here plus its subclass, no base changes.

class Databases {
	private cache: Map<T_Storage, DB_Common> = new Map();
	private ordered: T_Storage[] = [T_Storage.local];   // the ring; remote joins later

	w_storage: Writable<T_Storage>;
	active: DB_Common;

	constructor() {
		const saved = (preferences.read<T_Storage>(T_Preference.database) ?? T_Storage.local);
		this.w_storage = writable<T_Storage>(saved);
		this.active = this.db_forBackend(saved);
		this.active.fetch_all();
		// console.log(`Database registry started on the ${saved} storage.`);
	}

	// One live instance per storage, built on first use.
	db_forBackend(storage: T_Storage): DB_Common {
		if (!this.cache.has(storage)) {
			switch (storage) {
				case T_Storage.local: this.cache.set(storage, new DB_Local()); break;
				// case T_Storage.firebase: firestore storage — future
				default:              this.cache.set(storage, new DB_Local()); break;
			}
		}
		return this.cache.get(storage)!;
	}

	// Switch the active storage: make it active, load its data, save the choice.
	change_storage(storage: T_Storage): void {
		this.active = this.db_forBackend(storage);
		this.active.fetch_all();
		preferences.write(T_Preference.database, storage);
		this.w_storage.set(storage);
		// console.log(`Switched to the ${storage} storage.`);
	}

	// Step to the next storage in the ring.
	change_toNext(): void {
		const at = this.ordered.indexOf(this.active.storage);
		const next = this.ordered[(at + 1) % this.ordered.length];
		this.change_storage(next);
	}
}

export const databases = new Databases();
