<script lang='ts'>
	import { T_Decorations } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { stores } from '../../ts/managers/Stores';
	import { scenes } from '../../ts/managers/Scenes';
	import Separator from '../mouse/Separator.svelte';
	import { colors } from '../../ts/draw/Colors';
	import { engine } from '../../ts/render';

	async function save() { await scenes.add_to_library(); }
	const { w_text_color, w_background_color } = colors;
	const face_labels = ['bottom', 'top', 'left', 'right', 'back', 'front'];
	const { w_view_mode, w_decorations, w_solid, w_show_details, w_front_face } = stores;

	let show_dimensions = $derived(($w_decorations & T_Decorations.dimensions) !== 0);
	let show_angles     = $derived(($w_decorations & T_Decorations.angles) !== 0);
	let show_names      = $derived(($w_decorations & T_Decorations.names) !== 0);

	let controls_width  = $state(Infinity);
	let wrapped         = $derived(controls_width < 650);
</script>

{#snippet hamburger_button()}
	<button class='hamburger' class:active={$w_show_details} use:hit_target={{ id: 'details', onpress: () => stores.toggle_details() }} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='-2 -1 20 20' width='20' height='20'>
			<rect x='2' y='4'  width='16' height='2.5' rx='1.25'/>
			<rect x='2' y='9'  width='16' height='2.5' rx='1.25'/>
			<rect x='2' y='14' width='16' height='2.5' rx='1.25'/>
		</svg>
	</button>
{/snippet}

{#snippet other_buttons()}
	<button class='toolbar-btn' use:hit_target={{ id: 'save', onpress: save }}>save</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'fit', onpress: () => engine.fit_to_children() }}>fit</button>
{/snippet}

{#snippet left_buttons()}
	{@render hamburger_button()}
	{@render other_buttons()}
{/snippet}

{#snippet mode_buttons()}
	<div class='segmented'>
		<button class='seg' class:active={show_names} use:hit_target={{ id: 'names', onpress: () => stores.toggle_names() }}>names</button>
		<button class='seg' class:active={show_dimensions} use:hit_target={{ id: 'dimensionals', onpress: () => stores.toggle_dimensionals() }}>dimensions</button>
		<button class='seg' class:active={show_angles} use:hit_target={{ id: 'angulars', onpress: () => stores.toggle_angulars() }}>angles</button>
	</div>
	<button class='toolbar-btn' class:active={$w_view_mode === '2d'} use:hit_target={{ id: 'view-mode', onpress: () => engine.toggle_view_mode() }}>{$w_view_mode.toUpperCase()} ↔</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'solid', onpress: () => stores.toggle_solid() }}>{$w_solid ? 'solid' : 'x-ray'} ↔</button>
{/snippet}

{#snippet face_buttons()}
	<div class='segmented'>
		{#each face_labels as label, i}
			<button class='seg' class:front={$w_front_face === i} use:hit_target={{ id: `face-${i}`, onpress: () => engine.orient_to_face(i) }}>{label}</button>
		{/each}
	</div>
	<button class='toolbar-btn' use:hit_target={{ id: 'straighten', onpress: () => engine.straighten() }}>straighten</button>
{/snippet}

<div
	class            = 'controls'
	class:wrapped
	bind:clientWidth = {controls_width}
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	{#if wrapped}
		<div class='right-col'>
			<div class='right-row'>{@render hamburger_button()}{@render face_buttons()}</div>
			<Separator thickness={5} margin={6} />
			<div class='right-row'>{@render other_buttons()}{@render mode_buttons()}</div>
		</div>
	{:else}
		<div class='group'>
			{@render left_buttons()}
			<Separator vertical thickness={5} length={28} margin={0} />
		</div>
		<span class='spacer'></span>
		<div class='group'>{@render face_buttons()}</div>
		<span class='spacer'></span>
		<Separator vertical thickness={5} length={28} margin={0} />
		<div class='group'>{@render mode_buttons()}</div>
	{/if}
</div>

<style>
	.controls {
		box-sizing      : border-box;
		justify-content : flex-end;
		overflow        : visible;
		align-items     : center;
		padding         : 0 6px;
		width           : 100%;
		display         : flex;
	}

	.group {
		align-items : center;
		display     : flex;
		flex-shrink : 0;
	}

	.left-col {
		align-items : center;
		display     : flex;
		flex-shrink : 0;
	}

	.right-col {
		flex-direction : column;
		padding        : 6px 0;
		display        : flex;
		gap            : 2px;
		min-width      : 0;
		flex           : 1;
	}

	.right-row {
		justify-content : center;
		align-items     : center;
		display         : flex;
	}

	.spacer {
		flex      : 1 1 0px;
		min-width : 0;
	}

	.hamburger {
		z-index         : var(--z-action);
		background      : transparent;
		position        : relative;
		cursor          : pointer;
		color           : inherit;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border          : none;
		height          : 16px;
		width           : 16px;
		top             : -1px;
		padding         : 0;
	}

	.hamburger-icon rect {
		fill   : currentColor;
		stroke : none;
	}

	.hamburger:global([data-hitting]) .hamburger-icon rect {
		stroke       : var(--accent);
		fill         : white;
		stroke-width : 0.5;
	}

	.toolbar-btn {
		border        : 0.5px solid currentColor;
		z-index       : var(--z-action);
		padding       : 0 6px 1px 6px;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		background    : white;
		border-radius : 10px;
		font-size     : 11px;
		height        : 16px;
		margin-left   : 4px;
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
		border        : 0.5px solid currentColor;
		z-index       : var(--z-action);
		box-sizing    : border-box;
		overflow      : hidden;
		display       : flex;
		border-radius : 10px;
		height        : 16px;
		margin-left   : 2px;
	}

	.seg {
		border-right: 0.5px solid currentColor;
		color       : rgba(0, 0, 0, 0.35);
		padding     : 0 6px 1px 6px;
		box-sizing  : border-box;
		cursor      : pointer;
		background  : white;
		border      : none;
		font-size   : 11px;
		height      : 100%;
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
