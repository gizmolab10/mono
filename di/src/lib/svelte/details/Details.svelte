<script lang='ts'>
	import { T_Details } from '../../ts/types/Enumerations';
	import D_Preferences from './D_Preferences.svelte';
	import D_Selection from './D_Selection.svelte';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import D_Standard_Dimensions from './D_Standard_Dimensions.svelte';
	import D_Library from './D_Library.svelte';
	import D_List from './D_List.svelte';
	import Hideable from './Hideable.svelte';
	import { tick, onMount } from 'svelte';
	const { w_text_color, w_background_color, w_accent_color } = colors;

	onMount( async () => {
		setTimeout(() => {
			hits.recalibrate();
		}, 10);
	});

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

		<Hideable title='selection' id='selection' detail={T_Details.selection}>
			<D_Selection />
		</Hideable>

		<Hideable title='standard dimensions' id='standard-dimensions' detail={T_Details.standard_dimensions}>
			<D_Standard_Dimensions />
		</Hideable>

		<Hideable title='list' id='list' detail={T_Details.list}>
			<D_List />
		</Hideable>

		<Hideable title='library' id='library' detail={T_Details.library}>
			<D_Library />
		</Hideable>
	</div>
</div>

<style>
	.details {
		box-sizing : border-box;
		position   : relative;
		padding    : 0 0 1rem;
		overflow-y : auto;
		width      : 100%;
		height     : 100%;
	}

	.banner-zone {
		background : var(--accent);
		position   : relative;
	}


	.banner-zone :global(.hideable:last-child .slot) {
		border-bottom : 3px solid var(--accent);
	}

	.banner-zone::after {
		background    : var(--bg);
		border-radius : 11px 11px 0 0;
		display       : block;
		height        : 11px;
		content       : '';
	}

</style>
