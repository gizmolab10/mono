<script lang='ts'>
	import { T_Layer } from '../../ts/types/Enumerations';
	import { k } from '../../ts/common/Constants';

	let {
		vertical = false,
		z_layer  = T_Layer.layout,
		kind     = 'content' as 'content' | 'banners' | 'main',
	}: {
		vertical? : boolean;
		z_layer?  : T_Layer;
		kind?     : 'content' | 'banners' | 'main';
	} = $props();

	const thickness = $derived(k.thickness.separator[kind]);
	const r = $derived(k.radius[kind]);
	const hw = $derived(r * 7 / 6);
	const bleed = k.layout.margin;
	const flare_down = $derived(`M ${-hw} 0 H ${hw} A ${r} ${r} 0 0 0 ${hw - r} ${r} H ${r - hw} A ${r} ${r} 0 0 0 ${-hw} 0 Z`);
	const flare_up   = $derived(`M ${-hw} 0 H ${hw} A ${r} ${r} 0 0 1 ${hw - r} ${-r} H ${r - hw} A ${r} ${r} 0 0 1 ${-hw} 0 Z`);

</script>

{#if vertical}
	<div
		class='separator vertical'
		style:z-index={z_layer}
		style:width='{thickness}px'>
		<svg
			viewBox='{-hw} 0 {hw * 2} {r}'
			width={hw * 2} height={r}
			style='position:absolute; left:calc(50% - {hw}px); top:0; pointer-events:none'>
			<path d={flare_down} fill='var(--accent)' />
		</svg>
		<svg
			viewBox='{-hw} {-r} {hw * 2} {r}'
			width={hw * 2} height={r}
			style='position:absolute; left:calc(50% - {hw}px); bottom:0; pointer-events:none'>
			<path d={flare_up} fill='var(--accent)' />
		</svg>
	</div>
{:else}
	<div
		class='separator horizontal'
		style:z-index={z_layer}
		style:height='{thickness}px'
		style:margin='0 -{bleed}px'
		style:width='calc(100% + {bleed * 2}px)'>
		<svg
			viewBox='0 {-hw} {r} {hw * 2}'
			width={r} height={hw * 2}
			style='position:absolute; left:0; top:calc(50% - {hw}px); pointer-events:none'>
			<path d={flare_down} transform='rotate(-90)' fill='var(--accent)' />
		</svg>
		<svg
			viewBox='{-r} {-hw} {r} {hw * 2}'
			width={r} height={hw * 2}
			style='position:absolute; right:0; top:calc(50% - {hw}px); pointer-events:none'>
			<path d={flare_up} transform='rotate(-90)' fill='var(--accent)' />
		</svg>
	</div>
{/if}

<style>
	.separator {
		background  : var(--accent);
		flex-shrink : 0;
		position    : relative;
		overflow    : visible;
	}

	.vertical {
		align-self : stretch;
	}
</style>
