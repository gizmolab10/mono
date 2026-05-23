import { describe, it, expect } from 'vitest';
import { Seeded_Random } from '../common/Seeded_Random';

describe('Seeded_Random', () => {
	describe('determinism', () => {
		it('produces the same sequence for the same numeric seed', () => {
			const a = new Seeded_Random(42);
			const b = new Seeded_Random(42);
			const seq_a = Array.from({ length: 10 }, () => a.next());
			const seq_b = Array.from({ length: 10 }, () => b.next());
			expect(seq_a).toEqual(seq_b);
		});

		it('produces the same sequence for the same string seed', () => {
			const a = new Seeded_Random('basement|orientation=[0.1, 0.6, 0.7, -0.3]');
			const b = new Seeded_Random('basement|orientation=[0.1, 0.6, 0.7, -0.3]');
			const seq_a = Array.from({ length: 10 }, () => a.next());
			const seq_b = Array.from({ length: 10 }, () => b.next());
			expect(seq_a).toEqual(seq_b);
		});

		it('produces different sequences for different seeds', () => {
			const a = new Seeded_Random(1);
			const b = new Seeded_Random(2);
			const seq_a = Array.from({ length: 10 }, () => a.next());
			const seq_b = Array.from({ length: 10 }, () => b.next());
			expect(seq_a).not.toEqual(seq_b);
		});
	});

	describe('range', () => {
		it('next() stays inside [0, 1)', () => {
			const r = new Seeded_Random(7);
			for (let i = 0; i < 1000; i++) {
				const v = r.next();
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThan(1);
			}
		});

		it('next_int(N) stays inside [0, N)', () => {
			const r = new Seeded_Random(7);
			for (let i = 0; i < 1000; i++) {
				const v = r.next_int(8);
				expect(Number.isInteger(v)).toBe(true);
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThan(8);
			}
		});

		it('next_int rejects max <= 0', () => {
			const r = new Seeded_Random(7);
			expect(() => r.next_int(0)).toThrow();
			expect(() => r.next_int(-3)).toThrow();
		});
	});

	describe('pick_one', () => {
		it('returns an element from the array', () => {
			const r = new Seeded_Random(7);
			const choices = ['a', 'b', 'c', 'd'];
			for (let i = 0; i < 100; i++) {
				const v = r.pick_one(choices);
				expect(choices).toContain(v);
			}
		});

		it('rejects an empty array', () => {
			const r = new Seeded_Random(7);
			expect(() => r.pick_one([])).toThrow();
		});
	});

	describe('zero-seed protection', () => {
		it('does not lock at zero when seed is 0', () => {
			const r = new Seeded_Random(0);
			const first = r.next();
			const second = r.next();
			expect(first).not.toBe(0);
			expect(second).not.toBe(first);
		});
	});

	describe('hash_string', () => {
		it('is stable and unsigned 32-bit', () => {
			const h1 = Seeded_Random.hash_string('hello');
			const h2 = Seeded_Random.hash_string('hello');
			expect(h1).toBe(h2);
			expect(h1).toBeGreaterThanOrEqual(0);
			expect(h1).toBeLessThan(0x100000000);
		});

		it('differs for different inputs', () => {
			expect(Seeded_Random.hash_string('hello')).not.toBe(Seeded_Random.hash_string('world'));
		});
	});
});
