<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, s, u, Rect, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/Global_Imports';
	import { s_thing_changed, s_ancestry_focus, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { Svelte_Wrapper, Clusters_Geometry, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_mouse_location, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	interface Props {
		radius?: number;
		ring_width?: number;
		name?: any;
		color?: any;
		center?: any;
		cursor_closure?: any;
	}

	let {
		radius = 0,
		ring_width = 0,
		name = k.empty,
		color = k.empty,
		center = Point.zero,
		cursor_closure = () => {}
	}: Props = $props();
	const outer_radius = radius + ring_width;
	const geometry = s.clusters_geometry;
	let pagingWrapper!: Svelte_Wrapper = $state();
	let rebuilds = $state(0)
	let pagingRing = $state();



	function closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouse_state.isHover) {
			s.paging_ring_state.isHovering = !mouse_state.isOut;	// show thumb

			// hover

			rebuilds += 1;
			cursor_closure();
		} else if (mouse_state.isDown) {
			const angle = s.paging_ring_state.basis_angle.degrees_of(0);
			console.log(`${angle}`);
		}
	}
 
	function isHit(): boolean {
		const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(0, outer_radius)) {
			return true;
		}
		return false;
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		const hit = isHit();
		if (hit) {
			closure(mouse_state);
		}
		return hit;
	}

	// draw the paging ring, cluster labels and scroll bars

	run(() => {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	});
	run(() => {
		if (!!pagingRing) {
			pagingWrapper = new Svelte_Wrapper(pagingRing, handle_mouse_state, -1, SvelteComponentType.paging);
		}
	});
</script>

{#key rebuilds}
	<div class='paging-ring' bind:this={pagingRing} style='z-index:{ZIndex.paging};'>
		{#each geometry.cluster_maps as cluster_map}
			{#if !!cluster_map && (cluster_map.shown > 0)}
				<Paging_Arc
					color={color}
					center={center}
					cluster_map={cluster_map}/>
			{/if}
		{/each}
	</div>
{/key}
