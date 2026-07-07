<script lang='ts'>
	import Hideable from '../details/Hideable.svelte';
	import D_Preferences from '../details/D_Preferences.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import buildsRaw from '../../md/builds.md?raw';

	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => parseInt(l.split('|')[1].trim())));

	// Layout numbers ported from di's Constants (common_size 33): the inset/gap,
	// the corner radius, the fixed width of the details region, the smallest
	// window we allow, and the window width below which details wraps full-width.
	const gap = 7;
	const radius = 20;
	const DETAILS_WIDTH = 350;
	const WINDOW_MIN = 400;
	const WRAP_PHONE = 620;

	let width = $state(Math.max(WINDOW_MIN, window.innerWidth));
	let height = $state(window.innerHeight);
	let showBuildNotes = $state(false);
	let showDetails = $state(true);

	let wrap_phone = $derived(width < WRAP_PHONE);
	let detailsWidth = $derived(wrap_phone ? width - gap * 2 : DETAILS_WIDTH - gap * 2);
	let contentWidth = $derived(width - (showDetails ? detailsWidth + gap : 0) - gap * 2);

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
</script>

<svelte:window onresize={handleResize} />

<div
	class='panel'
	style:width='{width}px'
	style:height='{height}px'
	style:padding='{gap}px'
	style:--radius='{radius}px'
	style:--l-gap='{gap}px'
	style:background-color='var(--accent)'>

	<div class='main'>
		{#if showDetails}
			<div class='region details' style:width='{detailsWidth}px'>
				<Hideable title='preferences'>
					<D_Preferences />
				</Hideable>
			</div>
		{/if}
		<div class='region content' style:width='{contentWidth}px'>
			<div class='centered'>
				<div>Intersection</div>
				<div>Hey, bro!</div>
			</div>
		</div>
	</div>
</div>

<button
	class='build-opener'
	onclick={() => { showBuildNotes = true; console.log(`Build notes: opener clicked, current build is ${buildNumber}.`); }}>
	Build {buildNumber}
</button>

{#if showBuildNotes}
	<div
		class='build-backdrop'
		role='button'
		tabindex='-1'
		onclick={() => showBuildNotes = false}
		onkeyup={() => {}}>
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
		min-height : 0;
		overflow   : hidden;
		gap        : var(--l-gap);
		display    : flex;
		flex       : 1;
	}

	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.details {
		background  : var(--accent);
		flex-shrink : 0;
	}

	.content {
		background : var(--bg);
		flex       : 1;
	}

	.centered {
		justify-content : center;
		flex-direction  : column;
		align-items     : center;
		height          : 100%;
		font-size       : 8em;
		display         : flex;
	}

	.build-opener {
		border: 1px solid black;
		border-radius: 999px;
		padding: 2px 10px;
		background: none;
		position: fixed;
		font-size: 13px;
		cursor: pointer;
		color: #888;
		bottom: 12px;
		left: 16px;
	}

	.build-opener:hover {
		background: var(--hover);
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
