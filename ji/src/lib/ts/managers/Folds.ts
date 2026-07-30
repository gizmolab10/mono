import { preferences, T_Preference } from './Preferences';
import type { Hierarchy } from './Hierarchy';
import { T_Storage } from '../types/DB_Records';
import { writable } from 'svelte/store';
import { debug } from '../common/Debug';

// Which folders are shut in the file list. Each store keeps its own set, held by that
// store's own hierarchy — so switching away and back brings the same folds back. My own
// store also saves its set for the next launch; the AI store's folds are never saved
// (its files come from elsewhere, so a remembered fold there would be a guess about a
// list this browser doesn't own).
export const w_folders_shut = writable<Set<string>>(new Set());

// The store whose folds are on screen, and its hierarchy — where changes are put back.
let folds_for : string | null    = null;
let keeper    : Hierarchy | null = null;

w_folders_shut.subscribe((shut) => {
	if (folds_for === null || keeper === null) { return; }
	keeper.folders_shut = new Set(shut);
	if (folds_for === T_Storage.private) {
		preferences.write(T_Preference.my_folders_collapsed, Array.from(shut));
	}
});

// Bring out the folds for one store, from its own hierarchy. The first time my store's
// hierarchy is used, its set is filled from what was saved; every other store starts with
// nothing shut and keeps whatever it is given for as long as the app runs.
export function load_folds_forStorage(storage: string, hierarchy: Hierarchy): void {
	folds_for = null;
	keeper    = hierarchy;
	if (!hierarchy.folds_restored) {
		const saved = (storage === T_Storage.private)
			? (preferences.read<string[]>(T_Preference.my_folders_collapsed) ?? [])
			: [];
		hierarchy.folders_shut  = new Set(saved);
		hierarchy.folds_restored = true;
		debug.log(`Shut folders for the "${storage}" storage: filled in for the first time with ${saved.length}${storage === T_Storage.private ? ' from what was saved' : ' (nothing shut — this store never saves its folds)'}.`);
	} else {
		debug.log(`Shut folders for the "${storage}" storage: ${hierarchy.folders_shut.size} brought back from the last time this store was on screen.`);
	}
	w_folders_shut.set(new Set(hierarchy.folders_shut));
	folds_for = storage;
}
