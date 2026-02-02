/**
 * Tests for S_Items - generic reactive list container
 *
 * Run with: yarn test S_Items
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import S_Items from '../state/S_Items';

describe('S_Items', () => {
	describe('construction', () => {
		it('creates with empty array', () => {
			const si = new S_Items<string>([]);
			expect(si.length).toBe(0);
			expect(si.items).toEqual([]);
			expect(si.index).toBe(0);
		});

		it('creates with initial items', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			expect(si.length).toBe(3);
			expect(si.items).toEqual(['a', 'b', 'c']);
		});

		it('initializes index to 0', () => {
			const si = new S_Items<number>([1, 2, 3]);
			expect(si.index).toBe(0);
		});
	});

	describe('item access', () => {
		it('returns current item via index', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			expect(si.item).toBe('a');

			si.index = 1;
			expect(si.item).toBe('b');

			si.index = 2;
			expect(si.item).toBe('c');
		});

		it('returns null for empty list', () => {
			const si = new S_Items<string>([]);
			expect(si.item).toBeNull();
		});
	});

	describe('reactive stores', () => {
		it('w_items reflects current items', () => {
			const si = new S_Items<string>(['x', 'y']);
			expect(get(si.w_items)).toEqual(['x', 'y']);
		});

		it('w_index reflects current index', () => {
			const si = new S_Items<string>(['x', 'y']);
			expect(get(si.w_index)).toBe(0);

			si.index = 1;
			expect(get(si.w_index)).toBe(1);
		});

		it('w_length derives from w_items', () => {
			const si = new S_Items<string>(['a', 'b']);
			expect(get(si.w_length)).toBe(2);
		});

		it('w_item derives from w_items and w_index', () => {
			const si = new S_Items<string>(['first', 'second']);
			expect(get(si.w_item)).toBe('first');

			si.index = 1;
			expect(get(si.w_item)).toBe('second');
		});
	});

	describe('push', () => {
		it('adds item to list', () => {
			const si = new S_Items<string>([]);
			si.push('new');

			expect(si.length).toBe(1);
			expect(si.items).toContain('new');
		});

		it('sets index to pushed item', () => {
			const si = new S_Items<string>(['a', 'b']);
			si.push('c');

			expect(si.index).toBe(2);
			expect(si.item).toBe('c');
		});

		it('does not duplicate existing items', () => {
			const si = new S_Items<string>(['a', 'b']);
			si.push('a');

			expect(si.length).toBe(2);
			expect(si.index).toBe(0); // index moved to existing item
		});

		it('moves index to existing item when pushing duplicate', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;

			si.push('a'); // already exists at index 0

			expect(si.index).toBe(0);
			expect(si.item).toBe('a');
		});
	});

	describe('remove', () => {
		it('removes item from list', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.remove('b');

			expect(si.length).toBe(2);
			expect(si.items).toEqual(['a', 'c']);
		});

		it('does nothing when item not found', () => {
			const si = new S_Items<string>(['a', 'b']);
			si.remove('z');

			expect(si.length).toBe(2);
		});

		it('adjusts index when removing item before current', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;

			si.remove('a');

			// items setter clamps index from 2 to 1 (new max), then -= 1 makes it 0
			expect(si.index).toBe(0);
			expect(si.item).toBe('b'); // 'b' was at index 1, now at 0
		});

		it('resets when removing last item', () => {
			const si = new S_Items<string>(['only']);
			si.remove('only');

			expect(si.length).toBe(0);
			expect(si.index).toBe(0);
		});
	});

	describe('reset', () => {
		it('clears all items', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.reset();

			expect(si.length).toBe(0);
			expect(si.items).toEqual([]);
		});

		it('resets index to 0', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;
			si.reset();

			expect(si.index).toBe(0);
		});
	});

	describe('find_next_item', () => {
		it('moves to next item when incrementing', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 0;

			const found = si.find_next_item(true);

			expect(found).toBe(true);
			expect(si.index).toBe(1);
		});

		it('moves to previous item when decrementing', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;

			const found = si.find_next_item(false);

			expect(found).toBe(true);
			expect(si.index).toBe(1);
		});

		it('wraps around at end', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;

			const found = si.find_next_item(true);

			expect(found).toBe(true);
			expect(si.index).toBe(0); // wrapped to start
		});

		it('wraps around at start', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 0;

			const found = si.find_next_item(false);

			expect(found).toBe(true);
			expect(si.index).toBe(2); // wrapped to end
		});

		it('returns false for empty list', () => {
			const si = new S_Items<string>([]);

			const found = si.find_next_item(true);

			expect(found).toBe(false);
		});
	});

	describe('remove_all_beyond_index', () => {
		it('removes all items after current index', () => {
			const si = new S_Items<string>(['a', 'b', 'c', 'd']);
			si.index = 1;

			si.remove_all_beyond_index();

			expect(si.items).toEqual(['a', 'b']);
		});

		it('does nothing when at last index', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;

			si.remove_all_beyond_index();

			expect(si.items).toEqual(['a', 'b', 'c']);
		});
	});

	describe('add_uniquely_from', () => {
		it('adds items not already present', () => {
			const si = new S_Items<string>(['a', 'b']);
			const other = new S_Items<string>(['b', 'c', 'd']);

			si.add_uniquely_from(other);

			expect(si.items).toContain('c');
			expect(si.items).toContain('d');
		});

		it('does not duplicate existing items', () => {
			const si = new S_Items<string>(['a', 'b']);
			const other = new S_Items<string>(['a', 'b']);

			si.add_uniquely_from(other);

			expect(si.length).toBe(2);
		});

		it('handles null source', () => {
			const si = new S_Items<string>(['a']);

			si.add_uniquely_from(null);

			expect(si.length).toBe(1);
		});
	});

	describe('title', () => {
		it('returns zero string when empty', () => {
			const si = new S_Items<string>([]);
			expect(si.title('items', 'no items', 'one item')).toBe('no items');
		});

		it('returns one string for single item', () => {
			const si = new S_Items<string>(['only']);
			expect(si.title('items', 'no items', 'one item')).toBe('one item');
		});

		it('returns formatted string for multiple items', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 1;
			const title = si.title('item', 'no items', 'one item');
			expect(title).toContain('2nd');
			expect(title).toContain('3');
		});
	});

	describe('serialization', () => {
		it('serializes items with custom serializer', () => {
			const si = new S_Items<{ id: number }>([{ id: 1 }, { id: 2 }]);

			const serialized = si.serialize(item => item.id);

			expect(serialized).toEqual([1, 2]);
		});

		it('deserializes items with custom deserializer', () => {
			const data = [1, 2, 3];

			const si = S_Items.deserialize(data, n => ({ value: n }));

			expect(si).not.toBeNull();
			expect(si!.length).toBe(3);
			expect(si!.items[0]).toEqual({ value: 1 });
		});

		it('returns null for empty data', () => {
			const si = S_Items.deserialize<string, string>([], x => x);
			expect(si).toBeNull();
		});

		it('returns null for null data', () => {
			const si = S_Items.deserialize<string, string>(null, x => x);
			expect(si).toBeNull();
		});

		it('filters out null items during deserialization', () => {
			const data = [1, 2, 3];

			const si = S_Items.deserialize(data, n => n === 2 ? null : { value: n });

			expect(si).not.toBeNull();
			expect(si!.length).toBe(2);
		});

		it('sets index to last item after deserialization', () => {
			const data = [1, 2, 3];

			const si = S_Items.deserialize(data, n => n);

			expect(si!.index).toBe(2);
		});
	});

	describe('fromDefault', () => {
		it('creates S_Items with single default item', () => {
			const si = S_Items.fromDefault('default');

			expect(si.length).toBe(1);
			expect(si.item).toBe('default');
		});
	});

	describe('items setter', () => {
		it('clamps index when items shrink', () => {
			const si = new S_Items<string>(['a', 'b', 'c', 'd']);
			si.index = 3;

			si.items = ['x', 'y'];

			expect(si.index).toBe(1); // clamped to new max
		});

		it('preserves valid index when items change', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 1;

			si.items = ['x', 'y', 'z'];

			expect(si.index).toBe(1); // still valid
		});

		it('sets index to 0 for empty items', () => {
			const si = new S_Items<string>(['a', 'b', 'c']);
			si.index = 2;

			si.items = [];

			expect(si.index).toBe(0);
		});
	});
});
