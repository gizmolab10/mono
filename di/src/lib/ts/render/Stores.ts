import { preferences, T_Preference } from '../managers/Preferences';
import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { Smart_Object } from '../runtime';

// ============================================
// PERSISTENT STORE HELPER
// ============================================

function persistent<T>(key: T_Preference, fallback: T): Writable<T> {
  const w = writable<T>(preferences.read<T>(key) ?? fallback);
  w.subscribe((v) => preferences.write(key, v));
  return w;
}

// ============================================
// STORES
// ============================================

export const w_scale = writable<number>(1);
export const w_root_so = writable<Smart_Object | null>(null);
export const w_all_sos = writable<Smart_Object[]>([]);

export const w_view_mode = persistent<'2d' | '3d'>(T_Preference.viewMode, '3d');
export const w_precision = persistent<number>(T_Preference.precision, 0);
export const w_show_dimensionals = persistent<boolean>(T_Preference.showDimensionals, true);
export const w_solid = persistent<boolean>(T_Preference.solid, true);

// ============================================
// SYNCHRONOUS READERS (for non-reactive contexts)
// ============================================

/** Read current view mode synchronously (for non-reactive contexts like Render) */
export function current_view_mode(): '2d' | '3d' {
  return get(w_view_mode);
}

/** Read current precision level synchronously. */
export function current_precision(): number {
  return get(w_precision);
}

/** Read current dimensionals visibility synchronously. */
export function show_dimensionals(): boolean {
  return get(w_show_dimensionals);
}

/** Read current solid state synchronously. */
export function is_solid(): boolean {
  return get(w_solid);
}

// ============================================
// TOGGLES
// ============================================

/** Toggle dimensionals visibility. */
export function toggle_dimensionals(): void {
  w_show_dimensionals.update(v => !v);
}

/** Toggle solid / see-through. */
export function toggle_solid(): void {
  w_solid.update(v => !v);
}
