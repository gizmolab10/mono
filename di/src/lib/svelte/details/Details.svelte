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
	import D_Hierarchy from './D_Hierarchy.svelte';
	import D_Library from './D_Library.svelte';
	import D_Smart_Object from './D_Smart_Object.svelte';
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

		<Hideable title='hierarchy' id='hierarchy' detail={T_Details.hierarchy}>
			<D_Hierarchy />
		</Hideable>

		<Hideable title='smart object' id='so' detail={T_Details.so}>
			{#snippet actions()}
				<button class='banner-add' use:hit_target={{ id: 'add-child', onpress: () => engine.add_child_so() }}>+</button>
			{/snippet}
			<D_Smart_Object />
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
		background : var(--accent);
		position   : relative;
	}

	.banner-add:hover {
		background : var(--bg);
		color      : black;
	}

	.banner-zone::after {
		background    : var(--bg);
		border-radius : 11px 11px 0 0;
		display       : block;
		height        : 11px;
		content       : '';
	}

	.details {
		box-sizing : border-box;
		position   : relative;
		padding    : 0 0 1rem;
		overflow-y : auto;
		width      : 100%;
		height     : 100%;
	}

	.banner-add {
		background    : var(--accent);
		border        : 0.5px solid rgba(0, 0, 0, 0.3);
		border-radius : 50%;
		color         : rgba(0, 0, 0, 0.5);
		font-size     : 14px;
		font-weight   : 300;
		line-height   : 1;
		width         : 18px;
		height        : 18px;
		padding       : 0;
		cursor        : pointer;
		display       : flex;
		align-items   : center;
		justify-content : center;
	}

</style>
