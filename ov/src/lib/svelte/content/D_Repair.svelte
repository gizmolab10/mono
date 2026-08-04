<script lang='ts'>
	import { guides } from '../../ts/managers/Guides';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';

	// Putting things right that nothing on screen would show as wrong. One button so far: the
	// index files, since a move can only mend the two folders it touched.

	function handle_repair() {
		debug.log('Repair: the index files were asked for.');
		guides.repair_indexes();
	}

	function handle_links() {
		debug.log('Repair: the dead links were asked for.');
		guides.find_dead_links();
	}
</script>

<div class='repair-shop'>
	<button class='repair' use:tip={'clean index files'} onclick={handle_repair}>index files</button>
	<button class='repair' use:tip={'look through every guide for links that lead nowhere'} onclick={handle_links}>dead links</button>
</div>

<style>
	.repair-shop {
		gap             : var(--gap-tight);
		justify-content : center;
		align-items     : center;
		flex-wrap       : wrap;
		display         : flex;
		padding         : 0;      /* the section's own box already gives a gap all round */
	}

	.repair {
		border          : var(--thickness-normal) solid var(--black);
		height          : var(--height-control);
		padding         : var(--pad-control);
		border-radius   : var(--radius-pill);
		font-size       : var(--font-label);
		background      : var(--white);
		color           : var(--text);
		box-sizing      : border-box;
		white-space     : nowrap;
		cursor          : pointer;
	}

	.repair:hover {
		background      : var(--hover);
	}
</style>
