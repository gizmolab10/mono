<script lang='ts'>
	import { files } from '../../ts/managers/Files';
	import { hit_target } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';

	// Putting things right that nothing on screen would show as wrong. Two buttons: the index
	// files, since a move can only mend the two folders it touched, and the dead links and files,
	// links that lead nowhere said and rows whose files are gone forgotten.

	function handle_repair() {
		debug.log('Repair: the index files were asked for.');
		files.repair_indexes();
	}

	function handle_links() {
		debug.log('Repair: the dead links and files were asked for.');
		files.find_dead_links_and_files();
	}
</script>

<div class='repair-shop'>
	<button class='repair'
		use:hit_target={{ id: 'repair.indexes', onpress: handle_repair, tip: 'clean index files' }}>index files</button>
	<button class='repair'
		use:hit_target={{ id: 'repair.links', onpress: handle_links,
			tip: 'look through every guide for links that lead nowhere, and forget every file the db holds and the disk does not' }}>dead links and files</button>
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
		font-size       : var(--font-tiny);
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
