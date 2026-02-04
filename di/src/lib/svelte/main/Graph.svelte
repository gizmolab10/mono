<script lang='ts'>
	import { onMount, onDestroy } from 'svelte';
	import { render } from '../../ts/render/Render';
	import { colors } from '../../ts/draw/Colors';
	import { components } from '../../ts/managers/Components';
	import { hits } from '../../ts/managers/Hits';
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { init } from '../../ts/render/Trivial';

	const { w_text_color } = colors;
	const GRAPH_HID = 1;

	let canvas      : HTMLCanvasElement;
	let container   : HTMLDivElement;
	let initialized = false;

	const s_component = components.component_forHID_andType_createUnique(GRAPH_HID, T_Hit_Target.rubberband);

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

		// Register the container as a hit target
		s_component.set_html_element(container);
		
		// Set up click handler
		s_component.handle_s_mouse = (s_mouse: S_Mouse) => {
			if (s_mouse.isDown) {
				console.log('Graph clicked!');
			}
			return true;
		};

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			if (width == 0 || height == 0) return;

			resizeCanvas(Math.floor(width), Math.floor(height));
			
			// Update hit target rect after resize
			s_component.update_rect();
			hits.recalibrate();
		});

		observer.observe(container);

		return () => {
			observer.disconnect();
		};
	});

	onDestroy(() => {
		components.component_remove(s_component);
	});
</script>

<div
	class            = 'graph'
	bind:this        = {container}
	style:color      = {$w_text_color}
	style:background = 'white'>
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
