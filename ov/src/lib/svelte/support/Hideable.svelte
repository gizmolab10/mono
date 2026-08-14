<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/events/Hits';

	// A titled banner that toggles a body open and closed.
	let { title, children, open = $bindable(true) } : {
		title    : string;
		children : import('svelte').Snippet;
		open?    : boolean;
	} = $props();

	function toggle() {
		open = !open;
	}

	// Opening or closing moves everything below this banner, so every rectangle the hits manager
	// holds is asked again once the browser has drawn at the new height.
	$effect(() => {
		open;
		hits.defer_recalibrate();
	});
</script>

<div class='hideable'>
	<!-- Named by its own title, since the details column holds more than one of these. -->
	<button class='banner' class:open use:hit_target={{ id: `details.${title}` , onpress: toggle }}>
		<span class='banner-title layer-hideable'>{title}</span>
	</button>
	{#if open}
		<div class='slot'>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.hideable {
		gap            : var(--gap-faint);
		flex-direction : column;
		display        : flex;
	}

	.banner {
		height          : var(--height-big);
		border-radius   : var(--radius-tiny);
		font-size       : var(--font-big);
		font-weight     : var(--fw-big);
		letter-spacing  : var(--em-tiny);
		color           : var(--black);
		background      : var(--bg);
		text-transform  : lowercase;
		position        : relative;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		overflow        : hidden;
		display         : flex;
		border          : none;
		outline         : none;
		width           : 100%;
	}

	.banner::before {
		background : radial-gradient(ellipse at center, transparent 20%, var(--accent) 100%);
		position   : absolute;
		content    : '';
		inset      : 0;
	}

	.banner:global([data-hit])::before {
		background : var(--hover);
		opacity    : 1;
	}

	.banner-title {
		position : relative;
	}

	.slot {
		border-radius : var(--radius-tiny);
		padding       : var(--gap);
		background    : var(--bg);
		position      : relative;
	}
</style>
