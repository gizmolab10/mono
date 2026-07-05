<script lang='ts'>
	import { T_Details, T_Hit_Target } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/utilities/Colors';
	import { hits } from '../../ts/events/Hits';
	import { stores } from '../../ts/managers';
	const { w_t_details } = stores;

	let {
		id,
		title,
		detail,
		children,
		leftActions,
		rightActions,
	} : {
		id            : string;
		title         : string;
		detail        : T_Details;
		children      : import('svelte').Snippet;
		leftActions?  : import('svelte').Snippet;
		rightActions? : import('svelte').Snippet;
	} = $props();

	let is_visible = $derived(($w_t_details & detail) !== 0);

	async function toggle() {
		w_t_details.update(v => v ^ detail);
		await hits.defer_recalibrate();
	}

	let hideable_el: HTMLDivElement;
	const observer = new ResizeObserver( async () => await hits.defer_recalibrate());
	$effect(() => {
		if (hideable_el) {
			observer.observe(hideable_el);
			return () => observer.disconnect();
		}
	});
</script>

<div class='hideable'
	bind:this={hideable_el}>
	<button
		class='banner'
		class:open={is_visible}
		style:--banner={colors.banner}
		use:hit_target={{ type: T_Hit_Target.banner, id: `hideable-${id}`, onpress: toggle }}>
		{#if leftActions}<span class='banner-actions-left'>{@render leftActions()}</span>{/if}
		<span class='banner-title'>{title}</span>
		{#if rightActions}<span class='banner-actions-right'>{@render rightActions()}</span>{/if}
	</button>
	{#if is_visible}
		<div class='slot'>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.hideable {
		gap            : var(--th-thin-sep);
		flex-direction : column;
		display        : flex;
	}

	.banner {
		letter-spacing  : var(--l-letter-spacing);
		font-size       : var(--font-common);
		color           : rgba(0, 0, 0, 1);
		border-radius   : var(--r-common);
		z-index         : var(--z-action);
		height          : var(--h-banner);
		background      : var(--bg);
		text-transform  : lowercase;
		position        : relative;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		overflow        : hidden;
		display         : flex;
		border          : none;
		font-weight     : 300;
		outline         : none;
		margin          : 0;
	}

	.banner::before {
		background : radial-gradient(ellipse at center, transparent 20%, var(--accent) 100%);
		z-index    : var(--z-common);
		position   : absolute;
		content    : '';
		inset      : 0;
	}

	.banner:global([data-hit])::before {
		background : var(--bg);
		opacity    : 1;
	}

	.banner-title {
		z-index  : var(--z-layout);
		position : relative;
	}

	.banner-actions-right {
		z-index  : var(--z-action);
		position : absolute;
		right    : 6px;
		display  : flex;
		gap      : 2px;
	}

	.banner-actions-left {
		z-index  : var(--z-action);
		position : absolute;
		left     : 6px;
		display  : flex;
		gap      : 2px;
	}

	.slot {
		border-radius : var(--r-common);
		padding       : var(--l-margin);
		background    : var(--bg);
		position      : relative;
		margin        : 0;
	}

</style>
