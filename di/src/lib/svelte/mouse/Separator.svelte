<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Layer } from '../../ts/types/Enumerations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';

	let {
		title,
		onclick,
		end       = 0,
		length    = 0,
		margin    = 11,
		vertical  = false,
		z_layer   = T_Layer.layout,
		kind      = 'content' as 'content' | 'banners' | 'main',
	}: {
		title?     : string;
		end?       : number;
		length?    : number;
		margin?    : number;
		vertical?  : boolean;
		z_layer?   : T_Layer;
		onclick?   : () => void;
		kind?      : 'content' | 'banners' | 'main';
	} = $props();

	const css_var: Record<string, string> = {
		content: '--th-content-sep',
		banners: '--th-thin-sep',
		main:    '--th-sep',
	};

	const r = k.thickness.separator[kind] * 3;
	const w = r * 7 / 3;
	const uid = Math.random().toString(36).slice(2, 8);
</script>

{#if vertical}
	<button
		style:--m='{margin}px'
		style:z-index={z_layer}
		class='separator vertical'
		class:clickable={!!onclick}
		style:--e='{margin + end}px'
		style:--th='var({css_var[kind]})'
		use:hit_target={{ id: `sep-${uid}`, onrelease: onclick }}
		style:align-self={length ? undefined : 'stretch'}
		style:height={length ? `${length + 1}px` : undefined}>
		<svg
			style='position:absolute; left:calc(50% - {w/2}px); top:0.9; overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} fill='var(--accent)' />
		</svg>
		{#if title}<span class='title'>{title}</span>{/if}
		<svg
			style='position:absolute; left:calc(50% - {w/2}px); bottom:0.5; overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} transform='rotate(180 {w/2} {r/2})' fill='var(--accent)' />
		</svg>
	</button>
{:else}
	<button
		style:--m='{margin}px'
		style:z-index={z_layer}
		class:clickable={!!onclick}
		style:--e='{margin + end}px'
		class='separator horizontal'
		style:--th='var({css_var[kind]})'
		use:hit_target={{ id: `sep-${uid}`, onrelease: onclick }}>
		<svg
			style='position:absolute; left:{-w/4 -1}px; top:calc(50% - {r/2}px); overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} transform='rotate(-90 {w/2} {r/2})' fill='var(--accent)' />
		</svg>
		{#if title}<span class='title'>{title}</span>{/if}
		<svg
			style='position:absolute; right:{-w/4 + 6}px; top:calc(50% - {r/2}px); overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} transform='rotate(90 {w/2} {r/2})' fill='var(--accent)' />
		</svg>
	</button>
{/if}

<style>

	.separator {
		all        : unset;
		--r        : calc(var(--th) * 3.2);
		background : var(--accent);
		position   : relative;
		overflow   : visible;
		display    : block;
	}

	/* Accent backdrop extending behind the flares */
	.separator::before {
		position   : absolute;
		background : inherit;
		content    : '';
	}

	.horizontal {
		margin : 4px calc(-1 * var(--e)) 4px calc(-1 * var(--m));
		width  : calc(100% + var(--m) + var(--e));
		height : var(--th);
	}

	.horizontal::before {
		left  : calc(-1 * var(--r));
		right : calc(-1 * var(--r));
		top   : 0;
		bottom: 0;
	}

	.vertical {
		margin : calc(-1 * var(--m)) 4px calc(-1 * var(--e));
		width  : var(--th);
	}

	.vertical::before {
		top   : 0;
		bottom: 0;
		left  : 0;
		right : 0;
	}

	.clickable {
		cursor : pointer;
	}

	.clickable:hover .title {
		opacity : 1;
	}

	.title {
		letter-spacing : var(--l-letter-spacing);
		transform      : translate(-50%, -50%);
		font-size      : var(--h-font-small);
		position       : absolute;
		z-index        : inherit;
		text-align     : center;
		white-space    : nowrap;
		padding        : 0 4px;
		opacity        : 0.6;
		top            : 50%;
		left           : 50%;
	}
</style>
