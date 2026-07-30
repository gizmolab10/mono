import './Mock_Storage';                       // browser storage stood in for node — must be in place first
import { describe, it, expect, beforeEach } from 'vitest';
import { preferences, T_Preference } from '../managers/Preferences';
import { clear_storage } from './Mock_Storage';
import { T_Storage, T_Record } from '../types/DB_Records';

// Two steps run at launch, in this order: every saved name is brought up to the one
// spelling (its data moving with it), then everything saved under a name the app no
// longer uses is removed.

beforeEach(() => {
	clear_storage();
});

describe('renaming the saved settings', () => {
	it('moves a plain setting, a store\'s record list and a store\'s filter to their new names', () => {
		localStorage.setItem('ji:accentColor', '"#ff8800"');
		localStorage.setItem('ji:llmKey', '"a-share-token"');
		localStorage.setItem('ji:mine/documents', '[{"id":"a"}]');
		localStorage.setItem('ji:AI/families', '["image"]');

		expect(preferences.rename_saved_names()).toBe(4);

		expect(preferences.read<string>(T_Preference.color_accent)).toBe('#ff8800');
		expect(preferences.read<string>(T_Preference.ai_key)).toBe('a-share-token');
		expect(preferences.readDB<{ id: string }>(T_Storage.private, T_Record.documents)).toEqual([{ id: 'a' }]);
		expect(preferences.read_forStorage<string[]>(T_Storage.llm, T_Preference.format_families)).toEqual(['image']);
		// the old names are gone
		expect(localStorage.getItem('ji:accentColor')).toBe(null);
		expect(localStorage.getItem('ji:mine/documents')).toBe(null);
		expect(localStorage.getItem('ji:AI/families')).toBe(null);
	});

	it('moves the app\'s start marker too, keeping the rest of the name', () => {
		localStorage.setItem('ji:current_op', '"files"');
		localStorage.setItem('ji:mine_tags', '[{"id":"t"}]');

		preferences.rename_saved_names();

		expect(localStorage.getItem('ji_current_op')).toBe('"files"');
		expect(localStorage.getItem('ji_mine_tags')).toBe('[{"id":"t"}]');
		expect(localStorage.getItem('ji:current_op')).toBe(null);
	});

	it('folds the details region\'s two old open/shut flags into one list of open sections', () => {
		localStorage.setItem('ji:detailsPreferencesOpen', 'true');
		localStorage.setItem('ji:detailsDataOpen', 'false');

		preferences.rename_saved_names();

		expect(preferences.read<string[]>(T_Preference.details_open)).toEqual(['preferences']);
		expect(localStorage.getItem('ji:detailsPreferencesOpen')).toBe(null);
		expect(localStorage.getItem('ji:detailsDataOpen')).toBe(null);
	});

	it('saves an empty list when both details sections were shut', () => {
		localStorage.setItem('ji_details_preferences_open', 'false');
		localStorage.setItem('ji_details_data_open', 'false');

		preferences.rename_saved_names();

		expect(preferences.read<string[]>(T_Preference.details_open)).toEqual([]);
	});

	it('keeps an old value aside rather than throwing it away when its new name is taken', () => {
		localStorage.setItem('ji:accentColor', '"#000000"');
		preferences.write(T_Preference.color_accent, '#ff8800');

		expect(preferences.rename_saved_names()).toBe(0);      // nothing moved across

		expect(preferences.read<string>(T_Preference.color_accent)).toBe('#ff8800');
		expect(localStorage.getItem('ji:accentColor')).toBe(null);
		expect(localStorage.getItem('ji_rescued_ji:accentColor')).toBe('"#000000"');
		expect(preferences.rename_saved_names()).toBe(0);      // and again on the next launch
	});

	it('leaves what it kept aside alone when the sweep runs', () => {
		localStorage.setItem('ji_rescued_ji:mine/documents', '[{"id":"a"}]');
		preferences.sweep_unknown_names();
		expect(localStorage.getItem('ji_rescued_ji:mine/documents')).toBe('[{"id":"a"}]');
	});
});

describe('sweeping the saved settings', () => {
	it('keeps every kind of valid name and removes the rest', () => {
		// three valid names, one of each kind
		preferences.write(T_Preference.color_accent, '#ff8800');
		preferences.writeDB(T_Storage.private, T_Record.documents, [{ id: 'a' }]);
		preferences.write_forStorage(T_Storage.llm, T_Preference.filter_text, 'notes');
		// two leftovers: a name from a scheme since dropped, and a hand-planted one
		localStorage.setItem('ji_filter_text', '"app-wide, from before the filters went per store"');
		localStorage.setItem('ji_made-up', '"planted by hand"');
		// another app's setting, which is none of our business
		localStorage.setItem('other-app:color', 'blue');

		const removed = preferences.sweep_unknown_names();

		expect(removed).toBe(2);
		expect(preferences.read<string>(T_Preference.color_accent)).toBe('#ff8800');
		expect(preferences.readDB<{ id: string }>(T_Storage.private, T_Record.documents)).toEqual([{ id: 'a' }]);
		expect(preferences.read_forStorage<string>(T_Storage.llm, T_Preference.filter_text)).toBe('notes');
		expect(localStorage.getItem('ji_filter_text')).toBe(null);
		expect(localStorage.getItem('ji_made-up')).toBe(null);
		expect(localStorage.getItem('other-app:color')).toBe('blue');
	});

	it('renames before it removes, so data under an old name survives the sweep', () => {
		localStorage.setItem('ji:mine/tags', '[{"id":"t","name":"blue"}]');
		localStorage.setItem('ji:llmPointer', '"http://pointer"');

		preferences.sweep_unknown_names();

		expect(preferences.readDB<{ id: string }>(T_Storage.private, T_Record.tags)).toEqual([{ id: 't', name: 'blue' }]);
		expect(preferences.read<string>(T_Preference.ai_pointer)).toBe('http://pointer');
	});

	it('removes nothing when every saved name is one the app uses', () => {
		preferences.write(T_Preference.db, T_Storage.private);
		preferences.write_forStorage(T_Storage.private, T_Preference.filter_mode, 'any');
		expect(preferences.sweep_unknown_names()).toBe(0);
		expect(preferences.read<string>(T_Preference.db)).toBe(T_Storage.private);
		expect(preferences.read_forStorage<string>(T_Storage.private, T_Preference.filter_mode)).toBe('any');
	});

	it('counts a per-storage setting as valid only under a store, never on its own', () => {
		const valid = preferences.valid_names();
		expect(valid.has('ji_mine_filter_tags')).toBe(true);
		expect(valid.has('ji_ai_filter_tags')).toBe(true);
		expect(valid.has('ji_filter_tags')).toBe(false);
		expect(valid.has('ji_color_accent')).toBe(true);
	});

	it('spells every valid name the one way — one marker, no slashes, no run-together words', () => {
		for (const name of preferences.valid_names()) {
			expect(name.startsWith('ji_')).toBe(true);
			expect(name.includes(':')).toBe(false);
			expect(name.includes('/')).toBe(false);
			expect(name.slice(3)).toBe(name.slice(3).toLowerCase());
		}
	});
});
