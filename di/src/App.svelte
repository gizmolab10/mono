<script lang='ts'>
	import Main from './lib/svelte/main/Main.svelte';
	import { colors } from './lib/ts/draw/Colors';
	import { k } from './lib/ts/common/Constants';
	import { onMount } from 'svelte';

	const { w_accent_color, w_background_color, w_selected_color, w_text_color } = colors;

	// Static design tokens from Constants (single source of truth)
	onMount(() => {
		const root = document.documentElement.style;

		root.setProperty('--font-small',       `${k.height.font.small}px`);
		root.setProperty('--font-common',      `${k.height.font.common}px`);

		root.setProperty('--l-padding',        `${k.layout.padding}px`);
		root.setProperty('--l-margin',         `${k.layout.margin}px`);
		root.setProperty('--l-gap',            `${k.layout.gap}px`);
		
		root.setProperty('--th-tick',          `${k.thickness.tick}px`);
		root.setProperty('--th-track',         `${k.thickness.track}px`);
		root.setProperty('--th-thumb',         `${k.thickness.thumb}px`);
		root.setProperty('--th-sep',           `${k.thickness.separator.main}px`);
		root.setProperty('--th-thin-sep',      `${k.thickness.separator.banners}px`);
		root.setProperty('--th-content-sep',   `${k.thickness.separator.content}px`);

		root.setProperty('--corner-common',    `${k.corner.common}px`);
		root.setProperty('--corner-banner',    `${k.corner.banner}px`);
		root.setProperty('--corner-box',       `${k.corner.box}px`);

		root.setProperty('--z-common',         `${k.z.common}`);
		root.setProperty('--z-layout',         `${k.z.layout}`);
		root.setProperty('--z-action',         `${k.z.action}`);
		root.setProperty('--z-frontmost',      `${k.z.frontmost}`);

		root.setProperty('--h-button-segment', `${k.height.button.segment}px`);
		root.setProperty('--h-button-common',  `${k.height.button.common}px`);
		root.setProperty('--h-button-small',   `${k.height.button.small}px`);
		root.setProperty('--h-font-common',    `${k.height.font.common}px`);
		root.setProperty('--h-font-large',     `${k.height.font.large}px`);
		root.setProperty('--h-font-small',     `${k.height.font.small}px`);
		root.setProperty('--h-controls',       `${k.height.controls}px`);
		root.setProperty('--h-collapse',       `${k.height.collapse}px`);
		root.setProperty('--h-banner',         `${k.height.banner}px`);
		root.setProperty('--h-slider',         `${k.height.slider}px`);
		root.setProperty('--h-cell',           `${k.height.cell}px`);

	});

	// Reactive color stores
	$effect(() => {
		const root = document.documentElement.style;
		root.setProperty('--bg',                $w_background_color);
		root.setProperty('--accent',            $w_accent_color);
		root.setProperty('--text',              $w_text_color);
		root.setProperty('--selected',          $w_selected_color);
	});
</script>

<Main />

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
	}
</style>
