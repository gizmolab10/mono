<script lang='ts'>
	import { T_Layer, T_Decorations } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { stores } from '../../ts/managers/Stores';
	import { scenes } from '../../ts/managers/Scenes';
	import Separator from '../mouse/Separator.svelte';
	import { k } from '../../ts/common/Constants';
	import { engine } from '../../ts/render';

	const { w_view_mode, w_decorations, w_solid, w_show_details, w_forward_face, w_rotation_snap, w_allow_editing, w_tick, w_orientation } = stores;
	const face_labels = ['bottom', 'top', 'left', 'right', 'back', 'front'];
	const separator_length = k.height.controls + 2;
	const margin = 8.5;

	let controls_width   = $state(Infinity);
	let wrap_phone       = $derived(controls_width < (k.width.wrap_phone));
	let wrap_mobile      = $derived(controls_width < (k.width.wrap_mobile));
	let show_names       = $derived(($w_decorations & T_Decorations.names) !== 0);
	let show_angles      = $derived(($w_decorations & T_Decorations.angles) !== 0);
	let show_dimensions  = $derived(($w_decorations & T_Decorations.dimensions) !== 0);
	let root_fits        = $derived.by(() => { $w_tick; return engine.root_fits(); });
	let is_straightened  = $derived.by(() => { $w_orientation; $w_tick; return engine.is_straightened(); });

	async function save() { await scenes.add_to_library(); }

</script>

{#snippet hamburger_button()}
	<button class='hamburger' class:active={$w_show_details}
		use:hit_target={{ id: 'details', onpress: () => stores.toggle_details() }} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 {k.height.button.common} {k.height.button.common}' width={k.height.button.common} height={k.height.button.common}>
			<path d={svg_paths.hamburger(k.height.button.common)}/>
		</svg>
	</button>
{/snippet}

{#snippet decoration_buttons()}
	<div class='segmented'>
		<button class='seg' class:active={show_names} use:hit_target={{ id: 'names', onpress: () => stores.toggle_names() }}>names</button>
		<button class='seg' class:active={show_dimensions} use:hit_target={{ id: 'dimensionals', onpress: () => stores.toggle_dimensionals() }}>dimensions</button>
		<button class='seg' class:active={show_angles} use:hit_target={{ id: 'angulars', onpress: () => stores.toggle_angulars() }}>angles</button>
	</div>
{/snippet}

{#snippet mode_buttons()}
	{@render decoration_buttons()}
	<button class='toolbar-button' use:hit_target={{ id: 'view-mode', onpress: () => engine.toggle_view_mode() }}>{$w_view_mode.toUpperCase()} ⟳</button>
	<button class='toolbar-button' use:hit_target={{ id: 'solid', onpress: () => stores.toggle_solid() }}>{$w_solid ? 'solid' : 'x-ray'} ⟳</button>
{/snippet}

{#snippet face_buttons()}
	<div class='segmented'>
		{#each face_labels as label, i}
			<button class='seg' class:forward={$w_forward_face === i} use:hit_target={{ id: `face-${i}`, onpress: () => engine.orient_to_face(i) }}>{label}</button>
		{/each}
	</div>
{/snippet}

{#snippet face_accessory_buttons()}
	<button class='toolbar-button' disabled={is_straightened} use:hit_target={{ id: 'straighten', onpress: () => engine.straighten() }}>straighten</button>
	<button class='toolbar-button snap-button' class:snap-off={!$w_rotation_snap} use:hit_target={{ id: 'rotation-snap', onpress: () => engine.toggle_rotation_snap() }}>🧲</button>
{/snippet}

<div
	class:wrap_mobile
	class            = 'controls'
	style:background = 'var(--bg)'
	style:color      = 'var(--text)'
	bind:clientWidth = {controls_width}>
	{#if wrap_phone}
		<div class='right-col'>
			<div class='right-row'>
				{@render hamburger_button()}
				<Separator vertical kind="main" margin={margin} z_layer={T_Layer.layout} />
				<span class='spacer'></span>
				{@render face_accessory_buttons()}
				<button class='toolbar-button' use:hit_target={{ id: 'solid', onpress: () => stores.toggle_solid() }}>{$w_solid ? 'solid' : 'x-ray'} ⟳</button>
				<span class='spacer'></span>
			</div>
			<Separator kind="main" margin={margin} end={k.layout.gap_small} />
			<div class='right-row'>
				{@render face_buttons()}
			</div>
			<Separator kind="main" margin={margin} end={k.layout.gap_small} />
			<div class='right-row'>
				{@render decoration_buttons()}
				<button class='toolbar-button' use:hit_target={{ id: 'view-mode', onpress: () => engine.toggle_view_mode() }}>{$w_view_mode.toUpperCase()} ⟳</button>
			</div>
		</div>
	{:else if wrap_mobile}
		<div class='right-col'>
			<div class='right-row'>
				{@render hamburger_button()}
				<Separator vertical kind="main" margin={margin} z_layer={T_Layer.layout} />
				<span class='spacer'></span>
				{@render mode_buttons()}
				<span class='spacer'></span>
			</div>
			<Separator kind="main" margin={margin * 0.9} end={k.layout.gap_tiny} />
			<div class='right-row'>
				{@render face_buttons()}
				{@render face_accessory_buttons()}
			</div>
		</div>
	{:else}
		{@render hamburger_button()}
		<Separator vertical kind="main" length={separator_length} margin={-5} z_layer={T_Layer.layout} />
		<button class='toolbar-button' use:hit_target={{ id: 'save', onpress: save }}>save</button>
		<button class='toolbar-button' use:hit_target={{ id: 'allow-editing', onpress: () => stores.toggle_allow_editing() }}>{$w_allow_editing ? 'edit' : '🔒 edit'} ⟳</button>
		{#if $w_allow_editing && !root_fits}
			<button class='toolbar-button' use:hit_target={{ id: 'fit', onpress: () => engine.fit_to_children() }}>fit</button>
		{/if}
		<Separator vertical kind="main" length={separator_length} />
		<span class='spacer'></span>
		{@render face_buttons()}
		{@render face_accessory_buttons()}
		<span class='spacer'></span>
		<Separator vertical kind="main" length={separator_length} />
		{@render mode_buttons()}
	{/if}
</div>

<style>

	.controls {
		padding         : 0 var(--l-gap-large) 0 var(--l-gap-small);
		gap             : var(--l-gap);
		box-sizing      : border-box;
		justify-content : flex-end;
		overflow        : visible;
		align-items     : center;
		width           : 100%;
		display         : flex;
	}

	.controls:not(.wrap_mobile) {
		height : var(--h-controls);
	}

	.group {
		align-items : center;
		display     : flex;
		flex-shrink : 0;
	}

	.right-col {
		padding        : var(--l-gap) 0;
		flex-direction : column;
		display        : flex;
		gap            : 2px;
		min-width      : 0;
		flex           : 1;
	}

	.right-row {
		overflow        : visible;
		justify-content : center;
		align-items     : center;
		display         : flex;
		gap             : var(--l-gap);
	}

	.spacer {
		flex      : 1 1 0px;
		min-width : 0;
	}

	.hamburger {
		border          : none;
		height          : var(--h-button-common);
		width           : var(--h-button-common);
		z-index         : var(--z-action);
		background      : transparent;
		position        : relative;
		cursor          : pointer;
		color           : inherit;
		align-items     : center;
		justify-content : center;
		display         : flex;
		top             : 0px;
		left            : 1px;
		padding         : 0;
	}

	.hamburger-icon path {
		fill   : currentColor;
		stroke : none;
	}

	.hamburger:global([data-hit]) .hamburger-icon path {
		fill : lightgray;
	}

	.gap-after {
		margin-right : var(--l-gap);
	}

	.toolbar-button {
		padding       : 0 var(--l-padding) 1px var(--l-padding);
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		font-size     : var(--h-font-common);
		border-radius : var(--corner-common);
		z-index       : var(--z-action);
		background    : var(--c-white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
	}

	.toolbar-button.active {
		background : var(--selected);
		color      : var(--c-black);
	}

	.toolbar-button:disabled {
		cursor  : default;
		opacity : 0.35;
	}

	.toolbar-button:global([data-hit]) {
		color      : var(--c-black);
		background : var(--hover);
	}

	.snap-button {
		width         : var(--h-button-common);
		height        : var(--h-button-common);
		font-size     : var(--h-font-large);
		position      : relative;
		border-radius : 50%;
		padding       : 0;
	}

	.snap-off::after {
		transform  : translate(-50%, -50%) rotate(-45deg);
		width      : var(--h-button-common);
		background : var(--c-black);
		position   : absolute;
		height     : 1.5px;
		top        : 50%;
		left       : 50%;
		content    : '';
	}

	.segmented {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-segment);
		border-radius : var(--corner-common);
		z-index       : var(--z-action);
		box-sizing    : border-box;
		overflow      : hidden;
		display       : flex;
	}

	.seg {
		border      : none;
		padding     : 0 var(--l-padding) 1px var(--l-padding);
		border-right: var(--th-border) solid currentColor;
		color       : rgba(0, 0, 0, 0.35);
		font-size   : var(--h-font-common);
		background  : var(--c-white);
		box-sizing  : border-box;
		cursor      : pointer;
		height      : 100%;
	}

	.seg:last-child {
		border-right : none;
	}

	.seg.forward {
		background : var(--selected);
		color      : var(--c-black);
	}

	.seg.active {
		background : var(--selected);
		color      : var(--c-black);
	}

	.seg:global([data-hit]) {
		color      : var(--c-black);
		background : var(--hover);
	}

</style>

