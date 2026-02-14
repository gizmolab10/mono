<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import type { Writable } from 'svelte/store';
	import { tick } from 'svelte';

	let {
		title,
		id,
		visible,
		children
	} : {
		title    : string;
		id       : string;
		visible  : Writable<boolean>;
		children : import('svelte').Snippet;
	} = $props();

	const { w_accent_color } = colors;

	async function toggle() {
		visible.update(v => !v);
		await tick();
		hits.recalibrate();
	}
</script>

<div class='hideable'>
	<button
		class='banner'
		class:open={$visible}
		style:--accent={$w_accent_color}
		style:--banner={colors.banner}
		use:hit_target={{ id: `hideable-${id}`, onpress: toggle }}>
		<span class='banner-title'>{title}</span>
	</button>
	{#if $visible}
		<div class='slot'>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.hideable {
		display        : flex;
		flex-direction : column;
	}

	.banner {
		position        : relative;
		display         : flex;
		align-items     : center;
		justify-content : center;
		height          : 22px;
		margin          : 2px -0.75rem;
		border          : none;
		border-radius   : 6px;
		cursor          : pointer;
		overflow        : hidden;
		padding         : 0;
		color           : rgba(0, 0, 0, 0.5);
		font-size       : 10px;
		font-weight     : 500;
		letter-spacing  : 0.5px;
		text-transform  : lowercase;
	}

	.banner::before {
		content    : '';
		position   : absolute;
		inset      : 0;
		background : radial-gradient(ellipse at center, transparent 0%, var(--banner) 100%);
		z-index    : 0;
	}

	.banner.open::before {
		background : radial-gradient(ellipse at center, transparent 0%, var(--accent) 100%);
		opacity    : 0.4;
	}

	.banner:global([data-hitting])::before {
		background : var(--accent);
		opacity    : 0.5;
	}

	.banner-title {
		position : relative;
		z-index  : 1;
	}

	.slot {
		padding : 0.75rem 0 0 0;
	}
</style>
