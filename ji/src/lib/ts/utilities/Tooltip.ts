import { writable } from 'svelte/store';
import { debug } from '../common/Debug';

// The one hover hint shown at a time. A single ToolTip mounted at the app root reads this and
// draws the hint centered just below the mouse, appearing after a short pause (the browser's own
// title text waits about a second and can't be hurried). Message null shows nothing. `appearance`
// counts up every time the cursor lands on a different hinted element, so the hint's opening pause
// can restart even when two neighbors (rows all reading "open this file") carry the same words.
export type Tip = { message: string | null; x: number; y: number; appearance: number };

export const w_tip = writable<Tip>({ message: null, x: 0, y: 0, appearance: 0 });

// The action: mark an element with the words to show on hover. Empty, null, or false means "no
// tip here" (a thing that's only sometimes clickable, or simply needs none). It only sets an
// attribute; the one document-wide watcher below does the drawing.
export function tip(node: HTMLElement, message?: string | null | false) {
	const apply = (m?: string | null | false) => {
		if (m && m.trim()) { node.dataset.tip = m; } else { delete node.dataset.tip; }
	};
	apply(message);
	return {
		update(next?: string | null | false) { apply(next); },
		destroy() { delete node.dataset.tip; },
	};
}

// Start the one document-wide watcher (call once, from the app root). While the cursor is over an
// element that carries its own words (or a child of one), it shows those words and follows the
// mouse; over anything else it clears. Returns a teardown.
export function start_tips(): () => void {
	let current: HTMLElement | null = null;   // the hinted element the cursor is over right now
	let appearance = 0;                        // bumps each time that element changes, to restart the pause
	function on_move(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		const el = target?.closest?.('[data-tip]') as HTMLElement | null;
		if (el !== current) {
			current = el;
			appearance++;
			debug.log(`Tooltip: cursor moved onto a ${el ? `new hint ("${el.dataset.tip}")` : 'plain spot'} — appearance ${appearance}, its opening pause restarts.`);
		}
		const message = el?.dataset.tip ?? null;
		w_tip.set({ message, x: event.clientX, y: event.clientY, appearance });
	}
	function clear() { current = null; w_tip.set({ message: null, x: 0, y: 0, appearance }); }
	function clear_on_click() {
		if (current) { debug.log('Tooltip: mouse pressed — hint hidden until the cursor moves again.'); }
		clear();
	}

	document.addEventListener('mousemove', on_move);
	document.addEventListener('mouseleave', clear);        // cursor left the window
	document.addEventListener('mousedown', clear_on_click);   // a click hides the hint (it comes back on the next move)
	return () => {
		document.removeEventListener('mousemove', on_move);
		document.removeEventListener('mouseleave', clear);
		document.removeEventListener('mousedown', clear_on_click);
		clear();
	};
}
