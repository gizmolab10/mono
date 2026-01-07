<script lang="ts">
	import { onMount } from 'svelte';
	import { init } from './lib/ts/tests/Render.test';
	import Panel from './lib/svelte/layout/Panel.svelte';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		init(canvas);
	});
</script>

<Panel>
	{#snippet controls()}
		<div class="controls-content">
			<h1>Design Intuition</h1>
		</div>
	{/snippet}

	{#snippet graph()}
		<div class="graph-content">
			<canvas bind:this={canvas} width="600" height="600"></canvas>
			<div class="info">Drag to rotate • No gimbal lock</div>
		</div>
	{/snippet}

	{#snippet details()}
		<div class="details-content">
			<h2>Details</h2>
			<p>Properties panel placeholder</p>
		</div>
	{/snippet}
</Panel>

<style>
	:global(body) {
		margin: 0;
		background: #1a1a2e;
		font-family: system-ui, sans-serif;
		color: #eee;
	}

	.controls-content {
		display: flex;
		align-items: center;
		padding: 0 1rem;
		height: 100%;
	}

	.controls-content h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 300;
	}

	.graph-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.graph-content canvas {
		background: #0f0f1a;
		border: 1px solid #333;
		cursor: grab;
	}

	.graph-content canvas:active {
		cursor: grabbing;
	}

	.info {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: #888;
	}

	.details-content {
		padding: 1rem;
	}

	.details-content h2 {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 500;
	}

	.details-content p {
		margin: 0;
		font-size: 0.875rem;
		color: #888;
	}
</style>
