import { T_Storage, T_Record } from '../types/DB_Records';
import { T_Details } from '../types/Details';
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import { debug } from '../common/Debug';

/**
 * Preferences — persistent storage for user settings
 *
 * Simple localStorage wrapper with type-safe keys.
 * All keys are prefixed with 'ji:' for namespace isolation.
 */

// Every name is spelled the same way: the app's own "ji:" start, then the parts of
// the name joined by underscores, plainest part first ("show_details", not
// "showDetails"). A storage's own data reads the same way — "ji:mine_documents",
// "ji:ai_filter_tags" — so nothing has to remember two spellings. Each name here is
// the word it is saved under, so the code and the browser's saved settings match.
export enum T_Preference {
	// Layout
	details_open             = 'details_open',
	show_details             = 'show_details',
	mode                     = 'mode',

	// Colors
	color_accent    = 'color_accent',
	color_text      = 'color_text',

	// Content
	view_document      = 'view_document',
	current_op         = 'current_op',
	scroll_files_to    = 'scroll_files_to',
	my_folders_collapsed = 'my_folders_collapsed',
	format_families    = 'format_families',
	filter_tags        = 'filter_tags',
	filter_text        = 'filter_text',
	filter_mode        = 'filter_mode',
	show_chat_replies  = 'show_chat_replies',

	// Help
	help_page       = 'help_page',
	help_sidebar    = 'help_sidebar',

	// Database
	db              = 'db',
	show_stores     = 'show_stores',

	// The connection to a running AnythingLLM — the AI store's own settings
	ai_url          = 'ai_url',
	ai_key          = 'ai_key',
	ai_workspace    = 'ai_workspace',
	ai_docs_map     = 'ai_docs_map',
	ai_pointer      = 'ai_pointer',

}

// Every saved name of ours starts with this, and the rest of the name is parts joined
// by underscores — so the whole name reads one way, marker included.
const STORAGE_PREFIX = 'ji_';

// What the marker used to be. Only the rename step below still looks for it.
const FORMER_PREFIX = 'ji:';

// Where a value goes when its new name is already taken: kept aside, under a name that
// says so, rather than thrown away. The sweep leaves these alone. Nothing about the app
// reads them — they are there so a rename can never lose anything.
const RESCUED_PREFIX = `${STORAGE_PREFIX}rescued_`;

// The settings each storage keeps its own copy of, so they are saved under the
// storage's word and never under the app's name alone (the four list filters).
const PER_STORAGE_SETTINGS: T_Preference[] = [
	T_Preference.filter_tags,
	T_Preference.filter_text,
	T_Preference.filter_mode,
	T_Preference.format_families,
];

// What the app used to save each setting under, before the names were all spelled
// the one way. Walked at launch, ahead of the sweep, so the data moves across
// instead of reading as unknown and being removed. Once every browser has launched
// once, this table has nothing left to do and can go.
const RENAMED_SETTINGS: Record<string, T_Preference> = {
	showDetails            : T_Preference.show_details,
	appMode                : T_Preference.mode,
	accentColor            : T_Preference.color_accent,
	textColor              : T_Preference.color_text,
	viewDocument           : T_Preference.view_document,
	tableTopId             : T_Preference.scroll_files_to,
	collapsed              : T_Preference.my_folders_collapsed,
	showChatReplies        : T_Preference.show_chat_replies,
	helpPage               : T_Preference.help_page,
	helpSidebar            : T_Preference.help_sidebar,
	database               : T_Preference.db,
	showOtherStores        : T_Preference.show_stores,
	llmUrl                 : T_Preference.ai_url,
	llmKey                 : T_Preference.ai_key,
	llmWorkspace           : T_Preference.ai_workspace,
	llmDocMap              : T_Preference.ai_docs_map,
	llmPointer             : T_Preference.ai_pointer,
};

// Names already spelled the one way, under the current start, that have since been given
// a clearer word. Walked with the rest, so a browser that saved the earlier word keeps
// what it held.
// The details region used to save one open/shut flag per section. Both are now one list
// of the sections that are open, so these are the flags to fold in and clear. Each pair
// is the name it was saved under and the section it spoke for.
const FORMER_DETAILS_FLAGS: Array<{ name: string; section: T_Details }> = [
	{ name: `${FORMER_PREFIX}detailsPreferencesOpen`,   section: T_Details.preferences },
	{ name: `${FORMER_PREFIX}detailsDataOpen`,          section: T_Details.data },
	{ name: `${STORAGE_PREFIX}details_preferences_open`, section: T_Details.preferences },
	{ name: `${STORAGE_PREFIX}details_data_open`,        section: T_Details.data },
];

const RENAMED_AGAIN: Record<string, T_Preference> = {
	table_top         : T_Preference.scroll_files_to,
	files_scroll_to   : T_Preference.scroll_files_to,
	folders_collapsed : T_Preference.my_folders_collapsed,
};

// The same, for what a storage saves under its own word: the old spelling put the
// storage's word and the part either side of a slash, and one part has been renamed.
const RENAMED_PER_STORAGE: Record<string, T_Preference> = {
	filter_tags : T_Preference.filter_tags,
	filter_text : T_Preference.filter_text,
	filter_mode : T_Preference.filter_mode,
	families    : T_Preference.format_families,
};

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
	 * The name a storage saves one part of its own data under — its word lowercased,
	 * then the part, joined by an underscore like every other name ("ji:mine_documents",
	 * "ji:ai_filter_tags"). Lowercasing puts the AI store's data and the AI connection
	 * settings under the one word.
	 */
	name_forStorage(storage: string, part: string): string {
		return `${STORAGE_PREFIX}${storage.toLowerCase()}_${part}`;
	}

	/**
	 * Read one stored list for a record kind, saved under the storage's own word so
	 * two storages never collide. Returns an empty array when nothing is stored.
	 */
	readDB<T>(storage: string, record: string): T[] {
		try {
			const raw = localStorage.getItem(this.name_forStorage(storage, record));
			if (raw == null || raw == 'undefined') { return []; }
			return JSON.parse(raw) as T[];
		} catch {
			return [];
		}
	}

	/** Write one record kind's whole list back, under the storage's own word. */
	writeDB<T>(storage: string, record: string, list: T[]): void {
		try {
			localStorage.setItem(this.name_forStorage(storage, record), JSON.stringify(list));
		} catch (e) {
			console.warn(`Failed to save the ${record} list for the ${storage} storage:`, e);
		}
	}

	/** Remove one record kind's stored list for a storage. */
	removeDB(storage: string, record: string): void {
		localStorage.removeItem(this.name_forStorage(storage, record));
	}

	/**
	 * Every name the app still uses. Three kinds: a plain setting under the app's own
	 * name; one storage's record list; and one storage's copy of a per-storage setting.
	 * The sweep below removes anything else the app finds saved.
	 */
	valid_names(): Set<string> {
		const names = new Set<string>();
		for (const setting of Object.values(T_Preference)) {
			if (!PER_STORAGE_SETTINGS.includes(setting)) { names.add(STORAGE_PREFIX + setting); }
		}
		for (const storage of Object.values(T_Storage)) {
			for (const record of Object.values(T_Record)) { names.add(this.name_forStorage(storage, record)); }
			for (const setting of PER_STORAGE_SETTINGS) { names.add(this.name_forStorage(storage, setting)); }
		}
		return names;
	}

	/**
	 * Move one saved value from an old name to its new one, never losing it. Nothing under
	 * the old name means nothing to do. If the new name is already taken, the value there
	 * stands and the old value is kept aside under a "rescued" name instead of being thrown
	 * away — so a rename can be wrong without costing anything.
	 */
	private rename_one(from: string, to: string): 'moved' | 'rescued' | 'nothing' {
		const held = localStorage.getItem(from);
		if (held == null) { return 'nothing'; }
		if (localStorage.getItem(to) != null) {
			const aside = RESCUED_PREFIX + from;
			localStorage.setItem(aside, held);
			localStorage.removeItem(from);
			debug.log(`"${to}" was already taken, so the older "${from}" was not moved onto it — its ${held.length} character(s) are kept aside as "${aside}" and can be put back by hand.`);
			return 'rescued';
		}
		localStorage.setItem(to, held);
		localStorage.removeItem(from);
		debug.log(`Renamed the saved setting "${from}" to "${to}" — ${held.length} character(s) moved across, nothing lost.`);
		return 'moved';
	}

	/**
	 * Bring every saved name up to the one spelling, keeping its data. Three passes, in
	 * this order: the plain settings that ran their words together; everything a storage
	 * saved with a slash; and then the marker itself — anything still starting with the
	 * old "ji:" moves to the same name under "ji_". Runs before anything reads a setting,
	 * so renamed data is never mistaken for unknown and never read as missing.
	 */
	/**
	 * Fold the details region's two old open/shut flags into the one list of open sections.
	 * Runs only while an old flag is still saved, and only if the list isn't there yet. A
	 * section whose flag was never saved counts as open — that was the old first-time state.
	 */
	private merge_details_open(): void {
		const saved = FORMER_DETAILS_FLAGS.filter((flag) => localStorage.getItem(flag.name) != null);
		if (saved.length === 0) { return; }
		if (localStorage.getItem(STORAGE_PREFIX + T_Preference.details_open) == null) {
			const open: T_Details[] = [];
			for (const section of Object.values(T_Details)) {
				const flag = saved.find((f) => f.section === section);
				const was_open = flag == null ? true : localStorage.getItem(flag.name) === 'true';
				if (was_open) { open.push(section); }
			}
			this.write(T_Preference.details_open, open);
			debug.log(`Details sections: folded ${saved.length} old open/shut flag(s) into one list — open now [${open.join(', ')}]${open.length === 0 ? ' (both shut)' : ''}.`);
		}
		for (const flag of saved) { localStorage.removeItem(flag.name); }
	}

	rename_saved_names(): number {
		this.merge_details_open();
		let moved = 0, rescued = 0;
		const count = (how: 'moved' | 'rescued' | 'nothing') => {
			if (how === 'moved')   { moved   += 1; }
			if (how === 'rescued') { rescued += 1; }
		};
		for (const [was, now] of Object.entries(RENAMED_SETTINGS)) {
			count(this.rename_one(FORMER_PREFIX + was, STORAGE_PREFIX + now));
		}
		for (const [was, now] of Object.entries(RENAMED_AGAIN)) {
			count(this.rename_one(STORAGE_PREFIX + was, STORAGE_PREFIX + now));
		}
		for (const storage of Object.values(T_Storage)) {
			for (const record of Object.values(T_Record)) {
				count(this.rename_one(`${FORMER_PREFIX}${storage}/${record}`, this.name_forStorage(storage, record)));
			}
			for (const [was, now] of Object.entries(RENAMED_PER_STORAGE)) {
				count(this.rename_one(`${FORMER_PREFIX}${storage}/${was}`, this.name_forStorage(storage, now)));
			}
		}
		// The marker pass: whatever is left under the old marker keeps its name and changes
		// only its start. Collected first, since renaming shifts what a walk would see.
		const under_old_marker: string[] = [];
		for (let at = 0; at < localStorage.length; at++) {
			const name = localStorage.key(at);
			if (name != null && name.startsWith(FORMER_PREFIX)) { under_old_marker.push(name); }
		}
		for (const name of under_old_marker) {
			count(this.rename_one(name, STORAGE_PREFIX + name.slice(FORMER_PREFIX.length)));
		}
		debug.log(`Renamed the saved settings: ${moved} moved to a new name, ${rescued} kept aside because the new name was already taken, ${under_old_marker.length} of them from the old "${FORMER_PREFIX}" start to "${STORAGE_PREFIX}". All zeros means every name was already spelled the one way.`);
		return moved;
	}

	/**
	 * Remove every saved name of ours the app no longer uses — leftovers from schemes
	 * since dropped, and anything hand-planted. Only names under the app's own start are
	 * considered, so another app's settings are never touched; anything kept aside by a
	 * rename is left alone; the document bytes live in a different store and aren't in
	 * scope. Says what it removed, by name and size, so the sweep can be read rather
	 * than trusted.
	 */
	sweep_unknown_names(): number {
		this.rename_saved_names();   // first, so data under an old name moves instead of being removed
		const valid = this.valid_names();
		const ours: string[]  = [];
		const stale: string[] = [];
		for (let at = 0; at < localStorage.length; at++) {
			const name = localStorage.key(at);
			if (name == null || !name.startsWith(STORAGE_PREFIX)) { continue; }
			if (name.startsWith(RESCUED_PREFIX)) { continue; }   // kept aside by a rename — never swept
			ours.push(name);
			if (!valid.has(name)) { stale.push(name); }
		}
		let characters = 0;
		for (const name of stale) {
			const held = localStorage.getItem(name)?.length ?? 0;
			characters += held;
			localStorage.removeItem(name);
			debug.log(`Removed the saved setting "${name}" — the app has no such name any more; it held ${held} character(s).`);
		}
		debug.log(`Swept the saved settings: ${ours.length} of ours found, ${stale.length} removed (${characters} character(s) reclaimed), ${ours.length - stale.length} kept; ${valid.size} name(s) count as valid.`);
		return stale.length;
	}

	/**
	 * Read a setting that belongs to one storage only, so two storages never share it
	 * (the file-list filters work this way — "mine" and "AI" each keep their own).
	 */
	read_forStorage<T>(storage: string, key: T_Preference): T | null {
		try {
			const raw = localStorage.getItem(this.name_forStorage(storage, key));
			if (raw == null || raw == 'undefined') { return null; }
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	/** Write a setting that belongs to one storage only. */
	write_forStorage<T>(storage: string, key: T_Preference, value: T): void {
		try {
			localStorage.setItem(this.name_forStorage(storage, key), JSON.stringify(value));
		} catch (e) {
			console.warn(`Failed to write the ${key} preference for the ${storage} storage:`, e);
		}
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

// Bring the saved names up to date, then clear out the ones the app no longer uses —
// here, as this file is read, rather than in the launch code. Everything that reads a
// setting reaches it through this file, so this always runs first; done later, the
// screens would already have read the new names and found them empty (which is exactly
// what went wrong once). Guarded for the tests, where a browser store may not exist yet.
if (typeof localStorage !== 'undefined') {
	preferences.sweep_unknown_names();
}
