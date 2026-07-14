<script lang='ts'>
	import Hideable from './Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';
	import D_Data from './D_Data.svelte';

	// The collapsible details region: the preferences and data panels. The frame
	// computes its width.
	let { width }: { width: number } = $props();
</script>

<div class='region details' style:width='{width}px'>
	<Hideable title='preferences'>
		<D_Preferences />
	</Hideable>
	<Hideable title='data'>
		<D_Data />
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
</style>
