import { writable } from 'svelte/store';

// The one hover hint shown at a time. A single ToolTip mounted at the app root reads this and
// draws the hint centered just below the mouse, appearing the instant the cursor arrives (the
// browser's own title text waits about a second and can't be hurried). Message null shows nothing.
export type Tip = { message: string | null; x: number; y: number };

export const w_tip = writable<Tip>({ message: null, x: 0, y: 0 });

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
	function on_move(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		const el = target?.closest?.('[data-tip]') as HTMLElement | null;
		const message = el?.dataset.tip ?? null;
		w_tip.set({ message, x: event.clientX, y: event.clientY });
	}
	function clear() { w_tip.set({ message: null, x: 0, y: 0 }); }

	document.addEventListener('mousemove', on_move);
	document.addEventListener('mouseleave', clear);   // cursor left the window
	return () => {
		document.removeEventListener('mousemove', on_move);
		document.removeEventListener('mouseleave', clear);
		clear();
	};
}
