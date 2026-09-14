import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { Preferences } from '../utilities/Preferences';

// A storage of the browser's shape, held in a map, so the tests run with no browser.
function fake_storage() {
	const held = new Map<string, string>();
	return {
		held,
		getItem: (key: string) => held.get(key) ?? null,
		setItem: (key: string, value: string) => { held.set(key, value); },
		removeItem: (key: string) => { held.delete(key); },
		get length() { return held.size; },
		key: (at: number) => [...held.keys()][at] ?? null,
	};
}

describe('preferences', () => {
	it('saves every key under the prefix', () => {
		const storage = fake_storage();
		const preferences = new Preferences('ov_', storage);
		preferences.write('sorts', [1, 2]);
		expect([...storage.held.keys()]).toEqual(['ov_sorts']);
	});

	it('reads back what it wrote, as json', () => {
		const preferences = new Preferences('x.', fake_storage());
		preferences.write('open', { a: true });
		expect(preferences.read('open')).toEqual({ a: true });
	});

	it('reads nothing where nothing was saved, or the text is not json', () => {
		const storage = fake_storage();
		const preferences = new Preferences('x.', storage);
		expect(preferences.read('never')).toBeNull();
		storage.setItem('x.raw', 'a word');
		expect(preferences.read('raw')).toBeNull();
		expect(preferences.read_text('raw')).toBe('a word');
	});

	it('keeps text as it was written', () => {
		const storage = fake_storage();
		const preferences = new Preferences('lv.', storage);
		preferences.write_text('pass', 'open sesame');
		expect(storage.held.get('lv.pass')).toBe('open sesame');
		expect(preferences.read_text('pass')).toBe('open sesame');
	});

	it('forgets one key, or a list of them', () => {
		const storage = fake_storage();
		const preferences = new Preferences('x.', storage);
		preferences.write('a', 1);
		preferences.write('b', 2);
		preferences.write('c', 3);
		preferences.remove('a');
		preferences.clear(['b', 'c']);
		expect(storage.held.size).toBe(0);
	});

	it('gives a store that starts saved and saves on change', () => {
		const storage = fake_storage();
		storage.setItem('x.count', '5');
		const preferences = new Preferences('x.', storage);
		const w = preferences.persistent<number>('count', 0);
		expect(get(w)).toBe(5);
		w.set(7);
		expect(storage.held.get('x.count')).toBe('7');
		const fresh = preferences.persistent<number>('other', 9);
		expect(get(fresh)).toBe(9);
	});

	it('reads its prefix through a function, when handed one', () => {
		const storage = fake_storage();
		let prefix = 'kb_';
		const preferences = new Preferences(() => prefix, storage);
		preferences.write('a', 1);
		prefix = 'ai_';
		preferences.write('a', 2);
		expect([...storage.held.keys()]).toEqual(['kb_a', 'ai_a']);
		expect(preferences.read('a')).toBe(2);
	});

	it('adopts what an old prefix held, keeps its own where it has one, and drops the old keys', () => {
		const storage = fake_storage();
		storage.setItem('ov_sorts', '[1]');
		storage.setItem('ov_open', 'true');
		storage.setItem('ai_open', 'false');
		storage.setItem('kb_other', '3');
		const preferences = new Preferences('ai_', storage);
		expect(preferences.adopt('ov_')).toBe(1);
		expect(storage.held.get('ai_sorts')).toBe('[1]');
		expect(storage.held.get('ai_open')).toBe('false');
		expect([...storage.held.keys()].filter((key) => key.startsWith('ov_'))).toEqual([]);
		expect(storage.held.get('kb_other')).toBe('3');
		expect(new Preferences('ai_', null).adopt('ov_')).toBe(0);
	});

	it('answers nothing and saves nothing with no storage at all', () => {
		const preferences = new Preferences('x.', null);
		preferences.write('a', 1);
		expect(preferences.read('a')).toBeNull();
		expect(get(preferences.persistent('a', 'fallback'))).toBe('fallback');
	});
});
