/**
 * A section is a rectangle bounded above and below by a separator or by an edge of the view,
 * with equal gap around whatever it holds. Stacks of them make a page.
 *
 * The arithmetic lives here rather than in the component, so it can be proved without a page —
 * which is the whole point. Every spacing fault this file exists to prevent came from two places
 * doing their own arithmetic and drifting apart.
 */

import { k } from '../common/Core';

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
 * The gap a section holds below whatever it shows. Nothing is given back here: the line that
 * bounds this gap is the next section's, drawn at its top, and no section knows how thick the next
 * one draws its own.
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
 * The gap between a section's own line and what it shows, measured from the line's middle rather
 * than from its lower edge. Half the line stands inside that distance, so half of it is given back
 * here — and the gap reads the same whether the line above is the hair or the heavy one.
 *
 * Where half the line is wider than the gap itself, nothing is held: the content comes straight up
 * under the line.
 */
export function gap_above(folded: boolean, gap: number = USUAL_GAP, holds_subsections = false, thickness = 0): number {
	const inside = gap_inside(folded, gap, holds_subsections);
	if (inside === 0) { return 0; }
	return Math.max(0, inside - thickness / 2);
}

/**
 * How tall a folded section stands: no content, so its whole height stands in for the row that
 * went — the usual gap. Without it, the line above would sit on the line below.
 *
 * The gap a section holds open is not asked. A fold shows the same band whether it put away one
 * search field or a stack of tag rows, so the number is one number for every section.
 *
 * A section that should stand flat when folded says so by asking for no gap at all. That is the
 * one number, said once, rather than a second rule about when the first does not apply.
 *
 * How thick the line above is drawn comes in too, since what stands between two lines is measured
 * from their middles: half of one line and half of the next are inside the distance.
 *
 * One section can ask for more than that one number, and says how much. A section standing flat is
 * standing flat: it asks for no gap, and whatever extra it named is not added to nothing.
 */
export function folded_height(gap: number = USUAL_GAP, thickness: number = 0, extra: number = 0): number {
	const delta = k.thickness.huge - thickness;
	if (gap === 0) { return 0; }
	return USUAL_GAP + delta + extra;
}
