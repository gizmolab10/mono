<script lang="ts">
	import { run } from 'svelte/legacy';

	import { k, Size, Point, Thing, debug, ZIndex, Signals, onMount } from "../../ts/common/GlobalImports";
	import { dot_size, add_parent, ids_grabbed, id_showingTools } from '../../ts/managers/State';
	import { svgPath, Direction, dbDispatch, graphEditor } from "../../ts/common/GlobalImports";
	import SVGD3 from '../svg/SVGD3.svelte';
	let { pulse = -0.2, thing } = $props();
	let tinyDotColor = $state(thing.color);
	let strokeColor = $state(thing.color);
	let fillColor = $state(thing.color);
	let isHovering = true;
	let isGrabbed = $state(false);
	let clickCount = 0;
	let button = $state(null);
	let extra = null;
	let clickTimer;
	let path = '';
    let scale = 1;
    let time = 0;
	let size = $state(0);
	let left = $state(0);
	let top = $state(0);
	
	function ignore(event) {}
	function handleMouseIn(event) { updateColorsForIsHovering(true); }
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleMouseOut(event) { updateColorsForIsHovering(false); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-
	
	onMount( () => {
		let interval;
		updateColorsForIsHovering(false);
        if (pulse != 0) {
            interval = setInterval(() => {
                time += 0.1;
                scale = 1 + Math.sin(time) * pulse;
				size = $dot_size * scale;
            }, 50);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
	});



	function updateColors() {
		thing.updateColorAttributes();	// needed for revealColor
		fillColor = debug.lines ? 'transparent' : thing.revealColor(isHovering);
		tinyDotColor = thing.revealColor(!isHovering);
		strokeColor = thing.color;
	}

	function updateColorsForIsHovering(flag) {
		if (isHovering != flag) {
			isHovering = flag;
			updateColors();
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	function handleLongClick(event) {
		clearClicks();
		clickTimer = setTimeout(() => {
			handleDoubleClick(event);
		}, k.longClickThreshold);
	}

	function handleDoubleClick(event) {
		clearClicks();
		thing.becomeHere();
    }

	function handleSingleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				handleClick(event);
				clearClicks();
			}
		}, k.doubleClickThreshold);
	}

	async function handleClick(event) {
		if (thing.isExemplar) { return; }
		if ($add_parent) {

		} else if (event.shiftKey || isGrabbed) {
			thing.toggleGrab();
		} else {
			thing.grabOnly();
		}
	}


	run(() => {
		const grabbed = $ids_grabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors();
		}
	});
	run(() => {
		if (thing != null) {
			updateColors();
		}
	});
	run(() => {
		if ($dot_size > 0) {
			top = $id_showingTools == thing.id ? 23 : -$dot_size / 2 + 2;
			left = 1.5 - ($dot_size / 2); // offset from center?
		}
	});
</script>

<style>
	.dot {
		border: none;
		cursor: pointer;
		background: none;
		position: absolute;
	}
</style>

<button class='dot'
	bind:this={button}
	onblur={ignore}
	onfocus={ignore}
	onkeyup={ignore}
	onkeydown={ignore}
	onkeypress={ignore}
	onmouseup={handleMouseUp}
	onclick={handleSingleClick}
	onmouseout={handleMouseOut}
	onmouseover={handleMouseIn}
	onmousedown={handleLongClick}
	ondblclick={handleDoubleClick}
	oncontextmenu={handleContextMenu}
	style='
		top: {top}px;
		left: {left}px;
		width: {$dot_size}px;
		height: {$dot_size}px;
	'>
	<SVGD3
		fill={fillColor}
		stroke={strokeColor}
		zIndex={ZIndex.dots}
		size={Size.square($dot_size)}
		path={svgPath.oval($dot_size, false)}
	/>
	{#if thing.parents.length > 1}
		<SVGD3
			fill={tinyDotColor}
			zIndex={ZIndex.dots}
			stroke={tinyDotColor}
			size={Size.square($dot_size)}
			path={svgPath.circle($dot_size, size / 5)}
		/>
	{/if}
</button>
