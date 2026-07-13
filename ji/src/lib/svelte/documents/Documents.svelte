<script lang='ts'>
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/database/Signal';
	import Tags from '../tags/Tags.svelte';

	// The browse view: every file in the active store as type + name + its tags,
	// each row with an "edit tags" button that opens the tag picker for that
	// document. Live off the store-changed tick.

	// The build-notes opener lives in this view's corner; the frame owns the flag.
	let { showBuildNotes = $bindable(false), buildNumber = 0 }:
		{ showBuildNotes?: boolean; buildNumber?: number } = $props();

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
				tag_names : tag_ids.map((id) => name_of.get(id) ?? '?').join(', '),
			};
		});
	});

	function toggle_tag(document_id: string, tag_id: string, on: boolean) {
		if (on) { databases.active.add_tagging(tag_id, document_id); }
		else    { databases.active.remove_tagging(tag_id, document_id); }
	}

	// The tag ids currently on one document — the picker's starting selection.
	function chosen_for(document_id: string): Set<string> {
		return new Set(databases.active.indexes.tags_of(document_id));
	}
</script>

<div class='browse'>
	{#if rows.length === 0}
		<div class='empty'>no documents yet</div>
	{:else}
		<table class='files'>
			<tbody>
				{#each rows as row}
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

	<div class='corner-stack'>
		<button class='build-opener' onclick={() => showBuildNotes = true}>
			Build {buildNumber}
		</button>
		<a class='author-credit' href='https://designintuition.app' target='_blank' rel='noopener'>
			built by: jonathan sand
		</a>
	</div>
</div>

<style>
	.browse {
		position   : relative;
		padding    : var(--pad-view);
		box-sizing : border-box;
		height     : 100%;
		width      : 100%;
		overflow-y : auto;
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

	.corner-stack {
		bottom         : var(--inset-credit-bottom);
		left           : var(--inset-credit-left);
		gap            : var(--gap-tight);
		align-items    : flex-start;
		position       : absolute;
		flex-direction : column;
		display        : flex;
	}

	.build-opener {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--gray);
		cursor        : pointer;
	}

	.build-opener:hover {
		background : var(--hover);
	}

	.author-credit {
		font-size       : var(--font-credit);
		color           : var(--text);
		text-decoration : underline;
		cursor          : pointer;
	}

	.author-credit:hover {
		color : var(--hover);
	}
</style>
