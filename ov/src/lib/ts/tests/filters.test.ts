import { T_Picking, inverted, kept_from, tags_match } from '../managers/Filters';
import { describe, expect, it } from 'vitest';

// Which way the tags pick: a file shows if it wears any one of them, or only if it wears
// every one. With nothing picked, every file shows either way.

describe('picking by tag', () => {
	it('lets everything through when nothing is picked', () => {
		expect(tags_match(T_Picking.any, [], [])).toBe(true);
		expect(tags_match(T_Picking.all, [], ['prose'])).toBe(true);
	});

	it('any of: one worn tag out of the picked ones is enough', () => {
		expect(tags_match(T_Picking.any, ['prose', 'team'], ['prose'])).toBe(true);
		expect(tags_match(T_Picking.any, ['prose', 'team'], ['debug'])).toBe(false);
	});

	it('all of: every picked tag has to be worn', () => {
		expect(tags_match(T_Picking.all, ['prose', 'team'], ['prose', 'team', 'debug'])).toBe(true);
		expect(tags_match(T_Picking.all, ['prose', 'team'], ['prose'])).toBe(false);
	});

	it('reads an unknown way of picking as any of', () => {
		expect(tags_match('sideways', ['prose'], ['prose'])).toBe(true);
		expect(tags_match('sideways', ['prose'], ['team'])).toBe(false);
	});
});

// Inverting picks exactly the tags that were not picked, out of the ones on offer.

describe('inverting what is picked', () => {
	const offered = ['prose', 'team', 'debug'];

	it('picks what was not picked, and drops what was', () => {
		expect(inverted(offered, ['prose'])).toEqual(['team', 'debug']);
	});

	it('turns nothing picked into all of them, and back again', () => {
		expect(inverted(offered, [])).toEqual(offered);
		expect(inverted(offered, offered)).toEqual([]);
	});

	it('leaves out a picked tag that is no longer on offer', () => {
		expect(inverted(offered, ['gone'])).toEqual(offered);
	});
});

// A word remembered from an earlier visit that is no longer one of the choices would narrow
// the list while showing nowhere — nothing to press to undo it. Said once, used by each.

describe('letting go of a remembered word', () => {
	it('keeps the ones still on offer', () => {
		expect(kept_from(['prose', 'gone'], ['prose', 'team'])).toEqual(['prose']);
	});

	it('hands back the very same list when every one is still real', () => {
		const remembered = ['prose', 'team'];
		expect(kept_from(remembered, ['prose', 'team', 'debug'])).toBe(remembered);
	});

	it('hands back nothing when none of them is', () => {
		expect(kept_from(['gone'], ['prose'])).toEqual([]);
	});
});
