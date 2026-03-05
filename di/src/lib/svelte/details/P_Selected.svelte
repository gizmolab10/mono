<script lang='ts'>
	import { T_Parts_Tab } from '../../ts/types/Enumerations';
	import { stores } from '../../ts/managers';

	const { w_selection, w_parts_tab } = stores;

	let selected_so = $derived($w_selection?.so ?? null);

</script>

{#if selected_so}
	<div style:height='6px'/>
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
		border        : 0.5px solid currentColor;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		background    : white;
		padding       : 0 8px;
		font-size     : 11px;
		height        : 16px;
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
