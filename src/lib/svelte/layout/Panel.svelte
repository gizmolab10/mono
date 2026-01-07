<script lang="ts">
	import type { Snippet } from 'svelte';

	// Props with Svelte 5 runes
	let {
		children,
		controls,
		details,
		graph
	}: {
		children?: Snippet;
		controls?: Snippet;
		details?: Snippet;
		graph?: Snippet;
	} = $props();

	// Reactive state for window dimensions
	let width = $state(window.innerWidth);
	let height = $state(window.innerHeight);

	// Derived layout regions (will be configurable later)
	let controlsHeight = $derived(48);
	let detailsWidth = $derived(280);
	let showDetails = $state(true);

	// Computed regions
	let graphRect = $derived({
		x: 0,
		y: controlsHeight,
		width: showDetails ? width - detailsWidth : width,
		height: height - controlsHeight
	});

	let detailsRect = $derived({
		x: width - detailsWidth,
		y: controlsHeight,
		width: detailsWidth,
		height: height - controlsHeight
	});

	// Handle window resize
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
	<!-- Controls region (top) -->
	{#if controls}
		<div
			class="region controls"
			style:height="{controlsHeight}px"
		>
			{@render controls()}
		</div>
	{/if}

	<!-- Main content area -->
	<div class="main">
		<!-- Graph region -->
		{#if graph}
			<div
				class="region graph"
				style:width="{graphRect.width}px"
				style:height="{graphRect.height}px"
			>
				{@render graph()}
			</div>
		{/if}

		<!-- Details region (right side) -->
		{#if details && showDetails}
			<div
				class="region details"
				style:width="{detailsRect.width}px"
				style:height="{detailsRect.height}px"
			>
				{@render details()}
			</div>
		{/if}
	</div>

	<!-- Fallback for direct children -->
	{#if children}
		{@render children()}
	{/if}
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
		border-left: 1px solid var(--border-color, #333);
	}
</style>
