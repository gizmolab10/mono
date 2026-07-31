<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { w_tip, start_tips } from '../../ts/utilities/Tooltip';
	import { colors } from '../../ts/utilities/Colors';
	import { w_app, S_App } from '../../ts/types/App';
	import { c } from '../../ts/common/Configuration';
	import ToolTip from '../support/ToolTip.svelte';
	import buildsRaw from '../../md/builds.md?raw';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import BuildNotes from './BuildNotes.svelte';
	import Operation from './Operation.svelte';
	import Controls from './Controls.svelte';
	import Details from './Details.svelte';

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

	// The latest build number, read from the build-notes table.
	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter((line) => /^\|\s*\d+/.test(line))
		.map((line) => parseInt(line.split('|')[1].trim())));

	let showBuildNotes = $state(false);

	// Whether details shows at all is the hamburger's doing, and it is remembered across visits.
	const w_show_details = preferences.persistent<boolean>(T_Preference.show_details, true);

	// Is there room for both the details column (its fixed width) and the content region
	// beside it (its own smallest useful width), with the two outer margins and the one
	// between? Measured from the real window width, so it tracks resize and browser zoom.
	let room_for_both = $derived(width - gap * 3 >= k.width.details + k.width.content);
	// Too narrow for both: the content region is dropped and details fill the width.
	let details_only = $derived($w_show_details && !room_for_both);
	let details_width = $derived(details_only ? width - gap * 2 : k.width.details - gap * 2);
	// With details hidden, content has the whole width to itself.
	let content_width = $derived($w_show_details ? width - details_width - gap * 3 : width - gap * 2);

	function toggle_details() {
		const next = !$w_show_details;
		w_show_details.set(next);
		debug.log(`Hamburger clicked: details are now ${next ? 'showing' : 'hidden'}.`);
	}

	// Say it only when the showing-both / details-only / details-hidden picture changes,
	// with the numbers behind it.
	let said_last = '';
	$effect(() => {
		const line = `showing details: ${$w_show_details}, both fit: ${room_for_both}`;
		if (line === said_last) { return; }
		said_last = line;
		const needed = k.width.details + k.width.content + gap * 3;
		debug.log(`Layout: the window is ${width} wide and ${Math.round(needed)} is needed for both (details column ${k.width.details} + content ${k.width.content} + three gaps of ${Math.round(gap)}) — ${!$w_show_details
			? `details are hidden, so content has the whole ${Math.round(content_width)}.`
			: details_only
				? `too narrow, so the content region is hidden and details fill ${Math.round(details_width)}.`
				: `showing both, details ${Math.round(details_width)} wide and content ${Math.round(content_width)} wide.`}`);
	});
</script>

<svelte:window onresize={handleResize} />

{#if $w_app === S_App.launch}
	<div class='launch'>setting up the guides browser...</div>
{:else}

{#if showBuildNotes}
	<div
		class='build-backdrop'
		role='button'
		tabindex='-1'
		onkeyup={() => {}}
		onclick={() => showBuildNotes = false}>
		<BuildNotes onclose={() => showBuildNotes = false} />
	</div>
{/if}

<div class='frame' style:width='{width}px' style:height='{height}px'>
	<Controls onclick={toggle_details} detailsShown={$w_show_details} {buildNumber} onBuildOpen={() => { showBuildNotes = true; debug.log(`Build notes: opened, showing build ${buildNumber}.`); }} />
	<div class='boxes'>
		{#if $w_show_details}
			<Details width={details_width} />
		{/if}
		{#if !details_only}
			<Operation width={content_width} />
		{/if}
	</div>
</div>

<!-- The one hover hint for the whole app; each element opts in by carrying its own words. -->
<ToolTip message={$w_tip.message} mouseX={$w_tip.x} mouseY={$w_tip.y} appearance={$w_tip.appearance} />

{/if}

<style>
	/* While the guides are being read: nothing but these words, centered both ways. */
	.launch {
		font-size       : var(--font-launch);
		color           : var(--text);
		padding         : var(--gap);
		box-sizing      : border-box;
		justify-content : center;
		align-items     : center;
		position        : fixed;
		text-align      : center;
		display         : flex;
		inset           : 0;
	}

	.frame {
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

	/* The build notes sit over everything, on the accent, and a click anywhere shuts them. */
	.build-backdrop {
		background      : var(--accent);
		z-index         : calc(var(--z-frontmost) + 2);
		justify-content : center;
		align-items     : center;
		position        : fixed;
		display         : flex;
		inset           : 0;
	}

	/* The two side-by-side boxes, below the controls row. */
	.boxes {
		gap        : var(--gap);
		overflow   : hidden;
		display    : flex;
		min-height : 0;
		flex       : 1;
	}

	:global(:root) {
		--font: system-ui, sans-serif;
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
