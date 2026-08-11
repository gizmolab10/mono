/**
 * Make a box slide between heights instead of jumping.
 *
 * A browser only slides a value that was stated differently. A box left to find its own height
 * never states one — its height changes because what is inside it wrapped onto another row, and
 * nothing in the styling changed at all, so there is nothing to slide between. This watches what
 * the box would be and states that number in pixels, which is a change the styling can follow.
 *
 * The first measurement is put on without sliding, so nothing moves as the page arrives.
 */

/**
 * How tall a box would stand if left to itself: the bottom of its lowest child, counted from the
 * box's own top. Each child says where it starts and how tall it is; those two are handed in,
 * already counted from the box, so the arithmetic can be proved without a page.
 */
export function natural_height(children: Array<{ top: number; height: number }>): number {
	let lowest = 0;
	for (const one of children) {
		const bottom = one.top + one.height;
		if (bottom > lowest) { lowest = bottom; }
	}
	return lowest;
}

/** Where each child starts and how tall it is, both counted from the box's own top. */
export function children_of(box: HTMLElement): Array<{ top: number; height: number }> {
	const from = box.getBoundingClientRect().top;
	return (Array.from(box.children) as HTMLElement[]).map((one) => {
		const at = one.getBoundingClientRect();
		return { top: at.top - from, height: at.height };
	});
}

/**
 * Watch a box and keep its stated height equal to the height it would find on its own. The
 * sliding itself is the styling's — this only supplies a number for it to slide between.
 */
export function smooth_height(box: HTMLElement) {
	let stated = -1;
	let looking = false;                           // true while the height is off, so a change now is ours

	function look_again() {
		if (looking) { return; }
		looking = true;
		// Read where the children actually are. The stated height is left alone while reading: take
		// it off and the box jumps to its natural height at once, so the sliding put on afterwards
		// would have nowhere left to travel.
		const wants = natural_height(children_of(box));
		looking = false;
		if (wants === 0 || wants === stated) { return; }
		// The very first number goes on with the sliding turned off, so nothing moves on arrival.
		if (stated < 0) {
			const was = box.style.transitionProperty;
			box.style.transitionProperty = 'none';
			box.style.height = `${wants}px`;
			void box.offsetHeight;                 // makes the browser take that in before sliding again
			box.style.transitionProperty = was;
		} else {
			box.style.height = `${wants}px`;
		}
		stated = wants;
	}

	// The children move about as pills grow and shrink, so each of them is watched. The box itself
	// is watched too, since it is what changes width when the window does — and a narrower box
	// wraps its pills onto another row.
	const watcher = new ResizeObserver(look_again);
	watcher.observe(box);

	// Which children there are changes too: clearing or turning over what is picked brings pills
	// back and takes others away. Watching only the ones that were there at the start would leave
	// an arriving pill unwatched, and the box holding a height worked out before it came — so the
	// list is watched as well, and every child taken up afresh whenever it changes.
	function watch_the_children() {
		watcher.disconnect();
		watcher.observe(box);
		for (const one of Array.from(box.children)) { watcher.observe(one); }
		look_again();
	}
	const arrivals = new MutationObserver(watch_the_children);
	arrivals.observe(box, { childList: true });
	watch_the_children();

	// The first reading waits for the page to have drawn once: taken any sooner it finds the pills
	// still stacked, and states a height several rows tall that nothing afterwards corrects.
	requestAnimationFrame(look_again);

	return {
		update() { look_again(); },
		destroy() { watcher.disconnect(); arrivals.disconnect(); },
	};
}
