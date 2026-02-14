<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import type { Writable } from 'svelte/store';
	import { tick } from 'svelte';
	const { w_accent_color } = colors;

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
		style:--banner={colors.banner}
		style:--accent={$w_accent_color}
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
		flex-direction : column;
		display        : flex;
	}

	.banner {
		color           : rgba(0, 0, 0, 1);
		text-transform  : lowercase;
		position        : relative;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		overflow        : hidden;
		margin          : 3px 0;
		letter-spacing  : 0.5px;
		display         : flex;
		height          : 22px;
		border-radius   : 11px;
		font-size       : 12px;
		border          : none;
		font-weight     : 300;
	}

	.banner::before {
		background : radial-gradient(ellipse at center, transparent 0%, var(--banner) 80%);
		position   : absolute;
		content    : '';
		inset      : 0;
		z-index    : 0;
	}

	.banner:global([data-hitting])::before {
		background : var(--bg);
		opacity    : 1;
	}

	.banner-title {
		position : relative;
		z-index  : 1;
	}

	.slot {
		padding       : 0.75rem 1rem 0.75rem;
		background    : var(--bg);
		margin        : 0px 0 0;
		border-radius : 11px;
	}

</style>
