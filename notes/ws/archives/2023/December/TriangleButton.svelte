<script lang="ts">
	import { run } from 'svelte/legacy';

	import { k, Size, Thing, Point, ZIndex, Direction, dbDispatch, graphEditor, svgPath } from "../../ts/common/GlobalImports";
	import { dot_size, ids_grabbed } from '../../ts/managers/State';
	import SVGD3 from './SVGD3.svelte';
	let {
		fillColor_closure,
		strokeColor,
		direction,
		onClick,
		display,
		center,
		size,
		id
	} = $props();
	let path = $state(svgPath.triangle(Size.square(size), direction));
	let fillColor = $state(k.backgroundColor);
	let button = $state(null);

	function mouseOut(event) { setFillColor(false); }
	function mouseOver(event) { setFillColor(true); }
	function setFillColor(isFilled) { fillColor = fillColor_closure(isFilled); }
	
	run(() => {
		path = svgPath.triangle(Size.square(size), direction);
		setFillColor(false);
	});

	run(() => {
		const _ = $ids_grabbed;
		setFillColor(false);
	});

</script>

{#key display}
	<button id={id}
		bind:this={button}
		onclick={onClick}
		onmouseout={mouseOut}
		onmouseover={mouseOver}
		style='
			width: {size}px;
			height: {size}px;
			border: none;
			display: block;
			cursor: pointer;
			background: none;
			position: absolute;
			top: {center.y + 2 - (size / 2)}px;
			left: {center.x + 6 - (size / 2)}px;
		'>
		<SVGD3
			path={path}
			fill={fillColor}
			stroke={strokeColor}
			zIndex={ZIndex.dots}
			size={Size.square(size)}
		/>
	</button>
{/key}
