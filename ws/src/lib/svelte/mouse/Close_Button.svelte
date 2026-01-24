<script lang='ts'>
	import { hits, colors, svgPaths, elements } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, T_Hit_Target, S_Mouse } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let align_left: boolean = false;
	export let stroke_width: number = 0.75;
    export let name = 'generic close';
	export let closure: () => void;
	export let origin: Point;
    export let size = 20;
	const { w_s_hover } = hits;
	let element: HTMLElement | null = null;
	
	// Create s_element reactively so it uses the actual name prop value
	$: s_element = elements.s_element_for(new Identifiable(name), T_Hit_Target.button, name);
	let stroke = colors.default;
	let fill = 'white';

	$: {
		const _ = $w_s_hover;
		const isHovering = $w_s_hover?.id === s_element.id;
		stroke = isHovering ? 'white' : colors.default;
		fill = isHovering ? 'gray' : 'white';
	}

	onMount(() => {
		return () => {
			s_element.handle_s_mouse = undefined;
			hits.delete_hit_target(s_element);
		};
	});

	// Update handler whenever element, closure, or s_element changes (handles re-renders and cached reuse)
	$: if (!!element && !!closure && !!s_element) {
		s_element.set_html_element(element);
		// Always set handler (s_element may be cached/reused from previous component instance)
		s_element.handle_s_mouse = (s_mouse: S_Mouse) => {
			if (s_mouse.isDown) closure();
			return true;
		};
	}

	$: style = `
		cursor: pointer;
		user-select: none;
		width: ${size}px;
		height: ${size}px;
		position: absolute;
		top: ${origin.y}px;
		z-index: ${T_Layer.dot};
		${align_left ? 'left' : 'right'}: ${origin.x}px;
	`.removeWhiteSpace();

</script>

<div class='close-button'
	bind:this={element}
	style={style}>
    <SVG_D3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke={colors.default}
		stroke_width={stroke_width}
		svgPath={svgPaths.circle_atOffset(size, size - 2)}
	/>
    <SVG_D3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		stroke_width={1}
		svgPath={svgPaths.x_cross(size, size / 6)}
	/>
</div>
