import { TAG_AREAS, area_of, area_reads, tags_shown, tags_without_area } from '../types/Tag_Areas';
import { describe, expect, it } from 'vitest';
import { ALL_TAGS } from '../types/File';

// The areas are only a way of reading the closed tag list, so the two have to agree exactly:
// every tag belongs to one area, and no area names a tag that isn't on the list.

describe('the areas against the closed tag list', () => {
	it('claims every tag on the list', () => {
		expect(tags_without_area()).toEqual([]);
	});

	it('names nothing that is not on the list', () => {
		const named = TAG_AREAS.flatMap((area) => area.tags);
		expect(named.filter((tag) => !ALL_TAGS.includes(tag))).toEqual([]);
	});

	it('gives every tag exactly one area', () => {
		const named = TAG_AREAS.flatMap((area) => area.tags);
		expect(named.length).toBe(new Set(named).size);
		expect(named.length).toBe(ALL_TAGS.length);
	});

	it('says which area a tag belongs to, and nothing for a word that is not a tag', () => {
		expect(area_of('program')).toBe('code');
		expect(area_of('UX')).toBe('ux');
		expect(area_of('nonsense')).toBe('');
	});
});

describe('what an area shows', () => {
	const ux = TAG_AREAS.find((area) => area.name === 'ux')!;

	it('shows only the tags something is left wearing', () => {
		expect(tags_shown(ux, ['geometry'], [])).toEqual(['geometry']);
	});

	it('keeps a tag already picked, even with nothing left wearing it', () => {
		expect(tags_shown(ux, [], ['UX'])).toEqual(['UX']);
	});

	it('puts them in order, ignoring capitals', () => {
		expect(tags_shown(ux, ['visual', 'geometry', 'UX'], [])).toEqual(['geometry', 'UX', 'visual']);
	});

	it('shows nothing when the area is spent', () => {
		expect(tags_shown(ux, [], [])).toEqual([]);
	});
});

describe('what a shut area reads', () => {
	const bedrock = TAG_AREAS.find((area) => area.name === 'bedrock')!;

	it('reads its own name while nothing inside it is picked', () => {
		expect(area_reads(bedrock, [])).toBe('bedrock');
		expect(area_reads(bedrock, ['program'])).toBe('bedrock');    // picked, but in another area
	});

	it('reads what is picked instead, in order', () => {
		expect(area_reads(bedrock, ['setup', 'build'])).toBe('build, setup');
	});
});
