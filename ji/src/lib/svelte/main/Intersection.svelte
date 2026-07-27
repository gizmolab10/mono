<script lang='ts'>
	import { w_operation, w_view_document, T_Operation } from '../../ts/managers/Operations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import Show_Operation from '../operations/Show_Operation.svelte';
	import { w_hierarchy } from '../../ts/database/Databases';
	import Details from '../details/Details.svelte';
	import buildsRaw from '../../md/builds.md?raw';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import BuildNotes from './BuildNotes.svelte';
	import Controls from './Controls.svelte';
	import Help from './Help.svelte';

	// Both the view operation and the document it shows are persisted, so a reload
	// returns to the same open document. If that document is gone (nothing picked, or
	// it was erased), fall back to the list.
	$effect(() => {
		if ($w_operation !== T_Operation.view) { return; }
		const id = $w_view_document;
		if (id === null || !$w_hierarchy.document_byID(id)) {
			if (id !== null) { debug.log(`View points at a document that is no longer in the store (${id}) — back to the list.`); }
			w_operation.set(T_Operation.files);
			w_view_document.set(null);
		}
	});

	// The latest build number, read from the build-notes data table.
	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter((line) => /^\|\s*\d+/.test(line))
		.map((line) => parseInt(line.split('|')[1].trim())));

	// Layout numbers ported from di's Constants (common_size 33): the inset/gap,
	// the corner radius, the fixed width of the details region, the smallest
	// window we allow, and the window width below which details wraps full-width.
	const gap   = k.gap.default;
	const inset = k.gap.tight;   // the outer margin at the window's four edges — tight, so the app hugs the window

	let width = $state(Math.max(k.width.window, window.innerWidth));
	let height = $state(window.innerHeight);
	// Show-details is a persistent preference (survives reload), saved via the ported Preferences.
	const w_show_details = preferences.persistent<boolean>(T_Preference.showDetails, false);
	let showBuildNotes = $state(false);
	// Which top-level thing is showing — the help overlay or the app itself. A named mode
	// (not a boolean, whose true/false meaning was easy to flip), guarded to these two
	// values. Persisted, and "help" by default, so a first-time visitor lands on the
	// welcome page until they close it, which reveals the app.
	type App_Mode = 'help' | 'app';
	const w_app_mode = preferences.persistent<App_Mode>(T_Preference.appMode, 'help');

	// Is there room for both the details column (its fixed width) and the operations view
	// beside it (its own smallest useful width), with the two outer margins and the one
	// between? Measured from the real window width, so it tracks resize and browser zoom.
	let both_fit = $derived(width - inset * 2 - gap >= k.width.details + k.width.operations);
	// When details are open but both can't fit, the operations view is dropped and details
	// fill the width; otherwise details keep their fixed column and the operations view fills
	// the rest (and with details closed, the operations view has the whole width to itself).
	let details_only = $derived($w_show_details && !both_fit);
	let detailsWidth = $derived(details_only ? width - inset * 2 : k.width.details - gap * 2);
	let contentWidth = $derived(width - ($w_show_details ? detailsWidth + gap : 0) - inset * 2);

	// Log only when the show-both / details-only switch flips, with the numbers behind it.
	let last_layout_log = '';
	$effect(() => {
		const line = `details-only ${details_only}`;
		if (line === last_layout_log) { return; }
		last_layout_log = line;
		const need = k.width.details + k.width.operations + inset * 2 + gap;
		debug.log(`Panel layout: window ${width}px vs ${Math.round(need)}px needed for both (details ${k.width.details} + operations ${k.width.operations} + outer ${Math.round(inset * 2)} + between ${Math.round(gap)}) — ${details_only ? 'operations view hidden, details fill the width' : 'both side by side'}.`);
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


{#if $w_app_mode === 'help'}
	<Help onclose={() => w_app_mode.set('app')} />
{:else if showBuildNotes}
	<div
		role='button'
		tabindex='-1'
		onkeyup={() => {}}
		class='build-backdrop layer-intersection'
		onclick={() => showBuildNotes = false}>
		<BuildNotes onclose={() => showBuildNotes = false} />
	</div>
{:else}
	<div
		class='intersection'
		style:width='{width}px'
		style:height='{height}px'
		style:background-color='var(--accent)'>
		<Controls onclick={toggleDetails} onHelp={() => w_app_mode.set('help')} />
		<div class='panel'>
			{#if $w_show_details}
				<Details width={detailsWidth} {buildNumber} onBuildOpen={() => showBuildNotes = true} />
			{/if}
			{#if !details_only}
				<Show_Operation width={contentWidth} />
			{/if}
		</div>
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

	.build-backdrop {
		background: color-mix(in srgb, var(--black) 40%, transparent);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		inset: 0;
	}
</style>
