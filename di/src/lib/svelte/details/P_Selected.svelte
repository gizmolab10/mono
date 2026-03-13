<script lang='ts'>
	import { T_Parts_Tab } from '../../ts/types/Enumerations';
	import P_Attributes from './P_Attributes.svelte';
	import { stores } from '../../ts/managers';
	import P_Angles from './P_Angles.svelte';
	import Separator from '../mouse/Separator.svelte';
	import P_Repeat from './P_Repeat.svelte';

	const { w_parts_tab } = stores;

</script>

<div style:height='6px'></div>
<div class='actions-row'>
	<div class='segmented'>
		<button class:active={$w_parts_tab === 'attributes'} onclick={() => w_parts_tab.set(T_Parts_Tab.attributes)}>attributes</button>
		<button class:active={$w_parts_tab === 'rotation'} onclick={() => w_parts_tab.set(T_Parts_Tab.rotation)}>angles</button>
		<button class:active={$w_parts_tab === 'repeater'} onclick={() => w_parts_tab.set(T_Parts_Tab.repeater)}>repeats</button>
	</div>
</div>
<Separator />
<div class='tab-content'>
	{#if $w_parts_tab === 'attributes'}
		<P_Attributes />
	{:else if $w_parts_tab === 'rotation'}
		<P_Angles />
	{:else}
		<P_Repeat />
	{/if}
</div>

<style>
	.actions-row {
		display       : flex;
		margin-top    : -4px;
		gap           : 6px;
		margin-bottom : 2px;
	}

	.segmented {
		z-index : var(--z-action);
		margin  : 0 auto;
		display : flex;
	}

	.segmented button {
		border        : var(--th-border) solid currentColor;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		background    : var(--c-white);
		padding       : 0 8px;
		font-size     : var(--h-font-common);
		height        : var(--h-button-segment);
	}

	.segmented button:first-child {
		border-radius : var(--corner-common) 0 0 var(--corner-common);
	}

	.segmented button:last-child {
		border-radius : 0 var(--corner-common) var(--corner-common) 0;
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

	.tab-content {
		padding-top    : var(--l-gap);
	}
</style>
