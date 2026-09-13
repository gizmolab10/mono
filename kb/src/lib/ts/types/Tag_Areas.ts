import { in_order } from './File';

/**
 * The tags, gathered into areas: the host's, handed to kb in customizations.tag_areas since step
 * 7 of the plan, ai's ten among them.
 *
 * Many words in one row is more than an eye can scan, so each area folds its tags away behind
 * its own name and opens again when pressed. The areas are a way of reading the list, not a
 * second thing to filter by — what a file actually wears is still one flat set of tags, and
 * every tag belongs to exactly one area.
 */
export type Tag_Area = {
	name : string;
	tags : string[];
};

/** Which area a tag belongs to, or nothing when it belongs to none. */
export function area_of(tag: string, areas: Tag_Area[]): string {
	return areas.find((area) => area.tags.includes(tag))?.name ?? '';
}

/** Every tag on the closed list that no area claims — nothing, while the two agree. */
export function tags_without_area(tags: string[], areas: Tag_Area[]): string[] {
	return tags.filter((tag) => area_of(tag, areas) === '').sort(in_order);
}

/**
 * The tags of one area that are still worth showing: those something is left wearing, plus
 * any already picked, so a choice never vanishes from under the cursor. In the area's own
 * order, which for the lifecycle and the active areas is the order things happen in.
 */
export function tags_shown(area: Tag_Area, in_reach: string[], chosen: string[]): string[] {
	return area.tags.filter((tag) => in_reach.includes(tag) || chosen.includes(tag));
}

/**
 * What a shut area reads: its own name while nothing inside it is picked, otherwise the
 * names of what is — so a filter is never hidden without a sign that it is on.
 */
export function area_reads(area: Tag_Area, chosen: string[]): string {
	const picked = area.tags.filter((tag) => chosen.includes(tag)).sort(in_order);
	return picked.length === 0 ? area.name : picked.join(', ');
}
