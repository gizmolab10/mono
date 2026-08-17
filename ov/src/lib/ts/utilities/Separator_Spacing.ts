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

/**
 * Every line across the view on screen right now, in the order they stand. Two columns stand side
 * by side, so a caller wanting its own lines alone hands over the box that holds them; the whole
 * page otherwise, where the two would be read as one run and every distance between them wrong.
 */
export function lines_on_screen(within: Element | null = null): DOMRect[] {
	return [...(within ?? document).querySelectorAll('.separator.horizontal')]
		.map((one) => one.getBoundingClientRect())
		.filter((one) => one.width > 0);
}

/** Say what the lines on screen are holding, middle to middle. Nothing is said for one line alone. */
export function report_line_spacing(where: string, within: Element | null = null) {
	const centers = centers_of(lines_on_screen(within));
	if (centers.length < 2) { return; }
	const apart = distances_between(centers).map((one) => one.toFixed(2));
	debug.log(`Lines in ${where}: ${centers.length} of them, middle to middle — ${apart.join(', ')}.`);
}

/**
 * How far one thing stands below the line above it, measured from that line's middle — the one
 * number a gap is named by. The line above is the last one whose middle is higher than its top.
 *
 * Two numbers come back, because a gap can be right and still read wrong. The first is to the top
 * of the thing's own box. The second is to the first ink inside it: a pill-shaped field draws its
 * edge at its very top, while a line of words holds empty space above the letters, so the same
 * measured gap shows as two different gaps to the eye.
 */
export function gap_below_line(thing: Element | null, what: string) {
	if (!thing) { return; }
	const at = thing.getBoundingClientRect();
	const lines = lines_on_screen().filter((one) => one.top + one.height / 2 < at.top);
	if (lines.length === 0) { debug.log(`Spacing: nothing is drawn above ${what}, so it stands below no line.`); return; }
	const line = lines.reduce((lower, one) => (one.top > lower.top ? one : lower));
	const middle = line.top + line.height / 2;
	const ink = first_ink_in(thing);
	const says = ink === null ? 'it holds no words of its own'
		: `its first ink begins ${(ink - middle).toFixed(2)}px below that middle, which is ${(ink - at.top).toFixed(2)}px inside its own top`;
	debug.log(`Spacing: ${what} begins ${(at.top - middle).toFixed(2)}px below the middle of the ${line.height.toFixed(2)}-thick line above it, and ${says}.`);
}

/** Where the first letter inside a thing is actually drawn, or nothing where it holds none. */
function first_ink_in(thing: Element): number | null {
	const walk = document.createTreeWalker(thing, NodeFilter.SHOW_TEXT);
	let words = walk.nextNode() as Text | null;
	while (words && words.data.trim() === '') { words = walk.nextNode() as Text | null; }
	if (!words) { return null; }
	const at = words.data.search(/\S/);
	const one = document.createRange();
	one.setStart(words, at);
	one.setEnd(words, at + 1);
	const found = one.getBoundingClientRect();
	return found.height === 0 && found.top === 0 ? null : found.top;
}

/**
 * Every section on screen, each measured against the line above it. One call says whether the
 * gaps really differ, and by how much — the eye says they do, and the numbers say which.
 */
export function report_gaps_below_lines(where: string) {
	const bodies = [...document.querySelectorAll('.section-body')] as HTMLElement[];
	debug.log(`Spacing in ${where}: ${bodies.length} section(s) to measure below their own lines.`);
	for (const body of bodies) {
		const first = (body.firstElementChild ?? body) as HTMLElement;
		const named = body.getAttribute('data-hit-id') ?? (first.className || body.className);
		gap_below_line(first, `the section holding "${named}"`);
	}
}
