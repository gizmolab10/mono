<script lang='ts'>
	import type { Ancestry } from '../../nav/Ancestry';
	import { ux }            from '../../state/ux.svelte';
	import { colors }        from '../../colors/Colors.svelte';

	let { ancestry, left, top }: {
		ancestry: Ancestry;
		left    : number;
		top     : number;
	} = $props();

	const isExpanded = $derived(ancestry.isExpanded);
	const hidden     = $derived(ancestry.hidden_by_depth_limit);

	function handle_click(event: MouseEvent) {
		event.stopPropagation();
		if (hidden) {
			ux.becomeFocus(ancestry);
		} else {
			ux.toggle_expansion(ancestry);
			ux.ungrab_invisible_grabs();
		}
	}

	const size    = 14;
	const half    = size / 2;
	const chevron_right = `M ${half - 3} ${half - 4} L ${half + 3} ${half} L ${half - 3} ${half + 4}`;
	const chevron_left  = `M ${half + 3} ${half - 4} L ${half - 3} ${half} L ${half + 3} ${half + 4}`;
	const circle_path   = `M ${half} ${half - 4} A 4 4 0 1 1 ${half} ${half + 4} A 4 4 0 1 1 ${half} ${half - 4}`;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class  = 'reveal'
	style:left   = '{left}px'
	style:top    = '{top}px'
	style:width  = '{size}px'
	style:height = '{size}px'
	onclick={handle_click}>
	<svg
		width  = {size}
		height = {size}
		viewBox = '0 0 {size} {size}'>
		{#if hidden}
			<path d={circle_path} fill={colors.thing} stroke='none' />
		{:else}
			<path
				d            = {isExpanded ? chevron_left : chevron_right}
				fill         = 'none'
				stroke       = {colors.thing}
				stroke-width = '1.5' />
		{/if}
	</svg>
</div>

<style>
	.reveal {
		position : absolute;
		cursor   : pointer;
		z-index  : 1;
	}
</style>
