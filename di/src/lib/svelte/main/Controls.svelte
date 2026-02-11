<script lang='ts'>
	import { scenes } from '../../ts/managers/Scenes';
	import { stores } from '../../ts/managers/Stores';
	import { colors } from '../../ts/draw/Colors';
	import Slider from '../mouse/Slider.svelte';
	import { engine } from '../../ts/render';
	const { w_text_color, w_background_color } = colors;
	const { w_scale, w_view_mode, w_show_dimensionals, w_solid } = stores;

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
	style:background = {$w_background_color}>
	<h1>{title}</h1>
	<button class='toolbar-btn' onclick={() => { scenes.clear(); location.reload(); }}>reset</button>
	<button class='toolbar-btn' onclick={() => engine.straighten()}>straighten</button>
	<span class='spacer'></span>
	<Slider min={0.1} max={100} value={$w_scale} onchange={handle_slider} onstep={handle_scale} />
	<button class='toolbar-btn' class:active={$w_show_dimensionals} onclick={() => stores.toggle_dimensionals()}>{$w_show_dimensionals ? 'hide' : 'show'} dimensions</button>
	<button class='toolbar-btn' onclick={() => stores.toggle_solid()}>{$w_solid ? 'solid' : 'see through'}</button>
	<button class='toolbar-btn' class:active={$w_view_mode === '2d'} onclick={() => engine.toggle_view_mode()}>{$w_view_mode}</button>
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

	.toolbar-btn:hover {
		background : black;
		color      : white;
	}
</style>
