<script lang='ts'>
	import Separator from '../support/Separator.svelte';
	import Add_Tag from '../support/Add_Tag.svelte';
	import { debug } from '../../ts/common/Debug';

	// Stub: the manage-tags operation — rename, merge, and remove tags across the
	// store. Not built yet; this just marks the spot so the tag work has a home.
	debug.log('Manage-tags view opened — stub only, not built yet.');
</script>

<div class='manage-tags'>
	<Add_Tag />
	<div class='row-sep'><Separator /></div>
</div>

<style>
	.manage-tags {
		opacity   : var(--opacity-label);
		font-size : var(--font-label);
		padding   : var(--gap);
	}

	/* A --gap of space above the divider that closes off the add-tag row. */
	.row-sep {
		margin-top : var(--gap);
	}
</style>
