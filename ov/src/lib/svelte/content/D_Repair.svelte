<script lang='ts'>
	import { guides } from '../../ts/managers/Files';
	import { hit_target } from '../../ts/events/Hit_Target';
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
	<button class='repair'
		use:hit_target={{ id: 'repair.indexes', onpress: handle_repair, tip: 'clean index files' }}>index files</button>
	<button class='repair'
		use:hit_target={{ id: 'repair.links', onpress: handle_links,
			tip: 'look through every guide for links that lead nowhere' }}>dead links</button>
</div>

<style>
	.repair-shop {
		gap             : var(--gap-tiny);
		justify-content : center;
		align-items     : center;
		flex-wrap       : wrap;
		display         : flex;
		padding         : 0;      /* the section's own box already gives a gap all round */
	}

	.repair {
		border          : var(--thick) solid var(--black);
		padding         : var(--pad-control);
		border-radius   : var(--radius-pill);
		font-size       : var(-font-control);
		height          : var(--height);
		background      : var(--white);
		color           : var(--text);
		box-sizing      : border-box;
		cursor          : pointer;
		white-space     : nowrap;
	}

	.repair:global([data-hit]) {
		background      : var(--hover);
	}
</style>
