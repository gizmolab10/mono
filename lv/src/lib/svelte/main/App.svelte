<script lang='ts'>
	import Main from './Main.svelte';

</script>

<Main />

<style>
	:global(body) {
		font-family: system-ui, sans-serif;
		user-select: none;
		margin: 0;
	}

	:global(input:focus, textarea:focus) {
		user-select: text;
	}

</style>
