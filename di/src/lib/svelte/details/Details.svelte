<script lang='ts'>
	import { constants } from '../../ts/algebra/User_Constants';
	import { T_Details } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import { stores, scenes } from '../../ts/managers';
	import { engine } from '../../ts/render';
	import { onMount } from 'svelte';
	import Hideable from './Hideable.svelte';
	import D_Assembly from './D_Assembly.svelte';
	import D_Selection from './D_Selection.svelte';
	import D_Library from './D_Library.svelte';
	import D_Attributes from './D_Attributes.svelte';
	import D_Constants from './D_Constants.svelte';
	import D_Preferences from './D_Preferences.svelte';
	const { w_text_color, w_background_color, w_accent_color } = colors;
	const { w_t_details } = stores;

	onMount( async () => {
		setTimeout( async () => {
			await hits.defer_recalibrate();
		}, 10);
	});

	function handle_add() {
		w_t_details.update(v => v | T_Details.constants);
		constants.add('', 0);
		stores.tick();
	}

</script>

<div
	class            = 'details'
	style:color      = '{$w_text_color}'
	style:--accent   = {$w_accent_color}
	style:background = {$w_background_color}
	style:--bg       = {$w_background_color}>

	<div class='banner-zone'>
		<Hideable title='preferences' id='preferences' detail={T_Details.preferences}>
			<D_Preferences />
		</Hideable>

		<Hideable title='library' id='library' detail={T_Details.library}>
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'new-scene', onpress: () => scenes.new_scene() }}>+</button>
			{/snippet}
			<D_Library />
		</Hideable>

		<Hideable title='assembly' id='assembly' detail={T_Details.assembly}>
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'add-child', onpress: () => engine.add_child_so() }}>+</button>
			{/snippet}
			<D_Assembly />
		</Hideable>

		<Hideable title='selection' id='selection' detail={T_Details.selection}>
			<D_Selection />
		</Hideable>

		<Hideable title='attributes' id='so' detail={T_Details.attributes}>
			<D_Attributes />
		</Hideable>

		<Hideable title='constants' id='constants' detail={T_Details.constants}>
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'add-constant', onpress: () => handle_add() }}>+</button>
			{/snippet}
			<D_Constants />
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
		height        : 11px;
		display       : block;
		background    : var(--bg);
		border-radius : 11px 11px 0 0;
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
		line-height     : 1;
		padding         : 0;
		border-radius   : 50%;
		font-weight     : 300;
		font-size       : 14px;
		width           : 18px;
		height          : 18px;
		display         : flex;
		align-items     : center;
		justify-content : center;
		cursor          : pointer;
		background      : var(--accent);
		color           : rgba(0, 0, 0, 0.5);
		border          : 0.5px solid rgba(0, 0, 0, 0.3);
	}

</style>
