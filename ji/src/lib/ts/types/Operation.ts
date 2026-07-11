import { preferences, T_Preference } from '../managers/Preferences';

// Which view (operation) the content area shows. Persisted, so it survives a
// reload. 'search' is reserved for a later phase; only 'browse' and 'add' have
// views now.
export type T_Operation = 'browse' | 'add' | 'search';

export const w_operation = preferences.persistent<T_Operation>(T_Preference.current_op, 'browse');
