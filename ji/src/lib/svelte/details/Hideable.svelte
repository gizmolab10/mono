<script lang='ts'>
	// Trimmed port of di's Hideable: a titled banner that toggles a body open
	// and closed. di drives the toggle through its hit-target system and a
	// central store; here it is plain local state and a click.
	let { title, children, open = $bindable(true) } : {
		title    : string;
		children : import('svelte').Snippet;
		open?    : boolean;
	} = $props();

	function toggle() {
		open = !open;
	}
</script>

<div class='hideable'>
	<button class='banner' class:open onclick={toggle}>
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
		flex-direction : column;
		display        : flex;
		gap            : var(--gap-details);
	}

	.banner {
		color           : var(--black);
		background      : var(--bg);
		text-transform  : lowercase;
		position        : relative;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		overflow        : hidden;
		letter-spacing  : var(--tracking);
		font-size       : var(--font-banner);
		border-radius   : var(--radius-banner);
		height          : var(--height-hideable);
		display         : flex;
		border          : none;
		outline         : none;
		width           : 100%;
		font-weight     : var(--fw-banner);
	}

	.banner::before {
		background : radial-gradient(ellipse at center, transparent 20%, var(--accent) 100%);
		position   : absolute;
		content    : '';
		inset      : 0;
	}

	.banner:hover::before {
		background : var(--hover);
		opacity    : 1;
	}

	.banner-title {
		position : relative;
	}

	.slot {
		background    : var(--bg);
		position      : relative;
		border-radius : var(--radius-banner);
		padding       : var(--pad-slot);
	}
</style>
