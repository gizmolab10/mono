<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	import { scenes } from '../../ts/managers/Scenes';
	import { w_scale, w_view_mode, w_show_dimensionals, toggle_dimensionals } from '../../ts/managers/Stores';
	import { scale_up, scale_down, straighten, toggle_view_mode } from '../../ts/render/Engine';
	import Slider from '../mouse/Slider.svelte';
	import BuildNotes from './BuildNotes.svelte';
	const { w_text_color, w_background_color } = colors;

	let {
		title = 'Design Intuition'
	} : {
		title? : string;
	} = $props();

	let showBuildNotes = $state(false);

	function handle_scale(pointsUp: boolean, _isLong: boolean) {
		if (pointsUp) scale_up();
		else scale_down();
	}

	function handle_slider(value: number) {
		w_scale.set(value);
	}

</script>

{#if showBuildNotes}
	<BuildNotes onclose={() => showBuildNotes = false} />
{/if}

<div
	class            = 'controls'
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	<h1>{title}</h1>
	<span class='spacer'></span>
	<button class='toolbar-btn' class:active={$w_view_mode === '2d'} onclick={toggle_view_mode}>{$w_view_mode}</button>
	<button class='toolbar-btn' onclick={straighten}>straighten</button>
	<button class='toolbar-btn' class:active={$w_show_dimensionals} onclick={toggle_dimensionals}>{$w_show_dimensionals ? 'hide' : 'show'} dimensions</button>
	<Slider min={0.1} max={10} value={$w_scale} onchange={handle_slider} onstep={handle_scale} />
	<button class='toolbar-btn' onclick={() => { scenes.clear(); location.reload(); }}>reset</button>
	<button class='toolbar-btn' onclick={() => showBuildNotes = true}>build {__BUILD_NUMBER__}</button>
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
		margin      : 0;
		font-size   : 1.25rem;
		font-weight : 300;
	}

	.spacer {
		flex-grow: 1;
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
