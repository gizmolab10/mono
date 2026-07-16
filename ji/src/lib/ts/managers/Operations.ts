import { preferences, T_Preference } from './Preferences';
import { writable } from 'svelte/store';

export enum T_Operation {
	document = 'add new document',
	tag      = 'add new tag',
	view     = 'view document',
}

// The current operation (which view the content area shows), or null when none
// is selected — clicking the active segment clears it and the content falls back
// to the arrival landing.
export type T_Search_Op = 'enter' | 'taqs' | 'search';
export type T_Add_Op = 'documents' | 'tag' | 'submit';

export const w_operation = preferences.persistent<T_Operation | null>(T_Preference.current_op, null);

// Which document the "view" operation is showing. Not persisted — a reload lands
// back on the list, so a view never outlives the bytes it points at.
export const w_view_document = writable<string | null>(null);
