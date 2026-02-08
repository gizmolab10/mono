<script lang='ts'>
	import { onMount, onDestroy } from 'svelte';
	import { render } from '../../ts/render/Render';
	import { colors } from '../../ts/draw/Colors';
	import { components } from '../../ts/managers/Components';
	import { hits } from '../../ts/managers/Hits';
	import { editor } from '../../ts/managers/Editor';
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { init } from '../../ts/render/Setup';

	const { w_text_color } = colors;
	const { w_editing } = editor;
	const GRAPH_HID = 1;

	let canvas      : HTMLCanvasElement;
	let container   : HTMLDivElement;
	let dim_input   = $state<HTMLInputElement>();
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

	// ── dimensional input handlers ──

	function on_dim_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			editor.commit((e.target as HTMLInputElement).value);
		} else if (e.key === 'Escape') {
			editor.cancel();
		}
	}

	function on_dim_blur() {
		editor.cancel();
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

	// Focus the input when editing starts
	$effect(() => {
		if ($w_editing && dim_input) {
			dim_input.focus();
			dim_input.select();
		}
	});
</script>

<div
	class            = 'graph'
	bind:this        = {container}
	style:color      = {$w_text_color}
	style:background = 'white'>
	<canvas
		bind:this = {canvas}></canvas>
	{#if $w_editing}
		<input
			bind:this    = {dim_input}
			class        = 'dim-edit'
			type         = 'text'
			value        = {$w_editing.formatted}
			style:left   = '{$w_editing.x}px'
			style:top    = '{$w_editing.y}px'
			onkeydown    = {on_dim_keydown}
			onblur       = {on_dim_blur}
		/>
	{/if}
</div>

<style>
	.graph {
		width    : 100%;
		height   : 100%;
		position : relative;
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

	.dim-edit {
		position   : absolute;
		transform  : translate(-50%, -50%);
		font       : 12px sans-serif;
		text-align : center;
		width      : 80px;
		padding    : 2px 4px;
		border     : 1px solid #999;
		outline    : none;
		background : white;
		z-index    : 10;
	}
</style>
