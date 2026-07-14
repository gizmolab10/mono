<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import Documents from '../documents/Documents.svelte';
	import Details from '../details/Details.svelte';
	import { k } from '../../ts/common/Constants';
	import buildsRaw from '../../md/builds.md?raw';
	import BuildNotes from './BuildNotes.svelte';
	import Controls from './Controls.svelte';

	// The latest build number, read from the build-notes data table.
	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter((line) => /^\|\s*\d+/.test(line))
		.map((line) => parseInt(line.split('|')[1].trim())));

	// Layout numbers ported from di's Constants (common_size 33): the inset/gap,
	// the corner radius, the fixed width of the details region, the smallest
	// window we allow, and the window width below which details wraps full-width.
	const gap = k.gap.default;

	let width = $state(Math.max(k.width.window, window.innerWidth));
	let height = $state(window.innerHeight);
	// Show-details is a persistent preference (survives reload), saved via the ported Preferences.
	const w_show_details = preferences.persistent<boolean>(T_Preference.showDetails, false);
	let showBuildNotes = $state(false);

	let wrap_phone = $derived(width < k.width.phone);
	let detailsWidth = $derived(wrap_phone ? width - gap * 2 : k.width.details - gap * 2);
	let contentWidth = $derived(width - ($w_show_details ? detailsWidth + gap : 0) - gap * 2);

	// Log only when the narrow-wrap switch flips, with the numbers behind it.
	let last_phone_log = '';
	$effect(() => {
		const line = `phone ${wrap_phone}`;
		if (line === last_phone_log) return;
		last_phone_log = line;
	});

	function handleResize() {
		width = Math.max(k.width.window, window.innerWidth);
		height = window.innerHeight;
	}

	function toggleDetails() {
		const next = !$w_show_details;
		w_show_details.set(next);
	}

	// While the build-notes popup is open, the details and content regions hide.
	let last_notes_log = false;
	$effect(() => {
		if (showBuildNotes === last_notes_log) return;
		last_notes_log = showBuildNotes;
	});
</script>

<svelte:window onresize={handleResize} />

<div
	class='intersection'
	style:width='{width}px'
	style:height='{height}px'
	style:background-color='var(--accent)'>

	{#if !showBuildNotes}
		<Controls onclick={toggleDetails} />
		<div class='panel'>
			{#if $w_show_details}
				<Details width={detailsWidth} />
			{/if}
			<div class='region content' style:width='{contentWidth}px'>
				<Documents />
			</div>
		</div>

		<div class='corner-stack layer-intersection'>
			<button class='build-opener' onclick={() => showBuildNotes = true}>
				Build {buildNumber}
			</button>
			<a class='author-credit' href='https://designintuition.app' target='_blank' rel='noopener'>
				built by: jonathan sand
			</a>
		</div>
	{/if}
</div>

{#if showBuildNotes}
	<div
		role='button'
		tabindex='-1'
		onkeyup={() => {}}
		class='build-backdrop layer-intersection'
		onclick={() => showBuildNotes = false}>
		<BuildNotes onclose={() => showBuildNotes = false} />
	</div>
{/if}

<style>
	.intersection {
		padding        : var(--gap);
		box-sizing     : border-box;
		flex-direction : column;
		position       : fixed;
		display        : flex;
		top            : 0;
		left           : 0;
	}

	.panel {
		margin-top : var(--gap);               /* a gap below the controls row */
		gap        : var(--gap);
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

	/* Pinned to the bottom-left of the whole frame, above everything. */
	.corner-stack {
		bottom         : var(--inset-credit-bottom);
		left           : var(--inset-credit-left);
		gap            : var(--gap-tight);
		align-items    : flex-start;
		flex-direction : column;
		position       : fixed;
		display        : flex;
	}

	.build-opener {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--gray);
		cursor        : pointer;
	}

	.build-opener:hover {
		background : var(--hover);
	}

	.author-credit {
		font-size       : var(--font-credit);
		color           : var(--text);
		text-decoration : underline;
		cursor          : pointer;
	}

	.author-credit:hover {
		color : var(--hover);
	}

	.build-backdrop {
		background: color-mix(in srgb, var(--black) 40%, transparent);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		inset: 0;
	}
</style>
