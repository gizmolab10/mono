<script lang='ts'>
	import '../../common/Extensions';
	import { T_Database }  from '../../db/DB_Common';
	import { databases }   from '../../db/Databases.svelte';

	const db_options: T_Database[] = [T_Database.test, T_Database.firebase];

	let selected = $derived(databases.db.t_database);

	let dirty_count = $derived(() => {
		let count = 0;
		for (const t of databases.hierarchy.things.values())        { if (t.persistence.isDirty) count++; }
		for (const r of databases.hierarchy.relationships.values()) { if (r.persistence.isDirty) count++; }
		for (const t of databases.hierarchy.traits.values())        { if (t.persistence.isDirty) count++; }
		for (const g of databases.hierarchy.tags.values())          { if (g.persistence.isDirty) count++; }
		return count;
	});

	let stats = $derived([
		['database',      databases.db.t_database],
		['things',        databases.hierarchy.things.size.supressZero()],
		['relationships', databases.hierarchy.relationships.size.supressZero()],
		['predicates',    databases.hierarchy.predicates.size.supressZero()],
		['traits',        databases.hierarchy.traits.size.supressZero()],
		['tags',          databases.hierarchy.tags.size.supressZero()],
		['must save',     dirty_count().supressZero()],
	]);

	let saving = $state(false);

	async function handle_db_select(t_database: T_Database) {
		if (t_database === selected) return;
		await databases.change_database(t_database);
	}

	async function handle_save() {
		saving = true;
		await databases.db.persist_all();
		saving = false;
	}
</script>

<div class='data-container'>
	<div class='db-switcher'>
		{#each db_options as option}
			<button
				class      = 'db-option'
				class:active = {option === selected}
				onclick    = {() => handle_db_select(option)}>
				{option}
			</button>
		{/each}
	</div>

	<table class='stats'>
		<tbody>
			{#each stats as [label, value]}
				<tr>
					<td class='label'>{label}</td>
					<td class='value'>{value}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if dirty_count() > 0}
		<button
			class='save-button'
			disabled={saving}
			onclick={handle_save}>
			{saving ? 'saving…' : 'save to db'}
		</button>
	{/if}
</div>

<style>
	.data-container {
		padding     : 6px 8px;
		font-family : system-ui, sans-serif;
	}

	.db-switcher {
		display       : flex;
		gap           : 0;
		border        : 1px solid #555;
		border-radius : 4px;
		overflow      : hidden;
		margin-bottom : 8px;
	}

	.db-option {
		flex             : 1;
		padding          : 3px 0;
		border           : none;
		background-color : transparent;
		color            : #888;
		font-size        : 10px;
		font-family      : system-ui, sans-serif;
		cursor           : pointer;
	}

	.db-option:not(:last-child) {
		border-right : 1px solid #555;
	}

	.db-option:hover:not(.active) {
		background-color : #333;
		color            : #ccc;
	}

	.db-option.active {
		background-color : #555;
		color            : #eee;
	}

	.stats {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 10px;
	}

	.label {
		text-align  : right;
		padding     : 2px 6px 2px 4px;
		color       : #777;
		width       : 30%;
		white-space : nowrap;
	}

	.value {
		padding    : 2px 4px;
		color      : #bbb;
		word-break : break-all;
	}

	.save-button {
		display          : block;
		margin           : 6px auto 0;
		padding          : 3px 14px;
		border           : 1px solid #555;
		border-radius    : 4px;
		background-color : transparent;
		color            : #aaa;
		font-size        : 10px;
		font-family      : system-ui, sans-serif;
		cursor           : pointer;
	}

	.save-button:hover:not(:disabled) {
		background-color : #444;
		color            : #ddd;
	}

	.save-button:disabled {
		opacity : 0.4;
		cursor  : default;
	}
</style>
