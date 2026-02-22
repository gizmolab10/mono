<script lang='ts'>
	import { T_Editing, T_Hit_3D, T_Hit_Target, T_Layer } from '../../ts/types/Enumerations';
	import { hits, hits_3d, scenes, stores } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { components } from '../../ts/managers/Components';
	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { dimensions } from '../../ts/editors/Dimension';
	import { angulars } from '../../ts/editors/Angular';
	import { render } from '../../ts/render/Render';
	import { colors } from '../../ts/draw/Colors';
	import { k } from '../../ts/common/Constants';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount, onDestroy } from 'svelte';
	import { engine } from '../../ts/render';

	let { onshowbuildnotes = () => {} }: { onshowbuildnotes?: () => void } = $props();

	const { w_text_color, w_background_color } = colors;
	const { w_s_dimensions } = dimensions;
	const { w_s_angular } = angulars;
	const { w_s_face_label } = face_label;
	const { w_selection, w_root_so } = stores;

	let selected_so = $derived($w_selection?.so ?? $w_root_so);

	// Walk from selected SO up to root — returns [root, ..., parent, selected]
	let breadcrumbs = $derived.by(() => {
		const trail: Smart_Object[] = [];
		let current = selected_so;
		while (current) {
			trail.push(current);
			current = current.scene?.parent?.so ?? null;
		}
		trail.reverse();
		return trail;
	});

	function select_so(so: Smart_Object) {
		const face = hits_3d.front_most_face(so);
		if (face >= 0) {
			hits_3d.set_selection({ so, type: T_Hit_3D.face, index: face });
		}
		scenes.save();
	}
	const GRAPH_HID = 1;

	let canvas      : HTMLCanvasElement;
	let container   : HTMLDivElement;
	let dim_input   = $state<HTMLInputElement>();
	let ang_input   = $state<HTMLInputElement>();
	let label_input = $state<HTMLInputElement>();
	let initialized = false;

	const s_hit_target = components.component_forHID_andType_createUnique(GRAPH_HID, T_Hit_Target.graph);

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
			if (stores.editing() !== T_Editing.details_name) {
				face_label.cancel();
			}
		});
	}

	onMount(() => {
		if (!container) return;

		// Register the container as a hit target
		s_hit_target.set_html_element(container);

		// Set up click handler
		s_hit_target.handle_s_mouse = (_s_mouse: S_Mouse) => {
			return true;
		};

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

	onDestroy(() => {
		components.component_remove(s_hit_target);
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

	let label_focused = false;
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

<div
	class            = 'graph'
	bind:this        = {container}
	style:color      = {$w_text_color}
	style:background = 'white'
	style:--z-action = {T_Layer.action}
	style:--z-frontmost   = {T_Layer.frontmost}>
	<canvas
		bind:this = {canvas}></canvas>
	<div class='canvas-actions'>
		<button class='canvas-btn' use:hit_target={{ id: 'build', onpress: onshowbuildnotes }}>build {k.build_number}</button>
	</div>
	{#if breadcrumbs.length > 1}
		<div
			class='breadcrumbs'
			style:--crumb-bg = {$w_background_color}>
			{#each breadcrumbs as so, index (so.id)}
				<button
					class='crumb'
					class:current={index === breadcrumbs.length - 1}
					onclick={() => select_so(so)}>
					{so.name}
				</button>
			{/each}
		</div>
	{/if}
	{#if $w_s_dimensions}
		<input
			bind:this    = {dim_input}
			class        = 'dim-edit'
			type         = 'text'
			value        = {$w_s_dimensions.formatted}
			style:left   = '{$w_s_dimensions.x}px'
			style:top    = '{$w_s_dimensions.y}px'
			onkeydown    = {on_dim_keydown}
			onblur       = {on_dim_blur}
		/>
	{/if}
	{#if $w_s_angular}
		<input
			bind:this    = {ang_input}
			class        = 'ang-edit'
			type         = 'text'
			value        = {$w_s_angular.formatted}
			style:left   = '{$w_s_angular.x}px'
			style:top    = '{$w_s_angular.y}px'
			onkeydown    = {on_ang_keydown}
			onblur       = {on_ang_blur}
		/>
	{/if}
	{#if $w_s_face_label}
		<input
			bind:this    = {label_input}
			class        = 'label-edit'
			type         = 'text'
			value        = {$w_s_face_label.current_name}
			style:left   = '{Math.round($w_s_face_label.x)}px'
			style:top    = '{Math.round($w_s_face_label.y) - 0.2}px'
			oninput      = {on_label_input}
			onkeydown    = {on_label_keydown}
			onfocus      = {on_label_focus}
			onblur       = {on_label_blur}
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
		cursor     : grab;
		display    : block;
		background : inherit;
	}

	.graph canvas:active {
		cursor : grabbing;
	}

	.canvas-actions {
		position : absolute;
		bottom   : 10px;
		left     : 10px;
		display  : flex;
		gap      : 4px;
		z-index  : var(--z-action);
	}

	.canvas-btn {
		background    : rgba(255, 255, 255, 0.85);
		border        : 0.5px solid rgba(0, 0, 0, 0.25);
		border-radius : 10px;
		color         : rgba(0, 0, 0, 0.5);
		padding       : 0 6px 1px 6px;
		font-size     : 11px;
		height        : 20px;
		cursor        : pointer;
		box-sizing    : border-box;
	}

	.canvas-btn:hover {
		background : rgba(255, 255, 255, 1);
		color      : black;
		border     : 0.5px solid rgba(0, 0, 0, 0.4);
	}

	.breadcrumbs {
		position        : absolute;
		top             : 10px;
		left            : 10px;
		display         : flex;
		flex-direction  : column-reverse;
		align-items     : flex-start;
		gap             : 2px;
		z-index         : var(--z-action);
	}

	.crumb {
		background    : rgba(255, 255, 255, 0.7);
		border        : 0.5px solid transparent;
		border-radius : 4px;
		color         : rgba(0, 0, 0, 0.45);
		padding       : 0 8px;
		font-size     : 11px;
		height        : 20px;
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.crumb:hover {
		background : var(--crumb-bg);
		color      : black;
		border     : 0.5px solid rgba(0, 0, 0, 0.3);
	}

	.crumb.current {
		background  : var(--crumb-bg);
		color       : black;
		font-weight : 600;
		border      : 0.5px solid rgba(0, 0, 0, 0.5);
	}

	.dim-edit {
		position   : absolute;
		transform  : translate(-50%, -50%);
		font       : 12px sans-serif;
		text-align : center;
		width      : 80px;
		padding    : 2px 4px;
		border     : none;
		outline    : none;
		background : white;
		z-index    : var(--z-frontmost);
	}

	.ang-edit {
		position   : absolute;
		transform  : translate(-50%, -50%);
		font       : 12px sans-serif;
		text-align : center;
		width      : 60px;
		padding    : 2px 4px;
		border     : none;
		outline    : none;
		background : white;
		z-index    : var(--z-frontmost);
	}

	.label-edit {
		position       : absolute;
		transform      : translate(-50%, -50%);
		box-sizing     : border-box;
		font           : normal 10px sans-serif;
		-webkit-font-smoothing : antialiased;
		text-align     : center;
		width          : 60px;
		padding        : 0;
		line-height    : 1;
		height         : 10px;
		border         : none;
		outline        : none;
		background     : white;
		z-index        : var(--z-frontmost);
	}
</style>
