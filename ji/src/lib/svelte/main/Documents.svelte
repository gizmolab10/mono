<script lang='ts'>
	import { w_filter_tags, w_filter_text, w_filter_mode, filter_rows } from '../../ts/managers/Search';
	import { w_operation, w_view_document, T_Operation } from '../../ts/managers/Operations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { Document, T_DocumentFamily } from '../../ts/types/Document';
	import View_Document from '../actions/View_Document.svelte';
	import Add_Document from '../actions/Add_Document.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { w_hierarchy } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/types/Signal';
	import { save_drop } from '../../ts/managers/Drop';
	import { Direction } from '../../ts/types/Angle';
	import Add_Tag from '../actions/Add_Tag.svelte';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import { flushSync } from 'svelte';
	import { get } from 'svelte/store';
	import Tags from '../actions/Tags.svelte';

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	// Which folders are shut. One saved list of folder ids, kept across reloads the
	// way the details region's open sections are. A shut folder's contents drop from
	// the table until it's opened again.
	const w_closed = preferences.persistent_set(T_Preference.closedFolders);

	// The open/close triangle: the fat three-corner mark, pointing down when the
	// folder is open, right when it's shut. 15 across.
	const TRIANGLE = 15;
	function triangle_path(open: boolean): string {
		return svg_paths.fat_polygon(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function triangle_bounds(open: boolean): { minX: number; minY: number; width: number; height: number } {
		return svg_paths.fat_polygon_bounds(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function toggle_folder(id: string) {
		w_closed.update((shut) => {
			const next = new Set(shut);
			if (next.has(id)) { next.delete(id); debug.log(`Opened the folder ${id} — its contents come back.`); }
			else              { next.add(id);    debug.log(`Shut the folder ${id} — its contents drop from the table.`); }
			return next;
		});
	}

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
				is_dedup      : listed.is_dedup,
				has_children : listed.has_children,
				place_key    : `${listed.document.id}|${listed.relationship_id ?? ''}`,   // this row's spot: its doc plus the link that put it here (empty for a top-level row)
				tag_ids,
				tag_names    : tag_ids.map((id) => name_of.get(id) ?? '?').join(', '),
			};
		});
	});

	// Drop everything sitting under a shut folder, before the search even looks. A
	// row is under a shut folder when any of its folder chain is in the shut set.
	const open_rows = $derived.by(() => {
		return rows.filter((r) => !r.ancestor_ids.some((a) => $w_closed.has(a)));
	});

	// Narrowed by the shared search-text: every picked tag must logic-choice, and the name must
	// contain the search-text text. A matched file keeps its folder chain on screen too,
	// so it never shows indented under nothing — the ancestors ride along even if they miss.
	const shown = $derived.by(() => {
		const matched = filter_rows(open_rows, $w_filter_tags, $w_filter_text, $w_filter_mode);
		const keep = new Set(matched.map((r) => r.id));
		for (const r of matched) { for (const a of r.ancestor_ids) { keep.add(a); } }
		return open_rows.filter((r) => keep.has(r.id));       // original walk order, ancestors included
	});

	// --- remembering where the table was scrolled -----------------------------

	// A fast lookup from a row's spot to its row number, rebuilt whenever the shown
	// rows change. A spot is a document paired with the link that put it in that row,
	// so a file that shows twice (a duplicate) has two distinct spots — no clash.
	// Used to turn the saved top spot back into a row number at once, no scanning.
	const row_number_byPlace = $derived.by(() => {
		const map = new Map<string, number>();
		shown.forEach((r, i) => { map.set(r.place_key, i); });
		return map;
	});

	// For each folder row, the row number of the last row inside it — its subtree
	// runs from just after it up to (but not including) the next row at its own depth
	// or shallower. Used to keep a folder pinned until the bottom of its last child
	// scrolls past the header.
	const subtree_end_byRow = $derived.by(() => {
		const end = new Map<number, number>();
		shown.forEach((r, i) => {
			if (!r.has_children) { return; }
			let j = i + 1;
			while (j < shown.length && shown[j].depth > r.depth) { j++; }
			end.set(i, j - 1);
		});
		return end;
	});

	// The spot at the top of the scrolled rows — saved across reloads, so the table
	// can return to the same place. A spot (document + its link), not a pixel distance
	// and not a bare document id, so a duplicate returns to the very row left.
	const w_table_top_id = preferences.persistent<string | null>(T_Preference.tableTopId, null);

	let scroller  = $state<HTMLElement | null>(null);   // the scrolling rows area
	let restored  = $state(false);                      // did this table showing already jump to the saved place?
	let save_wait: ReturnType<typeof setTimeout> | null = null;

	// The folders the visible rows sit inside — pinned just under the header while
	// scrolling, so it stays clear where you are. The whole chain of open folders above
	// the top row, root-first. Holds the full rows, so a pinned folder is drawn — and
	// behaves — exactly like its own row (its triangle and buttons still work).
	const PIN_LIFT = 1;                                  // lift the pinned markers (and the pin line) 1px so they sit flush under the header
	// Each pinned folder plus the exact top (in the region's own coordinates) its marker
	// sits at — so the marker is placed right on its pin line, never off by the small
	// difference between a rendered marker's height and the real row's height.
	let pinned    = $state<Array<(typeof rows)[number]>>([]);
	let header_px  = $state(0);                          // the header's height, for placing the pinned markers below it
	let content_px = $state(0);                          // the scroll area's content width (minus the scrollbar), for the pinned overlay's width
	let pin_frame: number | null = null;

	// The height of the pinned header, so a row can be placed just below it rather
	// than hidden behind it.
	function header_height(): number {
		return (scroller?.querySelector('thead') as HTMLElement | null)?.offsetHeight ?? 0;
	}

	// The row now at the top: the first one sitting fully below the header line (its
	// top at or past it). A folder whose top has begun to slide under the header is
	// no longer this row — so it becomes a pinned marker the instant it starts to go,
	// with no gap where it is neither shown nor pinned.
	function top_row_element(): HTMLElement | null {
		if (!scroller) { return null; }
		const cutoff = scroller.getBoundingClientRect().top + header_height();
		for (const tr of scroller.querySelectorAll('tbody tr')) {
			if (tr.getBoundingClientRect().top >= cutoff - 1) { return tr as HTMLElement; }
		}
		return null;
	}

	// The spot now at the top, saved (a short wait after scrolling settles, so a fast
	// scroll saves once).
	function remember_top() {
		const tr = top_row_element();
		if (!tr) { return; }
		const key = tr.dataset.key ?? null;
		w_table_top_id.set(key);
		debug.log(`Table scroll: top spot is now "${tr.dataset.name ?? key}" (row ${tr.dataset.n}).`);
	}

	// The folders to pin, and the stack they form. Walking the rows outer-folder-first,
	// a running line starts at the header's bottom. A folder pins when its own row has
	// slid above that line but its last child is still below it — and once pinned, the
	// line drops by that marker's height, so the next (inner) folder only begins to
	// stick when its top slides behind the marker already pinned above it. A folder
	// stays pinned until the bottom of its whole subtree passes the line.
	function update_pins(): boolean {
		header_px = header_height();
		if (!scroller) { const had = pinned.length > 0; if (had) { pinned = []; } return had; }
		content_px = scroller.clientWidth;                              // the content width, minus the scrollbar
		// At the very top nothing is scrolled off, so nothing pins.
		if (scroller.scrollTop <= 0) { const had = pinned.length > 0; if (had) { pinned = []; } return had; }
		const table_rows = scroller.querySelectorAll('tbody tr');
		const chain: Array<(typeof rows)[number]> = [];
		// `offset` is the top of the next marker in the region's own coordinates; the pin
		// line is that same place in viewport coordinates. Each marker is placed AT its
		// pin line (offset), so its screen position matches exactly, and the next marker
		// stacks below by this row's real height — no gap from a marker rendering a hair
		// taller or shorter than its row.
		const region_top = scroller.getBoundingClientRect().top;
		let offset = header_px - PIN_LIFT;
		shown.forEach((r, i) => {
			if (!r.has_children) { return; }
			const folder_tr = table_rows[i] as HTMLElement | undefined;
			const last_tr   = table_rows[subtree_end_byRow.get(i) ?? i] as HTMLElement | undefined;
			if (!folder_tr || !last_tr) { return; }
			const rect        = folder_tr.getBoundingClientRect();
			const subtree_bot = last_tr.getBoundingClientRect().bottom;
			const line = region_top + offset;
			if (rect.top < line && subtree_bot > line) {
				chain.push(r);
				offset += rect.height;   // advance the pin line for the next (inner) folder
			}
		});
		// Only touch the state when the pinned set actually changes, to avoid needless redraws.
		const changed = chain.length !== pinned.length
			|| chain.some((c, i) => c.id !== pinned[i]?.id);
		if (changed) {
			pinned = chain;
		}
		return changed;
	}

	function on_scroll() {
		if (save_wait !== null) { clearTimeout(save_wait); }
		save_wait = setTimeout(remember_top, 150);       // save once the scrolling settles
		// Once per frame: on the first scroll event of a frame, measure and place the
		// markers now — in the same frame as the scroll — and paint them with flushSync,
		// so a marker never lands a frame after the row moved (that reads as a 1px flick).
		// Later events in the same frame are skipped, so a fast drag can't storm it.
		// Decide the pinned set on every scroll event, so a marker never lands a frame
		// after the row already crossed the line (that's the up-then-down flick). Only
		// force a same-frame paint when the set actually changed — which happens only at
		// a crossing, so a fast drag never storms the browser with forced layouts.
		if (update_pins()) { flushSync(); }
	}

	// Recompute the pinned folders whenever the shown rows change (a fold, a filter,
	// a delete) — the top row, and so its chain, may be different now. Deferred a frame
	// so it measures a settled layout: on a fresh load the header height, the row
	// positions, and the scrollbar width aren't ready yet, and measuring too early both
	// pins folders that shouldn't be and overruns the scrollbar.
	$effect(() => {
		shown;
		if (!scroller) { return; }
		if (pin_frame === null) { pin_frame = requestAnimationFrame(() => { pin_frame = null; update_pins(); }); }
	});

	// Put the rows back where they were: turn the saved id into a row number through
	// the map, find that row, and place it just under the header. If the saved item
	// is gone from the list, start at the top.
	//
	// On a fresh load the scroll area often has no height yet, so setting how far
	// down it is scrolled clamps to the top. So it tries on the next frame, and keeps
	// trying (up to a few frames) until the area is tall enough to actually hold the
	// place asked for — then the position takes.
	function restore_top() {
		if (!scroller) { return; }
		const key = get(w_table_top_id);
		if (!key) { return; }
		const n = row_number_byPlace.get(key);
		if (n === undefined) { scroller.scrollTop = 0; debug.log(`Table scroll: saved top spot ${key} is not in the list now — starting at the top.`); return; }

		let tries = 0;
		const apply = () => {
			if (!scroller) { return; }
			const tr = scroller.querySelectorAll('tbody tr')[n] as HTMLElement | undefined;
			if (!tr) { if (tries++ < 10) { requestAnimationFrame(apply); } return; }   // rows not painted yet
			const want = Math.max(0, tr.offsetTop - header_height());
			scroller.scrollTop = want;
			// It clamped short of where we asked — the area isn't tall enough yet, so try again.
			if (want > 0 && scroller.scrollTop < want - 1 && tries++ < 10) {
				requestAnimationFrame(apply);
			} else {
				debug.log(`Table scroll: restored to "${tr.dataset.name ?? key}" (row ${n}) — scrolled ${scroller.scrollTop} of a wanted ${want}, after ${tries} extra frame(s).`);
				update_pins();                              // the pinned folders match the restored place
			}
		};
		requestAnimationFrame(apply);
	}

	// Jump to the saved place once each time the table is shown (after a reload, or
	// after closing a viewed file). The scroller binding clears when the table is
	// swapped out, which arms the next showing to restore again.
	$effect(() => {
		if (!scroller) { restored = false; return; }
		if (!restored && shown.length > 0) { restore_top(); restored = true; }
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

	// The run the viewer steps through: the rows on screen right now (search and
	// folds already applied) that the viewer can actually show — folders and
	// unshowable kinds are skipped. A duplicate that shows twice is two stops, so
	// this is a list of places, kept as the very row objects from the table.
	const viewable_run = $derived(shown.filter((r) => Document.view_mode(r.extension) !== null));

	// Where in that run the open document sits. Stepping moves this, not the id,
	// since one file can sit at two places. There is more than one stop to move
	// between only when the run holds more than one.
	let view_pos = $state(0);
	const can_step = $derived(viewable_run.length > 1);

	// Open the view for one row; close it back to the list. Opening also marks where
	// that row sits in the run, so the triangles know where they are.
	function open_view(row: { id: string; name: string }) {
		const pos = viewable_run.indexOf(row as (typeof viewable_run)[number]);
		view_pos = pos < 0 ? 0 : pos;
		w_view_document.set(row.id);
		w_operation.set(T_Operation.view);
		debug.log(`Viewing "${row.name}" — stop ${view_pos + 1} of ${viewable_run.length} showable on screen.`);
	}

	// Step to the file before or after, wrapping around at both ends. Nothing to do
	// when there's only one showable file.
	function step(delta: number) {
		const run = viewable_run;
		if (run.length < 2) { debug.log(`Step ignored — only ${run.length} showable file on screen.`); return; }
		view_pos = (view_pos + delta + run.length) % run.length;
		w_view_document.set(run[view_pos].id);
		debug.log(`Stepped ${delta > 0 ? 'forward' : 'back'} to "${run[view_pos].name}" — stop ${view_pos + 1} of ${run.length}.`);
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

<!-- The three cells of a file/folder row: format, name (with the open/close triangle),
     and tags + the per-row buttons. Shared by the scrolling rows and the pinned folder
     markers, so a pinned folder behaves exactly like its own row. -->
{#snippet file_cells(row: (typeof rows)[number])}
	<td class='extension'><span>{row.family === T_DocumentFamily.folder ? '---' : (row.extension ?? '')}</span></td>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<td class='name' class:viewable={Document.view_mode(row.extension) !== null}
		style:padding-left='{row.depth * 5}px'
		onclick={(e) => { if (Document.view_mode(row.extension) !== null) { e.stopPropagation(); open_view(row); } }}><span class='name-line'><span class='tri-slot'>{#if row.has_children}{@const open = !$w_closed.has(row.id)}{@const b = triangle_bounds(open)}<button class='tri' title={open ? 'close this folder' : 'open this folder'} onclick={(e) => { e.stopPropagation(); toggle_folder(row.id); }}><svg overflow='visible' width={b.width} height={b.height} viewBox='{b.minX} {b.minY} {b.width} {b.height}'><path d={triangle_path(open)} /></svg></button>{/if}</span><span class='name-text'>{#if row.is_dedup}<span class='dedup-mark' title='also here — the same file, shown under another parent'>↳ </span>{/if}{row.display_name}</span></span></td>
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
				<div class='row-actions' role='group'
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
{/snippet}

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
		<View_Document document_id={$w_view_document} onclose={close_view}
			can_step={can_step} onprev={() => step(-1)} onnext={() => step(1)} />
	{:else}
		<hr>
		{#if rows.length === 0}
			<div class='empty'>no documents yet</div>
		{:else}
			<div class='table-region'>
			<div class='table-scroll' bind:this={scroller} onscroll={on_scroll}>
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
					{#each shown as row, row_number}
						<!-- svelte-ignore a11y_mouse_events_have_key_events -->
						<tr class='file' class:hovered={hovered_row === row.id} class:dedup={row.is_dedup}
							data-key={row.place_key} data-n={row_number} data-name={row.display_name}
							onmouseenter={() => { if (Document.view_mode(row.extension) !== null) { hovered_row = row.id; } }}
							onmouseleave={() => { if (hovered_row === row.id) { hovered_row = null; } }}>
							{@render file_cells(row)}
						</tr>
					{/each}
				</tbody>
			</table>
			</div>
			{#if pinned.length > 0}
				<!-- The pinned folders in one stacked block just under the header, so
				     neighbours share a single collapsed border (a clean line between each).
				     Each is a copy of its own folder row (same cells, so its triangle and
				     buttons work). Stops short of the scrollbar. -->
				<table class='blobs-table sticky-parents' style:top='{header_px - PIN_LIFT}px' style:width='{content_px}px'>
					<colgroup><col style='width:60px' /><col style='width:40%' /><col style='width:auto' /></colgroup>
					<tbody>
						{#each pinned as parent (parent.place_key)}
							<tr class='file pinned'>
								{@render file_cells(parent)}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
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
		overflow       : hidden;               /* the filter, search and header stay put; only the rows scroll */
		display        : flex;
		height         : 100%;
		width          : 100%;
		min-height     : 0;
	}

	/* Holds the scrolling rows and the pinned-folder overlay stacked on top of them. */
	.table-region {
		flex           : 1 1 auto;
		position       : relative;
		flex-direction : column;
		display        : flex;
		width          : 100%;
		min-height     : 0;
	}

	/* Only the table body scrolls; it fills the space under the pinned controls. */
	.table-scroll {
		flex       : 1 1 auto;
		overflow-y : auto;
		width      : 100%;
		min-height : 0;
	}

	/* A real 20px scrollbar that reserves its own width, so the content (and the
	   pinned-folder overlay measured from it) ends cleanly at the scrollbar instead of
	   running under a floating one. */
	.table-scroll::-webkit-scrollbar {
		width : 20px;
	}

	.table-scroll::-webkit-scrollbar-thumb {
		background    : var(--accent);
		border-radius : 999px;
	}

	.table-scroll::-webkit-scrollbar-track {
		background : transparent;
	}

	/* The pinned folders: a copy of the table sitting just below the column header,
	   holding one row per pinned folder. Stops short of the scrollbar (right is set to
	   its width). Can't be clicked — only shows where you are. */
	table.sticky-parents {
		box-sizing : border-box;               /* the inline height holds the row + its bottom line, so markers stack flush */
		position   : absolute;                 /* qualified with the tag so it beats .blobs-table's position: relative */
		left       : 0;
		z-index    : 2;                        /* above the rows; the header (z 1) sits above it */
		/* takes pointer events so a pinned folder's triangle and buttons still work;
		   width is set inline to the scroll content width, so it ends at the scrollbar */
	}

	/* Each pinned row is solid page-colored so the scrolling rows don't show through,
	   and carries a faint accent line under every cell (the table qualifier wins over
	   the see-through bottoms rows normally have on the format cell and the last row),
	   so the pinned stack reads as its own set of rows. */
	table.sticky-parents .file.pinned td {
		border-bottom : var(--thickness-faint) solid var(--accent);
		background    : var(--bg);
	}

	/* Hovering a pinned row lights it to the hover color, like a row in the list. */
	table.sticky-parents .file.pinned:hover td {
		background : var(--hover);
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

	/* The name row: a fixed triangle slot, then the name. The slot is always there
	   (even for files and childless folders) so every name lines up at its indent. */
	.name-line {
		align-items : center;
		display     : flex;
		min-width   : 0;
	}

	.tri-slot {
		width           : 16px;
		flex            : 0 0 auto;
		align-items     : center;
		justify-content : center;
		display         : flex;
	}

	/* The open/close triangle: page-colored inside with an accent outline, filling
	   to the hover color under the cursor. */
	.tri {
		border          : none;
		background      : transparent;
		padding         : 0;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
	}

	.tri path {
		fill         : var(--bg);
		stroke       : var(--accent);
		stroke-width : 1;
	}

	.tri:hover path {
		fill : var(--hover);
	}

	/* The name is capped by its 40%-wide column. Clipping lives on an inner block
	   (not the table cell — cell-level ellipsis is unreliable), so both file and
	   folder names cut off with an ellipsis, full text on hover. */
	.name-text {
		flex          : 1;
		min-width     : 0;
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}

	.name.viewable {
		cursor : pointer;
	}

	/* A second appearance of the same file (its "also here" dedup under another
	   parent) reads lighter, so the home row is clearly the solid one. */
	.blobs-table .file.dedup td {
		opacity : var(--opacity-label);
	}

	/* The little turn-in mark before an dedup's name. */
	.dedup-mark {
		opacity : var(--opacity-label);
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
