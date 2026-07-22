import { preferences, T_Preference } from './Preferences';

export enum T_Operation {
	document = 'add new document',
	view     = 'view document',
	tag      = 'add new tag',
}

// The current operation (which view the content area shows), or null when none
// is selected — clicking the active segment clears it and the content falls back
// to the arrival landing.
export type T_Search_Op = 'enter' | 'taqs' | 'search';
export type T_Add_Op = 'documents' | 'tag' | 'submit';

export const w_operation = preferences.persistent<T_Operation | null>(T_Preference.current_op, null);

// Which document the "view" operation is showing. Persisted, so a reload returns to
// the same open document; if that document is gone, the view falls back to the list.
export const w_view_document = preferences.persistent<string | null>(T_Preference.viewDocument, null);

// No operation means no open document — leaving every view drops what it pointed at.
w_operation.subscribe((op) => { if (op === null) { w_view_document.set(null); } });
