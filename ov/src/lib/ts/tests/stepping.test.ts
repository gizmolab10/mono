import { back_direction, forward_direction, mark_is_live, shows_mark } from '../utilities/Stepping';
import { describe, expect, it } from 'vitest';
import { Direction } from '../types/Angle';

// The two marks that step from one thing to the next: which way each points, whether it is
// drawn, and whether it answers.

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

