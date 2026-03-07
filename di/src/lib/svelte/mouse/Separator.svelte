<script lang='ts'>
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount } from 'svelte';

	let {
		title,
		onclick,
		end       = 0,
		length    = 0,
		margin    = 8,
		thickness = 2,
		vertical  = false,
	}: {
		title?     : string;
		onclick?   : () => void;
		end?       : number;
		length?    : number;
		margin?    : number;
		thickness? : number;
		vertical?  : boolean;
	} = $props();

	let radius = $derived(thickness * 3.2);
	let rpx    = $derived(`${radius}px`);

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
		style:--r='{radius}px'
		style:--m='{margin}px'
		style:--e='{margin + end}px'
		class='separator vertical'
		style:width='{thickness}px'
		class:clickable={!!onclick}
		style:height={length ? `${length}px` : undefined}>
		<div class='flare left' style:width={rpx} style:border-radius='0 {rpx} {rpx} 0'></div>
		{#if title}<span class='title'>{title}</span>{/if}
		<div class='flare right' style:width={rpx} style:border-radius='{rpx} 0 0 {rpx}'></div>
	</button>
{:else}
	<button
		bind:this={element}
		style:--r='{radius}px'
		style:--m='{margin}px'
		style:--e='{margin + end}px'
		class:clickable={!!onclick}
		class='separator horizontal'
		style:height='{thickness}px'>
		<div class='flare top' style:height={rpx} style:border-radius='0 0 {rpx} {rpx}'></div>
		{#if title}<span class='title'>{title}</span>{/if}
		<div class='flare bottom' style:height={rpx} style:border-radius='{rpx} {rpx} 0 0'></div>
	</button>
{/if}

<style>
	.separator {
		all        : unset;
		overflow   : visible;
		position   : relative;
		background : var(--accent);
		z-index    : var(--z-layout);
	}

	/* Accent backdrop extending behind the flares */
	.separator::before {
		content    : '';
		background : inherit;
		position   : absolute;
	}

	.horizontal {
		width  : calc(100% + var(--m) + var(--e));
		margin : 4px calc(-1 * var(--e)) 4px calc(-1 * var(--m));
	}

	.horizontal::before {
		left  : 0;
		right : 0;
		top   : calc(-1 * var(--r));
		bottom: calc(-1 * var(--r));
	}

	.vertical {
		margin     : calc(-1 * var(--m)) 4px calc(-1 * var(--e));
		align-self : stretch;
	}

	.vertical::before {
		top   : 0;
		bottom: 0;
		left  : calc(-1 * var(--r));
		right : calc(-1 * var(--r));
	}

	.flare {
		position   : absolute;
		background : var(--bg);
		z-index    : var(--z-layout);
	}

	.flare.top    { bottom: 100%; left: 0; right: 0; }
	.flare.bottom { top: 100%;    left: 0; right: 0; }
	.flare.left   { right: 100%;  top: 0;  bottom: 0; }
	.flare.right  { left: 100%;   top: 0;  bottom: 0; }

	.clickable {
		cursor : pointer;
	}

	.clickable:hover .title {
		opacity : 1;
	}

	.title {
		top            : 50%;
		left           : 50%;
		opacity        : 0.6;
		font-size      : 10px;
		padding        : 0 4px;
		letter-spacing : 0.5px;
		text-align     : center;
		white-space    : nowrap;
		position       : absolute;
		z-index        : var(--z-layout);
		transform      : translate(-50%, -50%);
	}
</style>
