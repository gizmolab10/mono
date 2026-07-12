<script lang='ts'>
	import { colors } from '../../ts/utilities/Colors';
	import { c } from '../../ts/common/Configuration';
	import Intersection from './Intersection.svelte';

	const {
		w_background_color, w_selected_color, w_accent_color, w_hover_color,
		w_thumb_color, w_track_color, w_focus_color, w_text_color, w_tick_color
	} = colors;

	$effect(() => {
		c.configure_reactive_colors(
			$w_background_color,
			$w_selected_color,
			$w_accent_color,
			$w_hover_color,
			$w_thumb_color,
			$w_track_color,
			$w_focus_color,
			$w_text_color,
			$w_tick_color
		);
	});
</script>

<Intersection />

<style>
	:global(:root) {
		--font: 'Montserrat', system-ui, sans-serif;
	}

	:global(body) {
		font-weight: var(--fw-normal);
		font-family: var(--font);
		user-select: none;
		margin: 0;
	}

	:global(button, input, select, textarea) {
		font-weight: var(--fw-normal);
		font-family: var(--font);
	}

	:global(input:focus, textarea:focus) {
		user-select: text;
	}

</style>
