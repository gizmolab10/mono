<script lang='ts'>
	import { onMount } from 'svelte';
	import { init } from '../../ts/tests/Render.test';
	import { render } from '../../ts/render/Render';
	import { colors } from '../../ts/utilities/Colors';
	const { w_text_color, w_background_color } = colors;

	let canvas      : HTMLCanvasElement;
	let container   : HTMLDivElement;
	let initialized = false;

	function initCanvas(width : number, height : number) {
		if (!canvas || initialized) return;
		canvas.width  = width;
		canvas.height = height;
		init(canvas);
		initialized = true;
	}

	function resizeCanvas(width : number, height : number) {
		if (!initialized) {
			initCanvas(width, height);
			return;
		}
		render.resize(width, height);
	}

	onMount(() => {
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			if (width == 0 || height == 0) return;

			resizeCanvas(Math.floor(width), Math.floor(height));
		});

		observer.observe(container);

		return () => observer.disconnect();
	});
</script>

<div
	class            = 'graph'
	bind:this        = {container}
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	<canvas
		bind:this = {canvas}></canvas>
</div>

<style>
	.graph {
		width  : 100%;
		height : 100%;
	}

	.graph canvas {
		width      : 100%;
		height     : 100%;
		cursor     : grab;
		display    : block;
		background : inherit;
	}

	.graph canvas:active {
		cursor : grabbing;
	}
</style>
