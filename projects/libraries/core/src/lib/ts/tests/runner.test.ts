import { describe, expect, it } from 'vitest';

// Proves the runner itself is wired up: it finds this file, runs it, and reports.
// The first real tests will sit beside this one.
describe('the test runner', () => {
	it('runs', () => {
		expect(1 + 1).toBe(2);
	});
});
