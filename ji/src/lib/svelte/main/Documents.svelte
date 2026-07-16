<script lang='ts'>
	import { w_filter_tags, w_filter_text, w_filter_mode, filter_rows } from '../../ts/managers/Search';
	import { w_operation, w_view_document, T_Operation } from '../../ts/managers/Operations';
	import { T_DocumentKind, view_mode } from '../../ts/types/DB_Records';
	import View_Document from '../actions/View_Document.svelte';
	import Add_Document from '../actions/Add_Document.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/types/Signal';
	import Add_Tag from '../actions/Add_Tag.svelte';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import Tags from '../actions/Tags.svelte';

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	// The documents view: every file in the active store as type + name + its tags,
	// each row with an "edit tags" button that opens the tag picker for that
	// document. Live off the store-changed tick. The search-text (picked tags + text)
	// is the shared Search state.

	let editing = $state<string | null>(null);      // which row's tag editor is open
	let confirming = $state<string | null>(null);   // which row is asking for delete?

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

	// The view operation is persisted but the document it points at is not, so a
	// reload can land on "view" with nothing to show. Fall back to the list then.
	$effect(() => {
		if ($w_operation === T_Operation.view && $w_view_document === null) {
			w_operation.set(null);
		}
	});

	// Open the view for one document; close it back to the list.
	function open_view(document_id: string) {
		w_view_document.set(document_id);
		w_operation.set(T_Operation.view);
		debug.log(`Viewing document ${document_id}.`);
	}
	function close_view() {
		w_view_document.set(null);
		if ($w_operation === T_Operation.view) { w_operation.set(null); }
	}

	// Trash one document — and, for a folder, everything under it. Asked first.
	function delete_byID(document_id: string) {
		databases.active.delete_subtree(document_id);
		confirming = null;
		if ($w_view_document === document_id) { close_view(); }
		debug.log(`Trashed document ${document_id} (and anything under it).`);
	}

	function toggle_tag(document_id: string, tag_id: string, on: boolean) {
		if (on) { databases.active.add_tagging(tag_id, document_id); }
		else    { databases.active.remove_tagging(tag_id, document_id); }
	}

	// The tag ids currently on one document — the picker's starting selection.
	function chosen_for(document_id: string): Set<string> {
		return new Set(databases.active.indexes.tags_of(document_id));
	}

	// The three table columns, in order: format hugs the right edge of its cell, the
	// other two hug the left. Only "add documents" reacts to hover — the label reads
	// its hover text and clicking opens that add view; format and tags stay inert.
	// The tags column also carries each row's per-document buttons at its right end.
	const columns = [
		{ label: 'format',        right: true,  hover: null,            op: null                 },
		{ label: 'add documents', right: false, hover: 'add documents', op: T_Operation.document },
		{ label: 'tags',          right: false, hover: null,            op: null                 },
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
		if (target.closest('.add-tag, .viewer')) { return; }  // keep clicks inside the new-tag field or the open document
		w_operation.set(null);
		w_view_document.set(null);                            // a background click also leaves the view
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
	{:else if $w_operation === T_Operation.tag}
		<Add_Tag ondone={() => w_operation.set(null)} />
	{:else if $w_operation === T_Operation.view && $w_view_document}
		<View_Document document_id={$w_view_document} onclose={close_view} />
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
							<td class='tag-actions'>
								<div class='tag-actions-row'>
									<span class='tag-names'>{row.tag_names}</span>
									<div class='row-actions'>
										{#if confirming === row.id}
											<button class='row-danger' onclick={() => delete_byID(row.id)}>delete</button>
											<button class='row-danger row-x' title='keep' onclick={() => confirming = null}>
												<svg class='row-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
													<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
												</svg>
											</button>
										{:else}
											<button class='row-button' title='edit tags'
												onclick={() => editing = editing === row.id ? null : row.id}>✏️</button>
											<button class='row-button' class:blank={row.kind === T_DocumentKind.folder} title='view'
												disabled={row.kind === T_DocumentKind.folder || view_mode(row.kind) === null}
												onclick={() => open_view(row.id)}>👁</button>
											<button class='row-button' title='delete'
												onclick={() => confirming = row.id}>🗑</button>
										{/if}
									</div>
								</div>
							</td>
						</tr>
						{#if editing === row.id}
							<tr class='editor'>
								<td colspan='3'>
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
		padding    : 0 0 var(--gap);
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

	.kind, .name, .tag-actions {
		padding        : calc(var(--gap-tight) - 1.5px) 0;   /* trimmed 1.5px each side — rows 3px shorter */
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

	/* One cell holds the tag names on the left and the per-row buttons on the right. */
	.tag-actions-row {
		gap             : var(--gap);
		justify-content : space-between;
		align-items     : center;
		display         : flex;
	}

	.tag-names {
		opacity    : var(--opacity-label);
		text-align : right;             /* the tags sit to the right, just left of the buttons */
		flex       : 1;
	}

	/* The per-row actions: edit tags, view, delete — quiet icon buttons, no border
	   and a see-through background, sitting at the right end of the row. */
	.row-actions {
		height          : calc(var(--height-control) - 4px);   /* constant, so the row doesn't grow when the confirm buttons appear */
		gap             : var(--gap-tight);
		justify-content : flex-end;
		align-items     : center;
		display         : flex;
		min-height      : 0;            /* as a flex child, honor that height cap instead of stretching to the taller confirm buttons */
	}

	.row-button {
		border          : var(--thickness-normal) solid transparent;   /* reserved, so hover adds no shift */
		height          : calc(var(--height-control) - 4px);
		width           : calc(var(--height-control) - 4px);
		border-radius   : var(--radius-percent);
		opacity         : var(--opacity-label);
		font-size       : var(--font-label);
		background      : transparent;
		box-sizing      : border-box;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
	}

	.row-button:not(:disabled):hover {
		border-color : var(--black);
		background   : var(--hover);
		opacity      : 1;
	}

	.row-button:disabled {
		opacity : calc(var(--opacity-label) / 2);
		cursor  : default;
	}

	/* A folder has nothing to show, so its eye is invisible — but still holds its
	   place, so edit and delete line up across every row. */
	.row-button.blank {
		visibility : hidden;
	}

	/* While confirming a delete, these two bordered buttons replace all three icons:
	   "delete" does it, "x" backs out. */
	/* Standard control height, even though the action row is capped 4px shorter —
	   they overflow that cap by 2px each side so the table row never grows. */
	.row-danger {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	/* The keep button is a circle holding the shared cross: equal width and height,
	   no side padding, its svg centered. */
	.row-x {
		border-radius   : var(--radius-percent);
		width           : var(--height-control);
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
	}

	.row-cross {
		width   : calc(var(--height-control) * 0.5);
		height  : calc(var(--height-control) * 0.5);
		display : block;
	}

	.row-cross path {
		stroke : var(--black);
	}

	.row-danger:hover {
		background : var(--hover);
	}

	.editor td {
		padding-bottom : var(--gap);
	}
</style>
