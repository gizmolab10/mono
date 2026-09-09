<script lang='ts'>
	import { k } from '../ts/common/Core';

	// The content box. The frame computes its width. One line in it for now, drawn with core's
	// own sizes so the push from Constants to the page is proved the moment it opens.
	let { width }: { width: number } = $props();
</script>

<div class='region content' style:width='{width}px'>
	<div style:padding='{k.gap.fat}px' style:font-size='{k.font.normal}px'>mj is running.</div>
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
