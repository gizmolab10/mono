<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	import { persistence } from '../../ts/managers/Persistence';
	import { scale_up, scale_down } from '../../ts/render/Trivial';
	import BuildNotes from './BuildNotes.svelte';
	const { w_text_color, w_background_color } = colors;

	let {
		title = 'Design Intuition'
	} : {
		title? : string;
	} = $props();

	let showBuildNotes = $state(false);
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
	<button class='toolbar-btn' onclick={scale_down}>&minus;</button>
	<button class='toolbar-btn' onclick={scale_up}>+</button>
	<button class='toolbar-btn reset' onclick={() => { persistence.clear(); location.reload(); }}>reset</button>
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
