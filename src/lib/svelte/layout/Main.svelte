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

		<!-- Horizontal separator below controls -->
		<Separator
			{thickness}
			length          = {innerWidth}
			hasFillets      = {true}
			hasDoubleFillet = {true}
			isHorizontal    = {true}
		/>

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

				<!-- Vertical separator between details and graph -->
				<Separator
					{thickness}
					length          = {mainHeight}
					hasFillets      = {true}
					hasDoubleFillet = {true}
					isHorizontal    = {false}
				/>
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
</style>
