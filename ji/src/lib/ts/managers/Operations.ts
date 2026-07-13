import { preferences, T_Preference } from './Preferences';

export enum T_Operation {
	document = 'add new document',
	tag      = 'add new tag',
}

// The current operation (which view the content area shows), or null when none
// is selected — clicking the active segment clears it and the content falls back
// to the arrival landing.
export type T_Search_Op = 'enter' | 'taqs' | 'search';
export type T_Add_Op = 'documents' | 'tag' | 'submit';

export const w_operation = preferences.persistent<T_Operation | null>(T_Preference.current_op, null);
