<script lang='ts'>
	import { w_tip, start_tips } from '../../ts/utilities/Tooltip';
	import { colors } from '../../ts/utilities/Colors';
	import { c } from '../../ts/common/Configuration';
	import { k } from '../../ts/common/Constants';
	import Details from '../details/Details.svelte';
	import ToolTip from '../support/ToolTip.svelte';
	import { debug } from '../../ts/common/Debug';

	const { w_background_color, w_accent_color, w_hover_color, w_text_color } = colors;

	// Whenever any of the four theme colors changes, push all four onto the page so
	// every component can read them as plain style names.
	$effect(() => {
		c.configure_reactive_colors(
			$w_background_color,
			$w_accent_color,
			$w_hover_color,
			$w_text_color
		);
	});

	// The one hover-hint watcher for the whole app: an element carrying its own words
	// (marked with the hint action) shows them, drawn by the hint at the bottom of this file.
	$effect(() => start_tips());

	// One number for the margin at the window's four edges and for the space between
	// the two regions, so the drawing and the arithmetic can never disagree.
	const gap = k.gap.default;

	let width  = $state(Math.max(k.width.window, window.innerWidth));
	let height = $state(window.innerHeight);

	function handleResize() {
		width  = Math.max(k.width.window, window.innerWidth);
		height = window.innerHeight;
	}

	// Is there room for both the details column (its fixed width) and the content region
	// beside it (its own smallest useful width), with the two outer margins and the one
	// between? Measured from the real window width, so it tracks resize and browser zoom.
	let room_for_both = $derived(width - gap * 3 >= k.width.details + k.width.content);
	// Too narrow for both: the content region is dropped and details fill the width.
	let details_width = $derived(room_for_both ? k.width.details - gap * 2 : width - gap * 2);
	let content_width = $derived(width - details_width - gap * 3);

	// Say it only when the both-or-details-only switch flips, with the numbers behind it.
	let said_last = '';
	$effect(() => {
		const line = `both fit: ${room_for_both}`;
		if (line === said_last) { return; }
		said_last = line;
		const needed = k.width.details + k.width.content + gap * 3;
		debug.log(`Layout: the window is ${width} wide and ${Math.round(needed)} is needed for both (details column ${k.width.details} + content ${k.width.content} + three gaps of ${Math.round(gap)}) — ${room_for_both
			? `showing both, details ${Math.round(details_width)} wide and content ${Math.round(content_width)} wide.`
			: `too narrow, so the content region is hidden and details fill ${Math.round(details_width)}.`}`);
	});
</script>

<svelte:window onresize={handleResize} />

<div class='frame' style:width='{width}px' style:height='{height}px'>
	<Details width={details_width} />
	{#if room_for_both}
		<div class='region content' style:width='{content_width}px'></div>
	{/if}
</div>

<!-- The one hover hint for the whole app; each element opts in by carrying its own words. -->
<ToolTip message={$w_tip.message} mouseX={$w_tip.x} mouseY={$w_tip.y} appearance={$w_tip.appearance} />

<style>
	.frame {
		background : var(--accent);
		padding    : var(--gap);
		gap        : var(--gap);
		box-sizing : border-box;
		position   : fixed;
		display    : flex;
		overflow   : hidden;
		top        : 0;
		left       : 0;
	}

	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.content {
		background  : var(--bg);
		flex-shrink : 0;
	}

	:global(:root) {
		--font: 'Montserrat', system-ui, sans-serif;
	}

	:global(body) {
		font-weight : var(--fw-normal);
		font-family : var(--font);
		color       : var(--text);
		user-select : none;
		margin      : 0;
	}

	:global(button, input, select, textarea) {
		font-weight : var(--fw-normal);
		font-family : var(--font);
	}

	:global(input:focus, textarea:focus) {
		user-select : text;
	}
</style>
