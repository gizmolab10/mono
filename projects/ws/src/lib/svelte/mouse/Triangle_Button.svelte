<script lang='ts'>
	import { k, x, hits, Point, elements, svgPaths, T_Mouse_Detection } from '../../ts/common/Global_Imports';
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

	// Point-in-triangle test for hover confined to SVG shape
	function triangle_contains_point(point: Point | null): boolean {
		if (!point) return false;
		const rect = s_triangle.rect;
		if (!rect) return false;
		// Screen center of the triangle
		const screenCenter = new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);
		// Get triangle vertices (simplified - using outer radius)
		const outer = size / 2;
		const vertices: Point[] = [];
		for (let i = 0; i < 3; i++) {
			const vertexAngle = angle + i * (Math.PI * 2 / 3);
			vertices.push(new Point(
				screenCenter.x + outer * Math.cos(vertexAngle),
				screenCenter.y + outer * Math.sin(vertexAngle)
			));
		}
		// Barycentric coordinate method
		const [p0, p1, p2] = vertices;
		const dX = point.x - p2.x;
		const dY = point.y - p2.y;
		const dX21 = p2.x - p1.x;
		const dY12 = p1.y - p2.y;
		const D = dY12 * (p0.x - p2.x) + dX21 * (p0.y - p2.y);
		const s = dY12 * dX + dX21 * dY;
		const t = (p2.y - p0.y) * dX + (p0.x - p2.x) * dY;
		if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
		return s >= 0 && t >= 0 && s + t <= D;
	}

	s_triangle.contains_point = triangle_contains_point;

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
