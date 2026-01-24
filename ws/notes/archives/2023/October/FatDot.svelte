<script lang='ts'>
	import { Thing, grabbedIDs, onDestroy, Signals, signal, handleSignalOfKind, Rounded, Direction, k } from '../common/GlobalImports';
	interface Props {
		isReveal?: boolean;
		thing?: any;
		size?: number;
		children?: import('svelte').Snippet;
	}

	let {
		isReveal = false,
		thing = Thing,
		size = 20,
		children
	}: Props = $props();
	const top = 4;
	const rounded = new Rounded(size, Direction.right);
	const path = rounded.path;
	let width = 20;
	let height = 20;
	const colors = '--dotColor: {thing.color}; --traitColor: {thing.revealColor(!isReveal)}; --buttonColor: {thing.revealColor( isReveal)};';

	onDestroy( () => { signalHandler.disconnect(); });

	const signalHandler = handleSignalOfKind(Signals.dots, (value) => {
		if (value == thing.id) {
			var style = document.getElementById(thing.id)?.style;
			style?.setProperty(	 '--dotColor', thing.color);
			style?.setProperty( '--traitColor', thing.revealColor(!isReveal));
			style?.setProperty('--buttonColor', thing.revealColor( isReveal));
		}
	})

	async function handleClick(event) {
		if (isReveal) {
			if (thing.hasChildren) {
				thing.redraw_runtimeBrowseRight(true);
			}
		} else if (event.shiftKey) {
			thing.toggleGrab();
		} else if ($grabbedIDs?.includes(thing.id)) {
			thing.redraw_runtimeBrowseRight(false);
		} else {
			thing.grabOnly();
		}
	}

</script>

{#key $grabbedIDs?.includes(thing.id)}
	{#if children}{@render children()}{:else}
		{#if isReveal}
			<svg width='{width}' height='{height}' viewBox='0 -8 {width} {height}'
				onclick={handleClick}>
				style={colors}>
				<path class="button-triangle" d={path} />
			</svg>
		{:else}
			<button id={thing.id}
				onclick={handleClick}
				style='width:{size}px; height:{size}px;
							 --dotColor: {thing.color};
						 --traitColor: {thing.revealColor(!isReveal)};
						--buttonColor: {thing.revealColor( isReveal)}'>
			</button>
		{/if}
	{/if}
{/key}

<style lang='scss'>
	button {
		top: 1px;
		border: 1px solid;
		border-radius: 50%;
	}
	button, .button-triangle {
		left: 3px;
		position: relative;
		cursor: pointer;
		color: var(--traitColor);
		border-color: var(--dotColor);
		background-color: var(--buttonColor);
		&:hover {
			color: var(--buttonColor);
			background-color: var(--traitColor);
		}
	}
</style>
