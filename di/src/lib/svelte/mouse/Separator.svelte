<script lang='ts'>
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { k } from '../../ts/common/Constants';
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
		thickness = k.thickness.separator.content,
	}: {
		title?     : string;
		end?       : number;
		length?    : number;
		margin?    : number;
		thickness? : number;
		vertical?  : boolean;
		onclick?   : () => void;
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
		class='separator vertical'
		class:clickable={!!onclick}
		style:width='{thickness}px'
		style:--e='{margin + end}px'
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
		class:clickable={!!onclick}
		style:--e='{margin + end}px'
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
		display    : block;
		overflow   : visible;
		position   : relative;
		background : var(--accent);
		z-index    : var(--z-layout);
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
	}

	.horizontal::before {
		top   : calc(-1 * var(--r));
		bottom: calc(-1 * var(--r));
		right : 0;
		left  : 0;
	}

	.vertical {
		margin     : calc(-1 * var(--m)) 4px calc(-1 * var(--e));
		align-self : stretch;
	}

	.vertical::before {
		right : calc(-1 * var(--r));
		left  : calc(-1 * var(--r));
		bottom: 0;
		top   : 0;
	}

	.flare {
		z-index    : var(--z-layout);
		background : var(--bg);
		position   : absolute;
	}

	.flare.left   { right: 100%;  top: 0;  bottom: 0; }
	.flare.right  { left: 100%;   top: 0;  bottom: 0; }
	.flare.top    { bottom: 100%; left: 0; right: 0; }
	.flare.bottom { top: 100%;    left: 0; right: 0; }

	.clickable {
		cursor : pointer;
	}

	.clickable:hover .title {
		opacity : 1;
	}

	.title {
		transform      : translate(-50%, -50%);
		font-size      : var(--h-font-small);
		z-index        : var(--z-layout);
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
