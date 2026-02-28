<script lang='ts'>
	import { T_Decorations } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { stores } from '../../ts/managers/Stores';
	import { scenes } from '../../ts/managers/Scenes';
	import { colors } from '../../ts/draw/Colors';
	import Slider from '../mouse/Slider.svelte';
	import { engine } from '../../ts/render';

	async function save() { await scenes.add_to_library(); }
	const { w_text_color, w_background_color, w_accent_color } = colors;
	const face_labels = ['bottom', 'top', 'left', 'right', 'back', 'front'];
	const { w_scale, w_view_mode, w_decorations, w_solid, w_show_details, w_show_grid, w_front_face, w_all_sos, w_tick } = stores;

	let needs_fit = $derived.by(() => {
		void $w_tick;
		const all = $w_all_sos;
		const root = all.find(so => !so.scene?.parent);
		if (!root || root.repeater) return false;
		if (!all.some(so => so.scene?.parent?.so === root)) return false;
		const rb = [root.x_min, root.x_max, root.y_min, root.y_max, root.z_min, root.z_max];
		for (const so of all) {
			let p = so.scene?.parent;
			let is_desc = false;
			while (p) { if (p.so === root) { is_desc = true; break; } p = p.parent; }
			if (!is_desc) continue;
			const db = [so.x_min, so.x_max, so.y_min, so.y_max, so.z_min, so.z_max];
			for (let ai = 0; ai < 3; ai++) {
				if (db[ai * 2] < rb[ai * 2]) return true;
				if (db[ai * 2 + 1] > rb[ai * 2 + 1]) return true;
			}
		}
		return false;
	});

	let show_dimensions = $derived(($w_decorations & T_Decorations.dimensions) !== 0);
	let show_angles     = $derived(($w_decorations & T_Decorations.angles) !== 0);
	let show_names      = $derived(($w_decorations & T_Decorations.names) !== 0);

	function handle_scale(pointsUp: boolean, _isLong: boolean) {
		if (pointsUp) engine.scale_up();
		else engine.scale_down();
	}

	function handle_slider(value: number) {
		w_scale.set(value);
	}

</script>

<div
	class            = 'controls'
	style:color      = {$w_text_color}
	style:background = {$w_background_color}
	style:--accent   = {$w_accent_color}>
	<button class='hamburger' class:active={$w_show_details} use:hit_target={{ id: 'details', onpress: () => stores.toggle_details() }} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 20 20' width='24' height='24'>
			<rect x='2' y='4'  width='16' height='2.5' rx='1.25'/>
			<rect x='2' y='9'  width='16' height='2.5' rx='1.25'/>
			<rect x='2' y='14' width='16' height='2.5' rx='1.25'/>
		</svg>
	</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'save', onpress: save }}>save</button>
	{#if needs_fit}<button class='toolbar-btn' use:hit_target={{ id: 'shrink-to-fit', onpress: () => engine.shrink_to_fit() }}>fit</button>{/if}
	<span class='spacer'></span>
	<div class='segmented'>
		<button class='seg' class:active={show_names} use:hit_target={{ id: 'names', onpress: () => stores.toggle_names() }}>names</button>
		<button class='seg' class:active={show_dimensions} use:hit_target={{ id: 'dimensionals', onpress: () => stores.toggle_dimensionals() }}>dimensions</button>
		<button class='seg' class:active={show_angles} use:hit_target={{ id: 'angulars', onpress: () => stores.toggle_angulars() }}>angles</button>
	</div>
	<button class='toolbar-btn' class:active={$w_view_mode === '2d'} use:hit_target={{ id: 'view-mode', onpress: () => engine.toggle_view_mode() }}>↔ {$w_view_mode}</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'solid', onpress: () => stores.toggle_solid() }}>↔ {$w_solid ? 'solid' : 'see through'}</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'grid', onpress: () => stores.toggle_grid() }}>↔ {$w_show_grid ? 'grid' : 'no grid'}</button>
	<Slider min={0.01} max={10000} value={$w_scale} logarithmic width={90} onchange={handle_slider} onstep={handle_scale} />
	<div class='segmented'>
		{#each face_labels as label, i}
			<button class='seg' class:front={$w_front_face === i} use:hit_target={{ id: `face-${i}`, onpress: () => engine.orient_to_face(i) }}>{label}</button>
		{/each}
	</div>
	<button class='toolbar-btn' use:hit_target={{ id: 'straighten', onpress: () => engine.straighten() }}>straighten</button>
</div>

<style>
	.controls {
		width           : 100%;
		display         : flex;
		flex-wrap       : wrap;
		padding         : 4px 1rem;
		row-gap         : 4px;
		align-items     : center;
		justify-content : flex-end;
		box-sizing      : border-box;
		overflow        : visible;
	}

	.spacer {
		flex      : 1 1 0px;
		min-width : 0;
	}

	.hamburger {
		background      : transparent;
		border          : none;
		color           : inherit;
		width           : 20px;
		height          : 20px;
		padding         : 0;
		cursor          : pointer;
		display         : flex;
		align-items     : center;
		justify-content : center;
		margin-right    : 6px;
		position        : relative;
		top             : -1px;
	}

	.hamburger-icon rect {
		fill   : currentColor;
		stroke : none;
	}

	.hamburger:global([data-hitting]) .hamburger-icon rect {
		fill         : white;
		stroke       : var(--accent);
		stroke-width : 0.5;
	}

	.toolbar-btn {
		background    : white;
		border        : 0.5px solid currentColor;
		border-radius : 10px;
		color         : inherit;
		padding       : 0 6px 1px 6px;
		font-size     : 11px;
		height        : 20px;
		cursor        : pointer;
		margin-left   : 6px;
		box-sizing    : border-box;
	}

	.toolbar-btn.active {
		background : white;
		color      : black;
	}

	.toolbar-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.segmented {
		display       : flex;
		margin-left   : 6px;
		border        : 0.5px solid currentColor;
		border-radius : 10px;
		overflow      : hidden;
		height        : 20px;
		box-sizing    : border-box;
	}

	.seg {
		background  : white;
		border      : none;
		border-right: 0.5px solid currentColor;
		color       : rgba(0, 0, 0, 0.35);
		padding     : 0 6px 1px 6px;
		font-size   : 11px;
		height      : 100%;
		cursor      : pointer;
		box-sizing  : border-box;
	}

	.seg:last-child {
		border-right : none;
	}

	.seg.front {
		background : rgba(0, 0, 0, 0.12);
		color      : black;
	}

	.seg.active {
		background : var(--accent);
		color      : black;
	}

	.seg:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}
</style>
