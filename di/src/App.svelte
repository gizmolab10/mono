<script lang='ts'>
	import { colors } from './lib/ts/utilities/Colors';
	import Main from './lib/svelte/main/Main.svelte';
	import { k } from './lib/ts/common/Constants';
	import { stores } from './lib/ts/managers/Stores';
	import { selection } from './lib/ts/managers/Selection';
	import { onMount } from 'svelte';

	const { w_accent_color, w_background_color, w_selected_color, w_text_color } = colors;

	// Static design tokens from Constants (single source of truth)
	onMount(() => {
		const root = document.documentElement.style;

		root.setProperty('--focus-outline',    `1.5px solid ${colors.focus}`);

		root.setProperty('--window-min-width', `${k.width.window_min}`);

		root.setProperty('--c-white',           'white');
		root.setProperty('--c-black',           colors.default);
		root.setProperty('--c-slider-border',   colors.border);
		root.setProperty('--c-focus',           colors.focus);
		root.setProperty('--c-thumb',           colors.thumb);
		root.setProperty('--c-track',           colors.track);

		root.setProperty('--font-reset',       `${k.height.font.reset}px sans-serif`);
		root.setProperty('--font-common',      `${k.height.font.common}px`);
		root.setProperty('--font-small',       `${k.height.font.small}px`);

		root.setProperty('--l-letter-spacing', `${k.layout.letter_spacing}px`);
		root.setProperty('--l-padding-small',  `${k.layout.padding_small}px`);
		root.setProperty('--l-gap-large',      `${k.layout.gap_large}px`);
		root.setProperty('--l-gap-small',      `${k.layout.gap_small}px`);
		root.setProperty('--l-gap-tiny',       `${k.layout.gap_tiny}px`);
		root.setProperty('--l-padding',        `${k.layout.padding}px`);
		root.setProperty('--l-margin',         `${k.layout.margin}px`);
		root.setProperty('--l-gap',            `${k.layout.gap}px`);
		
		root.setProperty('--th-tick',          `${k.thickness.tick}px`);
		root.setProperty('--th-track',         `${k.thickness.track}px`);
		root.setProperty('--th-thumb',         `${k.thickness.thumb}px`);
		root.setProperty('--th-border',        `${k.thickness.border}px`);
		root.setProperty('--th-sep',           `${k.thickness.separator.main}px`);
		root.setProperty('--th-thin-sep',      `${k.thickness.separator.content}px`);
		root.setProperty('--th-content-sep',   `${k.thickness.separator.content}px`);

		root.setProperty('--corner-common',    `${k.corner.common}px`);
		root.setProperty('--corner-banner',    `${k.corner.banner}px`);
		root.setProperty('--corner-input',     `${k.corner.input}px`);
		root.setProperty('--corner-box',       `${k.corner.box}px`);

		root.setProperty('--z-common',         `${k.z.common}`);
		root.setProperty('--z-layout',         `${k.z.layout}`);
		root.setProperty('--z-action',         `${k.z.action}`);
		root.setProperty('--z-frontmost',      `${k.z.frontmost}`);

		root.setProperty('--h-button-tiny',    `${k.height.button.tiny}px`);
		root.setProperty('--h-button-small',   `${k.height.button.small}px`);
		root.setProperty('--h-button-common',  `${k.height.button.common}px`);
		root.setProperty('--w-build-button',   `${k.width.build_button}px`);
		root.setProperty('--w-guides-slider',  `${k.width.guides_slider}px`);
		root.setProperty('--h-font-monster',   `${k.height.font.monster}px`);
		root.setProperty('--h-font-common',    `${k.height.font.common}px`);
		root.setProperty('--h-font-large',     `${k.height.font.large}px`);
		root.setProperty('--h-font-reset',     `${k.height.font.reset}px`);
		root.setProperty('--h-font-small',     `${k.height.font.small}px`);
		root.setProperty('--h-font-huge',      `${k.height.font.huge}px`);
		root.setProperty('--h-controls',       `${k.height.controls}px`);
		root.setProperty('--h-collapse',       `${k.height.collapse}px`);
		root.setProperty('--h-banner',         `${k.height.banner}px`);
		root.setProperty('--h-slider',         `${k.height.slider}px`);
		root.setProperty('--h-cell',           `${k.height.cell}px`);

		root.setProperty('--w-title',          `${k.width.title}px`);
		root.setProperty('--w-small',          `${k.width.small}px`);

		// Read-only hooks for browser-driven tests. Only attached when the URL
		// carries the `test=1` query parameter, so a normal user session sees
		// no extra surface on the page. The hooks expose internal state for
		// assertions; they do not write anything. Test code uses the on-screen
		// buttons to change state.
		if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === '1') {
			(window as unknown as { di_test: Record<string, () => unknown> }).di_test = {
				orientation: () => Array.from(stores.current_orientation()),
				selection: () => {
					const sel = selection.current;
					return sel ? { so_id: sel.so.id, type: sel.type, index: sel.index } : null;
				},
				view_mode: () => stores.current_view_mode,
				is_editing_allowed: () => stores.allow_editing,
			};
		}
	});

	// Reactive color stores
	$effect(() => {
		const root = document.documentElement.style;
		root.setProperty('--text',              $w_text_color);
		root.setProperty('--accent',            $w_accent_color);
		root.setProperty('--hover',             $w_accent_color);
		root.setProperty('--selected',          $w_selected_color);
		root.setProperty('--bg',                $w_background_color);
	});

</script>

<Main />

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		user-select: none;
	}

	:global(input:focus, textarea:focus) {
		user-select: text;
	}

	@media (max-width: 429px) {
		:global(:root) {
			--l-gap: 2px !important;
			--th-thin-sep: 1px !important;
			--th-content-sep: 1px !important;
		}
	}
</style>
