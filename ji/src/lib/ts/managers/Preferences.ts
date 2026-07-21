import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

/**
 * Preferences — persistent storage for user settings
 *
 * Simple localStorage wrapper with type-safe keys.
 * All keys are prefixed with 'ji:' for namespace isolation.
 */

export enum T_Preference {
	// Layout
	showDetails  	= 'showDetails',
	detailsPreferencesOpen = 'detailsPreferencesOpen',
	detailsDataOpen        = 'detailsDataOpen',

	// Colors
	accentColor     = 'accentColor',
	textColor       = 'textColor',

	// Content
	current_op      = 'current_op',
	closedFolders   = 'closedFolders',

	// Database
	database         = 'database',
	showOtherStores  = 'showOtherStores',

}

const STORAGE_PREFIX = 'ji:';

class Preferences {

	apply_queryStrings(queryStrings: URLSearchParams): void {
		const clear_options = queryStrings.get('clear')?.split(',') ?? [];
		if (clear_options.includes('preferences')) {
			preferences.reset();
		}
	}

	/**
	 * Read a preference from localStorage
	 */
	read<T>(key : T_Preference) : T | null {
		try {
			const raw = localStorage.getItem(STORAGE_PREFIX + key);
			if (raw == null || raw == 'undefined') {
				return null;
			}
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	/**
	 * Write a preference to localStorage
	 */
	write<T>(key : T_Preference, value : T) : void {
		try {
			const json = JSON.stringify(value);
			localStorage.setItem(STORAGE_PREFIX + key, json);
		} catch (e) {
			console.warn(`Failed to write preference ${key}:`, e);
		}
	}

	/**
	 * Remove a preference from localStorage
	 */
	remove(key : T_Preference) : void {
		localStorage.removeItem(STORAGE_PREFIX + key);
	}

	/**
	 * Clear all ji preferences
	 */
	clear() : void {
		const keys = Object.values(T_Preference);
		for (const key of keys) {
			this.remove(key);
		}
	}

	/**
	 * Reset preferences to defaults (removes every stored key)
	 */
	reset() : void {
		for (const key of Object.values(T_Preference)) {
			this.remove(key);
		}
	}

	/**
	 * Debug: dump all ji preferences to console
	 */
	dump() : void {
		const keys  = Object.values(T_Preference);
		const prefs : Record<string, unknown> = {};
		for (const key of keys) {
			prefs[key] = this.read(key);
		}
	}

	/**
	 * Read one stored list for a record kind, namespaced by the active storage so
	 * two storages never collide. Returns an empty array when nothing is stored.
	 */
	readDB<T>(storage: string, record: string): T[] {
		try {
			const raw = localStorage.getItem(`${STORAGE_PREFIX}${storage}/${record}`);
			if (raw == null || raw == 'undefined') { return []; }
			return JSON.parse(raw) as T[];
		} catch {
			return [];
		}
	}

	/** Write one record kind's whole list back, namespaced by the active storage. */
	writeDB<T>(storage: string, record: string, list: T[]): void {
		try {
			localStorage.setItem(`${STORAGE_PREFIX}${storage}/${record}`, JSON.stringify(list));
		} catch (e) {
			console.warn(`Failed to save the ${record} list for the ${storage} storage:`, e);
		}
	}

	/** Remove one record kind's stored list for a storage. */
	removeDB(storage: string, record: string): void {
		localStorage.removeItem(`${STORAGE_PREFIX}${storage}/${record}`);
	}

	persistent<T>(key: T_Preference, fallback: T): Writable<T> {
		const w = writable<T>(this.read<T>(key) ?? fallback);
		w.subscribe((v) => this.write(key, v));
		return w;
	}

	persistent_set(key: T_Preference): Writable<Set<string>> {
		const initial = this.read<string[]>(key) ?? [];
		const w = writable<Set<string>>(new Set(initial));
		w.subscribe((s) => this.write(key, Array.from(s)));
		return w;
	}

}

export const preferences = new Preferences();
