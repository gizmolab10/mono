<script lang='ts'>
	import { databases }    from './lib/db/Databases';
	import SeriouslyApp     from './lib/svelte/main/SeriouslyApp.svelte';

	databases.setup();
</script>

<SeriouslyApp />

<style>
	:global(body) {
		margin      : 0;
		font-family : system-ui, sans-serif;
	}
</style>
