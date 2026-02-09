/**
 * Preferences — persistent storage for user settings
 * 
 * Simple localStorage wrapper with type-safe keys.
 * All keys are prefixed with 'di:' for namespace isolation.
 */

export enum T_Preference {
	// Layout
	showDetails  = 'showDetails',
	detailsWidth = 'detailsWidth',
	
	// Colors
	textColor       = 'textColor',
	separatorColor  = 'separatorColor',
	backgroundColor = 'backgroundColor',

	// Units
	unitSystem = 'unitSystem',

	// View
	viewMode         = 'viewMode',
	precision        = 'precision',
	showDimensionals = 'showDimensionals',
	solid            = 'solid',
	lineThickness    = 'lineThickness',

	// Scenes
	scene = 'scene',
}

const STORAGE_PREFIX = 'di:';

class Preferences {
	
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
	 * Clear all di preferences
	 */
	clear() : void {
		const keys = Object.values(T_Preference);
		for (const key of keys) {
			this.remove(key);
		}
	}

	/**
	 * Debug: dump all di preferences to console
	 */
	dump() : void {
		const keys  = Object.values(T_Preference);
		const prefs : Record<string, unknown> = {};
		for (const key of keys) {
			prefs[key] = this.read(key);
		}
		console.log('Preferences:', prefs);
	}
}

export const preferences = new Preferences();
