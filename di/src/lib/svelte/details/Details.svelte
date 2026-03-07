<script lang='ts'>
	import { T_Details } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import D_Preferences from './D_Preferences.svelte';
	import { hits } from '../../ts/managers/Hits';
	import { scenes } from '../../ts/managers';
	import D_Library from './D_Library.svelte';
	import Hideable from './Hideable.svelte';
	import { engine } from '../../ts/render';
	import D_Parts from './D_Parts.svelte';
	import { onMount } from 'svelte';

	onMount( async () => {
		setTimeout( async () => {
			await hits.defer_recalibrate();
		}, 10);
	});

</script>

<div
	class            = 'details'
	style:color      = 'var(--text)'
	style:background = 'var(--bg)'>

	<div class='banner-zone'>
		<Hideable title='preferences' id='preferences' detail={T_Details.preferences}>
			<D_Preferences />
		</Hideable>

		<Hideable title='library' id='library' detail={T_Details.library}>
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'new-scene', onpress: () => engine.load_scene(scenes.new_scene()) }}>+</button>
			{/snippet}
			<D_Library />
		</Hideable>

		<Hideable title='parts' id='parts' detail={T_Details.parts}>
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'add-child', onpress: () => engine.add_child_so() }}>+</button>
			{/snippet}
			<D_Parts />
		</Hideable>

	</div>
</div>

<style>
	.banner-zone :global(.hideable:last-child .slot) {
		border-bottom : 3px solid var(--accent);
	}

	.banner-zone {
		background : var(--accent);
		position   : relative;
	}

	.banner-add:hover {
		background : var(--bg);
		color      : black;
	}

	.banner-zone::after {
		border-radius : var(--corner-banner) var(--corner-banner) 0 0;
		height        : var(--corner-banner);
		background    : var(--bg);
		display       : block;
		content       : '';
	}

	.details {
		box-sizing : border-box;
		position   : relative;
		padding    : 0 0 1rem;
		overflow-y : auto;
		height     : 100%;
		width      : 100%;
	}

	.banner-add {
		border          : 0.5px solid rgba(0, 0, 0, 0.3);
		height          : var(--h-button-small);
		width           : var(--h-button-small);
		color           : rgba(0, 0, 0, 0.5);
		font-size       : var(--h-font-large);
		z-index         : var(--z-action);
		background      : var(--selected);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border-radius   : 50%;
		font-weight     : 300;
		line-height     : 1;
		padding         : 0;
	}

</style>
