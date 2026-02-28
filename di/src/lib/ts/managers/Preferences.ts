/**
 * Preferences — persistent storage for user settings
 * 
 * Simple localStorage wrapper with type-safe keys.
 * All keys are prefixed with 'di:' for namespace isolation.
 */

export enum T_Preference {
	// Layout
	detailsWidth 	= 'detailsWidth',
	showDetails  	= 'showDetails',
	
	// Colors
	backgroundColor = 'backgroundColor',
	accentColor     = 'accentColor',
	textColor       = 'textColor',

	// Units
	unitSystem 		= 'unitSystem',

	// Hideables
	visibleDetails   = 'visibleDetails',

	// View
	decorations      = 'decorations',
	lineThickness    = 'lineThickness',
	precision        = 'precision',
	edgeColor        = 'edgeColor',
	viewMode         = 'viewMode',
	solid            = 'solid',
	showGrid         = 'showGrid',
	gridOpacity      = 'gridOpacity',

	// Render
	orientation      = 'orientation',
	scale            = 'scale',

	// Scenes
	scene = 'scene',

	// Library
	library = 'library',
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
	 * Reset preferences to defaults (preserves scene and library data)
	 */
	reset() : void {
		const preserve = new Set([T_Preference.scene, T_Preference.library]);
		for (const key of Object.values(T_Preference)) {
			if (!preserve.has(key)) this.remove(key);
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
