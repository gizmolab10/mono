import { describe, it, expect, beforeEach } from 'vitest';
import { preferences, T_Preference } from '../managers/Preferences';

beforeEach(() => {
	// The test environment carries a single mocked browser-storage map across tests.
	// Clear any leftover values from prior tests to keep these checks honest.
	preferences.remove(T_Preference.unitSystem);
	preferences.remove(T_Preference.precision);
	preferences.remove(T_Preference.gridOpacity);
});

// ═══════════════════════════════════════════════════════════════════
// Rule 57 — user preferences persist across reloads
// ═══════════════════════════════════════════════════════════════════

describe('user preferences persist across reloads', () => {
	it('a written value survives a fresh read — same value comes back', () => {
		preferences.write(T_Preference.precision, 3);
		expect(preferences.read<number>(T_Preference.precision)).toBe(3);
	});

	it('a removed preference reads back as missing', () => {
		preferences.write(T_Preference.gridOpacity, 0.7);
		expect(preferences.read<number>(T_Preference.gridOpacity)).toBe(0.7);

		preferences.remove(T_Preference.gridOpacity);
		expect(preferences.read<number>(T_Preference.gridOpacity)).toBeNull();
	});

	it('different preferences are stored under separate keys — they do not collide', () => {
		preferences.write(T_Preference.unitSystem, 'imperial');
		preferences.write(T_Preference.precision, 2);

		expect(preferences.read<string>(T_Preference.unitSystem)).toBe('imperial');
		expect(preferences.read<number>(T_Preference.precision)).toBe(2);
	});
});
