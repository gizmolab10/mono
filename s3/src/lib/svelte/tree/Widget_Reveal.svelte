<script lang='ts'>
	import type { Ancestry } from '../../nav/Ancestry';
	import { svgPaths }      from '../../geometry/SVG_Paths';
	import { ux }            from '../../state/ux.svelte';
	import { colors }        from '../../colors/Colors.svelte';
	import { Point }         from '../../types/Coordinates';
	import Angle             from '../../types/Angle';

	let { ancestry, left, top }: {
		ancestry: Ancestry;
		left    : number;
		top     : number;
	} = $props();

	const thing_color = $derived(ancestry.thing?.color ?? colors.thing);
	const isExpanded  = $derived(ancestry.isExpanded);
	const hidden      = $derived(ancestry.hidden_by_depth_limit);

	function handle_click(event: MouseEvent) {
		event.stopPropagation();
		if (hidden) {
			ux.becomeFocus(ancestry);
		} else {
			ux.toggle_expansion(ancestry);
			ux.ungrab_invisible_grabs();
		}
	}

	const size         = 14;
	const chevron_right = svgPaths.fat_polygon(size, Angle.angle_from_name('>') ?? Math.PI);
	const chevron_left  = svgPaths.fat_polygon(size, Angle.angle_from_name('<') ?? 0);
	const circle_path   = svgPaths.circle(new Point(size / 2, size / 2), 4);
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
			<path d={circle_path} fill={thing_color} stroke='none' />
		{:else}
			<path
				d      = {isExpanded ? chevron_left : chevron_right}
				fill   = 'white'
				stroke = {thing_color} />
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
