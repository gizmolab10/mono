<script lang='ts'>
	import Main from './lib/svelte/main/Main.svelte';
	import { colors } from './lib/ts/draw/Colors';

	const { w_accent_color, w_background_color } = colors;

	$effect(() => {
		const root = document.documentElement.style;
		root.setProperty('--accent', $w_accent_color);
		root.setProperty('--bg', $w_background_color);
	});
</script>

<Main />

<style>
	:global(body) {
		margin      : 0;
		font-family : system-ui, sans-serif;
	}

	:global(:root) {
		--z-common    : 0;
		--z-layout    : 1;
		--z-action    : 2;
		--z-frontmost : 3;
	}
</style>
