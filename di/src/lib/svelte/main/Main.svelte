<script lang='ts'>
	import { stores } from '../../ts/managers/Stores';
	import Details from '../details/Details.svelte';
	import { k } from '../../ts/common/Constants';
	import BuildNotes from './BuildNotes.svelte';
	import { e } from '../../ts/signals/Events';
	import Controls from './Controls.svelte';
	import Graph from './Graph.svelte';
	import { onMount } from 'svelte';

	const { w_show_details } = stores;

	// Initialize event system
	onMount(() => {
		e.setup();
	});

	// Reactive state for window dimensions
	let width  = $state(window.innerWidth);
	let height = $state(window.innerHeight);

	// Layout constants
	const gap    = k.thickness.separator.main;
	const radius = gap * 3;

	let controlsHeight = $state(k.height.controls);
	let wrap_phone     = $derived(width < k.width.wrap_phone);
	let detailsWidth   = $derived(wrap_phone ? width - gap * 2 : k.width.details - gap * 2);
	let showBuildNotes = $state(false);

	// Computed dimensions
	let mainHeight = $derived(height - controlsHeight - gap * 3);
	let graphWidth = $derived(width - ($w_show_details ? detailsWidth + gap : 0) - gap * 2);

	function handleResize() {
		width  = window.innerWidth;
		height = window.innerHeight;
	}

	// Swipe gesture → toggle details
	let touch_x = 0;
	let touch_y = 0;
	function ontouchstart(e: TouchEvent) { touch_x = e.touches[0].clientX; touch_y = e.touches[0].clientY; }
	function ontouchend(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touch_x;
		const dy = e.changedTouches[0].clientY - touch_y;
		if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
			if (dx > 0 && !$w_show_details) stores.toggle_details();
			if (dx < 0 && $w_show_details) stores.toggle_details();
		}
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
	{ontouchstart}
	{ontouchend}>
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
	{:else}
		<!-- Controls region -->
		<div
			bind:clientHeight={controlsHeight}
			class = 'region controls'>
			<Controls />
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
					style:width  = '{detailsWidth}px'
					style:height = '{mainHeight}px'>
					<Details />
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
		top         : 0;
		left        : 0;
		position    : fixed;
		font-family : system-ui, sans-serif;
		box-sizing  : border-box;
	}

	.main {
		display  : flex;
		overflow : hidden;
		gap      : var(--l-gap);
	}

	.region {
		overflow      : hidden;
		position      : relative;
		border-radius : var(--radius);
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
		width           : 100%;
		height          : 100%;
		display         : flex;
		justify-content : center;
		align-items     : flex-start;
		padding-top     : 20%;
		box-sizing      : border-box;
	}
</style>
