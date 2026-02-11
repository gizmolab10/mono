<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { scenes } from '../../ts/managers/Scenes';
	import { stores } from '../../ts/managers/Stores';
	import { colors } from '../../ts/draw/Colors';
	import Slider from '../mouse/Slider.svelte';
	import { engine } from '../../ts/render';
	const { w_text_color, w_background_color, w_accent_color } = colors;
	const { w_scale, w_view_mode, w_show_dimensionals, w_solid, w_show_details } = stores;

	let {
		title = 'Design Intuition™'
	} : {
		title? : string;
	} = $props();

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
	<h1>{title}</h1>
	<button class='toolbar-btn' use:hit_target={{ id: 'reset', onpress: () => { scenes.clear(); location.reload(); } }}>reset</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'straighten', onpress: () => engine.straighten() }}>straighten</button>
	<span class='spacer'></span>
	<Slider min={0.1} max={100} value={$w_scale} onchange={handle_slider} onstep={handle_scale} />
	<button class='toolbar-btn' class:active={$w_show_dimensionals} use:hit_target={{ id: 'dimensionals', onpress: () => stores.toggle_dimensionals() }}>{$w_show_dimensionals ? 'hide' : 'show'} dimensions</button>
	<button class='toolbar-btn' use:hit_target={{ id: 'solid', onpress: () => stores.toggle_solid() }}>{$w_solid ? 'solid' : 'see through'}</button>
	<button class='toolbar-btn' class:active={$w_view_mode === '2d'} use:hit_target={{ id: 'view-mode', onpress: () => engine.toggle_view_mode() }}>{$w_view_mode}</button>
</div>

<style>
	.controls {
		width       : 100%;
		height      : 100%;
		display     : flex;
		padding     : 0 1rem;
		align-items : center;
		box-sizing  : border-box;
	}

	.controls h1 {
		position    : relative;
		top         : -2px;
		margin      : 0;
		font-size   : 1.25rem;
		font-weight : 300;
	}

	.spacer {
		flex : 1;
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
</style>
