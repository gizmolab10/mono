<script lang='ts'>
	import Hideable from './Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';

	// The collapsible details region. The frame computes its width. The hamburger
	// is a separate fixed overlay owned by the frame. This component owns the
	// region, its (now empty) banner, and the preferences panel.
	let { width }: {
		width : number;
	} = $props();
</script>

<div class='region details' style:width='{width}px'>
	<div class='details-banner'></div>
	<Hideable title='preferences'>
		<D_Preferences />
	</Hideable>
</div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.details {
		background     : var(--accent);
		flex-direction : column;
		display        : flex;
		gap            : var(--gap-details);
		flex-shrink    : 0;
	}

	.details-banner {
		background      : var(--accent);
		align-items     : center;
		justify-content : center;
		border-radius   : var(--radius-banner);
		height          : var(--h-banner);
		width           : 100%;
		display         : flex;
		border          : none;
	}
</style>
