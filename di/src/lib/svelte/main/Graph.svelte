<script lang='ts'>
	import { T_Editing, T_Hit_3D, T_Hit_Target } from '../../ts/types/Enumerations';
	import { hits, hits_3d } from '../../ts/events';
	import { scenes, stores } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';

	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { dimensions } from '../../ts/editors/Dimension';
	import { angulars } from '../../ts/editors/Angular';
	import { render } from '../../ts/render/Render';
	import { k } from '../../ts/common/Constants';
	import Slider from '../mouse/Slider.svelte';
	import { onMount } from 'svelte';
	import { engine } from '../../ts/render';

	const { w_s_angular } = angulars;
	const { w_s_dimensions } = dimensions;
	const { w_s_face_label } = face_label;
	const { w_selection, w_scale, w_grid_opacity } = stores;

	let { onshowbuildnotes = () => {} }: { onshowbuildnotes?: () => void } = $props();
	let dim_input   = $state<HTMLInputElement>();
	let ang_input   = $state<HTMLInputElement>();
	let label_input = $state<HTMLInputElement>();
	let canvas      : HTMLCanvasElement;
	let container   : HTMLDivElement;
	let label_focused = false;
	let initialized = false;

	function handle_zoom_step(pointsUp: boolean) {
		if (pointsUp) engine.scale_up();
		else engine.scale_down();
	}

	function handle_zoom_slide(value: number) {
		w_scale.set(value);
	}

	function handle_grid_opacity(value: number) {
		w_grid_opacity.set(value);
	}

	let selected_so = $derived($w_selection?.so ?? scenes.root_so);

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

<div
	class            = 'graph'
	bind:this        = {container}
	style:color      = 'var(--text)'
	style:background = 'var(--c-white)'
	use:hit_target   = {{ id: 'graph', type: T_Hit_Target.graph }}>
	<canvas
		bind:this = {canvas}></canvas>
	<div class='canvas-actions'>
		<button class='build-button' use:hit_target={{ id: 'build', onpress: onshowbuildnotes }}>build {k.build_number}</button>
	</div>
	{#if breadcrumbs.length > 1}
		<div
			class='breadcrumbs'>
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
	<div class='assist'>
		<div class='assist-slider'>
			<Slider min={0} max={1} value={$w_grid_opacity} width={81} show_steppers={false} onchange={handle_grid_opacity} />
		</div>
		<span class='assist-label'>guides</span>
	</div>
	<div class='zoom'>
		<Slider min={0.01} max={10000} value={$w_scale} logarithmic fill onchange={handle_zoom_slide} onstep={handle_zoom_step} />
	</div>
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

<style>

	.graph {
		position : relative;
		width    : 100%;
		height   : 100%;
	}

	.graph canvas {
		background   : inherit;
		display      : block;
		cursor       : grab;
		touch-action : none;
	}

	.graph canvas:active {
		cursor : grabbing;
	}

	.assist {
		z-index        : var(--z-action);
		position       : absolute;
		flex-direction : column;
		align-items    : center;
		display        : flex;
		bottom         : 14px;
		gap            : 12px;
		right          : 3px;
	}

	.assist-label {
		letter-spacing : var(--l-letter-spacing);
		color          : rgba(0, 0, 0, 0.35);
		font-size      : var(--h-font-common);
	}

	.assist-slider {
		container-type : size;
		width          : 24px;
		height         : 81px;
	}

	.assist-slider :global(.slider-compound) {
		transform : translate(-50%, -50%) rotate(-90deg);
		position  : absolute;
		width     : 100cqh;
		top       : 50%;
		left      : 50%;
	}

	.zoom {
		z-index  : var(--z-action);
		position : absolute;
		right    : 10px;
		top      : 2px;
		width    : 50%;
	}

	.canvas-actions {
		z-index  : var(--z-action);
		gap      : var(--l-gap);
		position : absolute;
		display  : flex;
		bottom   : 10px;
		left     : 10px;
	}

	.build-button {
		border        : var(--th-border) solid rgba(0, 0, 0, 0.25);
		padding       : 0 var(--l-padding) 1px var(--l-padding);
		background    : rgba(255, 255, 255, 0.85);
		height        : var(--h-button-common);
		border-radius : var(--corner-common);
		font-size     : var(--h-font-common);
		color         : rgba(0, 0, 0, 0.5);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.build-button:hover,
	.build-button:global([data-hit]) {
		border     : var(--th-border) solid rgba(0, 0, 0, 0.4);
		color      : var(--c-black);
		background : var(--hover);
	}

	.breadcrumbs {
		z-index         : var(--z-action);
		flex-direction  : column;
		align-items     : flex-start;
		position        : absolute;
		top             : 10px;
		left            : 10px;
		display         : flex;
		gap             : 2px;
	}

	.crumb {
		border        : var(--th-border) solid transparent;
		background    : rgba(255, 255, 255, 0.7);
		height        : var(--h-button-common);
		color         : rgba(0, 0, 0, 0.45);
		font-size     : var(--h-font-common);
		border-radius : var(--corner-box);
		box-sizing    : border-box;
		cursor        : pointer;
		padding       : 0 8px;
	}

	.crumb:hover {
		border     : var(--th-border) solid rgba(0, 0, 0, 0.3);
		color      : var(--c-black);
		background : var(--hover);
	}

	.crumb.current {
		border      : var(--th-border) solid rgba(0, 0, 0, 0.5);
		background  : var(--crumb-bg);
		color       : var(--c-black);
		font-weight : 600;
	}

	.dim-edit {
		transform  : translate(-50%, -50%);
		z-index    : var(--z-frontmost);
		font       : var(--font-edit);
		background : var(--c-white);
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
		background : var(--c-white);
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
		background             : var(--c-white);
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
