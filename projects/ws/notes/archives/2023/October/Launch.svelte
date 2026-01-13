<script>
	import { get, launch, DBType, onMount } from '../../ts/common/GlobalImports';
	import { isBusy, db_type, things_arrived } from '../../ts/managers/State';
	import Panel from './Panel.svelte';
	let isLoading = true;

	onMount(async () => { launch.setup(); })
</script>

<style>
	p {
		text-align: center;
		font-size: 3em;
	}
</style>

{#if $isBusy}
	<p>Welcome to Seriously</p>
	{#if $db_type != DBType.local}
		<p>(loading your {$db_type} data{$db_type == DBType.firebase ? ', from ' + dbDispatch.db.baseID : ''})</p>
	{/if}
{:else if !$things_arrived}
	<p>Nothing is available.</p>
{:else}
	<Panel/>
{/if}
