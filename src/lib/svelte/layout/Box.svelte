<script lang='ts'>
	import type { Snippet } from 'svelte';
	import Separator from './Separator.svelte';

	let {
		width,
		height,
		showTop      = true,
		showBottom   = true,
		showLeft     = true,
		showRight    = true,
		thickness    = 8,
		cornerRadius = 6,
		children
	} : {
		width         : number;
		height        : number;
		thickness?    : number;
		cornerRadius? : number;
		showTop?      : boolean;
		showBottom?   : boolean;
		showLeft?     : boolean;
		showRight?    : boolean;
		children?     : Snippet;
	} = $props();

	// Content area dimensions (inside separators)
	let contentWidth  = $derived(width - (showLeft ? thickness : 0) - (showRight ? thickness : 0));
	let contentHeight = $derived(height - (showTop ? thickness : 0) - (showBottom ? thickness : 0));
</script>

<div
	class        = 'box'
	style:width  = '{width}px'
	style:height = '{height}px'>
	{#if showTop}
		<div
			class = 'separator-top'>
			<Separator
				length       = {width}
				{thickness}
				{cornerRadius}
				isHorizontal = {true}
				hasGullWings = {false}
			/>
		</div>
	{/if}

	<div
		class = 'box-middle'>
		{#if showLeft}
			<div
				class = 'separator-left'>
				<Separator
					{thickness}
					{cornerRadius}
					hasGullWings = {true}
					hasBothWings = {true}
					isHorizontal = {false}
					length       = {height - (showTop ? thickness : 0) - (showBottom ? thickness : 0)}
				/>
			</div>
		{/if}

		<div
			class        = 'box-content'
			style:width  = '{contentWidth}px'
			style:height = '{contentHeight}px'>
			{#if children}
				{@render children()}
			{/if}
		</div>

		{#if showRight}
			<div
				class = 'separator-right'>
				<Separator
					{thickness}
					{cornerRadius}
					hasGullWings = {true}
					hasBothWings = {true}
					isHorizontal = {false}
					length       = {height - (showTop ? thickness : 0) - (showBottom ? thickness : 0)}
				/>
			</div>
		{/if}
	</div>

	{#if showBottom}
		<div
			class = 'separator-bottom'>
			<Separator
				length       = {width}
				{thickness}
				{cornerRadius}
				isHorizontal = {true}
				hasGullWings = {false}
			/>
		</div>
	{/if}
</div>

<style>
	.box {
		display        : flex;
		position       : relative;
		box-sizing     : border-box;
		flex-direction : column;
	}

	.box-middle {
		flex    : 1;
		display : flex;
	}

	.box-content {
		flex     : 1;
		overflow : hidden;
	}

	.separator-top,
	.separator-bottom {
		flex-shrink : 0;
		overflow    : visible;
	}

	.separator-left,
	.separator-right {
		flex-shrink : 0;
		overflow    : visible;
	}
</style>
