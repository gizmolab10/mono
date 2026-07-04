<script lang='ts'>
	import { stores, selection, parts } from '../../ts/managers';
	import { T_Parts_Tab } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import Separator from '../mouse/Separator.svelte';
	import P_Attributes from './P_Attributes.svelte';
	import P_Angles from './P_Angles.svelte';
	import P_Repeat from './P_Repeat.svelte';
	import { engine } from '../../ts/render';

	const { w_tick, w_parts_tab, w_attribute_keys } = stores;
	const { w_selection } = selection;

	// Reactive: re-evaluate the cut-button visibility on every state tick and
	// on every selection change. The engine routine reads selection, scene
	// parent, repeater flags, descendant list, and stored axis lengths.
	let _can_cut_tick = $derived($w_tick + ($w_selection ? 1 : 0));
	function can_cut(_tick: number): boolean {
		return engine.can_cut_selected();
	}

</script>

{#if !$w_selection}
	<p>nothing is selected</p>
{:else}
	<div class='edit-title-row'>
		<input
			type      = 'text'
			class     = 'collapsed-name'
			value     = {$w_selection.so.name}
			onkeydown = {(e) => parts.name_keydown(e, $w_selection!.so)}
			oninput   = {(e) => parts.live_rename($w_selection!.so, (e.target as HTMLInputElement).value)}
			onblur    = {(e) => { const inp = e.target as HTMLInputElement; parts.commit_name($w_selection!.so, inp.value, inp); }}
		/>
	</div>
	{#if $w_selection.so.scene?.parent}
		<div class='duplicate-row'>
			{#if can_cut(_can_cut_tick)}
				<button class='action-button' use:hit_target={{ id: 'cut', onpress: () => engine.cut_selected_so() }}>divide in half</button>
			{/if}
			<button class='action-button' use:hit_target={{ id: 'duplicate', onpress: () => engine.duplicate_so() }}>duplicate</button>
		</div>
	{/if}
	<Separator />
	<div class='actions-row'>
		<div class='segmented'>
			<button class:active={$w_parts_tab === 'attributes'} onclick={() => w_parts_tab.set(T_Parts_Tab.attributes)}>attributes</button>
			<button class:active={$w_parts_tab === 'rotation'}   onclick={() => w_parts_tab.set(T_Parts_Tab.rotation)}>angles</button>
			<button class:active={$w_parts_tab === 'repeater'}   onclick={() => w_parts_tab.set(T_Parts_Tab.repeater)}>repeats</button>
		</div>
	</div>
	{#if $w_parts_tab === 'attributes'}
		<div class='keys-row'>
			<button class='keys-toggle' title='group attributes by start/length/end, or by axis' onclick={() => stores.toggle_attribute_keys()}>{$w_attribute_keys} ⟳</button>
		</div>
	{/if}
	<div class='tab-content'>
		{#if $w_parts_tab === 'attributes'}
			<P_Attributes />
		{:else if $w_parts_tab === 'rotation'}
			<P_Angles />
		{:else}
			<P_Repeat />
		{/if}
	</div>
{/if}

<style>

	p {
		font-size     : var(--font-small);
		margin        : -5px 0 -3px;
		text-align    : center;
		opacity       : 0.6;
	}

	.collapsed-name:focus {
		outline        : var(--focus-outline);
		background     : var(--white);
		outline-offset : -1.5px;
	}

	.collapsed-name {
		border        : 0.5px solid rgba(0, 0, 0, 0.6);
		font-size     : var(--font-small);
		border-radius : var(--r-table);
		z-index       : var(--z-action);
		height        : var(--h-cell);
		margin-bottom : var(--l-gap);
		background    : var(--white);
		box-sizing    : border-box;
		flex          : 1 1 auto;
		color         : inherit;
		font-family   : inherit;
		outline       : none;
		text-align    : left;
		width         : 100%;
		padding-left  : 6px;
	}

	.actions-row {
		gap           : var(--l-gap-tiny);
		display       : flex;
		margin-top    : 5px;
		margin-bottom : 1px;
	}

	.action-button {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-tiny);
		border-radius : var(--r-common);
		font-size     : var(--font-common);
		z-index       : var(--z-action);
		background    : var(--white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		padding       : 0 8px;
	}

	.action-button:hover {
		background : var(--hover);
	}

	.duplicate-row {
		gap             : var(--l-gap-tiny);
		margin-bottom   : var(--l-gap-tiny);
		justify-content : center;
		display         : flex;
	}

	.segmented {
		z-index : var(--z-action);
		margin  : 0 auto;
		display : flex;
	}

	.segmented button {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		font-size     : var(--font-common);
		background    : var(--white);
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 8px;
	}

	.segmented button:first-child {
		border-radius : var(--r-common) 0 0 var(--r-common);
	}

	.segmented button:last-child {
		border-radius : 0 var(--r-common) var(--r-common) 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		background  : var(--selected);
		font-weight : 600;
	}

	.segmented button:hover:not(.active) {
		background : var(--hover);
	}

	.keys-row {
		justify-content : center;
		display         : flex;
		margin-top      : var(--l-gap-tiny);
	}

	.keys-toggle {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-tiny);
		border-radius : var(--r-common);
		font-size     : var(--font-common);
		z-index       : var(--z-action);
		background    : var(--white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 10px;
		min-width     : 3em;
	}

	.keys-toggle:hover {
		background : var(--hover);
	}

	.tab-content {
		padding-top : var(--l-gap-tiny);
	}

</style>
