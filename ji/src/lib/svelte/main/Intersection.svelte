<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import Details from '../details/Details.svelte';
	import Controls from './Controls.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Activity from './Activity.svelte';

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
				<Details width={detailsWidth} />
			{/if}
			<div class='region content' style:width='{contentWidth}px'>
				<Activity bind:showBuildNotes />
			</div>
			<Controls onclick={toggleDetails} onAccent={$w_show_details} />
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
