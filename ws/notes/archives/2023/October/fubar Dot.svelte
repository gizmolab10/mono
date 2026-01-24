<!-- @migration-task Error while migrating Svelte code: Block was left open
https://svelte.dev/e/block_unclosed -->
<script lang='ts'>
	import { noop, Thing, onMount, ZIndex, signal, Signals, BrowserType, getBrowserType, dbDispatch } from '../../ts/common/GlobalImports';
	import { idsGrabbed, dotDiameter } from '../../ts/managers/State';
	import TouchButton from './TouchButton.svelte';
	export let isReveal = false;
	export let thing = Thing;
	let placement = 'left: 5px; top: 4px;' // tiny browser compensation
	const browserType = getBrowserType();
	let buttonColor = thing.color;
	let traitColor = thing.color;
	const dotColor = thing.color;
	let isGrabbed = false;

	onMount( () => {
		updateColorStyle();
	});

	function updateColorStyle() {
		thing.updateColorAttributes();
		const buttonFlag = (isReveal && (!thing.isExpanded || isGrabbed));
		traitColor = thing.revealColor(!isReveal || isGrabbed);
		buttonColor = thing.revealColor(buttonFlag);
	}

	$: {
		const grabbed = $idsGrabbed?.includes(thing.id);
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColorStyle();
		}
		
		if (browserType != BrowserType.chrome) {
			placement = 'top: 2px; left: 5px;'
		}
	}

	function handleDoubleClick() {
		if (!isReveal) {
			thing.becomeHere();
		}
    }

	async function handleClick(event) {
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

<TouchButton
	class='touch'
	on:blur={noop()}
	on:focus={noop()}
	on:keypress={noop()}
	on:click={handleClick}
	on:mouseover={dot.style.backgroundColor=traitColor}
	on:mouseout={dot.style.backgroundColor=buttonColor}
	style='{placement}
		width:{$dotDiameter}px;
		height:{$dotDiameter}px;
		z-index: {ZIndex.dots};
		background-color: {buttonColor};
		border-color: {dotColor};
		color: {traitColor};'
>

<style lang='scss'>
	.touch {
		min-width: 1px;
		cursor: pointer;
		border: 1px solid;
		border-radius: 50%;
		position: relative;
	}
</style>
