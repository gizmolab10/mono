<script lang='ts'>
	import { k } from '../../ts/common/Constants';
	import type { Snippet } from 'svelte';
	import Separator from './Separator.svelte';

	let {
		width,
		height,
		showTop    = true,
		showBottom = true,
		showLeft   = true,
		showRight  = true,
		thickness  = k.thickness.separator.main,
		children
	} : {
		width       : number;
		height      : number;
		thickness?  : number;
		showTop?    : boolean;
		showBottom? : boolean;
		showLeft?   : boolean;
		showRight?  : boolean;
		children?   : Snippet;
	} = $props();

	// Content area dimensions (inside separators)
	let contentWidth  = $derived(width - (showLeft ? thickness : 0) - (showRight ? thickness : 0));
	let contentHeight = $derived(height - (showTop ? thickness : 0) - (showBottom ? thickness : 0));

	// Vertical separator positioning: fillets should align with horizontal separator centers
	let verticalTop    = $derived(showTop ? thickness / 2 : 0);
	let verticalLength = $derived(height - (showTop ? thickness / 2 : 0) - (showBottom ? thickness / 2 : 0));
</script>

<div
	class        = 'box'
	style:width  = '{width}px'
	style:height = '{height}px'>

	<!-- Horizontal separators (no fillets) -->
	{#if showTop}
		<div
			class      = 'separator-top'
			style:top  = '0'
			style:left = '0'>
			<Separator
				{thickness}
				length       = {width}
				isHorizontal = {true}
				hasFillets   = {false}
			/>
		</div>
	{/if}

	{#if showBottom}
		<div
			class      = 'separator-bottom'
			style:top  = '{height - thickness}px'
			style:left = '0'>
			<Separator
				{thickness}
				length       = {width}
				isHorizontal = {true}
				hasFillets   = {false}
			/>
		</div>
	{/if}

	<!-- Vertical separators (with fillets) -->
	{#if showLeft}
		<div
			class      = 'separator-left'
			style:top  = '{verticalTop}px'
			style:left = '0'>
			<Separator
				{thickness}
				length          = {verticalLength}
				isHorizontal    = {false}
				hasFillets      = {true}
				hasDoubleFillet = {true}
			/>
		</div>
	{/if}

	{#if showRight}
		<div
			class      = 'separator-right'
			style:top  = '{verticalTop}px'
			style:left = '{width - thickness}px'>
			<Separator
				{thickness}
				length          = {verticalLength}
				isHorizontal    = {false}
				hasFillets      = {true}
				hasDoubleFillet = {true}
			/>
		</div>
	{/if}

	<!-- Content area -->
	<div
		class        = 'box-content'
		style:top    = '{showTop ? thickness : 0}px'
		style:left   = '{showLeft ? thickness : 0}px'
		style:width  = '{contentWidth}px'
		style:height = '{contentHeight}px'>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.box {
		position   : relative;
		box-sizing : border-box;
	}

	.separator-top,
	.separator-bottom,
	.separator-left,
	.separator-right {
		position : absolute;
		overflow : visible;
	}

	.box-content {
		position : absolute;
		overflow : hidden;
	}
</style>
