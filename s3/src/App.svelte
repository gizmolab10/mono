<script lang='ts'>
	import { store }        from './lib/store/store.svelte';
	import { ux }           from './lib/state/ux.svelte';
	import { rootAncestry } from './lib/nav/Ancestry';
	import SeriouslyApp     from './lib/svelte/main/SeriouslyApp.svelte';

	store.load_seed();
	ux.becomeFocus(rootAncestry);
</script>

<SeriouslyApp />

<style>
	:global(body) {
		margin      : 0;
		font-family : system-ui, sans-serif;
	}
</style>
