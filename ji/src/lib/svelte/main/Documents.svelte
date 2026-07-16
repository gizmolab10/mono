<script lang='ts'>
	import { w_filter_tags, w_filter_text, w_filter_mode, filter_rows } from '../../ts/managers/Search';
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import Add_Document from '../actions/Add_Document.svelte';
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/types/Signal';
	import Add_Tag from '../actions/Add_Tag.svelte';
	import { debug } from '../../ts/common/Debug';
	import Tags from '../actions/Tags.svelte';

	// The documents view: every file in the active store as type + name + its tags,
	// each row with an "edit tags" button that opens the tag picker for that
	// document. Live off the store-changed tick. The search-text (picked tags + text)
	// is the shared Search state.

	let editing = $state<string | null>(null);

	const rows = $derived.by(() => {
		$w_db_changed;                                   // re-read on every store change
		const db = databases.active;
		const name_of = new Map(db.tags.map((t) => [t.id, t.name]));
		// Walk parent-first, child-next so folders lead their contents; each row
		// carries how deep it sits (for the indent) and its folder chain above
		// (so a filtered-in file can keep its parent folders on screen).
		return db.list_documents().map((listed) => {
			const tag_ids = listed.tag_ids;
			return {
				id           : listed.document.id,
				name         : listed.document.name,
				kind         : listed.document.kind,
				depth        : listed.depth,
				ancestor_ids : listed.ancestor_ids,
				tag_ids,
				tag_names    : tag_ids.map((id) => name_of.get(id) ?? '?').join(', '),
			};
		});
	});

	// Narrowed by the shared search-text: every picked tag must logic-choice, and the name must
	// contain the search-text text. A matched file keeps its folder chain on screen too,
	// so it never shows indented under nothing — the ancestors ride along even if they miss.
	const shown = $derived.by(() => {
		const matched = filter_rows(rows, $w_filter_tags, $w_filter_text, $w_filter_mode);
		const keep = new Set(matched.map((r) => r.id));
		for (const r of matched) { for (const a of r.ancestor_ids) { keep.add(a); } }
		return rows.filter((r) => keep.has(r.id));       // original walk order, ancestors included
	});

	// With no documents to show, open the drop box so the first one can be added.
	// The guard stops this from re-firing once the drop box is already up.
	$effect(() => {
		if (rows.length === 0 && $w_operation !== T_Operation.document) {
			debug.log('No documents in the store — opening the drop box to add the first one.');
			w_operation.set(T_Operation.document);
		}
	});

	function toggle_tag(document_id: string, tag_id: string, on: boolean) {
		if (on) { databases.active.add_tagging(tag_id, document_id); }
		else    { databases.active.remove_tagging(tag_id, document_id); }
	}

	// The tag ids currently on one document — the picker's starting selection.
	function chosen_for(document_id: string): Set<string> {
		return new Set(databases.active.indexes.tags_of(document_id));
	}

	// The four table columns, in order. Format and edit-tags hug the right edge to
	// match their cells; the middle two hug the left. The middle two also react to
	// hover — the label reads its "hover" text instead — and clicking them opens the
	// matching add view; format and edit-tags stay inert.
	const columns = [
		{ label: 'format',        right: true,  hover: null,            op: null                 },
		{ label: 'add documents', right: false, hover: 'add documents', op: T_Operation.document },
		{ label: 'tags',          right: true,  hover: null,            op: null                 },
		{ label: ' ',             right: true,  hover: null,            op: null                 },
	];

	let hovered = $state<number | null>(null);

	// One click handler for every header, told which column it was. The two middle
	// headers switch the content area to their add view; format and edit-tags do
	// nothing.
	function head_click(event: MouseEvent, col: number) {
		event.stopPropagation();                              // don't let this reach the background clearer
		const op = columns[col].op;
		if (!op) {
			debug.log(`The "${columns[col].label}" header does nothing — no add view for it.`);
			return;
		}
		w_operation.set(op);
		debug.log(`Clicked "${columns[col].label}" — content area now showing "${op}".`);
	}

	// A click on the empty background leaves the add view and returns to the list.
	// Clicks inside the drop box or the new-tag field are kept so they don't dismiss
	// mid-interaction. The picked filters are untouched — only the add view clears.
	function background_click(event: MouseEvent) {
		if (!$w_operation) { return; }                        // already showing the list
		if (rows.length === 0) { return; }                   // empty store stays on the drop box — nothing to return to
		const target = event.target as HTMLElement;
		if (target.closest('.add-tag')) { return; }          // keep clicks inside the new-tag field; a drop-box click clears the operation
		w_operation.set(null);
		debug.log(`Clicked out of the add view with ${rows.length} document(s) in the store — back to the list.`);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class='documents' onclick={background_click}>
	{#if rows.length > 0 && $w_operation === null}
		<div class='logic'>
			<Tags
				bind:selected={$w_filter_tags}
				bind:mode={$w_filter_mode}
				onadd={$w_operation === T_Operation.tag ? undefined : () => w_operation.set(T_Operation.tag)} />
		</div>
		<input class='search-text' type='search' placeholder='search by name' bind:value={$w_filter_text} />
	{/if}
	{#if $w_operation === T_Operation.document}
		<Add_Document />
	{:else}
		{#if $w_operation === T_Operation.tag}
			<Add_Tag ondone={() => w_operation.set(null)} />
		{:else}
			<hr>
			{#if rows.length === 0}
				<div class='empty'>no documents yet</div>
			{:else}
				<table class='blobs-table'>
					<thead>
						<tr class='head'>
							{#each columns as col, i}
								<th class:right={col.right}>
									<button
										class='head-label'
										class:interactive={col.hover}
										onmouseenter={() => { if (col.hover) { hovered = i; } }}
										onmouseleave={() => { if (hovered === i) { hovered = null; } }}
										onclick={(e) => head_click(e, i)}>{hovered === i && col.hover ? col.hover : col.label}</button>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each shown as row}
							<tr class='file'>
								<td class='kind'>{row.kind === 'folder' ? '---' : row.kind}</td>
								<td class='name' style:padding-left='{row.depth * 20}px'>{row.name}</td>
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
	{/if}
</div>

<style>
	.documents {
		padding        : var(--gap);           /* an even --gap margin around the content */
		box-sizing     : border-box;
		position       : relative;
		flex-direction : column;
		display        : flex;
		height         : 100%;
		width          : 100%;
		overflow-y     : auto;
	}

	/* Wraps the filter (toggle + chips); the bottom space sets it off the rule. */
	.logic {
		padding-bottom  : var(--gap);
		justify-content : center;
		display         : flex;
	}

	/* The search box: centered under the tags, narrows the list as you type. Its
	   type is "search", so browsers that support it draw a native clear × at the
	   right once there is text. */
	.search-text {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		margin-bottom : var(--gap);
		align-self    : center;
		width         : 200px;
		margin-top    : -2px;                  /* nudge the search box up 2px */
	}

	hr {
		border      : none;                    /* clear the browser-default hr line... */
		border-top  : var(--thickness-normal) solid var(--black);   /* ...leaving only this */
		margin      : 8px 0 var(--gap);
		width       : 100%;
		flex-shrink : 0;
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

	.blobs-table {
		border-collapse : collapse;
		position        : relative;
		/* Lift the table so each header label rides up onto the rule above it. */
		margin-top      : -1.6em;
		width           : 100%;
	}

	/* The cell is transparent so the rule shows through; only the label pill
	   below masks it. Labels align left, except format and edit-tags hug right. */
	.head th {
		padding    : var(--gap-tight) 0 var(--gap);
		text-align : left;
	}

	.head th.right {
		text-align : right;
	}

	/* Each column label as a pill floating on the rule, just like D_Data's
	   more / less: the page-colored background masks the line so the label
	   reads as text sitting on a broken rule; hovering lights it up the same. */
	.head-label {
		border        : var(--thickness-faint) solid var(--bg);
		font-size     : var(--font-label);
		padding       : 0 var(--gap);
		color         : var(--text);
		background    : var(--bg);
		font-family   : inherit;
		cursor        : pointer;
		border-radius : 999px;
	}

	/* Only add documents header reacts to hover; format and edit-tags stay inert. */
	.head-label:not(.interactive) {
		cursor : default;
	}

	/* The document header reads as a real button: control height, solid black edge. */
	.head-label.interactive {
		border     : var(--thickness-normal) solid var(--black);
		height     : var(--height-control);
		box-sizing : border-box;
		background : var(--white);
		position   : relative;
		top        : 1px;                      /* nudge down so its text lines up with the other headings */
	}

	.head-label.interactive:hover {
		border-color : var(--black);
		background   : var(--hover);
	}

	.kind, .name, .tags, .edit {
		padding        : var(--gap-tight) 0;
		font-size      : var(--font-base);
		color          : var(--text);
		vertical-align : baseline;
		text-align     : left;
	}

	.kind {
		opacity       : var(--opacity-label);
		padding-right : var(--gap-fat);
		text-align    : right;
		width         : 60px;
	}

	.tags {
		opacity       : var(--opacity-label);
		text-align    : right;
	}

	.edit {
		text-align    : right;
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
