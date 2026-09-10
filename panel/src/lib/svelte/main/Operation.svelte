<script lang='ts'>
	import type { Snippet } from 'svelte';

	// The operation view. The page computes its width and its height. It holds whatever the host
	// hands over, given both, and nothing where the host hands nothing.
	let { width, height, children }: { width: number; height: number; children?: Snippet<[number, number]> } = $props();
</script>

<div class='region content' style:width='{width}px'>
	{@render children?.(width, height)}
</div>

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
