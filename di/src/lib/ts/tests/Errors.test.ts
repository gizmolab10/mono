import { describe, it, expect, beforeEach } from 'vitest';
import { errors } from '../algebra';
import { givens } from '../algebra/Givens';
import { scene } from '../render/Scene';
import Smart_Object from '../runtime/Smart_Object';

const cube_edges: [number, number][] = [
	[0, 1], [1, 2], [2, 3], [3, 0],
	[4, 5], [5, 6], [6, 7], [7, 4],
	[0, 4], [1, 5], [2, 6], [3, 7],
];

function add_so(name: string): Smart_Object {
	const so = new Smart_Object(name);
	scene.create({ so, edges: cube_edges });
	return so;
}

beforeEach(() => {
	scene.clear();
	givens.clear();
});

// ═══════════════════════════════════════════════════════════════════
// VALIDATE_NAME
// ═══════════════════════════════════════════════════════════════════

describe('validate_name', () => {

	// ── valid names ──

	it('accepts simple alphanumeric names', () => {
		expect(errors.validate_name('tread')).toBeNull();
		expect(errors.validate_name('box_1')).toBeNull();
		expect(errors.validate_name('MyPart')).toBeNull();
	});

	it('accepts names with underscores', () => {
		expect(errors.validate_name('front_panel')).toBeNull();
		expect(errors.validate_name('_leading')).toBeNull();
		expect(errors.validate_name('trailing_')).toBeNull();
	});

	it('accepts names with spaces (caller converts to underscores)', () => {
		expect(errors.validate_name('my part')).toBeNull();
	});

	// ── bad characters ──

	it('rejects dots', () => {
		const err = errors.validate_name('tread.s');
		expect(err).toContain("'.'");
	});

	it('rejects slashes', () => {
		const err = errors.validate_name('tread/ss');
		expect(err).toContain("'/'");
	});

	it('groups consecutive bad characters', () => {
		const err = errors.validate_name('tread!@@#$ss');
		expect(err).toContain("'!@@#$'");
	});

	it('rejects plus, minus, asterisk', () => {
		expect(errors.validate_name('a+b')).toContain("'+'");
		expect(errors.validate_name('a-b')).toContain("'-'");
		expect(errors.validate_name('a*b')).toContain("'*'");
	});

	// ── reserved attribute names ──

	it('rejects single-letter attribute names', () => {
		for (const attr of ['s', 'e', 'l', 'x', 'y', 'z', 'X', 'Y', 'Z', 'w', 'd', 'h']) {
			expect(errors.validate_name(attr)).toContain('reserved');
		}
	});

	it('accepts multi-letter names that start with reserved letters', () => {
		expect(errors.validate_name('shelf')).toBeNull();
		expect(errors.validate_name('width_extra')).toBeNull();
	});

	// ── duplicate SO names ──

	it('rejects names already used by another SO', () => {
		add_so('drawer');
		expect(errors.validate_name('drawer')).toContain('already in use');
	});

	it('allows the same name when excluded by SO id', () => {
		const so = add_so('drawer');
		expect(errors.validate_name('drawer', so.id)).toBeNull();
	});

	// ── duplicate given names ──

	it('rejects names already used by a given', () => {
		givens.add('gap', 10);
		expect(errors.validate_name('gap')).toContain('already in use');
	});

	it('allows the same name when excluded by given name', () => {
		givens.add('gap', 10);
		expect(errors.validate_name('gap', undefined, 'gap')).toBeNull();
	});

	// ── cross-pool collisions ──

	it('rejects SO name that matches a given', () => {
		givens.add('spacer', 5);
		expect(errors.validate_name('spacer')).toContain('already in use');
	});

	it('rejects given name that matches an SO', () => {
		add_so('bracket');
		expect(errors.validate_name('bracket')).toContain('already in use');
	});
});

// ═══════════════════════════════════════════════════════════════════
// EXTRACT_SPAN
// ═══════════════════════════════════════════════════════════════════

describe('extract_span', () => {

	it('finds position from "at position N" errors', () => {
		const err = new Error('Unexpected character at position 5');
		expect(errors.extract_span(err, 'abc + @def')).toEqual([5, 1]);
	});

	it('finds token from "got \'X\'" errors', () => {
		const err = new Error("Expected number, reference, or '(' but got '*'");
		const span = errors.extract_span(err, 'a.e + * 3');
		expect(span[0]).toBe(6);
		expect(span[1]).toBe(1);
	});

	it('finds token from "token \'X\'" errors', () => {
		const err = new Error("Unexpected token '+' — expected end of expression");
		const span = errors.extract_span(err, 'a.e 3 + 1');
		expect(span[0]).toBe(6);
	});

	it('highlights last char for "got end" errors', () => {
		const err = new Error("Expected number but got 'end'");
		const span = errors.extract_span(err, 'a.e + ');
		expect(span).toEqual([4, 1]);
	});

	it('falls back to full input when nothing matches', () => {
		const err = new Error('something went wrong');
		expect(errors.extract_span(err, 'abc')).toEqual([0, 3]);
	});
});

// ═══════════════════════════════════════════════════════════════════
// BAD_SYNTAX — suggestions
// ═══════════════════════════════════════════════════════════════════

describe('bad_syntax', () => {

	it('offers only delete when bad token is an operator', () => {
		const err = errors.bad_syntax('a.e + * 3', [5, 1], new Error('bad'));
		expect(err.suggestions).toHaveLength(1);
		expect(err.suggestions[0].label).toBe('delete it');
	});

	it('offers only delete when junk is adjacent to an operator', () => {
		const err = errors.bad_syntax('a.e - @!#@ 3', [6, 4], new Error('bad'));
		expect(err.suggestions).toHaveLength(1);
		expect(err.suggestions[0].label).toBe('delete it');
	});

	it('offers only delete when junk precedes an operator', () => {
		const err = errors.bad_syntax('a.e @!#@ + 3', [4, 4], new Error('bad'));
		expect(err.suggestions).toHaveLength(1);
		expect(err.suggestions[0].label).toBe('delete it');
	});

	it('offers operator replacements when not adjacent to an operator', () => {
		const err = errors.bad_syntax('a.e @!# b.e', [4, 3], new Error('bad'));
		expect(err.suggestions.length).toBeGreaterThan(1);
		expect(err.suggestions.map(s => s.label)).toContain('+');
		expect(err.suggestions.map(s => s.label)).toContain('delete it');
	});
});

// ═══════════════════════════════════════════════════════════════════
// CLASSIFY
// ═══════════════════════════════════════════════════════════════════

describe('classify', () => {

	it('routes "got end" errors to incomplete', () => {
		const err = errors.classify('a.e +', [4, 1], new Error("Expected number but got 'end'"));
		expect(err.message).toContain('incomplete');
	});

	it('routes tail junk to incomplete with widened span', () => {
		const err = errors.classify('a.e./', [4, 1], new Error('bad'));
		expect(err.message).toContain('incomplete');
		expect(err.span).toEqual([3, 2]); // covers "./"
	});

	it('routes mid-formula errors to bad_syntax', () => {
		const err = errors.classify('a.e + @@ + b.e', [6, 2], new Error('bad'));
		expect(err.message).toContain('unexpected');
	});
});
