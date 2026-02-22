<script lang='ts'>
	import { onMount, onDestroy }  from 'svelte';
	import type { Ancestry }       from '../../nav/Ancestry';
	import { T_Hit_Target }        from '../../common/Enumerations';
	import { S_Hit_Target }        from '../../state/S_Hit_Target';
	import { svgPaths }            from '../../geometry/SVG_Paths';
	import { colors }              from '../../colors/Colors.svelte';
	import { hits }                from '../../managers/Hits.svelte';
	import { ux }                  from '../../state/ux.svelte';
	import { Point }               from '../../types/Coordinates';
	import Angle                   from '../../types/Angle';

	let { ancestry, left, top }: {
		ancestry: Ancestry;
		left    : number;
		top     : number;
	} = $props();

	const thing_color = $derived(ancestry.thing?.color ?? colors.thing);
	const isExpanded  = $derived(ancestry.isExpanded);
	const hidden      = $derived(ancestry.hidden_by_depth_limit);
	const isHovering  = $derived(
		hits.hovering?.type === T_Hit_Target.reveal &&
		hits.hovering?.ancestry !== null &&
		ancestry.equals(hits.hovering?.ancestry)
	);

	let element: HTMLDivElement;
	let hit_target: S_Hit_Target;

	onMount(() => {
		hit_target = new S_Hit_Target(T_Hit_Target.reveal, ancestry);
		hit_target.handle_s_mouse = (s_mouse) => {
			if (s_mouse.isDown) {
				if (hidden) {
					ux.becomeFocus(ancestry);
				} else {
					ux.toggle_expansion(ancestry);
					ux.ungrab_invisible_grabs();
				}
			}
			return true;
		};
		hit_target.set_html_element(element);
		hits.add_hit_target(hit_target);
	});

	onDestroy(() => {
		if (hit_target) hits.delete_hit_target(hit_target);
	});

	const size         = 14;
	const chevron_right = svgPaths.fat_polygon(size, Angle.angle_from_name('>') ?? Math.PI);
	const chevron_left  = svgPaths.fat_polygon(size, Angle.angle_from_name('<') ?? 0);
	const circle_path   = svgPaths.circle(new Point(size / 2, size / 2), 4);
</script>

<div
	class  = 'reveal'
	bind:this    = {element}
	style:left   = '{left}px'
	style:top    = '{top}px'
	style:width  = '{size}px'
	style:height = '{size}px'>
	<svg
		width  = {size}
		height = {size}
		viewBox = '0 0 {size} {size}'>
		{#if hidden}
			<path d={circle_path} fill={isHovering ? 'white' : thing_color} stroke={isHovering ? thing_color : 'none'} />
		{:else}
			<path
				d      = {isExpanded ? chevron_left : chevron_right}
				fill   = {isHovering ? thing_color : 'white'}
				stroke = {isHovering ? 'white' : thing_color} />
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
