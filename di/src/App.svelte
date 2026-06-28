<script lang='ts'>
	import { colors } from './lib/ts/utilities/Colors';
	import { c } from './lib/ts/common/Configuration';
	import Main from './lib/svelte/main/Main.svelte';
	import { print } from './lib/ts/utilities/Print';

	const {
		w_background_color, 
		w_selected_color, 
		w_accent_color, 
		w_hover_color, 
		w_thumb_color, 
		w_track_color, 
		w_focus_color,
		w_text_color, 
		w_tick_color
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

	// Wire the browser print events (Cmd+P / File -> Print). The print logic
	// itself lives in the Print manager. App-wide styles live in css/app.css.
	print.register();
</script>

<Main />
