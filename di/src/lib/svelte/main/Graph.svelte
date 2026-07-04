<script lang='ts'>
	import { T_Editing, T_Hit_Target } from '../../ts/types/Enumerations';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { dimensions } from '../../ts/editors/Dimension';
	import { angulars } from '../../ts/editors/Angular';
	import { hits, hits_3d } from '../../ts/events';
	import { render } from '../../ts/render/Render';
	import { k } from '../../ts/common/Constants';
	import { stores } from '../../ts/managers';
	import { e } from '../../ts/events/Events';
	import { engine } from '../../ts/render';
	import { onMount } from 'svelte';

	const { w_mouse_location } = e;
	const { w_s_angular } = angulars;
	const { w_s_face_label } = face_label;
	const { w_hover, w_hovered_dimension, w_hovered_dim_target } = hits_3d;
	const { w_s_dimensions, w_dim_edit_width } = dimensions;

	const axis_label: Record<'x' | 'y' | 'z', string> = { x: 'width', y: 'depth', z: 'height' };

	// The hovered dimension's on-screen label rect, for the DOM hover pill.
	// render.dimension_rects is rebuilt each frame; this recomputes when the
	// hover changes (a hover change also triggers a render, so the rects are
	// current). x/y are the label centre; w/h its size.
	const hovered_dim_rect = $derived.by(() => {
		const hd = $w_hovered_dimension;
		if (!hd) return null;
		return render.dimension_rects.find(r => r.so === hd.so && r.axis === hd.axis) ?? null;
	});

	// Show the hover pill on a hovered dim's label when the central rule marks
	// that dim's part as hovered — but never on the dim being edited (its edit
	// pill is there). Touch the hover stores so this recomputes on any change.
	const show_hover_pill = $derived.by(() => {
		void $w_hover; void $w_hovered_dim_target;
		const hd = $w_hovered_dimension;
		if (!hovered_dim_rect || !hd) return false;
		const ed = $w_s_dimensions;
		if (ed && hd.so === ed.so && hd.axis === ed.axis) return false;
		return hits_3d.hover_highlight_so_id === hd.so.id;
	});

	// While editing, the edit box recolors to the hover color when the central
	// rule marks the edited part as hovered (its lines or body — not its label).
	const edit_is_hovered = $derived.by(() => {
		void $w_hover; void $w_hovered_dimension; void $w_hovered_dim_target;
		const ed = $w_s_dimensions;
		return !!ed && hits_3d.hover_highlight_so_id === ed.so.id;
	});

	let dim_input     = $state<HTMLInputElement>();
	let ang_input     = $state<HTMLInputElement>();
	let label_input   = $state<HTMLInputElement>();
	let canvas        : HTMLCanvasElement;
	let container     : HTMLDivElement;
	let initialized   = false;
	let label_focused = false;

	// Walk up parents from this smart object, collect names, drop the root
	// (the topmost ancestor), join with dots. For a smart object directly
	// under root, this is just its own name. For the root itself, show the
	// root's own name (the file / design name) instead of an empty path.
	function ancestry_path(so: Smart_Object): string {
		const names: string[] = [];
		let current: Smart_Object | null = so;
		while (current) {
			names.push(current.name);
			current = current.scene?.parent?.so ?? null;
		}
		if (names.length <= 1) return so.name;  // the root part: its own name
		names.pop();  // drop the root for descendants — the path is relative to it
		return names.reverse().join('.');
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

	// Measure the edit text at the dimension font so the edit box can grow to
	// fit it (matches the drawn label width in Dimension_Renderer).
	let dim_measure_ctx: CanvasRenderingContext2D | null = null;
	function measure_dim_width(text: string): number {
		if (!dim_measure_ctx) dim_measure_ctx = document.createElement('canvas').getContext('2d');
		if (!dim_measure_ctx) return 80;
		dim_measure_ctx.font = `${k.height.font.graph}px sans-serif`;
		return dim_measure_ctx.measureText(text).width + 4;
	}

	// Every keystroke: remeasure the text width and store it so the edit box
	// resizes to fit.
	function on_dim_input(ev: Event) {
		dimensions.set_edit_width(measure_dim_width((ev.target as HTMLInputElement).value));
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
			dimensions.set_edit_width(measure_dim_width(dim_input.value));
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
		use:hit_target   = {{ id: 'graph', type: T_Hit_Target.graph }}
		style:background = 'var(--white)'
		style:color      = 'var(--text)'
		class            = 'canvas-card'
		bind:this        = {container}>
		<canvas bind:this = {canvas}></canvas>
		{#if $w_hover && $w_mouse_location}
			{@const path = ancestry_path($w_hover.so)}
			<div
				style:left='{$w_mouse_location.x + 12}px'
				style:top='{$w_mouse_location.y + 12}px'
				class='name-popup'>
				{path}{$w_hovered_dimension ? `${path ? '.' : ''}${axis_label[$w_hovered_dimension.axis]} (${$w_hovered_dimension.axis})` : ''}
			</div>
		{/if}
		{#if show_hover_pill && hovered_dim_rect}
			<div
				class       = 'dim-pill dim-hover-pill'
				style:left  = '{hovered_dim_rect.x}px'
				style:top   = '{hovered_dim_rect.y}px'
				style:width = '{hovered_dim_rect.w}px'
				style:height= '{hovered_dim_rect.h}px'
			></div>
		{/if}
		{#if $w_s_dimensions}
			<input
				value     		= {$w_s_dimensions.formatted}
				style:left		= '{$w_s_dimensions.x}px'
				style:top 		= '{$w_s_dimensions.y}px'
				style:width		= '{$w_dim_edit_width}px'
				class     		= 'dim-pill dim-edit'
				class:hovered	= {edit_is_hovered}
				onkeydown 		= {on_dim_keydown}
				oninput   		= {on_dim_input}
				onblur    		= {on_dim_blur}
				bind:this 		= {dim_input}
				type      		= 'text'
			/>
		{/if}
		{#if $w_s_angular}
			<input
				value     		= {$w_s_angular.formatted}
				style:left		= '{$w_s_angular.x}px'
				style:top 		= '{$w_s_angular.y}px'
				onkeydown 		= {on_ang_keydown}
				onblur    		= {on_ang_blur}
				bind:this 		= {ang_input}
				class     		= 'ang-edit'
				type      		= 'text'
			/>
		{/if}
		{#if $w_s_face_label}
			<input
				style:top 		= '{Math.round($w_s_face_label.y) - 0.2}px'
				style:left		= '{Math.round($w_s_face_label.x)}px'
				value     		= {$w_s_face_label.current_name}
				onkeydown 		= {on_label_keydown}
				oninput   		= {on_label_input}
				onfocus   		= {on_label_focus}
				onblur    		= {on_label_blur}
				bind:this 		= {label_input}
				class     		= 'label-edit'
				type      		= 'text'
			/>
		{/if}
	</div>
</div>

<style>

	.graph {
		gap            : var(--l-gap);
		flex-direction : column;
		display        : flex;
		height         : 100%;
		width          : 100%;
	}

	.name-popup {
		box-shadow      : 0 1px 4px rgba(0, 0, 0, 0.18);
		z-index         : var(--z-frontmost);
		font-size       : var(--font-graph);
		color           : var(--c-default);
		border-radius   : var(--r-common);
		background      : var(--white);
		padding         : 2px 8px;
		white-space     : nowrap;
		position        : fixed;
		pointer-events  : none;
	}

	.canvas-card {
		border-radius : var(--r-common);
		position      : relative;
		flex          : 1 1 auto;
		overflow      : hidden;
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

	.dim-pill {
		transform     : translate(-50%, -50%);
		z-index       : var(--z-frontmost);
		box-sizing    : content-box;
		position      : absolute;
		padding       : 2px 4px;
		border-radius : 999px;
	}

	.dim-edit.hovered {
		border-color : var(--so-hover);
		color        : var(--so-hover);
	}

	.dim-edit {
		border      : 2px dashed var(--so-selected);
		color       : var(--so-selected);
		font-size   : var(--font-graph);
		line-height : 1;
		background  : var(--white);
		text-align  : center;
		min-width   : 24px;
		outline     : none;
	}

	.dim-hover-pill {
		border         : 2px solid var(--so-hover);
		background     : transparent;
		pointer-events : none;
	}

	.ang-edit {
		transform  : translate(-50%, -50%);
		z-index    : var(--z-frontmost);
		font-size  : var(--font-graph);
		background : var(--white);
		position   : absolute;
		padding    : 2px 4px;
		text-align : center;
		width      : 60px;
		border     : none;
		outline    : none;
	}

	.label-edit {
		transform              : translate(-50%, -50%);
		z-index                : var(--z-frontmost);
		font-size			   : var(--font-graph);
		height                 : var(--h-cell);
		background             : var(--white);
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
