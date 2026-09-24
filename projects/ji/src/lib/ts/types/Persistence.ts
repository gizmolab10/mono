import { T_Record } from './DB_Records';

// Per-record bookkeeping, held only in memory (never saved). It tracks which
// records still need saving, grouped by record kind. A local storage re-saves
// every record and just clears this; a remote storage saves only what is dirty.
// The last-modified date lives on the Document record itself, so it survives a
// reload — this object holds only the throwaway dirty state.

export class Persistence {
	private dirty_ids: Map<T_Record, Set<string>> = new Map();

	// Mark one record of a kind as needing a save.
	mark_dirty(record: T_Record, id: string): void {
		if (!this.dirty_ids.has(record)) { this.dirty_ids.set(record, new Set()); }
		this.dirty_ids.get(record)!.add(id);
	}

	// The ids of one kind that still need saving.
	dirty_forRecord(record: T_Record): string[] {
		return Array.from(this.dirty_ids.get(record) ?? []);
	}

	// Total count still needing a save, across every kind — drives a save button.
	get total_dirty_count(): number {
		let count = 0;
		for (const set of this.dirty_ids.values()) { count += set.size; }
		return count;
	}

	// Forget the dirty state for one kind (called after that kind is written).
	clear(record: T_Record): void {
		this.dirty_ids.get(record)?.clear();
	}

	// Forget everything (called when a fresh in-memory model is handed over).
	clear_all(): void {
		this.dirty_ids.clear();
	}
}
