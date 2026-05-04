<script lang='ts'>
	import { colors } from './lib/ts/utilities/Colors';
	import { c } from './lib/ts/common/Configuration';
	import Main from './lib/svelte/main/Main.svelte';

	const { w_accent_color, w_background_color, w_selected_color, w_text_color } = colors;

	$effect(() => {
		c.configure_reactive_colors($w_text_color, $w_accent_color, $w_selected_color, $w_background_color);
	});

</script>

<Main />

<style>
	:global(body) {
		font-family: system-ui, sans-serif;
		user-select: none;
		margin: 0;
	}

	:global(input:focus, textarea:focus) {
		user-select: text;
	}

	@media (max-width: 429px) {
		:global(:root) {
			--th-content-sep: 1px !important;
			--th-thin-sep: 1px !important;
			--l-gap-small: 1px !important;
			--l-gap-tiny: 1px !important;
			--l-gap: 1px !important;
		}
	}
</style>
