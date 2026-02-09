import { preferences, T_Preference } from './Preferences';
import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Smart_Object } from '../runtime';

function persistent<T>(key: T_Preference, fallback: T): Writable<T> {
	const w = writable<T>(preferences.read<T>(key) ?? fallback);
	w.subscribe((v) => preferences.write(key, v));
	return w;
}

class Stores {

	// Session (reset on setup)
	w_scale = writable<number>(1);
	w_root_so = writable<Smart_Object | null>(null);
	w_all_sos = writable<Smart_Object[]>([]);

	// Persistent
	w_show_dimensionals = persistent<boolean>(T_Preference.showDimensionals, true);
	w_view_mode = persistent<'2d' | '3d'>(T_Preference.viewMode, '3d');
	w_precision = persistent<number>(T_Preference.precision, 0);
	w_solid = persistent<boolean>(T_Preference.solid, true);

	// Synchronous readers (for non-reactive contexts like Render)
	show_dimensionals(): boolean { return get(this.w_show_dimensionals); }
	current_view_mode(): '2d' | '3d' { return get(this.w_view_mode); }
	current_precision(): number { return get(this.w_precision); }
	is_solid(): boolean { return get(this.w_solid); }

	// Toggles
	toggle_dimensionals(): void { this.w_show_dimensionals.update(v => !v); }
	toggle_solid(): void { this.w_solid.update(v => !v); }

}

export const stores = new Stores();
