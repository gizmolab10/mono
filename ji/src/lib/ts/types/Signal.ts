import { writable } from 'svelte/store';

// A tiny "the store changed" tick. The store bumps it after every save; any view
// showing store contents subscribes and re-reads. Kept in its own file so the
// base can bump it without importing the registry (which would be a cycle).

export const w_db_changed = writable(0);

export function db_changed(): void {
	w_db_changed.update((n) => n + 1);
}
