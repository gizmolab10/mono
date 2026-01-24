<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { noop, Thing, onMount, ZIndex, signal, Signals, BrowserType, getBrowserType, dbDispatch } from '../../ts/common/GlobalImports';
	import { idsGrabbed, dotDiameter } from '../../ts/managers/State';
	interface Props {
		isReveal?: boolean;
		thing?: any;
		title?: string;
	}

	let { isReveal = false, thing = Thing, title = '' }: Props = $props();
	const doubleClickThreshold = 200;				// one fifth of a second
	const longClickThreshold = 500;
	const browserType = getBrowserType();
	const dotColor = thing.color;
	let buttonColor = $state(thing.color);
	let traitColor = $state(thing.color);
	let placement = $state('left: 5px; top: 4px;')			// tiny browser compensation
	let isGrabbed = $state(false);
	let clickCount = 0;
	let clickTimer;
	let dot = $state(null);

	onMount( () => { updateColorStyle(); });
	function handleMouseUp() { clearTimeout(clickTimer); }
	function handleContextMenu(event) { event.preventDefault(); } 		// Prevent the default context menu on right-
	function handleMouseOut(event) { dot.style.backgroundColor=buttonColor; }
	function handleMouseOver(event) { dot.style.backgroundColor=traitColor; }

	function updateColorStyle() {
		thing.updateColorAttributes();
		const buttonFlag = (isReveal && (!thing.isExpanded || isGrabbed));
		traitColor = thing.revealColor(!isReveal || isGrabbed);
		buttonColor = thing.revealColor(buttonFlag);
	}

	run(() => {
		const grabbed = $idsGrabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColorStyle();
		}
		
		if (browserType != BrowserType.chrome) {
			placement = 'top: 2px; left: 5px;'
		}
	});

	function handleLongClick(event) {
		clearTimeout(clickTimer); // Clear any previous timers
		clickCount = 0;
		clickTimer = setTimeout(() => {
		}, longClickThreshold);
	}

	function handleDoubleClick(event) {
		clearTimeout(clickTimer);
		clickCount = 0;
		if (!isReveal ) {
			thing.becomeHere();
		}
    }

	function handleSingleClick(event) {
		clickCount++;

		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				handleClick(event);
			}
			clickCount = 0;
		}, doubleClickThreshold);
	}

	function handleClick(event) {
		if (thing.isExemplar) { return; }
		if (isReveal) {
			if (thing.needsBulkFetch) {
				thing.redraw_fetchAll_runtimeBrowseRight(false);
			} else {
				thing.toggleExpand();
				signal(Signals.childrenOf);
			}
		} else if (event.shiftKey || isGrabbed) {
			thing.toggleGrab();
		} else {
			thing.grabOnly();
		}
	}

</script>

<button
	bind:this={dot}
	onblur={noop()}
	onfocus={noop()}
	onkeypress={noop()}
	onmouseup={handleMouseUp}
    onclick={handleSingleClick}
	onmouseout={handleMouseOut}
	onmouseover={handleMouseOver}
    onmousedown={handleLongClick}
    ondblclick={handleDoubleClick}
    oncontextmenu={handleContextMenu}
	style='{placement}
		width:{$dotDiameter}px;
		height:{$dotDiameter}px;
		z-index: {ZIndex.dots};
		background-color: {buttonColor};
		border-color: {dotColor};
		color: {traitColor};'>
</button>

<style lang='scss'>
	button {
		min-width: 1px;
		cursor: pointer;
		border: 1px solid;
		border-radius: 50%;
		position: relative;
	}
</style>
