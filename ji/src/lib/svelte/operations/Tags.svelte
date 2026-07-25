<script lang='ts'>
	import Add_Tag from '../support/Add_Tag.svelte';
	import { debug } from '../../ts/common/Debug';

	// Stub: the tags operation — a running history of questions and answers over the
	// store. Not built yet; this just marks the spot so the "tags" segment has a home.
	debug.log('Chat view opened — stub only, not built yet.');
</script>

<div class='tags'>
	<Add_Tag />
</div>

<style>
	.tags {
		opacity   : var(--opacity-label);
		font-size : var(--font-label);
		padding   : var(--gap);
	}
</style>
