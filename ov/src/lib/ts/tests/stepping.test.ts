import { back_direction, forward_direction, make_holding, mark_is_live, shows_mark } from '../utilities/Stepping';
import { describe, expect, it, vi } from 'vitest';
import { Direction } from '../types/Angle';

// The two marks that step from one thing to the next: which way each points, whether it is
// drawn, whether it answers, and the holding that repeats a step.

describe('which way each mark points', () => {
	it('runs side to side by default', () => {
		expect(back_direction(false)).toBe(Direction.left);
		expect(forward_direction(false)).toBe(Direction.right);
	});

	it('runs up and down when asked', () => {
		expect(back_direction(true)).toBe(Direction.up);
		expect(forward_direction(true)).toBe(Direction.down);
	});
});

describe('whether a mark is drawn, and whether it answers', () => {
	it('leaves out a mark that leads nowhere', () => {
		expect(shows_mark(false, false)).toBe(false);
		expect(shows_mark(true, false)).toBe(true);
	});

	it('draws both when asked, and the dead one still leads nowhere', () => {
		expect(shows_mark(false, true)).toBe(true);
		expect(mark_is_live(false)).toBe(false);
		expect(mark_is_live(true)).toBe(true);
	});
});

describe('holding a mark down', () => {
	it('steps once at the press, then patters after the pause', () => {
		vi.useFakeTimers();
		let steps = 0;
		const holding = make_holding(400, 100);
		holding.start(() => { steps += 1; });
		expect(steps).toBe(1);                    // the first step, right away
		vi.advanceTimersByTime(399);
		expect(steps).toBe(1);                    // still waiting
		vi.advanceTimersByTime(1 + 100 * 3);
		expect(steps).toBe(4);                    // three more, one per beat
		holding.stop();
		vi.advanceTimersByTime(1000);
		expect(steps).toBe(4);                    // let go, so nothing more
		vi.useRealTimers();
	});

	it('says which steps are its own patter and which was the press', () => {
		vi.useFakeTimers();
		const asked: boolean[] = [];
		const holding = make_holding(400, 100);
		holding.start((repeated) => { asked.push(repeated); });
		expect(asked).toEqual([false]);            // the press itself
		vi.advanceTimersByTime(400 + 100 * 2);
		expect(asked).toEqual([false, true, true]);
		holding.stop();
		vi.useRealTimers();
	});

	it('never runs two beats at once', () => {
		vi.useFakeTimers();
		let steps = 0;
		const holding = make_holding(400, 100);
		holding.start(() => { steps += 1; });
		holding.start(() => { steps += 1; });      // pressed again without letting go
		expect(steps).toBe(2);                     // one first step each
		vi.advanceTimersByTime(400 + 100);
		expect(steps).toBe(3);                     // one beat, not two
		holding.stop();
		vi.useRealTimers();
	});

	it('is safe to let go when nothing is held', () => {
		const holding = make_holding();
		expect(() => holding.stop()).not.toThrow();
	});
});
