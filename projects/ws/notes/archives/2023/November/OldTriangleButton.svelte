<script lang="ts">
	import { run } from 'svelte/legacy';

	import { k, noop, Size, Thing, ZIndex, Direction, dbDispatch, graphEditor, svgPath } from "../../ts/common/GlobalImports";
	import { dotSize } from '../../ts/managers/State';
	const path = svgPath.triangle(Size.square($dotSize), Direction.left);
	let fillColor = $state(k.backgroundColor);
	let button = $state(null);
	let { origin = new Point($dotSize, 20), here } = $props();
	
	function mouseOver(event) { updateColors(true); }
	function mouseout(event) { updateColors(false); }

	function handleClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.latestGrab(true);
		if (grab) {
			graphEditor.thing_redraw_remoteMoveRight(grab, false, false);
		}
	}

	function updateColors(isFilled) {
		fillColor = here.revealColor(isFilled);
	}

	run(() => { updateColors(false) });
</script>

<button class='svg-button'
	bind:this={button}
	onclick={handleClick}
	style='
		top: {origin.y - 6}px;
		left: {origin.x - 6}px;
	'>
	<svg width='20'
		height='20'
		onblur={() => { noop(); }}
		onfocus={() => { noop(); }}
		viewbox='0 0 20 20'
		onmouseout={mouseout}
		onmouseover={mouseOver}
		style='position: absolute; left: 5px; top: 6px; z-index: {ZIndex.dots};'>
		<path d={path} stroke={here.color} fill={fillColor}/>
	</svg>
</button>

<style>
	.svg-button {
		position: absolute;
		border: none;
		background: none;
		border-radius: 50%;
		display: inline-block; /* or block */
		width: 30px;	 /* Match SVG viewbox width */
		height: 30px;	/* Match SVG viewbox height */
		cursor: pointer;
		outline: none; /* Optional: Remove focus outline, but only if you provide another focus style */
	}

	.svg-button svg {
		display: block; /* This removes any unwanted space below the SVG */
	}

	.svg-button:hover {
			/* Styles for hover state, e.g., change SVG color */
	}

	.svg-button:active {
			/* Styles for active state */
	}

	.svg-button:focus {
			/* Styles for focus state, e.g., add an outline or change SVG color */
	}
</style>