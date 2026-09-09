<script lang='ts'>
	// The content box. The frame computes its width. Empty: nothing happens in it yet.
	let { width }: { width: number } = $props();
</script>

<div class='region content' style:width='{width}px'></div>

<style>
	.content {
		border-radius  : var(--radius);
		padding        : var(--gap);
		box-sizing     : border-box;
		gap            : var(--gap);
		background     : var(--bg);
		position       : relative;
		flex-direction : column;
		overflow       : visible;
		display        : flex;
		flex-shrink    : 0;
		min-height     : 0;
	}
</style>
