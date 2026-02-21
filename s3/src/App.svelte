<script lang='ts'>
	import { store } from './lib/store/store.svelte';
	store.load_seed();
</script>

<style>
	:global(body) {
		margin      : 0;
		font-family : system-ui, sans-serif;
	}
</style>
