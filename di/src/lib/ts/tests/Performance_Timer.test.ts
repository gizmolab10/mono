import { describe, it, expect, beforeEach } from 'vitest';
import { Performance_Timer } from '../common/Performance_Timer';

describe('Performance_Timer', () => {
	let t: Performance_Timer;
	beforeEach(() => { t = new Performance_Timer(); });

	describe('basic start/stop', () => {
		it('returns 0 for a phase that has never run', () => {
			expect(t.last('greedy')).toBe(0);
			expect(t.average('greedy')).toBe(0);
		});

		it('records a non-negative duration after start/stop', () => {
			t.start('greedy');
			// burn a few microseconds so performance.now() advances
			let acc = 0;
			for (let i = 0; i < 1_000; i++) acc += Math.sqrt(i);
			expect(acc).toBeGreaterThan(0);
			t.stop('greedy');
			expect(t.last('greedy')).toBeGreaterThanOrEqual(0);
		});

		it('a stop with no matching start is a no-op', () => {
			t.stop('never_started');
			expect(t.last('never_started')).toBe(0);
		});
	});

	describe('running average', () => {
		it('updates incrementally across multiple stops', () => {
			// Stub the timestamp source so the test is deterministic.
			let now = 0;
			const orig = performance.now;
			performance.now = () => now;

			t.start('retry'); now = 10; t.stop('retry');   // 10 ms
			t.start('retry'); now = 30; t.stop('retry');   // 20 ms
			t.start('retry'); now = 60; t.stop('retry');   // 30 ms

			expect(t.last('retry')).toBe(30);
			// average of 10, 20, 30 = 20
			expect(t.average('retry')).toBe(20);

			performance.now = orig;
		});
	});

	describe('per-phase isolation', () => {
		it('keeps separate timings for separate phases', () => {
			let now = 0;
			const orig = performance.now;
			performance.now = () => now;

			t.start('a'); now = 5;  t.stop('a');     // a: 5 ms
			t.start('b'); now = 25; t.stop('b');     // b: 20 ms

			expect(t.last('a')).toBe(5);
			expect(t.last('b')).toBe(20);
			expect(t.average('a')).toBe(5);
			expect(t.average('b')).toBe(20);

			performance.now = orig;
		});
	});

	describe('breakdown', () => {
		it('returns per-phase stats sorted by phase name', () => {
			let now = 0;
			const orig = performance.now;
			performance.now = () => now;

			t.start('greedy'); now = 5;  t.stop('greedy');
			t.start('retry'); now = 10; t.stop('retry');
			t.start('greedy'); now = 20; t.stop('greedy');  // greedy avg = (5 + 10) / 2 = 7.5

			const rows = t.breakdown();
			expect(rows).toHaveLength(2);
			expect(rows[0]).toEqual({ phase: 'greedy', last_ms: 10, avg_ms: 7.5, count: 2 });
			expect(rows[1]).toEqual({ phase: 'retry', last_ms: 5,  avg_ms: 5,   count: 1 });

			performance.now = orig;
		});
	});

	describe('reset', () => {
		it('clears every phase', () => {
			let now = 0;
			const orig = performance.now;
			performance.now = () => now;

			t.start('greedy'); now = 5; t.stop('greedy');
			expect(t.last('greedy')).toBe(5);

			t.reset();
			expect(t.last('greedy')).toBe(0);
			expect(t.average('greedy')).toBe(0);
			expect(t.breakdown()).toEqual([]);

			performance.now = orig;
		});
	});
});
