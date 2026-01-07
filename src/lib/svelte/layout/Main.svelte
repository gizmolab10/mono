<script lang="ts">
	import Controls from './Controls.svelte';
	import Graph from './Graph.svelte';
	import Details from './Details.svelte';

	// Reactive state for window dimensions
	let width = $state(window.innerWidth);
	let height = $state(window.innerHeight);

	// Layout constants (configurable later)
	let controlsHeight = $derived(48);
	let detailsWidth = $derived(280);
	let showDetails = $state(true);

	// Computed regions
	let graphRect = $derived({
		x: showDetails ? detailsWidth : 0,
		y: controlsHeight,
		width: showDetails ? width - detailsWidth : width,
		height: height - controlsHeight
	});

	let detailsRect = $derived({
		x: 0,
		y: controlsHeight,
		width: detailsWidth,
		height: height - controlsHeight
	});

	function handleResize() {
		width = window.innerWidth;
		height = window.innerHeight;
	}
</script>

<svelte:window onresize={handleResize} />

<div
	class="panel"
	style:width="{width}px"
	style:height="{height}px"
>
	<div
		class="region controls"
		style:height="{controlsHeight}px"
	>
		<Controls />
	</div>

	<div class="main">
		{#if showDetails}
			<div
				class="region details"
				style:width="{detailsRect.width}px"
				style:height="{detailsRect.height}px"
			>
				<Details />
			</div>
		{/if}

		<div
			class="region graph"
			style:width="{graphRect.width}px"
			style:height="{graphRect.height}px"
		>
			<Graph />
		</div>
	</div>
</div>

<style>
	.panel {
		position: fixed;
		top: 0;
		left: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--panel-bg, #1a1a2e);
		color: var(--panel-fg, #eee);
		font-family: system-ui, sans-serif;
	}

	.main {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.region {
		position: relative;
		overflow: hidden;
	}

	.controls {
		width: 100%;
		border-bottom: 1px solid var(--border-color, #333);
	}

	.graph {
		flex: 1;
	}

	.details {
		border-right: 1px solid var(--border-color, #333);
	}
</style>
