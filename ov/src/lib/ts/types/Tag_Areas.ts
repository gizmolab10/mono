import { ALL_TAGS, in_order } from './Guide';

/**
 * The tags, gathered into six areas.
 *
 * Twenty-four words in one row is more than an eye can scan, so each area folds its tags
 * away behind its own name and opens again when pressed. The areas are a way of reading the
 * list, not a second thing to filter by — what a guide actually wears is still one flat set
 * of tags, and every tag belongs to exactly one area.
 */
export type Tag_Area = {
	name : string;
	tags : string[];
};

export const TAG_AREAS: Tag_Area[] = [
	{ name: 'ai',      tags: ['session', 'team', 'style', 'prose'] },
	{ name: 'code',    tags: ['port', 'migrate', 'refactor', 'wire', 'data'] },
	{ name: 'fix',     tags: ['test', 'debug'] },
	{ name: 'harness', tags: ['platform', 'setup', 'deploy', 'tools', 'build'] },
	{ name: 'other',   tags: ['notes', 'vision', 'research', 'stale', 'think'] },
	{ name: 'ux',      tags: ['visual-design', 'UX', 'geometry'] },
];

/** Which area a tag belongs to, or nothing when it belongs to none. */
export function area_of(tag: string): string {
	return TAG_AREAS.find((area) => area.tags.includes(tag))?.name ?? '';
}

/** Every tag on the closed list that no area claims — nothing, while the two agree. */
export function tags_without_area(): string[] {
	return ALL_TAGS.filter((tag) => area_of(tag) === '').sort(in_order);
}

/**
 * The tags of one area that are still worth showing: those something is left wearing, plus
 * any already picked, so a choice never vanishes from under the cursor.
 */
export function tags_shown(area: Tag_Area, in_reach: string[], chosen: string[]): string[] {
	return area.tags.filter((tag) => in_reach.includes(tag) || chosen.includes(tag)).sort(in_order);
}

/**
 * What a shut area reads: its own name while nothing inside it is picked, otherwise the
 * names of what is — so a filter is never hidden without a sign that it is on.
 */
export function area_reads(area: Tag_Area, chosen: string[]): string {
	const picked = area.tags.filter((tag) => chosen.includes(tag)).sort(in_order);
	return picked.length === 0 ? area.name : picked.join(', ');
}
