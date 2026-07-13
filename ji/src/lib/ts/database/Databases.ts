import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import { DB_Common } from './DB_Common';
import { DB_Local } from './DB_Local';
import { T_Backend } from './DB_Records';
import { preferences, T_Preference } from '../managers/Preferences';

// The registry. Holds one live backend instance per kind, tracks which is
// active, remembers the choice, and rebuilds on a switch. Only the local
// backend is built now; the remote (firestore) slot is left open — adding it
// is one more case here plus its subclass, no base changes.

class Databases {
	private cache: Map<T_Backend, DB_Common> = new Map();
	private ordered: T_Backend[] = [T_Backend.local];   // the ring; remote joins later

	w_backend: Writable<T_Backend>;
	active: DB_Common;

	constructor() {
		const saved = (preferences.read<T_Backend>(T_Preference.database) ?? T_Backend.local);
		this.w_backend = writable<T_Backend>(saved);
		this.active = this.db_forBackend(saved);
		this.active.fetch_all();
		console.log(`Database registry started on the ${saved} backend.`);
	}

	// One live instance per backend, built on first use.
	db_forBackend(backend: T_Backend): DB_Common {
		if (!this.cache.has(backend)) {
			switch (backend) {
				case T_Backend.local: this.cache.set(backend, new DB_Local()); break;
				// case T_Backend.remote: firestore backend — future
				default:              this.cache.set(backend, new DB_Local()); break;
			}
		}
		return this.cache.get(backend)!;
	}

	// Switch the active backend: make it active, load its data, save the choice.
	change_backend(backend: T_Backend): void {
		this.active = this.db_forBackend(backend);
		this.active.fetch_all();
		preferences.write(T_Preference.database, backend);
		this.w_backend.set(backend);
		console.log(`Switched to the ${backend} backend.`);
	}

	// Step to the next backend in the ring.
	change_toNext(): void {
		const at = this.ordered.indexOf(this.active.backend);
		const next = this.ordered[(at + 1) % this.ordered.length];
		this.change_backend(next);
	}
}

export const databases = new Databases();
