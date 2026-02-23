<script lang='ts'>
	import { ux }        from '../../state/ux.svelte';
	import { databases } from '../../db/Databases.svelte';
	import { k }         from '../../common/Constants';

	let ancestry  = $derived(ux.ancestry_forDetails);
	let thing     = $derived(ancestry?.thing ?? null);
	let grabs     = $derived(ux.grabs);

	let children_count = $derived(thing ? databases.hierarchy.children_of(thing.id).length : 0);
	let parents_count  = $derived(thing ? databases.hierarchy.parents_of(thing.id).length : 0);

	let characteristics = $derived(thing ? [
		['title',    thing.title],
		['color',    thing.color],
		['type',     thing.t_thing],
		['children', children_count],
		['parents',  parents_count],
		['id',       thing.id.slice(0, 12) + '…'],
	] : []);
</script>

{#if grabs.length > 1}
	<div class='multi-grab'>
		<span class='count'>{grabs.length}</span> items selected
	</div>
{:else if thing}
	<table class='characteristics'>
		<tbody>
			{#each characteristics as [label, value]}
				<tr>
					<td class='label'>{label}</td>
					<td class='value'>{value}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p class='empty'>{k.nothing_to_show}</p>
{/if}

<style>
	.multi-grab {
		padding     : 8px;
		text-align  : center;
		font-size   : 11px;
		color       : #999;
		font-family : system-ui, sans-serif;
	}

	.count {
		font-weight : 600;
		color       : #ccc;
	}

	.characteristics {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 10px;
		font-family     : system-ui, sans-serif;
	}

	.label {
		text-align  : right;
		padding     : 2px 6px 2px 4px;
		color       : #777;
		width       : 30%;
		white-space : nowrap;
	}

	.value {
		padding     : 2px 4px;
		color       : #bbb;
		word-break  : break-all;
	}

	.empty {
		padding     : 8px;
		text-align  : center;
		font-size   : 10px;
		color       : #666;
		font-family : system-ui, sans-serif;
	}
</style>
