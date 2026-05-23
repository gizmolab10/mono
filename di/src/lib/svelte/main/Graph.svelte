<script lang='ts'>
	import { T_Editing, T_Hit_Target } from '../../ts/types/Enumerations';
	import { stores } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { dimensions } from '../../ts/editors/Dimension';
	import { angulars } from '../../ts/editors/Angular';
	import { hits, hits_3d } from '../../ts/events';
	import { render } from '../../ts/render/Render';
	import { e } from '../../ts/events/Events';
	import { engine } from '../../ts/render';
	import { onMount } from 'svelte';

	const { w_mouse_location } = e;
	const { w_s_angular } = angulars;
	const { w_s_dimensions } = dimensions;
	const { w_s_face_label } = face_label;
	const { w_hover, w_hovered_dimension } = hits_3d;

	const axis_label: Record<'x' | 'y' | 'z', string> = { x: 'width', y: 'depth', z: 'height' };

	// Walk up parents from this smart object, collect names, drop the root
	// (the topmost ancestor), join with dots. For a smart object directly
	// under root, this is just its own name.
	function ancestry_path(so: Smart_Object): string {
		const names: string[] = [];
		let current: Smart_Object | null = so;
		while (current) {
			names.push(current.name);
			current = current.scene?.parent?.so ?? null;
		}
		names.pop();  // drop the root
		return names.reverse().join('.');
	}

	let dim_input   = $state<HTMLInputElement>();
	let ang_input   = $state<HTMLInputElement>();
	let label_input = $state<HTMLInputElement>();
	let canvas      : HTMLCanvasElement;
	let container   : HTMLDivElement;
	let label_focused = false;
	let initialized = false;

	function initCanvas(width : number, height : number) {
		if (!canvas || initialized) return;
		canvas.width  = width;
		canvas.height = height;
		engine.setup(canvas);
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
			dimensions.commit((e.target as HTMLInputElement).value);
		} else if (e.key === 'Escape') {
			dimensions.cancel();
		}
	}

	function on_dim_blur() {
		dimensions.cancel();
	}

	// ── angular input handlers ──

	function on_ang_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			angulars.commit((e.target as HTMLInputElement).value);
		} else if (e.key === 'Escape') {
			angulars.cancel();
		}
	}

	function on_ang_blur() {
		angulars.cancel();
	}

	// ── face label input handlers ──

	function on_label_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			face_label.commit((e.target as HTMLInputElement).value);
		} else if (e.key === 'Escape') {
			face_label.cancel();
		}
	}

	function on_label_input(e: Event) {
		face_label.sync((e.target as HTMLInputElement).value);
	}

	function on_label_focus() {
		stores.w_editing.set(T_Editing.face_label);
		const cur = face_label.cursor;
		if (cur && label_input) {
			requestAnimationFrame(() => label_input?.setSelectionRange(cur.start, cur.end));
		}
	}

	function on_label_blur(e: FocusEvent) {
		const input = e.target as HTMLInputElement;
		face_label.cursor = { start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 };
		// Defer so the focus handler on Details fires first
		setTimeout(() => {
			if (stores.editing !== T_Editing.details_name) {
				face_label.cancel();
			}
		});
	}

	onMount(() => {
		if (!container) return;

		const observer = new ResizeObserver( async (entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			if (width == 0 || height == 0) return;

			resizeCanvas(Math.floor(width), Math.floor(height));

			await hits.defer_recalibrate();
		});

		observer.observe(container);

		return () => {
			observer.disconnect();
		};
	});

	// Focus the input when editing starts
	$effect(() => {
		if ($w_s_dimensions && dim_input) {
			dim_input.focus();
			dim_input.select();
		}
	});

	$effect(() => {
		if ($w_s_angular && ang_input) {
			ang_input.focus();
			ang_input.select();
		}
	});

	$effect(() => {
		if ($w_s_face_label && label_input) {
			if (!label_focused) {
				label_input.focus();
				const cur = face_label.cursor;
				if (cur) {
					requestAnimationFrame(() => label_input?.setSelectionRange(cur.start, cur.end));
				} else {
					label_input.select();
				}
				label_focused = true;
			}
		} else {
			label_focused = false;
		}
	});
</script>

<div class='graph'>
	<div
		class            = 'canvas-card'
		bind:this        = {container}
		style:color      = 'var(--text)'
		style:background = 'var(--white)'
		use:hit_target   = {{ id: 'graph', type: T_Hit_Target.graph }}>
		<canvas
			bind:this = {canvas}></canvas>
		{#if $w_hover && $w_mouse_location}
			{@const path = ancestry_path($w_hover.so)}
			<div
				class='name-popup'
				style:left='{$w_mouse_location.x + 12}px'
				style:top='{$w_mouse_location.y + 12}px'>
				{path}{$w_hovered_dimension ? `${path ? '.' : ''}${axis_label[$w_hovered_dimension.axis]} (${$w_hovered_dimension.axis})` : ''}
			</div>
		{/if}
		{#if $w_s_dimensions}
			<input
				value        = {$w_s_dimensions.formatted}
				style:left   = '{$w_s_dimensions.x}px'
				style:top    = '{$w_s_dimensions.y}px'
				onkeydown    = {on_dim_keydown}
				onblur       = {on_dim_blur}
				bind:this    = {dim_input}
				class        = 'dim-edit'
				type         = 'text'
			/>
		{/if}
		{#if $w_s_angular}
			<input
				value        = {$w_s_angular.formatted}
				style:left   = '{$w_s_angular.x}px'
				style:top    = '{$w_s_angular.y}px'
				onkeydown    = {on_ang_keydown}
				onblur       = {on_ang_blur}
				bind:this    = {ang_input}
				class        = 'ang-edit'
				type         = 'text'
			/>
		{/if}
		{#if $w_s_face_label}
			<input
				style:top    = '{Math.round($w_s_face_label.y) - 0.2}px'
				style:left   = '{Math.round($w_s_face_label.x)}px'
				value        = {$w_s_face_label.current_name}
				onkeydown    = {on_label_keydown}
				oninput      = {on_label_input}
				onfocus      = {on_label_focus}
				onblur       = {on_label_blur}
				bind:this    = {label_input}
				class        = 'label-edit'
				type         = 'text'
			/>
		{/if}
	</div>
</div>

<style>

	.graph {
		flex-direction : column;
		width          : 100%;
		height         : 100%;
		gap            : var(--l-gap);
		display        : flex;
	}

	.name-popup {
		border-radius   : var(--r-common);
		padding         : 2px 8px;
		background      : var(--white);
		font-size       : var(--font-small);
		box-shadow      : 0 1px 4px rgba(0, 0, 0, 0.18);
		pointer-events  : none;
		white-space     : nowrap;
		z-index         : var(--z-frontmost);
		position        : fixed;
		color           : var(--c-default);
	}

	.canvas-card {
		border-radius : var(--r-common);
		position      : relative;
		overflow      : hidden;
		flex          : 1 1 auto;
		min-height    : 0;
	}

	.canvas-card canvas {
		background   : inherit;
		display      : block;
		cursor       : grab;
		touch-action : none;
	}

	.canvas-card canvas:active {
		cursor : grabbing;
	}

	.dim-edit {
		transform  : translate(-50%, -50%);
		z-index    : var(--z-frontmost);
		font       : var(--font-edit);
		background : var(--white);
		position   : absolute;
		text-align : center;
		padding    : 2px 4px;
		width      : 80px;
		border     : none;
		outline    : none;
	}

	.ang-edit {
		transform  : translate(-50%, -50%);
		z-index    : var(--z-frontmost);
		font       : var(--font-edit);
		background : var(--white);
		position   : absolute;
		padding    : 2px 4px;
		text-align : center;
		width      : 60px;
		border     : none;
		outline    : none;
	}

	.label-edit {
		font                   : normal 10px sans-serif;
		transform              : translate(-50%, -50%);
		z-index                : var(--z-frontmost);
		background             : var(--white);
		height                 : var(--h-cell);
		-webkit-font-smoothing : antialiased;
		box-sizing             : border-box;
		position               : absolute;
		text-align             : center;
		width                  : 60px;
		border                 : none;
		outline                : none;
		line-height            : 1;
		padding                : 0;
	}

</style>
