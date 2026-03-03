<script lang='ts'>
	import { stores } from '../../ts/managers';
	import { T_Parts_Tab } from '../../ts/types/Enumerations';

	const { w_selection, w_parts_tab } = stores;

	let selected_so = $derived($w_selection?.so ?? null);
</script>

{#if selected_so}
<div class='actions-row'>
	<div class='segmented'>
		<button class:active={$w_parts_tab === 'attributes'} onclick={() => w_parts_tab.set(T_Parts_Tab.attributes)}>attributes</button>
		<button class:active={$w_parts_tab === 'rotation'} onclick={() => w_parts_tab.set(T_Parts_Tab.rotation)}>angles</button>
		<button class:active={$w_parts_tab === 'repeater'} onclick={() => w_parts_tab.set(T_Parts_Tab.repeater)}>repeats</button>
	</div>
</div>
{/if}

<style>
	.actions-row {
		display       : flex;
		gap           : 6px;
		margin-top    : 0px;
		margin-bottom : 5px;
	}

	.segmented {
		display : flex;
		gap     : 0;
		margin  : 0 auto;
	}

	.segmented button {
		border        : 0.5px solid currentColor;
		background    : white;
		color         : inherit;
		font-size     : 11px;
		height        : 20px;
		padding       : 0 8px;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.segmented button:first-child {
		border-radius : 10px 0 0 10px;
	}

	.segmented button:last-child {
		border-radius : 0 10px 10px 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.segmented button:hover:not(.active) {
		background : var(--bg);
	}
</style>
