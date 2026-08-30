import { get, writable } from 'svelte/store';
import { debug } from '../common';
import { hits } from '../events';

// The one hover hint shown at a time. A single ToolTip mounted at the app root reads this and
// draws the hint centered just below the mouse, appearing after a short pause (the browser's own
// title text waits about a second and can't be hurried). Message null shows nothing. `appearance`
// counts up every time the cursor lands on a different hinted element, so the hint's opening pause
// can restart even when two neighbors carry the same words.
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
	let at_x = 0, at_y = 0;                    // where the cursor was last seen

	// A control that has moved over to the hits manager carries no words of its own: the manager
	// holds which target the cursor is on, and that target holds the words. It is asked first,
	// since it names the one thing under the cursor while the walk up the page finds the nearest
	// thing that happens to carry words — often a whole row standing behind the control.
	//
	// The one exception is a thing standing inside what the manager names: a link inside a file's
	// own words is smaller than those words, and its own words are the truer answer. Without this
	// every link read as the whole page's "click a paragraph to edit it".
	function words_to_show(el: HTMLElement | null): string | null {
		const target = get(hits.w_s_hover);
		const said = target?.tip ?? null;
		const stands_on = target?.html_element ?? null;
		const inside = !!el && !!stands_on && stands_on !== el && stands_on.contains(el);
		debug.log_soon(`Hover: the manager says "${said ?? 'nothing'}" for "${target?.id ?? 'nothing'}"; the element under the cursor says "${el?.dataset.tip ?? 'nothing'}" and ${inside ? 'stands inside it, so its own words win' : 'does not stand inside it, so the manager wins'}.`);
		if (inside) { return el.dataset.tip ?? said; }
		return said ?? el?.dataset.tip ?? null;
	}

	function on_move(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		const el = target?.closest?.('[data-tip]') as HTMLElement | null;
		if (el !== current) {
			current = el;
			appearance++;
		}
		at_x = event.clientX;
		at_y = event.clientY;
		w_tip.set({ message: words_to_show(el), x: at_x, y: at_y, appearance });
	}

	// The manager is told the cursor after this watcher is, so its answer arrives one move late.
	// This says it again the moment it changes, which is what makes the hint show on the way in
	// rather than on the move after.
	const stop_watching = hits.w_s_hover.subscribe(() => {
		appearance++;
		w_tip.set({ message: words_to_show(current), x: at_x, y: at_y, appearance });
	});

	// Some hints say something different while a key is held — hovering a guide with the
	// command key down offers to edit it rather than open it. The words on the element have
	// already changed by then, but nothing would show them until the mouse moved, so the
	// hint is said again on its own.
	// Waits one drawing beat first: the words on the element are changed by the same key
	// press, and that change lands after the press is handled, so reading them any sooner
	// would show what they said a moment ago.
	function on_key() {
		if (!current) { return; }
		requestAnimationFrame(() => {
			if (!current) { return; }
			w_tip.set({ message: current.dataset.tip ?? null, x: at_x, y: at_y, appearance });
		});
	}
	function clear() { current = null; w_tip.set({ message: null, x: 0, y: 0, appearance }); }
	function clear_on_click() {
		clear();
	}

	document.addEventListener('mousemove', on_move);
	document.addEventListener('mouseleave', clear);        // cursor left the window
	document.addEventListener('mousedown', clear_on_click);   // a click hides the hint (it comes back on the next move)
	window.addEventListener('keydown', on_key);            // a held key can change what a hint says
	window.addEventListener('keyup', on_key);
	return () => {
		stop_watching();
		document.removeEventListener('mousemove', on_move);
		document.removeEventListener('mouseleave', clear);
		document.removeEventListener('mousedown', clear_on_click);
		window.removeEventListener('keydown', on_key);
		window.removeEventListener('keyup', on_key);
		clear();
	};
}
