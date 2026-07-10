<script lang='ts'>
	import Hideable from '../details/Hideable.svelte';
	import D_Preferences from '../details/D_Preferences.svelte';
	import Content from './Content.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';

	// di's hamburger icon, built exactly as di's Primary_Controls toggle does:
	// path sized common+2 (35), drawn in a common-square viewBox. common = 33.
	const hamburgerPath = svg_paths.hamburger(35);
	console.log(`Details toggle: hamburger icon uses di's exact path (length ${hamburgerPath.length}).`);

	// Layout numbers ported from di's Constants (common_size 33): the inset/gap,
	// the corner radius, the fixed width of the details region, the smallest
	// window we allow, and the window width below which details wraps full-width.
	const gap = 7;
	const radius = 20;
	const DETAILS_WIDTH = 350;
	const WINDOW_MIN = 400;
	const WRAP_PHONE = 620;
	const hamburgerButtonWidth = 28;        // width of the collapsed details tab (the "D" button)

	let width = $state(Math.max(WINDOW_MIN, window.innerWidth));
	let height = $state(window.innerHeight);
	// Show-details is a persistent preference (survives reload), saved via the ported Preferences.
	const w_show_details = preferences.persistent<boolean>(T_Preference.showDetails, false);
	let showBuildNotes = $state(false);

	let wrap_phone = $derived(width < WRAP_PHONE);
	let detailsWidth = $derived(wrap_phone ? width - gap * 2 : DETAILS_WIDTH - gap * 2);
	let contentWidth = $derived(width - ($w_show_details ? detailsWidth + gap : 0) - gap * 2);

	// Log only when the narrow-wrap switch flips, with the numbers behind it.
	let last_phone_log = '';
	$effect(() => {
		const line = `phone ${wrap_phone}`;
		if (line === last_phone_log) return;
		last_phone_log = line;
		console.log(`Window layout: measured ${Math.round(width)} pixels wide. Narrow-wrap layout is ${wrap_phone} (switches under ${WRAP_PHONE}).`);
	});

	function handleResize() {
		width = Math.max(WINDOW_MIN, window.innerWidth);
		height = window.innerHeight;
	}

	function toggleDetails() {
		const next = !$w_show_details;
		w_show_details.set(next);
		console.log(`Details region ${next ? 'shown' : 'hidden'} — ${next ? Math.round(detailsWidth) : hamburgerButtonWidth} pixels wide. (saved to preferences)`);
	}

	// While the build-notes popup is open, the details and content regions hide.
	let last_notes_log = false;
	$effect(() => {
		if (showBuildNotes === last_notes_log) return;
		last_notes_log = showBuildNotes;
		console.log(`Build notes popup ${showBuildNotes ? 'open' : 'closed'} — regions ${showBuildNotes ? 'hidden' : 'shown'}.`);
	});
</script>

<svelte:window onresize={handleResize} />

{#snippet hamburgerButton()}
	<button class='d-button' onclick={toggleDetails} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 33 33' width='33' height='33'>
			<path d={hamburgerPath} />
		</svg>
	</button>
{/snippet}

<div
	class='panel'
	style:--l-gap='{gap}px'
	style:padding='{gap}px'
	style:width='{width}px'
	style:height='{height}px'
	style:--radius='{radius}px'
	style:background-color='var(--accent)'>

	<div class='main'>
		{#if !showBuildNotes}
			{#if $w_show_details}
				<div class='region details' style:width='{detailsWidth}px'>
					<div class='details-banner'>Controls go here</div>
					{@render hamburgerButton()}
					<Hideable title='preferences'>
						<D_Preferences />
					</Hideable>
				</div>
			{/if}
			<div class='region content' style:width='{contentWidth}px'>
				{#if !$w_show_details}
					{@render hamburgerButton()}
				{/if}
				<Content bind:showBuildNotes />
			</div>
		{/if}
	</div>
</div>

{#if showBuildNotes}
	<div
		role='button'
		tabindex='-1'
		onkeyup={() => {}}
		class='build-backdrop'
		onclick={() => showBuildNotes = false}>
		<BuildNotes onclose={() => showBuildNotes = false} />
	</div>
{/if}

<style>
	.panel {
		box-sizing     : border-box;
		flex-direction : column;
		position       : fixed;
		display        : flex;
		top            : 0;
		left           : 0;
	}

	.main {
		gap        : var(--l-gap);
		overflow   : hidden;
		display    : flex;
		min-height : 0;
		flex       : 1;
	}

	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.details {
		background     : var(--accent);
		flex-direction : column;
		display        : flex;
		gap            : 2px;
		flex-shrink    : 0;
	}

	.details-banner {
		color           : var(--text-on-accent);
		background      : var(--accent);
		text-transform  : lowercase;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		border-radius   : 10px;
		font-size       : 14px;
		height          : 42px;
		width           : 100%;
		display         : flex;
		border          : none;
	}

	.d-button {
		color           : var(--text-on-accent);
		background      : transparent;
		cursor          : pointer;
		padding         : 2px 6px;
		align-items     : center;
		justify-content : center;
		position        : fixed;
		border-radius   : 10px;
		display         : flex;
		border          : none;
		left            : 8px;
		top             : 8px;
		z-index         : 5;
	}

	.hamburger-icon {
		overflow : visible;
	}

	.d-button .hamburger-icon path {
		fill   : currentColor;
		stroke : currentColor;
	}

	/* Details hidden: the hamburger sits on the content and is always black. */
	.content .d-button {
		color : black;
	}

	/* Details hidden: black hamburger, accent-colored on hover. */
	.content .d-button:hover .hamburger-icon path {
		fill   : var(--accent);
		stroke : var(--accent);
	}

	.details .d-button:hover .hamburger-icon path {
		fill   : var(--text-on-accent-hover);
		stroke : var(--text-on-accent-hover);
	}

	.content {
		background : var(--bg);
		flex       : 1;
	}

	.build-backdrop {
		background: color-mix(in srgb, #000 40%, transparent);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		z-index: 10;
		inset: 0;
	}
</style>
