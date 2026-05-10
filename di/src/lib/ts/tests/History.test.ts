import { describe, it, expect, vi, beforeEach } from 'vitest';

// The history manager pulls the current scene through the scenes manager.
// We stub the scenes module so we can hand it a controllable value at each step.
let current_state: { n: number } = { n: 0 };
vi.mock('../managers/Scenes', () => ({
	scenes: {
		capture: () => current_state,
	},
}));

import { history } from '../managers/History';

// History stores a Portable_Scene; in this test we hand it a tiny stand-in
// shape and cast at the boundary so the test can read the marker number.
const as_state = (v: unknown): { n: number } => v as { n: number };

describe('history chain — back five, forward five', () => {

	beforeEach(() => {
		history.clear();
		current_state = { n: 0 };
	});

	it('walks back five and forward five, ending where it started', () => {
		const states = [0, 1, 2, 3, 4, 5].map(n => ({ n }));

		// Snapshot states 0..4 in turn, leaving current at state 5.
		current_state = states[0];
		for (let i = 1; i <= 5; i++) {
			history.snapshot();
			current_state = states[i];
		}

		// Walk back five times. Each step should restore the previous state.
		const back: { n: number }[] = [];
		for (let i = 0; i < 5; i++) {
			const s = history.undo();
			expect(s).not.toBeNull();
			back.push(as_state(s));
			current_state = as_state(s);
		}
		expect(back.map(s => s.n)).toEqual([4, 3, 2, 1, 0]);

		// Walk forward five times. Each step should re-apply the next state.
		const forward: { n: number }[] = [];
		for (let i = 0; i < 5; i++) {
			const s = history.redo();
			expect(s).not.toBeNull();
			forward.push(as_state(s));
			current_state = as_state(s);
		}
		expect(forward.map(s => s.n)).toEqual([1, 2, 3, 4, 5]);

		// Landed back at the original current state.
		expect(current_state.n).toBe(5);
	});

	it('a fresh snapshot after undoing wipes the forward chain', () => {
		const a = { n: 10 };
		const b = { n: 20 };
		const c = { n: 30 };

		current_state = a;
		history.snapshot();
		current_state = b;
		history.snapshot();
		current_state = c;

		// Step back once — forward chain now has one entry.
		current_state = as_state(history.undo());
		expect(history.can_redo).toBe(true);

		// Take a new snapshot — forward chain must be discarded.
		history.snapshot();
		expect(history.can_redo).toBe(false);
	});

});
