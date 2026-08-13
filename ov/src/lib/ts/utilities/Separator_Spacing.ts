/**
 * How far apart the lines across a view stand, measured middle to middle.
 *
 * A line has thickness, so its top edge moves whenever its thickness changes; its middle does
 * not. Measuring middle to middle is the one number that says how much a stack of sections is
 * actually holding, whatever each line is drawn at.
 *
 * The arithmetic is here rather than in a component so it can be proved without a page.
 */

import { debug } from '../common/Debug';

/** Where the middle of each line stands, top to bottom. */
export function centers_of(lines: DOMRect[]): number[] {
	return lines.map((one) => one.top + one.height / 2).sort((a, b) => a - b);
}

/** The distance from each middle to the next one's, in the order they stand. */
export function distances_between(centers: number[]): number[] {
	const distances: number[] = [];
	for (let at = 1; at < centers.length; at += 1) {
		distances.push(centers[at] - centers[at - 1]);
	}
	return distances;
}

/** Every line across the view on screen right now, in the order they stand. */
export function lines_on_screen(): DOMRect[] {
	return [...document.querySelectorAll('.separator.horizontal')]
		.map((one) => one.getBoundingClientRect())
		.filter((one) => one.width > 0);
}

/** Say what the lines on screen are holding, middle to middle. Nothing is said for one line alone. */
export function report_line_spacing(where: string) {
	const centers = centers_of(lines_on_screen());
	if (centers.length < 2) { return; }
	const apart = distances_between(centers).map((one) => one.toFixed(2));
	debug.log(`Lines in ${where}: ${centers.length} of them, middle to middle — ${apart.join(', ')}.`);
}
