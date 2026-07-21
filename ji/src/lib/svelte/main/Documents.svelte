<script lang='ts'>
	import { w_filter_tags, w_filter_text, w_filter_mode, filter_rows } from '../../ts/managers/Search';
	import { w_operation, w_view_document, T_Operation } from '../../ts/managers/Operations';
	import { save_drop } from '../../ts/managers/Drop';
	import { Document, T_DocumentFamily } from '../../ts/types/Document';
	import View_Document from '../actions/View_Document.svelte';
	import Add_Document from '../actions/Add_Document.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { w_hierarchy } from '../../ts/database/Databases';
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
	let hovered_row = $state<string | null>(null);  // which row the cursor is over — tracked in code, not CSS :hover, so the per-row buttons (which stand a touch taller than the row) still count as "on the row"

	const rows = $derived.by(() => {
		$w_db_changed;                                   // re-read on every store change
		const name_of = new Map($w_hierarchy.tags.map((t) => [t.id, t.name]));
		// Walk parent-first, child-next so folders lead their contents; each row
		// carries how deep it sits (for the indent) and its folder chain above
		// (so a filtered-in file can keep its parent folders on screen).
		return $w_hierarchy.list_documents().map((listed) => {
			const tag_ids = listed.tag_ids;
			const name      = listed.document.name ?? '';
			const extension = listed.document.extension ?? null;
			const family    = listed.document.family ?? null;
			// Drop a trailing extension when it is one this format is stored under
			// (so "notes.txt" shows "notes" and "photo.jpg" in a jpeg row shows
			// "photo"). Folders and unmatched names stay whole; the full name is
			// kept for filtering and the hover tooltip.
			const display_name = Document.strip_known_extension(name, extension);
			return {
				id           : listed.document.id,
				name,
				display_name,
				extension,
				family,
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

	// How many tags exist in the store to pick from. When zero, the row's pencil
	// has nothing to offer, so it shows an "add tags" button instead of the picker.
	const tag_count = $derived.by(() => {
		$w_db_changed;
		return $w_hierarchy.tags.length;
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
		$w_hierarchy.delete_subtree(document_id);
		confirming = null;
		if ($w_view_document === document_id) { close_view(); }
		debug.log(`Trashed document ${document_id} (and anything under it).`);
	}

	function toggle_tag(document_id: string, tag_id: string, on: boolean) {
		if (on) { $w_hierarchy.add_tagging(tag_id, document_id); }
		else    { $w_hierarchy.remove_tagging(tag_id, document_id); }
	}

	// The tag ids currently on one document — the picker's starting selection.
	function chosen_for(document_id: string): Set<string> {
		return new Set($w_hierarchy.indexes.tags_of(document_id));
	}

	// The three table columns, in order: format, name, tags — each label centered
	// in its column. Only "add documents" reacts to hover — the label reads its
	// hover text and clicking opens that add view; format and tags stay inert.
	// The tags column also carries each row's per-document buttons at its right end.
	const columns = [
		{ label: 'format',             hover: null,                 op: null,                 width: '60px' },
		{ label: 'add more documents', hover: 'add more documents', op: T_Operation.document, width: '40%'  },
		{ label: 'tags',               hover: null,                 op: null,                 width: 'auto' },
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
		const target = event.target as HTMLElement;
		// A click outside an open per-row tag editor closes it (clicks on the picker keep it open).
		if (editing && !target.closest('.picker')) {
			debug.log(`Clicked out of the tag editor for document ${editing} — closing it.`);
			editing = null;
		}
		if (!$w_operation) { return; }                        // already showing the list
		if (rows.length === 0) { return; }                   // empty store stays on the drop box — nothing to return to
		if (target.closest('.add-tag')) { return; }          // keep clicks inside the new-tag field; a click anywhere on the open document closes it
		w_operation.set(null);
		w_view_document.set(null);                            // a background click also leaves the view
		debug.log(`Clicked out of the add view with ${rows.length} document(s) in the store — back to the list.`);
	}

	// A drop anywhere on the documents view opens the add-documents view first, then
	// saves — no tags (the drop box handles its own, tagged, drops and stops them
	// from reaching here). Opening the drop box means the count and any question
	// report there, where there's room for them, rather than on the table.
	let dragging = $state(false);
	async function documents_drop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		debug.log('Dropped on the table — opening the add-documents view so the drop reports there.');
		w_operation.set(T_Operation.document);
		await save_drop(event.dataTransfer, new Set());
	}
	function documents_dragover(event: DragEvent) {
		event.preventDefault();
		dragging = true;
	}
	function documents_dragleave() {
		dragging = false;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class='documents' class:dragging onclick={background_click}
	ondrop={documents_drop} ondragover={documents_dragover} ondragleave={documents_dragleave}>
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
			<div class='table-scroll'>
			<table class='blobs-table'>
				<thead>
					<tr class='head'>
						{#each columns as col, i}
							<th style:width={col.width}>
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
						<!-- svelte-ignore a11y_mouse_events_have_key_events -->
						<tr class='file' class:hovered={hovered_row === row.id}
							onmouseenter={() => { if (Document.view_mode(row.extension) !== null) { hovered_row = row.id; } }}
							onmouseleave={() => { if (hovered_row === row.id) { hovered_row = null; } }}>
							<td class='extension'><span>{row.family === T_DocumentFamily.folder ? '---' : (row.extension ?? '')}</span></td>
							<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
							<td class='name' class:viewable={Document.view_mode(row.extension) !== null}
								style:padding-left='{row.depth * 20}px'
								onclick={(e) => { if (Document.view_mode(row.extension) !== null) { e.stopPropagation(); open_view(row.id); } }}><span class='name-text'>{row.display_name}</span></td>
							<td class='tag-actions'>
								<div class='tag-actions-row'>
									{#if editing === row.id}
										{#if tag_count === 0}
											<!-- No tags exist yet to pick from — offer to create some. Same
											     action as the top add-tags control: switch to the tag view. -->
											<button class='add-tags-inline'
												onclick={(e) => { e.stopPropagation(); debug.log(`No tags in the store yet — opening the add-tags view from row ${row.id}.`); $w_operation = T_Operation.tag; }}>add tags</button>
										{:else}
											<!-- The tag picker takes the buttons' place on the row, right-justified;
											     a click outside it (handled by the background) closes it. -->
											<Tags
												selected={chosen_for(row.id)}
												ontoggle={(tag_id, on) => { toggle_tag(row.id, tag_id, on); debug.log(`Toggled a tag on row ${row.id} ${on ? 'on' : 'off'} — closing the picker.`); editing = null; }} />
										{/if}
									{:else}
										<span class='tag-names'>{row.tag_names}</span>
										<!-- Over the buttons, drop the row highlight — they act on their own, not the row. -->
										<!-- svelte-ignore a11y_mouse_events_have_key_events -->
										<div class='row-actions'
											onmouseenter={() => hovered_row = null}
											onmouseleave={() => hovered_row = row.id}>
											{#if confirming === row.id}
												<button class='row-danger' onclick={() => delete_byID(row.id)}>delete</button>
												<button class='row-danger row-x' title='keep' onclick={() => confirming = null}>
													<svg class='row-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
														<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
													</svg>
												</button>
											{:else}
												<button class='row-button' title='edit tags'
													onclick={(e) => { e.stopPropagation(); editing = row.id; }}>✏️</button>
												<button class='row-button trash' title='delete'
													onclick={() => confirming = row.id}>
													<svg class='row-bin' viewBox='0 0 24 24'>
														<path d='M4 6 H20 M9 6 V4 H15 V6 M6 6 L7 20 H17 L18 6 M10 10 V17 M14 10 V17'
															fill='none' stroke='currentColor' stroke-width='1.6'
															stroke-linecap='round' stroke-linejoin='round' />
													</svg>
												</button>
											{/if}
										</div>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			</div>
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
		min-height     : 0;
		overflow       : hidden;               /* the filter, search and header stay put; only the rows scroll */
	}

	/* Only the table body scrolls; it fills the space under the pinned controls. */
	.table-scroll {
		flex       : 1 1 auto;
		min-height : 0;
		overflow-y : auto;
		width      : 100%;
		margin-top : -3px;                     /* nudge the header content up 3px */
	}

	/* A drag over the whole view — an accent frame says a drop will land. */
	.documents.dragging {
		outline        : var(--thickness-fat) var(--accent);
		outline-offset : calc(-1 * var(--gap));
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

	.search-text:hover {
		background : var(--hover);
	}

	hr {
		border      : none;                    /* clear the browser-default hr line... */
		border-top  : var(--thickness-faint) solid var(--accent);   /* ...leaving only this */
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
		table-layout    : fixed;             /* honor the column widths set on the header, so the name can be capped */
		position        : relative;
		width           : 100%;
	}

	/* The header ignores scroll. Sticky must go on the cells, not the <thead>
	   -> a collapsed-border table ignores sticky on the row group. 
	   Solid page-colored cells keep scrolling rows from showing through,
	   and the bottom rule closes off the pinned part, matching the one above. */
	.head th {
		background  : var(--bg);
		position    : sticky;
		top         : 0;
		z-index     : 1;
	}

	/* The closing rule sits a --gap above the cell's bottom, so a --gap of
	   page-colored space below it also stays pinned. Drawn as a positioned line,
	   not a collapsed border — a collapsed border here is shared with the first
	   row and would scroll away with it. */
	.head th::after {
		content    : '';
		position   : absolute;
		left       : 0;
		right      : 0;
		bottom     : var(--gap);
		height     : var(--thickness-faint);
		background : var(--accent);
	}

	/* A faint accent line under each row. */
	.blobs-table .file td {
		border-bottom : var(--thickness-faint) solid var(--accent);
	}

	/* ...but not under the last row — its bottom line is see-through. */
	.blobs-table .file:last-child td {
		border-bottom-color : transparent;
	}

	/* ...and not under the first column (format) — its bottom stays see-through. */
	.blobs-table .file td.extension {
		border-bottom-color : transparent;
	}

	/* The cell is transparent so the rule shows through; only the label pill
	   below masks it. Each label is centered in its column. */
	.head th {
		padding    : 0 0 calc(var(--gap) * 2);   /* content, then room for the rule plus a --gap below it, all pinned */
		text-align : center;
	}

	/* The tags title hugs the right, matching the tags/buttons in the cells below. */
	.head th:last-child {
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

	.extension, .name, .tag-actions {
		padding        : calc(var(--gap-tight) - 1.5px) 0;   /* trimmed 1.5px each side — rows 3px shorter */
		font-size      : var(--font-base);
		color          : var(--text);
		vertical-align : middle;             /* center, not baseline — an empty tag cell no longer adds height */
		text-align     : left;
	}

	/* The name is capped by its 40%-wide column. Clipping lives on an inner block
	   (not the table cell — cell-level ellipsis is unreliable), so both file and
	   folder names cut off with an ellipsis, full text on hover. */
	.name-text {
		display       : block;
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}

	.name.viewable {
		cursor : pointer;
	}

	/* Hovering any row lights the whole row as a row-sized pill — every row has
	   edit and delete actions, so every row is interactive. Driven by a tracked
	   hover state (not CSS :hover) so the slightly-taller buttons still count as
	   being on the row. (Click-to-view and the pointer cursor stay on viewable
	   names only.) */
	.blobs-table .file.hovered td {
		background          : var(--hover);
		border-bottom-color : transparent;
	}

	.blobs-table .file.hovered td:first-child {
		border-top-left-radius    : var(--radius-pill);
		border-bottom-left-radius : var(--radius-pill);
	}

	.blobs-table .file.hovered td:last-child {
		border-top-right-radius    : var(--radius-pill);
		border-bottom-right-radius : var(--radius-pill);
	}

	.extension {
		padding-right : var(--gap-fat);
		text-align    : right;
		width         : 60px;
	}

	/* Dim only the format text, not the whole cell — otherwise the cell's hover
	   highlight is dimmed too and the format column looks like it never lit. */
	.extension span {
		opacity : var(--opacity-label);
	}

	/* One cell holds the tag names (or, while editing, the tag picker) and the
	   per-row buttons — everything hugs the right, the names filling the space.
	   Its height is pinned so the taller picker overflows instead of growing the row. */
	.tag-actions-row {
		height          : calc(var(--height-control) - 9px);
		gap             : var(--gap);
		justify-content : flex-end;
		align-items     : center;
		display         : flex;
		min-height      : 0;
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

	.row-button.trash {
		color : var(--accent-dark);
	}

	.row-bin {
		width   : var(--size-svg);
		height  : var(--size-svg);
		display : block;
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

	/* While confirming a delete, these two bordered buttons replace all three icons:
	   "delete" does it, "x" backs out. */
	/* Standard control height, even though the action row is capped 4px shorter —
	   they overflow that cap by 2px each side so the table row never grows. */
	.row-danger,
	.add-tags-inline {
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

	.add-tags-inline:hover {
		background : var(--hover);
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
		width   : var(--size-svg);
		height  : var(--size-svg);
		display : block;
	}

	.row-cross path {
		stroke : var(--black);
	}

	.row-danger:hover {
		background : var(--hover);
	}
</style>
