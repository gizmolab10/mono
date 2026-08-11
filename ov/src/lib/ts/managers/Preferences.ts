import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

/**
 * Preferences — what the browser remembers between visits.
 *
 * A thin wrapper around the browser's own saved-settings store. Every name is
 * spelled the same way: the app's own "ov_" start, then the parts of the name
 * joined by underscores, plainest part first ("show_details", not "showDetails").
 * Each name below is the word it is saved under, so the code and the browser's
 * saved settings always match.
 *
 * ji carries a pile of renaming and sweeping code because it has years of saved
 * names to bring forward. Overview has none, so none of that is here.
 */

export enum T_Preference {
	// Layout
	details_open    = 'details_open',
	show_details    = 'show_details',

	// Colors
	color_accent    = 'color_accent',
	color_text      = 'color_text',

	// Filters on the guide list
	filter_project  = 'filter_project',
	filter_kind     = 'filter_kind',
	filter_tags     = 'filter_tags',
	tag_picking     = 'tag_picking',
	filter_text     = 'filter_text',

	// The guide list itself
	show_filters    = 'show_filters',
	filters_folded  = 'filters_folded',
	areas_open      = 'areas_open',
	folders_shut    = 'folders_shut',
	show_folders    = 'show_folders',
	sorts           = 'sorts',
	scroll_files_to = 'scroll_files_to',
	view_guide      = 'view_guide',
	current_op      = 'current_op',

	// Reading one guide
	show_labels     = 'show_labels',
	fold_titles     = 'fold_titles',
	show_search     = 'show_search',
	search_at       = 'search_at',

	// Putting things right
	includes_work   = 'includes_work',

	// The line along the bottom
	show_status     = 'show_status',
	status_words    = 'status_words',
}

// Every saved name of ours starts with this.
const STORAGE_PREFIX = 'ov_';

class Preferences {

	/** Read one saved setting. Nothing saved (or unreadable) reads as nothing. */
	read<T>(key: T_Preference): T | null {
		try {
			const raw = localStorage.getItem(STORAGE_PREFIX + key);
			if (raw == null || raw == 'undefined') { return null; }
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	/** Save one setting. */
	write<T>(key: T_Preference, value: T): void {
		try {
			localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
		} catch (e) {
			console.warn(`Could not save the "${key}" setting:`, e);
		}
	}

	/** Forget one setting. */
	remove(key: T_Preference): void {
		localStorage.removeItem(STORAGE_PREFIX + key);
	}

	/** Forget every setting this app saves. */
	clear(): void {
		for (const key of Object.values(T_Preference)) {
			this.remove(key);
		}
	}

	/**
	 * A value that remembers itself: starts at whatever was saved (or the fallback
	 * when nothing was), and saves again on every change.
	 */
	persistent<T>(key: T_Preference, fallback: T): Writable<T> {
		const saved = this.read<T>(key);
		const w = writable<T>(saved ?? fallback);
		w.subscribe((v) => this.write(key, v));
		return w;
	}

}

export const preferences = new Preferences();
