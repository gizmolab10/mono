<script lang='ts'>
	import { T_Hit_Target, T_Layer } from '../../ts/types/Enumerations';
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount } from 'svelte';

	let {
		title,
		onclick,
		end       = 0,
		length    = 0,
		margin    = 11,
		vertical  = false,
		kind      = 'content' as 'content' | 'banners' | 'main',
		z_layer   = T_Layer.layout,
	}: {
		title?     : string;
		end?       : number;
		length?    : number;
		margin?    : number;
		kind?      : 'content' | 'banners' | 'main';
		vertical?  : boolean;
		onclick?   : () => void;
		z_layer?   : T_Layer;
	} = $props();

	const css_var: Record<string, string> = {
		content: '--th-content-sep',
		banners: '--th-thin-sep',
		main:    '--th-sep',
	};

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
		style:--th='var({css_var[kind]})'
		style:--m='{margin}px'
		style:z-index={z_layer}
		class='separator vertical'
		class:clickable={!!onclick}
		style:--e='{margin + end}px'
		style:height={length ? `${length}px` : undefined}
		style:align-self={length ? undefined : 'stretch'}>
		<div class='flare left'></div>
		{#if title}<span class='title'>{title}</span>{/if}
		<div class='flare right'></div>
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
		<div class='flare top'></div>
		{#if title}<span class='title'>{title}</span>{/if}
		<div class='flare bottom'></div>
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
		top   : calc(-1 * var(--r));
		bottom: calc(-1 * var(--r));
		right : 0;
		left  : 0;
	}

	.vertical {
		margin : calc(-1 * var(--m)) 4px calc(-1 * var(--e));
		width  : var(--th);
	}

	.vertical::before {
		right : calc(-1 * var(--r));
		left  : calc(-1 * var(--r));
		bottom: 0;
		top   : 0;
	}

	.flare {
		z-index    : inherit;
		background : var(--bg);
		position   : absolute;
	}

	.flare.left   { right: 100%;  top: 0;  bottom: 0; width: var(--r); border-radius: 0 var(--r) var(--r) 0; }
	.flare.right  { left: 100%;   top: 0;  bottom: 0; width: var(--r); border-radius: var(--r) 0 0 var(--r); }
	.flare.top    { bottom: 100%; left: 0; right: 0; height: var(--r); border-radius: 0 0 var(--r) var(--r); }
	.flare.bottom { top: 100%;    left: 0; right: 0; height: var(--r); border-radius: var(--r) var(--r) 0 0; }

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
