import { CONTROL_CLASSES, CONTROL_TAGS, landed_on_a_control } from '../utilities/Leaving';
import { describe, expect, it } from 'vitest';

describe('what a press in the top rows means', () => {
	it('the empty space leads back to the list', () => {
		expect(landed_on_a_control(['span', 'view-spacer'])).toBe(false);
		expect(landed_on_a_control(['div', 'view-head'])).toBe(false);
		expect(landed_on_a_control([])).toBe(false);
	});

	it('the step marks answer for themselves', () => {
		expect(landed_on_a_control(['svg', 'button', 'step'])).toBe(true);
	});

	it('so does the search field', () => {
		expect(landed_on_a_control(['input', 'search'])).toBe(true);
	});

	it('so does the count between the marks', () => {
		expect(landed_on_a_control(['span', 'hit-count'])).toBe(true);
	});

	it('so does the file\'s name, and the field that renames it', () => {
		expect(landed_on_a_control(['span', 'view-name'])).toBe(true);
		expect(landed_on_a_control(['input', 'rename-field'])).toBe(true);
	});

	it('the folders above the file are only words, so they lead back', () => {
		expect(landed_on_a_control(['span', 'view-ancestry'])).toBe(false);
	});

	it('reads capitals the same as small letters', () => {
		expect(landed_on_a_control(['BUTTON'])).toBe(true);
	});

	it('names every control exactly once', () => {
		expect(new Set(CONTROL_TAGS).size).toBe(CONTROL_TAGS.length);
		expect(new Set(CONTROL_CLASSES).size).toBe(CONTROL_CLASSES.length);
	});
});
