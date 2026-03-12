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
		actions,
		children,
	} : {
		id       : string;
		title    : string;
		detail   : T_Details;
		children : import('svelte').Snippet;
		actions? : import('svelte').Snippet;
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
		<span class='banner-title'>{title}</span>
		{#if actions}<span class='banner-actions'>{@render actions()}</span>{/if}
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
		letter-spacing  : var(--l-letter-spacing);
		border-radius   : var(--corner-banner);
		font-size       : var(--h-font-common);
		color           : rgba(0, 0, 0, 1);
		z-index         : var(--z-action);
		height          : var(--h-banner);
		text-transform  : lowercase;
		position        : relative;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		overflow        : hidden;
		margin          : 3px 0;
		display         : flex;
		border          : none;
		background      : var(--bg);
		font-weight     : 300;
		outline         : none;
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

	.banner-actions {
		z-index  : var(--z-action);
		position : absolute;
		right    : 6px;
		display  : flex;
		gap      : 2px;
	}

	.slot {
		border-radius : var(--corner-banner);
		padding       : var(--l-margin);
		background    : var(--bg);
		position      : relative;
		margin        : 0px 0 0;
	}

</style>
