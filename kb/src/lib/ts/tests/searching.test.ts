import { describe, expect, it } from 'vitest';
import { what_to_open } from '../utilities/Searching';

// A piece a search opened must not be folded away when the next place is inside that very piece.
// Doing both — folding, then opening the same one again — is what blinked on every keystroke.

const ALPHA = { name: 'ALPHA' } as unknown as HTMLElement;
const BETA  = { name: 'BETA' } as unknown as HTMLElement;

describe('which piece a search opens and folds', () => {
	it('leaves the open one alone when the next place is inside it', () => {
		expect(what_to_open(ALPHA, ALPHA)).toEqual({ fold: null, show: null });
	});

	it('folds the old one and opens the new when the next place is elsewhere', () => {
		expect(what_to_open(ALPHA, BETA)).toEqual({ fold: ALPHA, show: BETA });
	});

	it('opens one when none was open', () => {
		expect(what_to_open(null, BETA)).toEqual({ fold: null, show: BETA });
	});

	it('folds the open one when there is no next place at all', () => {
		expect(what_to_open(ALPHA, null)).toEqual({ fold: ALPHA, show: null });
	});

	it('does nothing when none was open and none is needed', () => {
		expect(what_to_open(null, null)).toEqual({ fold: null, show: null });
	});
});
