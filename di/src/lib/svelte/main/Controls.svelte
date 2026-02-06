<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	import { persistence } from '../../ts/managers/Persistence';
	import { scale_up, scale_down, set_scale, get_scale } from '../../ts/render/Trivial';
	import Slider from '../mouse/Slider.svelte';
	import BuildNotes from './BuildNotes.svelte';
	const { w_text_color, w_background_color } = colors;

	let {
		title = 'Design Intuition'
	} : {
		title? : string;
	} = $props();

	let showBuildNotes = $state(false);
	let current_scale = $state(1);

	// Sync from engine on mount (after init runs)
	$effect(() => {
		current_scale = get_scale();
	});

	function handle_scale(pointsUp: boolean, _isLong: boolean) {
		if (pointsUp) scale_up();
		else scale_down();
		current_scale = get_scale();
	}

	function handle_slider(value: number) {
		set_scale(value);
		current_scale = value;
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
	<Slider min={0.1} max={10} value={current_scale} onchange={handle_slider} onstep={handle_scale} />
	<button class='toolbar-btn' onclick={() => { persistence.clear(); location.reload(); }}>reset</button>
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
	}

	.toolbar-btn:hover {
		background : black;
		color      : white;
	}
</style>
