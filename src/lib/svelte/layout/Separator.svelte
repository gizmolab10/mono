<script lang='ts'>
	import { k } from '../../ts/common/Constants';
	import { Point } from '../../ts/types/Coordinates';
	import { Direction } from '../../ts/types/Angle';
	import { colors } from '../../ts/draw/Colors';
	import Fillets from './Fillets.svelte';

	let {
		length,
		thickness      = k.thickness.separator.main,
		isHorizontal   = true,
		hasFillets       = true,
		hasDoubleFillet  = true,
		hasThinDivider = false,
		title          = null as string | null
	} : {
		length          : number;
		thickness?      : number;
		title?          : string | null;
		isHorizontal?    : boolean;
		hasFillets?      : boolean;
		hasDoubleFillet? : boolean;
		hasThinDivider? : boolean;
	} = $props();

	const { w_separator_color, w_background_color } = colors;

	// Fillet positions and directions
	let filletCenter1 = $derived(
		isHorizontal
			? new Point(0, thickness / 2)
			: new Point(thickness / 2, 0)
	);

	let filletCenter2 = $derived(
		isHorizontal
			? new Point(length, thickness / 2)
			: new Point(thickness / 2, length)
	);

	let filletDirection1 = $derived(isHorizontal ? Direction.right : Direction.down);
	let filletDirection2 = $derived(isHorizontal ? Direction.left : Direction.up);

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
	style:background-color = 'transparent'>
	{#if hasFillets}
		<Fillets
			center    = {filletCenter1}
			color     = {$w_separator_color}
			direction = {filletDirection1}
		/>
		{#if hasDoubleFillet}
			<Fillets
				center    = {filletCenter2}
				color     = {$w_separator_color}
				direction = {filletDirection2}
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
		overflow : visible;
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
