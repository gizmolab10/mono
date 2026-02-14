<script lang='ts'>
	import D_Preferences from './D_Preferences.svelte';
	import D_Selection from './D_Selection.svelte';
	import D_Library from './D_Library.svelte';
	import { colors } from '../../ts/draw/Colors';
	import { stores } from '../../ts/managers';
	import Hideable from './Hideable.svelte';
	const { w_text_color, w_background_color, w_accent_color } = colors;
	const { w_show_selection, w_show_preferences, w_show_library } = stores;

</script>

<div
	class            = 'details'
	style:color      = '{$w_text_color}'
	style:--accent   = {$w_accent_color}
	style:background = {$w_background_color}
	style:--bg       = {$w_background_color}>

	<div class='banner-zone'>
		<Hideable title='preferences' id='preferences' visible={w_show_preferences}>
			<D_Preferences />
		</Hideable>

		<Hideable title='selection' id='selection' visible={w_show_selection}>
			<D_Selection />
		</Hideable>

		<Hideable title='library' id='library' visible={w_show_library}>
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
