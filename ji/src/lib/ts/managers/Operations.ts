import { preferences, T_Preference } from './Preferences';
import { T_Operation } from '../common/Enumerations';

// The current operation (which view the content area shows), or null when none
// is selected — clicking the active segment clears it and the content falls back
// to the arrival landing. A saved null reads back as the add default on reload.
export type T_Search_Op = 'enter' | 'taqs' | 'search';
export type T_Add_Op = 'documents' | 'tag' | 'submit';

export const w_operation = preferences.persistent<T_Operation | null>(T_Preference.current_op, T_Operation.add);
