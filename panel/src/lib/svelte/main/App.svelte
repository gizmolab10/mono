<script lang='ts'>
	import { c, colors, hits, k, Point, S_Mouse, start_tips, ToolTip, w_tip } from '../../ts/common/Core';
	import Operation from './Operation.svelte';
	import Controls from './Controls.svelte';
	import Details from './Details.svelte';

	// ov's three regions, emptied: the controls row across the top, the details column down the left,
	// the content box filling the rest. Nothing in any of them yet.

	const { w_background_color, w_accent_color, w_hover_color, w_text_color } = colors;

	// Whenever any of the four theme colors changes, push all four onto the page so every
	// component can read them as plain style names. Nothing is remembered between visits yet,
	// so what is pushed is core's own defaults.
	$effect(() => {
		c.configure_reactive_colors($w_background_color, $w_accent_color, $w_hover_color, $w_text_color);
	});

	// The one hover-hint watcher for the whole app: an element carrying its own words shows
	// them, drawn by the hint at the bottom of this file.
	$effect(() => start_tips());

	// One number for the margin at the window's four edges and for the space between the two
	// regions, so the drawing and the arithmetic can never disagree.
	const gap = k.gap.normal;

	let width  = $state(Math.max(k.width.normal, window.innerWidth));
	let height = $state(window.innerHeight);

	function handleResize() {
		width  = Math.max(k.width.normal, window.innerWidth);
		height = window.innerHeight;
		// Everything on screen has moved, and every rectangle the hits manager holds was measured
		// once. They are asked again after the browser has drawn at the new size.
		hits.defer_recalibrate();
	}

	// Whether details shows at all is the hamburger's doing. Not remembered between visits yet.
	let show_details = $state(true);

	// Is there room for both the details column (its fixed width) and the content region beside
	// it (its own smallest useful width), with the two outer margins and the one between?
	let room_for_both = $derived(width - gap * 3 >= k.width.small + k.width.big);
	// Too narrow for both: the content region is dropped and details fill the width.
	let details_only  = $derived(show_details && !room_for_both);
	let details_width = $derived(details_only ? width - gap * 2 : k.width.small - gap * 2);
	// With details hidden, content has the whole width to itself.
	let content_width = $derived(show_details ? width - details_width - gap * 3 : width - gap * 2);

	function toggle_details() {
		show_details = !show_details;
	}
</script>

<!-- The cursor is fed to the manager here and nowhere else: it asks which targets hold that point
     and hands the press to the one of highest precedence. A control that has moved over to it
     watches nothing itself. -->
<svelte:window
	onresize={handleResize}
	onmousemove={(event) => hits.handle_mouse_movement_at(new Point(event.clientX, event.clientY))}
	onmousedown={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.down(event, null))}
	onmouseup={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.up(event, null))} />

<div class='app' style:width='{width}px' style:height='{height}px'>
	<Controls onclick={toggle_details} detailsShown={show_details} />
	<div class='boxes'>
		{#if show_details}
			<Details width={details_width} />
		{/if}
		{#if !details_only}
			<Operation width={content_width} />
		{/if}
	</div>
</div>

<!-- The one hover hint for the whole app; each element opts in by carrying its own words. -->
<ToolTip message={$w_tip.message} mouseX={$w_tip.x} mouseY={$w_tip.y} appearance={$w_tip.appearance} />

<style>
	.app {
		background     : var(--accent);
		padding        : var(--gap);
		gap            : var(--gap);
		flex-direction : column;
		box-sizing     : border-box;
		position       : fixed;
		display        : flex;
		overflow       : hidden;
		top            : 0;
		left           : 0;
	}

	/* The two side-by-side boxes, below the controls row. */
	.boxes {
		gap        : var(--gap);
		overflow   : visible;
		display    : flex;
		min-height : 0;
		flex       : 1;
	}

	:global(:root) {
		/* The typeface. Not a step on any ladder, so it keeps a name of its own. */
		--family: system-ui, sans-serif;
	}

	:global(body) {
		font-weight : var(--fw);
		font-family : var(--family);
		color       : var(--text);
		user-select : none;
		margin      : 0;
	}

	:global(button, input, select, textarea) {
		font-weight : var(--fw);
		font-family : var(--family);
	}
</style>
