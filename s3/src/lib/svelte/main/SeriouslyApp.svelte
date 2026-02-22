<script lang='ts'>
	import { startup } from '../../state/startup.svelte';
	import { events }  from '../../signals/Events.svelte';
	import { onMount }  from 'svelte';
	import Panel from './Panel.svelte';

	onMount(() => {
		events.setup();
		return () => events.teardown();
	});
</script>

{#if startup.isReady}
	<Panel />
{:else}
	<div class='loading'>loading…</div>
{/if}

<style>
	.loading {
		display         : flex;
		align-items     : center;
		justify-content : center;
		height          : 100vh;
		font-family     : system-ui, sans-serif;
		color           : #999;
	}
</style>
