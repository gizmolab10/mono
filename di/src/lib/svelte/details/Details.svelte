<script lang='ts'>
	import { scenes, stores, parts, selection } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { preferences } from '../../ts/managers/Preferences';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Details } from '../../ts/types/Enumerations';
	import D_Preferences from './D_Preferences.svelte';
	import Separator from '../mouse/Separator.svelte';
	import D_Selection from './D_Selection.svelte';
	import { k } from '../../ts/common/Constants';
	import { hits } from '../../ts/events/Hits';
	import D_Library from './D_Library.svelte';
	import { engine } from '../../ts/render';
	import D_Givens from './D_Givens.svelte';
	import Hideable from './Hideable.svelte';
	import D_Parts from './D_Parts.svelte';
	import { onMount, tick } from 'svelte';

	const th_sep = k.thickness.separator.main;
	const { w_selection_name } = selection;
	const { w_tick, w_all_sos } = stores;
	const { w_naming_error } = parts;

	interface Props {
		onpadchange?: (pad: number) => void;
	}

	let selection_title: string = $derived( $w_selection_name ?? 'nothing selected' );
	let scroll_box: HTMLDivElement | undefined = $state();
	let inner_box: HTMLDivElement | undefined = $state();
	let givens_add: (() => void) | undefined = $state();
	let { onpadchange }: Props = $props();
	let scrollbar_w = $state(0);

	// Count of leaf parts in the scene. A repeater counts as a single leaf and
	// nothing inside it counts — the master, its descendants, and the spawned
	// clones are all hidden from the count. Outside of repeaters, the usual
	// leaf rule applies: a part counts when nothing is parented under it.
	let parts_leaf_count = $derived.by(() => {
		$w_tick;
		const sos = $w_all_sos;
		const is_inside_repeater = (s: Smart_Object): boolean => {
			let p = s.scene?.parent?.so;
			while (p) {
				if (p.repeater?.is_repeating) return true;
				p = p.scene?.parent?.so;
			}
			return false;
		};
		const visible = sos.filter(s => !is_inside_repeater(s));
		return visible.filter(s => s.repeater?.is_repeating || !visible.some(c => c.scene?.parent?.so === s)).length;
	});

	let parts_title: string = $derived(
		parts_leaf_count === 0 ? 'no parts'
		: parts_leaf_count === 1 ? 'part (1)'
		: `parts (${parts_leaf_count})`
	);

	function factory_reset() {
		preferences.reset();
		location.reload();
	}

	function add_child_and_show_parts() {
		stores.w_t_details.update(v => v | T_Details.parts);
		engine.add_child_so();
	}

	async function add_given_and_show_givens() {
		stores.w_t_details.update(v => v | T_Details.givens);
		await tick();
		givens_add?.();
	}

	function recheck_overflow() {
		if (!scroll_box) return;
		const overflowing = scroll_box.scrollHeight > scroll_box.clientHeight + 1;
		const sw = overflowing ? scroll_box.offsetWidth - scroll_box.clientWidth : 0;
		if (sw !== scrollbar_w) {
			scrollbar_w = sw;
			onpadchange?.(sw > 0 ? sw + th_sep : 0);
		}
	}

	onMount( async () => {
		await hits.defer_recalibrate();
	});

	$effect(() => {
		if (!scroll_box || !inner_box) return;
		const ro = new ResizeObserver(() => recheck_overflow());
		ro.observe(scroll_box);
		ro.observe(inner_box);
		recheck_overflow();
		return () => ro.disconnect();
	});

</script>

<div class='details-shell'>

<div
	class            = 'details'
	bind:this        = {scroll_box}
	style:color      = 'var(--text)'
	onscroll         = {() => hits.recalibrate()}>

	<div bind:this={inner_box} class='banner-zone' style:padding-right='{scrollbar_w > 0 ? th_sep + "px" : "0"}'>
		<Hideable title='preferences' id='preferences' detail={T_Details.preferences}>
			{#snippet leftActions()}
				<button class='action-button' use:hit_target={{ id: 'reset-prefs', onpress: factory_reset }}>factory reset</button>
			{/snippet}
			<D_Preferences />
		</Hideable>

		<Hideable title='library' id='library' detail={T_Details.library}>
			{#snippet leftActions()}
				<button class='action-button' use:hit_target={{ id: 'reset-library', onpress: () => scenes.reset_library() }}>reinstall</button>
			{/snippet}
			{#snippet rightActions()}
				<button class='banner-add' use:hit_target={{ id: 'new-scene', onpress: () => engine.load_scene(scenes.new_scene()) }}>+</button>
			{/snippet}
			<D_Library />
		</Hideable>

		<Hideable title={parts_title} id='parts' detail={T_Details.parts}>
			{#snippet rightActions()}
				<button class='banner-add' use:hit_target={{ id: 'add-child', onpress: add_child_and_show_parts }}>+</button>
			{/snippet}
			<D_Parts />
		</Hideable>

		{#if $w_selection_name}
			<Hideable title={selection_title} id='selection' detail={T_Details.selection}>
				<D_Selection />
			</Hideable>

			<Hideable title='givens' id='givens' detail={T_Details.givens}>
				{#snippet rightActions()}
					<button class='banner-add' use:hit_target={{ id: 'add-given', onpress: add_given_and_show_givens }}>+</button>
				{/snippet}
				<D_Givens bind:add={givens_add} />
			</Hideable>
		{/if}

		{#if $w_naming_error}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class='naming-backdrop' onmousedown={(e) => { e.preventDefault(); parts.dismiss_naming(); }}></div>
			<div class='naming-overlay'>
				<div class='naming-message'>{@html $w_naming_error.replace(/'([^']+)'/g, "&#39;<span class='naming-quoted'>$1</span>&#39;")}</div>
				<div class='naming-suggestions'>
					<button class='naming-suggestion' onmousedown={(e) => { e.preventDefault(); parts.dismiss_naming(); }}>delete it</button>
				</div>
			</div>
		{/if}

	</div>
</div>

{#if scrollbar_w > 0}
	<div class='separator-overlay' style:right='{scrollbar_w}px'>
		<Separator vertical kind='main' />
	</div>
{/if}

</div>

<style>

	.banner-zone {
		gap            : var(--th-sep);
		background     : var(--accent);
		position       : relative;
		flex-direction : column;
		display        : flex;
	}

	.banner-add:hover,
	.banner-add:active {
		color      : var(--c-default);
		background : var(--white);
	}

	.details {
		background : var(--accent);
		box-sizing : border-box;
		position   : relative;
		overflow-x : hidden;
		overflow-y : auto;
		height     : 100%;
		width      : 100%;
		padding    : 0;
	}

	.details-shell {
		position : relative;
		height   : 100%;
		width    : 100%;
	}

	.separator-overlay {
		position       : absolute;
		align-items    : stretch;
		pointer-events : none;
		display        : flex;
		bottom         : -1px;
		top            : 0;
	}

	.separator-overlay :global(.separator.vertical) {
		height     : 100%;
	}

	.details::-webkit-scrollbar {
		background : var(--accent);
		width      : 15px;
	}

	.details::-webkit-scrollbar-track,
	.details::-webkit-scrollbar-track-piece,
	.details::-webkit-scrollbar-corner {
		background : var(--accent);
	}

	.details::-webkit-scrollbar-button {
		height     : var(--th-sep);
		background : var(--accent);
		display    : block;
	}

	.details::-webkit-scrollbar-thumb {
		border        : 0.1px solid var(--c-default);
		background    : var(--c-thumb);
		border-radius : 9999px;
	}

	.action-button {
		background    : radial-gradient(ellipse at center, var(--white) 30%, var(--accent) 100%);
		border        : var(--th-border) solid rgba(0, 0, 0, 0.3);
		height        : var(--h-button-tiny);
		border-radius : var(--r-common);
		font-size     : var(--font-reset);
		z-index       : var(--z-action);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 10px;
		font-weight   : 400;
	}

	.action-button:global([data-hit]) {
		color      : var(--c-default);
		background : var(--white);
	}

	.banner-add {
		background      : radial-gradient(circle at center, var(--white) 30%, var(--accent) 80%);
		border          : var(--th-border) solid rgba(0, 0, 0, 0.3);
		height          : var(--h-button-small);
		width           : var(--h-button-small);
		color           : rgba(0, 0, 0, 0.5);
		font-size       : var(--font-large);
		z-index         : var(--z-action);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border-radius   : 50%;
		font-weight     : 600;
		line-height     : 1;
		padding         : 0;
	}

	.naming-backdrop {
		position : fixed;
		z-index  : 999;
		inset    : 0;
	}

	.naming-overlay {
		font-size     : var(--font-small);
		border        : 2px solid darkred;
		background    : var(--white);
		box-sizing    : border-box;
		position      : relative;
		padding       : 6px 8px;
		text-align    : center;
		width         : 100%;
		z-index       : 1000;
		margin-top    : 8px;
		margin-bottom : 8px;
		border-radius : 8px;
	}

	.naming-message :global(.naming-quoted) {
		color : darkred;
	}

	.naming-suggestions {
		justify-content : center;
		display         : flex;
		margin-top      : 8px;
	}

	.naming-suggestion {
		border        : var(--th-border) solid currentColor;
		font-size     : var(--font-small);
		border-radius : var(--r-table);;
		cursor        : pointer;
		color         : inherit;
		padding       : 2px 5px;
		background    : white;
		line-height   : 1;
	}

	.naming-suggestion:hover {
		outline    : 2px solid var(--accent);
		background : var(--selected);
	}

</style>
