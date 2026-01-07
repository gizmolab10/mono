<script lang='ts'>
	import { Point } from '../../ts/types/Coordinates';
	import { Direction } from '../../ts/types/Angle';
	import { colors } from '../../ts/utilities/Colors';
	import Gull_Wings from './Gull_Wings.svelte';

	let {
		length,
		thickness      = 8,
		cornerRadius   = 6,
		isHorizontal   = true,
		hasGullWings   = true,
		hasBothWings   = true,
		hasThinDivider = false,
		title          = null as string | null
	} : {
		length          : number;
		thickness?      : number;
		cornerRadius?   : number;
		title?          : string | null;
		isHorizontal?   : boolean;
		hasGullWings?   : boolean;
		hasBothWings?   : boolean;
		hasThinDivider? : boolean;
	} = $props();

	const { w_separator_color, w_background_color } = colors;

	// Wing positions and directions
	let wingCenter1 = $derived(
		isHorizontal
			? new Point(0, thickness / 2)
			: new Point(thickness / 2, 0)
	);

	let wingCenter2 = $derived(
		isHorizontal
			? new Point(length, thickness / 2)
			: new Point(thickness / 2, length)
	);

	let wingDirection1 = $derived(isHorizontal ? Direction.right : Direction.down);
	let wingDirection2 = $derived(isHorizontal ? Direction.left : Direction.up);

	// Dimensions
	let separatorWidth  = $derived(isHorizontal ? length : thickness);
	let separatorHeight = $derived(isHorizontal ? thickness : length);
</script>

<div
	class                  = 'separator'
	class:horizontal       = {isHorizontal}
	class:vertical         = {!isHorizontal}
	style:width            = '{separatorWidth}px'
	style:height           = '{separatorHeight}px'
	style:background-color = {$w_separator_color}>
	{#if hasGullWings}
		<Gull_Wings
			{thickness}
			radius    = {cornerRadius}
			center    = {wingCenter1}
			color     = {$w_separator_color}
			direction = {wingDirection1}
		/>
		{#if hasBothWings}
			<Gull_Wings
				{thickness}
				radius    = {cornerRadius}
				center    = {wingCenter2}
				color     = {$w_separator_color}
				direction = {wingDirection2}
			/>
		{/if}
	{/if}
</div>

{#if hasThinDivider}
	<div
		class                  = 'thin-divider'
		class:horizontal       = {isHorizontal}
		class:vertical         = {!isHorizontal}
		style:background-color = {colors.thin_separator_line_color}></div>
{/if}

{#if title}
	<div
		class                  = 'separator-title'
		style:background-color = {$w_background_color}>
		{title}
	</div>
{/if}

<style>
	.separator {
		position : relative;
	}

	.thin-divider {
		position         : absolute;
		background-color : #999;
	}

	.thin-divider.horizontal {
		top       : 50%;
		left      : 8px;
		width     : calc(100% - 16px);
		height    : 0.5px;
		transform : translateY(-50%);
	}

	.thin-divider.vertical {
		top       : 6px;
		left      : 50%;
		width     : 0.5px;
		height    : calc(100% - 12px);
		transform : translateX(-50%);
	}

	.separator-title {
		top         : 50%;
		left        : 50%;
		padding     : 0 5px;
		position    : absolute;
		font-size   : 0.75rem;
		white-space : nowrap;
		transform   : translate(-50%, -50%);
	}
</style>
