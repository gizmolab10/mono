<script lang='ts'>
	import { k } from '../../ts/common/Constants';
	import Controls from './Controls.svelte';
	import Graph from './Graph.svelte';
	import Details from './Details.svelte';
	import Separator from './Separator.svelte';
	import Box from './Box.svelte';

	// Reactive state for window dimensions
	let width  = $state(window.innerWidth);
	let height = $state(window.innerHeight);

	// Layout constants
	const thickness = k.thickness.separator.main;

	let controlsHeight = $derived(48);
	let detailsWidth   = $derived(280);
	let showDetails    = $state(true);

	// Box inner dimensions (accounting for box borders)
	let innerWidth  = $derived(width - thickness * 2);
	let innerHeight = $derived(height - thickness * 2);

	// Computed dimensions accounting for separators
	let mainHeight = $derived(innerHeight - controlsHeight - thickness);
	let graphWidth = $derived(innerWidth - (showDetails ? detailsWidth + thickness : 0));

	// Horizontal separator: fillets should align with box border centers
	// Extend by thickness/2 on each side
	let hSeparatorLength = $derived(innerWidth + thickness);

	// Vertical separator: fillets should align with horizontal separator centers
	// Extend by thickness/2 on each end
	let vSeparatorLength = $derived(mainHeight + thickness);

	function handleResize() {
		width  = window.innerWidth;
		height = window.innerHeight;
	}
</script>

<svelte:window
	onresize = {handleResize}
/>

<div
	class = 'panel'>
	<Box
		{width}
		{height}
		{thickness}>
		<!-- Controls region -->
		<div
			class        = 'region controls'
			style:height = '{controlsHeight}px'>
			<Controls />
		</div>

		<!-- Horizontal separator below controls (inset by thickness/2 on each side) -->
		<div
			class       = 'h-separator-wrapper'
			style:width = '{innerWidth}px'>
			<div style:margin-left = '{-thickness / 2}px'>
				<Separator
					{thickness}
					length          = {hSeparatorLength}
					hasFillets      = {true}
					hasDoubleFillet = {true}
					isHorizontal    = {true}
				/>
			</div>
		</div>

		<!-- Main content area -->
		<div
			class        = 'main'
			style:height = '{mainHeight}px'>
			{#if showDetails}
				<!-- Details region -->
				<div
					class        = 'region details'
					style:width  = '{detailsWidth}px'
					style:height = '{mainHeight}px'>
					<Details />
				</div>

				<!-- Vertical separator between details and graph (inset by thickness/2 on each end) -->
				<div
					class        = 'v-separator-wrapper'
					style:height = '{mainHeight}px'
					style:margin-top = '{-thickness / 2}px'>
					<Separator
						{thickness}
						length          = {vSeparatorLength}
						hasFillets      = {true}
						hasDoubleFillet = {true}
						isHorizontal    = {false}
					/>
				</div>
			{/if}

			<!-- Graph region -->
			<div
				class        = 'region graph'
				style:width  = '{graphWidth}px'
				style:height = '{mainHeight}px'>
				<Graph />
			</div>
		</div>
	</Box>
</div>

<style>
	.panel {
		top         : 0;
		left        : 0;
		position    : fixed;
		font-family : system-ui, sans-serif;
	}

	.main {
		display  : flex;
		overflow : hidden;
	}

	.region {
		overflow : hidden;
		position : relative;
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

	.h-separator-wrapper {
		flex-shrink : 0;
		overflow    : visible;
	}

	.v-separator-wrapper {
		flex-shrink  : 0;
		overflow     : visible;
		box-sizing   : border-box;
	}
</style>
