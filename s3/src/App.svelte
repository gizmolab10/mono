<script lang='ts'>
	import { store }    from './lib/store/store.svelte';
	import SeriouslyApp from './lib/svelte/main/SeriouslyApp.svelte';
	store.load_seed();
</script>

<SeriouslyApp />

<style>
	:global(body) {
		margin      : 0;
		font-family : system-ui, sans-serif;
	}
</style>
