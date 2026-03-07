<script lang='ts'>
	import { T_Details } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/managers/Hits';
	import { scenes } from '../../ts/managers';
	import { engine } from '../../ts/render';
	import { onMount } from 'svelte';
	import Hideable from './Hideable.svelte';
	import D_Parts from './D_Parts.svelte';
	import D_Library from './D_Library.svelte';
	import D_Preferences from './D_Preferences.svelte';
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
		position   : relative;
		background : var(--accent);
	}

	.banner-add:hover {
		color      : black;
		background : var(--bg);
	}

	.banner-zone::after {
		content       : '';
		height        : var(--corner-banner);
		display       : block;
		background    : var(--bg);
		border-radius : var(--corner-banner) var(--corner-banner) 0 0;
	}

	.details {
		overflow-y : auto;
		width      : 100%;
		height     : 100%;
		position   : relative;
		padding    : 0 0 1rem;
		box-sizing : border-box;
	}

	.banner-add {
		z-index         : var(--z-action);
		line-height     : 1;
		padding         : 0;
		border-radius   : 50%;
		font-weight     : 300;
		font-size       : 14px;
		width           : 18px;
		height          : var(--h-button-common);
		display         : flex;
		align-items     : center;
		justify-content : center;
		cursor          : pointer;
		background      : var(--accent);
		color           : rgba(0, 0, 0, 0.5);
		border          : 0.5px solid rgba(0, 0, 0, 0.3);
	}

</style>
