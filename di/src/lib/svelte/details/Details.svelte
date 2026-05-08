<script lang='ts'>
	import { scenes, stores, parts } from '../../ts/managers';
	import { preferences } from '../../ts/managers/Preferences';
	import { T_Details } from '../../ts/types/Enumerations';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { hit_target } from '../../ts/events/Hit_Target';
	import D_Preferences from './D_Preferences.svelte';
	import D_Selection from './D_Selection.svelte';
	import { hits } from '../../ts/events/Hits';
	import D_Library from './D_Library.svelte';
	import D_Givens from './D_Givens.svelte';
	import Hideable from './Hideable.svelte';
	import { engine } from '../../ts/render';
	import D_Parts from './D_Parts.svelte';
	import { onMount, tick } from 'svelte';

	const { w_tick, w_all_sos } = stores;
	const { w_naming_error } = parts;

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
	let parts_title = $derived(
		parts_leaf_count === 0 ? 'no parts'
		: parts_leaf_count === 1 ? '(1) part'
		: `(${parts_leaf_count}) parts`
	);

	function factory_reset() {
		preferences.reset();
		location.reload();
	}

	function add_child_and_show_parts() {
		stores.w_t_details.update(v => v | T_Details.parts);
		engine.add_child_so();
	}

	let givens_add: (() => void) | undefined = $state();

	async function add_given_and_show_givens() {
		stores.w_t_details.update(v => v | T_Details.givens);
		await tick();
		givens_add?.();
	}

	onMount( async () => {
		await hits.defer_recalibrate();
	});

</script>

<div
	class            = 'details'
	style:color      = 'var(--text)'
	style:background = 'var(--bg)'
	onscroll         = {() => hits.recalibrate()}>

	<div class='banner-zone'>
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

		<Hideable title='edit' id='selection' detail={T_Details.selection}>
			<D_Selection />
		</Hideable>

		<Hideable title='givens' id='givens' detail={T_Details.givens}>
			{#snippet rightActions()}
				<button class='banner-add' use:hit_target={{ id: 'add-given', onpress: add_given_and_show_givens }}>+</button>
			{/snippet}
			<D_Givens bind:add={givens_add} />
		</Hideable>

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

<style>
	.banner-zone :global(.hideable:last-child .slot) {
		border-bottom : 3px solid var(--accent);
	}

	.banner-zone {
		background : var(--accent);
		position   : relative;
	}

	.banner-add:hover,
	.banner-add:active {
		background : var(--white);
		color      : var(--c-default);
	}

	.banner-zone::after {
		border-radius : var(--corner-banner) var(--corner-banner) 0 0;
		height        : var(--corner-banner);
		background    : var(--bg);
		display       : block;
		content       : '';
	}

	.details {
		box-sizing : border-box;
		position   : relative;
		overflow-x : hidden;
		overflow-y : auto;
		height     : 100%;
		width      : 100%;
		padding    : 0;
	}

	.action-button {
		background    : radial-gradient(ellipse at center, var(--white) 30%, var(--accent) 100%);
		border        : var(--th-border) solid rgba(0, 0, 0, 0.3);
		height        : var(--h-button-tiny);
		border-radius : var(--corner-common);
		font-size     : var(--font-reset);
		z-index       : var(--z-action);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 10px;
		font-weight     : 400;
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
		inset    : 0;
		z-index  : 999;
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
		border-radius : var(--c-r-table);;
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
