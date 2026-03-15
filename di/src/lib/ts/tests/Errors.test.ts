import { describe, it, expect, beforeEach } from 'vitest';
import { errors } from '../algebra';
import { constants } from '../algebra/User_Constants';
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
	constants.clear();
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

	// ── duplicate constant names ──

	it('rejects names already used by a constant', () => {
		constants.add('gap', 10);
		expect(errors.validate_name('gap')).toContain('already in use');
	});

	it('allows the same name when excluded by constant name', () => {
		constants.add('gap', 10);
		expect(errors.validate_name('gap', undefined, 'gap')).toBeNull();
	});

	// ── cross-pool collisions ──

	it('rejects SO name that matches a constant', () => {
		constants.add('spacer', 5);
		expect(errors.validate_name('spacer')).toContain('already in use');
	});

	it('rejects constant name that matches an SO', () => {
		add_so('bracket');
		expect(errors.validate_name('bracket')).toContain('already in use');
	});
});
