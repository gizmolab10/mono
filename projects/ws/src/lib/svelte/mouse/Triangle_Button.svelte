<script lang='ts'>
	import { k, x, hits, elements, svgPaths, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { S_Mouse, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import Button from './Button.svelte';
	export let mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
	export let handle_s_mouse: (result: S_Mouse) => boolean;
	export let hover_closure: (flag: boolean) => boolean;
	export let extraPath = null;
	export let name = k.empty;
	export let strokeColor;
	export let center;
	export let angle;
	export let size;
	const { w_s_hover } = hits;
	const { w_items: w_grabbed } = x.si_grabs;
	const s_triangle = elements.s_element_for(new Identifiable(name), T_Hit_Target.button, name);
	let trianglePath = svgPaths.fat_polygon(size, angle);
	s_triangle.color_background = 'transparent';
	let extraColor = 'white';
	let fillColor = 'white';

	$: $w_grabbed, setFillColor(false);
	
	$: {
		trianglePath = svgPaths.fat_polygon(size, angle);
		setFillColor(false);
	}

	$: {
		const isHovering = $w_s_hover?.id === s_triangle.id;
		setFillColor(isHovering);
	}

	function setFillColor(isFilled) {
		if (!!hover_closure) {
			[fillColor, extraColor] = hover_closure(isFilled);
		}
	}

</script>

<Button
	mouse_detection={mouse_detection}
	handle_s_mouse={handle_s_mouse}
	s_button={s_triangle}
	border_thickness=0
	center={center}
	height={size}
	width={size}
	name={name}>
	<SVG_D3 name='triangle'
		svgPath={trianglePath}
		stroke={strokeColor}
		fill={fillColor}
		height={size}
		width={size}
	/>
	{#if extraPath}
		<SVG_D3 name='triangleInside'
			svgPath={extraPath}
			stroke={extraColor}
			fill={extraColor}
			height={size}
			width={size}
		/>
	{/if}
	<slot/>
</Button>
