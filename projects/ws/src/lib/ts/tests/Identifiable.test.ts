/**
 * Tests for Identifiable - ID generation and identity
 *
 * Run with: yarn test Identifiable
 */

import { describe, it, expect } from 'vitest';
import Identifiable from '../runtime/Identifiable';

describe('Identifiable', () => {
	describe('construction', () => {
		it('creates with auto-generated ID', () => {
			const ident = new Identifiable();
			expect(ident.id).toBeDefined();
			expect(ident.id.length).toBeGreaterThan(0);
		});

		it('creates with provided ID', () => {
			const ident = new Identifiable('custom-id');
			expect(ident.id).toBe('custom-id');
		});

		it('computes hash ID from string ID', () => {
			const ident = new Identifiable('test');
			expect(ident.hid).toBe('test'.hash());
		});
	});

	describe('newID', () => {
		it('generates unique IDs', () => {
			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(Identifiable.newID());
			}
			expect(ids.size).toBe(100); // all unique
		});

		it('starts with prefix', () => {
			const id = Identifiable.newID();
			expect(id.startsWith('NEW')).toBe(true);
		});

		it('uses custom prefix when provided', () => {
			const id = Identifiable.newID('CUSTOM');
			expect(id.startsWith('CUSTOM')).toBe(true);
		});

		it('has consistent length', () => {
			const ids = [];
			for (let i = 0; i < 10; i++) {
				ids.push(Identifiable.newID());
			}
			const lengths = ids.map(id => id.length);
			expect(new Set(lengths).size).toBe(1); // all same length
		});
	});

	describe('equals', () => {
		it('returns true for same ID', () => {
			const a = new Identifiable('same');
			const b = new Identifiable('same');
			expect(a.equals(b)).toBe(true);
		});

		it('returns false for different IDs', () => {
			const a = new Identifiable('one');
			const b = new Identifiable('two');
			expect(a.equals(b)).toBe(false);
		});

		it('returns false for null', () => {
			const a = new Identifiable('test');
			expect(a.equals(null)).toBe(false);
		});

		it('returns false for undefined', () => {
			const a = new Identifiable('test');
			expect(a.equals(undefined)).toBe(false);
		});
	});

	describe('setID', () => {
		it('updates ID', () => {
			const ident = new Identifiable('old');
			ident.setID('new');
			expect(ident.id).toBe('new');
		});

		it('updates hash ID', () => {
			const ident = new Identifiable('old');
			const oldHid = ident.hid;
			ident.setID('new');
			expect(ident.hid).not.toBe(oldHid);
			expect(ident.hid).toBe('new'.hash());
		});

		it('generates new ID when called without argument', () => {
			const ident = new Identifiable('old');
			ident.setID();
			expect(ident.id).not.toBe('old');
			expect(ident.id.startsWith('NEW')).toBe(true);
		});
	});

	describe('removeAll', () => {
		it('removes all occurrences of character', () => {
			const result = Identifiable.removeAll('-', 'a-b-c-d');
			expect(result).toBe('abcd');
		});

		it('returns original when character not found', () => {
			const result = Identifiable.removeAll('x', 'abcd');
			expect(result).toBe('abcd');
		});

		it('handles empty string', () => {
			const result = Identifiable.removeAll('-', '');
			expect(result).toBe('');
		});

		it('handles consecutive occurrences', () => {
			const result = Identifiable.removeAll('-', 'a---b');
			expect(result).toBe('ab');
		});
	});

	describe('remove_item_byHID', () => {
		it('removes item by matching hash ID', () => {
			const a = new Identifiable('a');
			const b = new Identifiable('b');
			const c = new Identifiable('c');
			const arr = [a, b, c];

			const result = Identifiable.remove_item_byHID(arr, b);

			expect(result.length).toBe(2);
			expect(result).toContain(a);
			expect(result).not.toContain(b);
			expect(result).toContain(c);
		});

		it('returns all items when target not found', () => {
			const a = new Identifiable('a');
			const b = new Identifiable('b');
			const arr = [a, b];
			const target = new Identifiable('not-in-array');

			const result = Identifiable.remove_item_byHID(arr, target);

			expect(result.length).toBe(2);
		});

		it('handles empty array', () => {
			const target = new Identifiable('target');
			const result = Identifiable.remove_item_byHID([], target);
			expect(result).toEqual([]);
		});
	});

	describe('id_inReverseOrder', () => {
		it('reverses short IDs (3 chars or less)', () => {
			const result = Identifiable.id_inReverseOrder('abc');
			expect(result).toBe('acb'); // first char stays, rest reversed
		});

		it('returns new ID for long IDs (> 3 chars)', () => {
			const result = Identifiable.id_inReverseOrder('abcd');
			expect(result.startsWith('NEW')).toBe(true);
		});

		it('handles 2-char IDs', () => {
			const result = Identifiable.id_inReverseOrder('ab');
			expect(result).toBe('ab'); // first stays, nothing to reverse
		});

		it('handles 1-char IDs', () => {
			const result = Identifiable.id_inReverseOrder('a');
			expect(result).toBe('a');
		});
	});

	describe('hash consistency', () => {
		it('same string produces same hash', () => {
			const a = new Identifiable('test');
			const b = new Identifiable('test');
			expect(a.hid).toBe(b.hid);
		});

		it('different strings produce different hashes', () => {
			const a = new Identifiable('one');
			const b = new Identifiable('two');
			expect(a.hid).not.toBe(b.hid);
		});

		it('empty string has hash of 0', () => {
			const ident = new Identifiable('');
			expect(ident.hid).toBe(0);
		});
	});
});
