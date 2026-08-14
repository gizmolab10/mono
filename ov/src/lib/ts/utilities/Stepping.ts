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

// Holding a mark down to keep stepping is the hits manager's now: a target hands it the press
// itself and each repeat after the pause, and the manager keeps the beat.
