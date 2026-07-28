import { w_operation, T_Operation } from '../managers/Operations';
import { preferences, T_Preference } from '../managers/Preferences';
import { Hierarchy } from '../managers/Hierarchy';
import { T_Storage } from '../types/DB_Records';
import { refresh_llm_docs, clear_llm_docs, start_llm_heartbeat, stop_llm_heartbeat } from './LLM_Docs';
import { db_changed, w_db_changed } from '../types/Signal';
import type { Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';
import { DB_Common } from './DB_Common';
import { DB_Local } from './DB_Local';
import { DB_LLM } from './DB_LLM';

// True while the active store's records are being fetched in (the AI store reads them from
// AnythingLLM a moment after launch). Screens hold off "the store is empty" decisions until it
// clears, so a not-yet-loaded store isn't mistaken for an empty one.
export const w_hierarchy_loading = writable<boolean>(false);

// One storage backend paired with the hierarchy that owns its records.
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
	private ordered: T_Storage[] = [T_Storage.private, T_Storage.llm];   // the ring the "next" step cycles through

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
		// On the AI store, read back what AnythingLLM holds so the count is right from the
		// first paint, whatever view is showing; if its two settings are missing, open the
		// screen that asks for them.
		if (saved === T_Storage.llm) {
			refresh_llm_docs();
			start_llm_heartbeat();   // notice an idle connection drop even when nothing's calling
			this.reload_after_prime(store);   // its records come from AnythingLLM, fetched now
			if (this.llm_creds_missing()) { w_operation.set(T_Operation.init); }
		}
	}

	// The AI store's records live in AnythingLLM. Fetch them into memory, then refill the
	// hierarchy from what arrived and redraw. A no-op prime (local stores) leaves things as-is.
	private reload_after_prime(store: Store): void {
		w_hierarchy_loading.set(true);
		store.db.prime().then(() => {
			store.hierarchy.fetch_all();
			this.w_hierarchy.set(store.hierarchy);
			db_changed();
		}).finally(() => w_hierarchy_loading.set(false));
	}

	// The AI store needs two stored settings — the address pointer and the share token —
	// to reach AnythingLLM. Missing either means the store can't work, so the init screen
	// asks for them.
	private llm_creds_missing(): boolean {
		const pointer = preferences.read<string>(T_Preference.llmPointer)?.trim();
		const key     = preferences.read<string>(T_Preference.llmKey)?.trim();
		return !pointer || !key;
	}

	// One live backend-and-tree per storage, built on first use.
	private store_forBackend(storage: T_Storage): Store {
		if (!this.cache.has(storage)) {
			// The LLM store is its own backend (local for now, AnythingLLM hooks later);
			// every other storage is the plain local backend under its own namespace.
			const db: DB_Common = storage === T_Storage.llm ? new DB_LLM() : new DB_Local(storage);
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
		// Switching onto the AI store reads back what AnythingLLM holds, and opens the init
		// screen if its two settings are missing; leaving it forgets those docs and drops
		// the init screen (it means nothing off the AI store).
		if (storage === T_Storage.llm) {
			refresh_llm_docs();
			start_llm_heartbeat();   // notice an idle connection drop even when nothing's calling
			this.reload_after_prime(store);   // its records come from AnythingLLM, fetched now
			if (this.llm_creds_missing()) { w_operation.set(T_Operation.init); }
		} else {
			clear_llm_docs();
			stop_llm_heartbeat();
			if (get(w_operation) === T_Operation.init) { w_operation.set(T_Operation.files); }
		}
		// "ask" only works on the LLM store — leaving it drops the user back to the list.
		if (storage !== T_Storage.llm && get(w_operation) === T_Operation.chat) {
			w_operation.set(T_Operation.files);
		}
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

// Which storage is active, reachable as `$w_storage` in a component.
export const w_storage = databases.w_storage;

// The list view is disabled when the active hierarchy holds no documents — the drop box takes
// its place so the first one can be added. Enforced here (not in the list view) so it holds
// whatever asked for the list: the operations pill, a help link, a background click, closing the
// viewer. Held while the store is still loading its records, so a not-yet-loaded store isn't
// mistaken for an empty one. Re-checked when the operation changes, when loading finishes, and
// when the store's contents change (so deleting the last document drops to the drop box too).
function enforce_list_or_drop(): void {
	if (get(w_hierarchy_loading)) { return; }
	const op = get(w_operation);
	const shows_list = op === null || op === T_Operation.files;
	if (shows_list && h && h.documents.length === 0) {
		w_operation.set(T_Operation.drop);
	}
}
w_operation.subscribe(() => enforce_list_or_drop());
w_hierarchy_loading.subscribe(() => enforce_list_or_drop());
w_db_changed.subscribe(() => enforce_list_or_drop());
