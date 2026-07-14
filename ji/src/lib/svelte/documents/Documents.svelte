<script lang='ts'>
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/database/Signal';
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import { w_filter_tags, w_filter_text, filter_rows } from '../../ts/managers/Search';
	import Tags from '../tags/Tags.svelte';
	import Add_Document from './Add_Document.svelte';

	// The documents view: every file in the active store as type + name + its tags,
	// each row with an "edit tags" button that opens the tag picker for that
	// document. Live off the store-changed tick. The filter (picked tags + text)
	// is the shared Search state.

	let editing = $state<string | null>(null);

	const rows = $derived.by(() => {
		$w_db_changed;                                   // re-read on every store change
		const db = databases.active;
		const name_of = new Map(db.tags.map((t) => [t.id, t.name]));
		return db.documents.map((d) => {
			const tag_ids = db.indexes.tags_of(d.id);
			return {
				id        : d.id,
				name      : d.name,
				kind      : d.kind,
				tag_ids,
				tag_names : tag_ids.map((id) => name_of.get(id) ?? '?').join(', '),
			};
		});
	});

	// Narrowed by the shared filter: every picked tag must match, and the name must
	// contain the filter text.
	const shown = $derived(filter_rows(rows, $w_filter_tags, $w_filter_text));

	function toggle_tag(document_id: string, tag_id: string, on: boolean) {
		if (on) { databases.active.add_tagging(tag_id, document_id); }
		else    { databases.active.remove_tagging(tag_id, document_id); }
	}

	// The tag ids currently on one document — the picker's starting selection.
	function chosen_for(document_id: string): Set<string> {
		return new Set(databases.active.indexes.tags_of(document_id));
	}
</script>

<div class='documents'>
	<div class='chips'>
		<Tags bind:selected={$w_filter_tags} />
	</div>
	<hr>
	{#if $w_operation === T_Operation.document}
		<Add_Document />
	{:else}
		{#if rows.length === 0}
			<div class='empty'>no documents yet</div>
		{:else}
			<table class='files'>
				<tbody>
					{#each shown as row}
						<tr class='file'>
							<td class='kind'>{row.kind}</td>
							<td class='name'>{row.name}</td>
							<td class='tags'>{row.tag_names}</td>
							<td class='edit'>
								<button class='edit-button' onclick={() => editing = editing === row.id ? null : row.id}>
									{editing === row.id ? 'done' : 'edit tags'}
								</button>
							</td>
						</tr>
						{#if editing === row.id}
							<tr class='editor'>
								<td colspan='4'>
									<Tags
										selected={chosen_for(row.id)}
										ontoggle={(tag_id, on) => toggle_tag(row.id, tag_id, on)} />
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	{/if}
</div>

<style>
	.documents {
		position       : relative;
		padding        : var(--gap);           /* an even --gap margin around the content */
		box-sizing     : border-box;
		flex-direction : column;
		display        : flex;
		height         : 100%;
		width          : 100%;
		overflow-y     : auto;
	}

	.chips {
		padding-bottom : var(--gap);
	}

	hr {
		border      : none;
		border-top  : var(--thickness-faint) solid var(--black);
		margin      : 0 0 var(--gap);
		flex-shrink : 0;
		width       : 100%;
	}

	.empty {
		opacity         : var(--opacity-label);
		font-size       : var(--font-base);
		color           : var(--text);
		align-items     : center;
		justify-content : center;
		display         : flex;
		height          : 100%;
	}

	.files {
		border-collapse : collapse;
		width           : 100%;
	}

	.kind, .name, .tags, .edit {
		padding        : var(--gap-tight) 0;
		font-size      : var(--font-base);
		color          : var(--text);
		vertical-align : baseline;
		text-align     : left;
	}

	.kind {
		opacity : var(--opacity-label);
		width   : 60px;
	}

	.tags {
		opacity : var(--opacity-label);
	}

	.edit {
		text-align : right;
	}

	.edit-button {
		border        : var(--thickness-normal) solid var(--black);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
		border-radius : 999px;
	}

	.edit-button:hover {
		background : var(--hover);
	}

	.editor td {
		padding-bottom : var(--gap);
	}
</style>
