import { HEAVY, SLANTED, STRUCK, partner_of, surround, toggle_emphasis } from '../utilities/Emphasis';
import { describe, expect, it } from 'vitest';

describe('putting a pair of marks around what is picked', () => {
	it('knows which mark closes which', () => {
		expect(partner_of('[')).toBe(']');
		expect(partner_of('(')).toBe(')');
		expect(partner_of('{')).toBe('}');
		expect(partner_of('"')).toBe('"');
		expect(partner_of("'")).toBe("'");
	});

	it('has no partner for a mark that does not come in a pair', () => {
		expect(partner_of('x')).toBe('');
		expect(partner_of(']')).toBe('');
	});

	it('puts the pair either side, and keeps the same words picked', () => {
		const done = surround('one two three', 4, 7, '[');
		expect(done?.text).toBe('one [two] three');
		expect(done && done.text.slice(done.from, done.to)).toBe('two');
	});

	it('uses the same mark both sides for a quote', () => {
		expect(surround('one two', 4, 7, '"')?.text).toBe('one "two"');
		expect(surround('one two', 4, 7, "'")?.text).toBe("one 'two'");
	});

	it('takes the pair off again when it sits inside what is picked', () => {
		const done = surround('one [two] three', 4, 9, '[');
		expect(done?.text).toBe('one two three');
		expect(done && done.text.slice(done.from, done.to)).toBe('two');
	});

	it('takes it off when it sits just outside what is picked', () => {
		const done = surround('one [two] three', 5, 8, '[');
		expect(done?.text).toBe('one two three');
		expect(done && done.text.slice(done.from, done.to)).toBe('two');
	});

	it('does the same for quotes, where both marks are the same', () => {
		expect(surround('one "two"', 4, 9, '"')?.text).toBe('one two');
		expect(surround('one "two"', 5, 8, '"')?.text).toBe('one two');
	});

	it('does not mistake one mark for a pair', () => {
		expect(surround('one [two', 4, 8, '[')?.text).toBe('one [[two]');
	});

	it('does nothing with nothing picked, so the mark is simply typed', () => {
		expect(surround('one two', 4, 4, '[')).toBe(null);
	});

	it('does nothing for a mark that is not one of the pairs', () => {
		expect(surround('one two', 4, 7, 'x')).toBe(null);
	});
});

// Making a run of words heavy or slanted while a piece is open. The same press puts the stars
// on and takes them off again, so what is picked has to be read carefully both ways.

describe('making words heavy', () => {
	it('puts two stars either side of what is picked', () => {
		const done = toggle_emphasis('one two three', 4, 7, HEAVY);
		expect(done.text).toBe('one **two** three');
		expect(done.text.slice(done.from, done.to)).toBe('two');
	});

	it('takes them off again when they sit inside what is picked', () => {
		const done = toggle_emphasis('one **two** three', 4, 11, HEAVY);
		expect(done.text).toBe('one two three');
		expect(done.text.slice(done.from, done.to)).toBe('two');
	});

	it('takes them off when they sit just outside what is picked', () => {
		const done = toggle_emphasis('one **two** three', 6, 9, HEAVY);
		expect(done.text).toBe('one two three');
		expect(done.text.slice(done.from, done.to)).toBe('two');
	});

	it('with nothing picked, puts the pair in and stands between them', () => {
		const done = toggle_emphasis('one three', 4, 4, HEAVY);
		expect(done.text).toBe('one ****three');
		expect(done.from).toBe(6);
		expect(done.to).toBe(6);
	});
});

describe('making words slanted', () => {
	it('puts one star either side', () => {
		expect(toggle_emphasis('one two', 4, 7, SLANTED).text).toBe('one *two*');
	});

	it('takes one off again', () => {
		expect(toggle_emphasis('one *two*', 4, 9, SLANTED).text).toBe('one two');
	});

	it('leaves heavy words alone rather than shaving one star off each side', () => {
		const done = toggle_emphasis('one **two**', 4, 11, SLANTED);
		expect(done.text).toBe('one ***two***');       // slanted as well as heavy, not half-undone
	});
});

describe('striking words through', () => {
	it('puts two squiggles either side', () => {
		expect(toggle_emphasis('one two', 4, 7, STRUCK).text).toBe('one ~~two~~');
	});

	it('takes them off again, inside or outside the picking', () => {
		expect(toggle_emphasis('one ~~two~~', 4, 11, STRUCK).text).toBe('one two');
		expect(toggle_emphasis('one ~~two~~', 6, 9, STRUCK).text).toBe('one two');
	});

	it('leaves heavy words alone — the two marks are not each other\'s', () => {
		expect(toggle_emphasis('one **two**', 6, 9, STRUCK).text).toBe('one **~~two~~**');
	});

	it('can strike heavy words, and unstrike them', () => {
		const struck = toggle_emphasis('one **two**', 6, 9, STRUCK);
		expect(struck.text).toBe('one **~~two~~**');
		expect(toggle_emphasis(struck.text, struck.from, struck.to, STRUCK).text).toBe('one **two**');
	});
});

describe('the two together', () => {
	it('makes heavy words slanted too, and back again', () => {
		const heavy = toggle_emphasis('one two', 4, 7, HEAVY);
		expect(heavy.text).toBe('one **two**');
		const both = toggle_emphasis(heavy.text, heavy.from, heavy.to, SLANTED);
		expect(both.text).toBe('one ***two***');
		const back = toggle_emphasis(both.text, both.from, both.to, SLANTED);
		expect(back.text).toBe('one **two**');
	});
});
