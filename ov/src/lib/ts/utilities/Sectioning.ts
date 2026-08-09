/**
 * A section is a rectangle bounded above and below by a separator or by an edge of the view,
 * with equal gap around whatever it holds. Stacks of them make a page.
 *
 * The arithmetic lives here rather than in the component, so it can be proved without a page —
 * which is the whole point. Every spacing fault this file exists to prevent came from two places
 * doing their own arithmetic and drifting apart.
 */

import { k } from '../common/Constants';

/** What a section is bounded by, above and below. */
export enum T_Edge {
	/** An edge of the view. Nothing is drawn, and no gap is held for a line. */
	view    = 'view',
	/** A hair between two subsections. */
	thin    = 'thin',
	/** The line between two sections. */
	thick   = 'thick',
}

/** How thick the line at one boundary is drawn. Nothing at all at an edge of the view. */
export function thickness_of(edge: T_Edge): number {
	if (edge === T_Edge.thin)  { return k.thickness.normal; }
	if (edge === T_Edge.thick) { return k.thickness.huge; }
	return 0;
}

/** The gap a section holds when it is not told otherwise. */
export const USUAL_GAP = k.gap.normal;

/**
 * The gap a section holds above and below whatever it shows. One number, used on both sides —
 * that evenness is the rule, and it is why nothing downstream has to correct anything.
 *
 * A folded section holds none: there is nothing inside to stand clear of, so its two lines meet
 * with only the one gap that stands in for the row that went.
 *
 * A section holding subsections holds none either, and its own gap is ignored: its first and last
 * children already hold one at those very boundaries, and two gaps at one boundary is the
 * doubling this whole piece exists to prevent.
 */
export function gap_inside(folded: boolean, gap: number = USUAL_GAP, holds_subsections = false): number {
	if (folded || holds_subsections) { return 0; }
	return gap;
}

/**
 * How tall a folded section stands: no content, so its whole height stands in for the row that
 * went — its own gap and a tiny one over. Without it, the line above would sit on the line below.
 *
 * A section that should stand flat when folded says so by asking for no gap at all. That is the
 * one number, said once, rather than a second rule about when the first does not apply.
 */
export function folded_height(gap: number = USUAL_GAP): number {
	if (gap === 0) { return 0; }
	return gap + k.gap.tiny;
}
