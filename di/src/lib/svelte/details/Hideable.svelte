<script lang='ts'>
	import { T_Details, T_Layer } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import { stores } from '../../ts/managers';
	import { tick } from 'svelte';
	const { w_t_details } = stores;
	const { w_accent_color } = colors;

	let {
		title,
		id,
		detail,
		children
	} : {
		title    : string;
		id       : string;
		detail   : T_Details;
		children : import('svelte').Snippet;
	} = $props();

	let is_visible = $derived(($w_t_details & detail) !== 0);

	async function toggle() {
		w_t_details.update(v => v ^ detail);
		await tick();
		hits.recalibrate();
	}
</script>

<div class='hideable'
	style:--z-common={T_Layer.common}
	style:--z-hideable={T_Layer.hideable}>
	<button
		class='banner'
		class:open={is_visible}
		style:--banner={colors.banner}
		style:--accent={$w_accent_color}
		use:hit_target={{ id: `hideable-${id}`, onpress: toggle }}>
		<span class='banner-title'>{title}</span>
	</button>
	{#if is_visible}
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
		z-index    : var(--z-common);
	}

	.banner:global([data-hitting])::before {
		background : var(--bg);
		opacity    : 1;
	}

	.banner-title {
		position : relative;
		z-index  : var(--z-hideable);
	}

	.slot {
		padding       : 8px;
		background    : var(--bg);
		margin        : 0px 0 0;
		border-radius : 11px;
	}

</style>
