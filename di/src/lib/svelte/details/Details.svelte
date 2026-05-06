<script lang='ts'>
	import { scenes, stores, selection } from '../../ts/managers';
	import { preferences } from '../../ts/managers/Preferences';
	import { T_Details } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import D_Preferences from './D_Preferences.svelte';
	import D_Selection from './D_Selection.svelte';
	import { scene } from '../../ts/render/Scene';
	import { hits } from '../../ts/events/Hits';
	import D_Library from './D_Library.svelte';
	import Hideable from './Hideable.svelte';
	import { engine } from '../../ts/render';
	import D_Parts from './D_Parts.svelte';
	import { onMount } from 'svelte';

	const w_selection = selection.w_selection;
	const { w_tick } = stores;

	let is_repeater_or_clone = $derived.by(() => {
		// Re-trigger on any scene-state change so reorderings are picked up too.
		$w_tick;
		const sel = $w_selection;
		const so = sel?.so;
		if (!so) return false;
		if (so.repeater?.is_repeating) return true;
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater?.is_repeating) return false;
		const siblings = scene.get_all().filter(o => o.parent?.so === parent).map(o => o.so);
		return siblings[0] !== so;
	});

	function factory_reset() {
		preferences.reset();
		location.reload();
	}

	function add_child_and_show_parts() {
		stores.w_t_details.update(v => v | T_Details.parts);
		engine.add_child_so();
	}

	onMount( async () => {
		await hits.defer_recalibrate();
	});

</script>

<div
	class            = 'details'
	style:color      = 'var(--text)'
	style:background = 'var(--bg)'
	onscroll         = {() => hits.recalibrate()}>

	<div class='banner-zone'>
		<Hideable title='preferences' id='preferences' detail={T_Details.preferences}>
			{#snippet leftActions()}
				<button class='action-button' use:hit_target={{ id: 'reset-prefs', onpress: factory_reset }}>factory reset</button>
			{/snippet}
			<D_Preferences />
		</Hideable>

		<Hideable title='library' id='library' detail={T_Details.library}>
			{#snippet leftActions()}
				<button class='action-button' use:hit_target={{ id: 'reset-library', onpress: () => scenes.reset_library() }}>reinstall</button>
			{/snippet}
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'new-scene', onpress: () => engine.load_scene(scenes.new_scene()) }}>+</button>
			{/snippet}
			<D_Library />
		</Hideable>

		<Hideable title='parts' id='parts' detail={T_Details.parts}>
			{#snippet actions()}
				{#if !is_repeater_or_clone}
					<button class='banner-add' use:hit_target={{ id: 'add-child', onpress: add_child_and_show_parts }}>+</button>
				{/if}
			{/snippet}
			<D_Parts />
		</Hideable>

		<Hideable title='selected part' id='selection' detail={T_Details.selection}>
			<D_Selection />
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

	.banner-add:hover,
	.banner-add:active {
		background : var(--c-white);
		color      : var(--c-black);
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
		overflow-x : hidden;
		overflow-y : auto;
		height     : 100%;
		width      : 100%;
		padding    : 0;
	}

	.action-button {
		background    : radial-gradient(ellipse at center, var(--c-white) 30%, var(--accent) 100%);
		border        : var(--th-border) solid rgba(0, 0, 0, 0.3);
		height        : var(--h-button-tiny);
		border-radius : var(--corner-common);
		font-size     : var(--h-font-reset);
		z-index       : var(--z-action);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 10px;
		font-weight     : 400;
	}

	.action-button:global([data-hit]) {
		color      : var(--c-black);
		background : var(--bg);
	}

	.banner-add {
		background      : radial-gradient(circle at center, var(--c-white) 30%, var(--accent) 80%);
		border          : var(--th-border) solid rgba(0, 0, 0, 0.3);
		height          : var(--h-button-small);
		width           : var(--h-button-small);
		color           : rgba(0, 0, 0, 0.5);
		font-size       : var(--h-font-large);
		z-index         : var(--z-action);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border-radius   : 50%;
		font-weight     : 600;
		line-height     : 1;
		padding         : 0;
	}

</style>
