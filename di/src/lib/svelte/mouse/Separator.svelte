<script lang='ts'>
	import { T_Layer } from '../../ts/types/Enumerations';
	import { colors } from '../../ts/utilities/Colors';
	import { k } from '../../ts/common/Constants';

	let {
		vertical = false,
		spacer   = false,
		z_layer  = T_Layer.layout,
		kind     = 'content' as 'content' | 'main',
	}: {
		vertical? : boolean;
		spacer?   : boolean;
		z_layer?  : T_Layer;
		kind?     : 'content' | 'main';
	} = $props();


	const { w_accent_color } = colors;
	const r = $derived(k.radius[kind]);
	const fill = $derived($w_accent_color);
	const extra_length = $derived(k.layout.extra[kind]);
	const thickness = $derived(k.thickness.separator[kind]);
	const fillet_tr = $derived(`M ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 0 Z`);
	const fillet_tl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 1 0 ${r} L 0 0 Z`);
	const fillet_br = $derived(`M ${r} 0 A ${r} ${r} 0 0 1 0 ${-r} L 0 0 Z`);
	const fillet_bl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 0 0 ${-r} L 0 0 Z`);

</script>

{#if vertical}
	<div
		class='separator vertical'
		class:spacer
		style:z-index={z_layer}
		style:width={spacer ? undefined : `${thickness}px`}>
		<svg viewBox='{-r} 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:{-r}px; top:0; pointer-events:none'>
			<path d={fillet_tl} fill={fill} />
		</svg>
		<svg viewBox='0 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:100%; top:0; pointer-events:none'>
			<path d={fillet_tr} fill={fill} />
		</svg>
		<svg viewBox='{-r} {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:{-r}px; bottom:0; pointer-events:none'>
			<path d={fillet_bl} fill={fill} />
		</svg>
		<svg viewBox='0 {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:100%; bottom:0; pointer-events:none'>
			<path d={fillet_br} fill={fill} />
		</svg>
	</div>
{:else}
	<div
		style:z-index={z_layer}
		class='separator horizontal'
		style:height='{thickness}px'
		style:margin='0 -{extra_length}px'
		style:width='calc(100% + {extra_length * 2}px)'>
		<svg viewBox='0 {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:0; top:{-r}px; pointer-events:none'>
			<path d={fillet_br} fill={fill} />
		</svg>
		<svg viewBox='0 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:0; bottom:{-r}px; pointer-events:none'>
			<path d={fillet_tr} fill={fill} />
		</svg>
		<svg viewBox='{-r} {-r} {r} {r}' width={r} height={r}
			style='position:absolute; right:0; top:{-r}px; pointer-events:none'>
			<path d={fillet_bl} fill={fill} />
		</svg>
		<svg viewBox='{-r} 0 {r} {r}' width={r} height={r}
			style='position:absolute; right:0; bottom:{-r}px; pointer-events:none'>
			<path d={fillet_tl} fill={fill} />
		</svg>
	</div>
{/if}

<style>
	.separator {
		flex-shrink : 0;
		overflow    : visible;
		position    : relative;
		background  : var(--accent);
	}

	.vertical {
		align-self : stretch;
	}

	.vertical.spacer {
		min-width : 0;
		flex      : 1 1 0px;
	}

	.vertical.spacer:first-child {
		margin-left  : calc(-1 * var(--l-padding));
		padding-left : var(--l-padding);
	}

	.vertical.spacer:last-child {
		margin-right  : calc(-1 * var(--l-padding));
		padding-right : var(--l-padding);
	}
</style>
