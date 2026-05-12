<script lang='ts'>
	import { stores } from '../../ts/managers/Stores';
	import Details from '../details/Details.svelte';
	import { k } from '../../ts/common/Constants';
	import BuildNotes from './BuildNotes.svelte';
	import UserGuide from './UserGuide.svelte';
	import { e } from '../../ts/events/Events';
	import Controls from './Controls.svelte';
	import Graph from './Graph.svelte';
	import { onMount } from 'svelte';

	const { w_show_details } = stores;

	// Initialize event system
	onMount(() => {
		e.setup();
	});

	// Reactive state for window dimensions
	let width  = $state(Math.max(k.width.window_min, window.innerWidth));
	let height = $state(window.innerHeight);

	// Layout constants
	const gap    = k.thickness.separator.main;
	const radius = k.radius.main;

	let controlsHeight = $state(k.height.controls);
	let details_pad    = $state(0);
	let wrap_phone     = $derived(width < k.width.wrap_phone);
	let detailsWidth   = $derived(
		wrap_phone
			? width - gap * 2
			: k.width.details - gap * 2 + details_pad
	);
	let showBuildNotes = $state(false);
	let showUserGuide  = $state(false);

	// Computed dimensions
	let mainHeight = $derived(height - controlsHeight - gap * 3);
	let graphWidth = $derived(width - ($w_show_details ? detailsWidth + gap : 0) - gap * 2);

	function handleResize() {
		width  = Math.max(k.width.window_min, window.innerWidth);
		height = window.innerHeight;
	}

</script>

<svelte:window
	onresize = {handleResize}
/>

<div
	class                  = 'panel'
	style:padding          = '{gap}px'
	style:--l-gap          = '{gap}px'
	style:width            = '{width}px'
	style:height           = '{height}px'
	style:--radius         = '{radius}px'
	style:background-color = 'var(--accent)'
	>
	{#if showBuildNotes}
		<!-- Build notes: single empty region fills entire space -->
		<div
			style:background="color-mix(in srgb, var(--bg) 95%, black)"
			onclick={() => showBuildNotes = false}
			class='region build-notes-region'
			onkeyup={() => {}}
			role="button"
			tabindex="-1">
			<BuildNotes onclose={() => showBuildNotes = false} />
		</div>
	{:else if showUserGuide}
		<!-- User guide: full-screen overlay with sidebar list and content panel -->
		<div class='region user-guide-region'>
			<UserGuide onclose={() => showUserGuide = false} />
		</div>
	{:else}
		<!-- Controls region -->
		<div
			bind:clientHeight={controlsHeight}
			class = 'region controls'>
			<Controls onshowuserguide={() => showUserGuide = true} />
		</div>

		<!-- Main content area -->
		<div
			class         = 'main'
			style:height  = '{mainHeight}px'
			style:margin-top = '{gap}px'>
			{#if $w_show_details}
				<!-- Details region -->
				<div
					class        = 'region details'
					style:height = '{mainHeight}px'
					style:width  = '{detailsWidth}px'>
					<Details onpadchange={(v) => details_pad = v} />
				</div>
			{/if}

			<!-- Graph region -->
			<div
				class        = 'region graph'
				style:width  = '{graphWidth}px'
				style:height = '{mainHeight}px'>
				<Graph onshowbuildnotes={() => showBuildNotes = true} />
			</div>
		</div>
	{/if}
</div>

<style>
	.panel {
		min-width   : var(--window-min-width);
		font-family : system-ui, sans-serif;
		box-sizing  : border-box;
		position    : fixed;
		top         : 0;
		left        : 0;
	}

	.main {
		gap      : var(--l-gap);
		overflow : hidden;
		display  : flex;
	}

	.region {
		z-index       : var(--z-layout);
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.controls {
		width : 100%;
	}

	.graph {
		flex : 1;
	}

	.details {
		flex-shrink : 0;
	}

	.build-notes-region {
		box-sizing      : border-box;
		justify-content : center;
		align-items     : center;
		display         : flex;
		width           : 100%;
		height          : 100%;
	}

	.user-guide-region {
		box-sizing      : border-box;
		position        : relative;
		width           : 100%;
		height          : 100%;
		border-radius   : calc(var(--h-controls) / 2);
	}
</style>
