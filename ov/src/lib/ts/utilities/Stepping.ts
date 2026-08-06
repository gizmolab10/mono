import { Direction } from '../types/Angle';

/**
 * The two marks that step from one thing to the next, and the holding that repeats a step.
 *
 * Which way each mark points is the one thing that changes when the pair runs up-and-down
 * rather than side-to-side, so it is worked out here rather than written twice.
 */

/** Which way the "back" mark points: left when the pair runs across, up when it runs down. */
export function back_direction(vertical: boolean): Direction {
	return vertical ? Direction.up : Direction.left;
}

/** Which way the "forward" mark points: right when the pair runs across, down when it runs down. */
export function forward_direction(vertical: boolean): Direction {
	return vertical ? Direction.down : Direction.right;
}

/**
 * Whether a mark is drawn at all. Ordinarily one that leads nowhere is simply absent — its
 * absence is the sign that there is nothing that way. Asked to show both, it is drawn anyway
 * and left dead to the touch, so the pair never changes width.
 */
export function shows_mark(can_go: boolean, always_both: boolean): boolean {
	return can_go || always_both;
}

/** Whether a drawn mark answers to a press. */
export function mark_is_live(can_go: boolean): boolean {
	return can_go;
}

/**
 * Holding a mark down keeps stepping: one step at once, a pause, then a steady patter until
 * it is let go. Made fresh for each pair, so two pairs on screen never share a beat.
 */
export const HOLD_PAUSE = 400;
export const HOLD_TICK = 120;

export type Holding = {
	start : (step: () => void) => void;
	stop  : () => void;
};

export function make_holding(pause = HOLD_PAUSE, tick = HOLD_TICK): Holding {
	let wait: ReturnType<typeof setTimeout> | null = null;
	let beat: ReturnType<typeof setInterval> | null = null;

	function stop(): void {
		if (wait !== null) { clearTimeout(wait); wait = null; }
		if (beat !== null) { clearInterval(beat); beat = null; }
	}

	function start(step: () => void): void {
		stop();                                   // never two runs at once
		step();                                   // the first step, right away
		wait = setTimeout(() => { beat = setInterval(step, tick); }, pause);
	}

	return { start, stop };
}
