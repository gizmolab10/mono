<script lang='ts'>
	import { Gallery, photosInFolder, technical } from '../ts/common/Gallery';

	// The content box. App.svelte computes its width. In it, gallery's own component, showing
	// the pictures of mj's one folder. A picture and its caption sit at the middle of the box's
	// height. While editing is on, the drop box and the table start at the top instead.
	let { width }: { width: number } = $props();

	const FOLDER = 'mj';
</script>

<div class='region content' class:centered={!technical.editing} style:width='{width}px'>
	<Gallery folder={FOLDER} photos={photosInFolder(FOLDER)} />
</div>

<style>
	.content {
		border-radius  : var(--radius);
		box-sizing     : border-box;
		padding        : var(--gap);
		gap            : var(--gap);
		background     : var(--bg);
		position       : relative;
		overflow       : visible;
		flex-direction : column;
		display        : flex;
		flex-shrink    : 0;
		min-height     : 0;
	}

	.content.centered {
		justify-content : center;
	}
</style>
