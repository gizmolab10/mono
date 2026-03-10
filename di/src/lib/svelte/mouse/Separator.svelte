<script lang='ts'>
	import { T_Hit_Target, T_Layer } from '../../ts/types/Enumerations';
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { hits } from '../../ts/managers/Hits';
	import { k } from '../../ts/common/Constants';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount } from 'svelte';

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

	const r = k.thickness.separator[kind] * 3.2;
	const w = r * 7 / 3;

	// ── Hits system ──

	let element: HTMLElement | null = $state(null);
	const uid = Math.random().toString(36).slice(2, 8);
	const target = new S_Hit_Target(T_Hit_Target.control, `sep-${uid}`);

	$effect(() => {
		if (element && onclick) {
			target.set_html_element(element);
			target.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isUp) onclick();
				return true;
			};
		}
	});

	onMount(() => {
		return () => hits.delete_hit_target(target);
	});
</script>

{#if vertical}
	<button
		bind:this={element}
		style:--m='{margin}px'
		style:z-index={z_layer}
		class='separator vertical'
		class:clickable={!!onclick}
		style:--e='{margin + end}px'
		style:--th='var({css_var[kind]})'
		style:align-self={length ? undefined : 'stretch'}
		style:height={length ? `${length + 1}px` : undefined}>
		<svg
			style='position:absolute; left:calc(50% - {w/2}px); top:0; overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} fill='var(--accent)' />
		</svg>
		{#if title}<span class='title'>{title}</span>{/if}
		<svg
			style='position:absolute; left:calc(50% - {w/2}px); bottom:0; overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} transform='rotate(180 {w/2} {r/2})' fill='var(--accent)' />
		</svg>
	</button>
{:else}
	<button
		bind:this={element}
		style:--th='var({css_var[kind]})'
		style:--m='{margin}px'
		style:z-index={z_layer}
		class:clickable={!!onclick}
		style:--e='{margin + end}px'
		class='separator horizontal'>
		<svg
			style='position:absolute; left:{-w/4 - 1}px; top:calc(50% - {r/2}px); overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} transform='rotate(-90 {w/2} {r/2})' fill='var(--accent)' />
		</svg>
		{#if title}<span class='title'>{title}</span>{/if}
		<svg
			style='position:absolute; right:{-w/4 - 1}px; top:calc(50% - {r/2}px); overflow:visible; pointer-events:none'
			width={w} height={r}>
			<path d={svg_paths.flares(r)} transform='rotate(90 {w/2} {r/2})' fill='var(--accent)' />
		</svg>
	</button>
{/if}

<style>
	.separator {
		--r        : calc(var(--th) * 3.2);
		all        : unset;
		display    : block;
		overflow   : visible;
		position   : relative;
		background : var(--accent);
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
		transform      : translate(-50%, -50%);
		font-size      : var(--h-font-small);
		z-index        : inherit;
		position       : absolute;
		text-align     : center;
		white-space    : nowrap;
		letter-spacing : 0.5px;
		padding        : 0 4px;
		opacity        : 0.6;
		top            : 50%;
		left           : 50%;
	}
</style>
