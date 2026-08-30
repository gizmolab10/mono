import { in_thousands } from '../utilities/Numbers';
import { describe, expect, it } from 'vitest';

// A number written in thousands once it is past one; a small one passes through untouched.

describe('a number written in thousands', () => {
	it('leaves a small number plain', () => {
		expect(in_thousands(0)).toBe('0');
		expect(in_thousands(984)).toBe('984');
		expect(in_thousands(1000)).toBe('1000');
	});

	it('divides past one thousand, one decimal, marked with k', () => {
		expect(in_thousands(38392)).toBe('38.4k');
		expect(in_thousands(1500)).toBe('1.5k');
	});

	it('drops a bare .0', () => {
		expect(in_thousands(214000)).toBe('214k');
		expect(in_thousands(213970)).toBe('214k');
	});
});
