<script lang='ts'>
	import { w_filter_tags, w_filter_text, w_filter_mode, w_filter_families, filter_rows } from '../../ts/managers/Filter_Documents';
	import { w_folders_shut } from '../../ts/managers/Folds';
	import { w_operation, w_view_document, T_Operation, w_viewable_run, open_view, close_view } from '../../ts/managers/Operations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { Document, T_DocumentFamily } from '../../ts/types/Document';
	import { w_hierarchy } from '../../ts/database/Databases';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import Select_Tags from '../support/Select_Tags.svelte';
	import { w_db_changed } from '../../ts/types/Signal';
	import Separator from '../support/Separator.svelte';
	import { save_drop } from '../../ts/managers/Drop';
	import { Direction } from '../../ts/types/Angle';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import { get } from 'svelte/store';

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);
	const trash_svgpath = svg_paths.trashcan();

	// The family filter's segments: one per document family, in enum order, minus
	// "folder" (not a filterable content family here). Clicking a segment toggles that
	// family in the saved list (adds it if off, removes it if on). An empty list means
	// no family filter is applied.
	const families = Object.values(T_DocumentFamily).filter((f) => f !== T_DocumentFamily.folder);
	function toggle_family(family: string) {
		w_filter_families.update((list) => {
			const has  = list.includes(family);
			const next = has ? list.filter((f) => f !== family) : [...list, family];
			debug.log(`Family filter: "${family}" ${has ? 'removed' : 'added'} — now [${next.join(', ')}].`);
			return next;
		});
	}

	// Which folders are shut. A shut folder's contents drop from the table until it's
	// opened again. My own store keeps its folds across reloads; the AI store's last
	// only for this visit — see the shared fold state.
	const w_closed = w_folders_shut;

	// The open/close triangle: a plain isosceles pointer, pointing down when the
	// folder is open, right when it's shut. Sized to the shared drawn-glyph size (~19.7).
	const TRIANGLE = k.size.svg;
	function triangle_path(open: boolean): string {
		return svg_paths.soft_pointer(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function triangle_bounds(open: boolean): { minX: number; minY: number; width: number; height: number } {
		return svg_paths.soft_pointer_bounds(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function toggle_folder(id: string) {
		w_closed.update((shut) => {
			const next = new Set(shut);
			if (next.has(id)) { next.delete(id); }
			else              { next.add(id); }
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
				viewable     : listed.document.viewable ?? false,
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

	// The picked tags that still exist in this store. The picks are saved across
	// reloads, so a tag deleted since (or a store that hasn't loaded its tags yet)
	// could otherwise narrow the list to nothing with no picker on screen to undo it.
	// Ignoring the missing ones can't reach that dead end, and the pick stays saved —
	// so if that tag comes back, so does the filter.
	const picked_tags = $derived.by(() => {
		$w_db_changed;
		const exists = new Set($w_hierarchy.tags.map((t) => t.id));
		const kept   = new Set(Array.from($w_filter_tags).filter((id) => exists.has(id)));
		if (kept.size !== $w_filter_tags.size) {
			debug.log(`Tag filter: ${$w_filter_tags.size} tag(s) picked, ${kept.size} still in the store — the missing ${$w_filter_tags.size - kept.size} are ignored (still saved).`);
		}
		return kept;
	});

	// Narrowed by the shared search: picked tags, name text, and picked families all
	// narrow together. filter_rows returns only surviving content rows (never folders);
	// here each such row pulls its folder chain back on screen, so a matched file never
	// shows indented under nothing — and a folder left with no surviving row drops.
	// A filter searches the WHOLE list (so a match inside a shut folder is found), but the
	// display still honors the folds: a shut folder shows as the path to its matches, while
	// its matched children stay hidden until you open it. With no filter, only the open rows show.
	const shown = $derived.by(() => {
		const filtering = picked_tags.size > 0 || $w_filter_text.trim() !== '' || $w_filter_families.length > 0;
		const searched = filtering ? rows : open_rows;
		const matched = filter_rows(searched, picked_tags, $w_filter_text, $w_filter_mode, $w_filter_families);
		const keep = new Set(matched.map((r) => r.id));
		for (const r of matched) { for (const a of r.ancestor_ids) { keep.add(a); } }
		const display = open_rows.filter((r) => keep.has(r.id));   // fold-respecting: hides matches under a shut folder
		debug.log(`List: ${filtering ? 'filter on — searched all' : 'no filter — searched open'} ${searched.length} row(s); ${matched.length} match(es); showing ${display.length} open row(s) (a shut folder keeps its matches hidden until opened).`);
		return display;
	});


	// How many files under each folder match the active filter — the ones on screen plus
	// the ones a shut fold is hiding. The filter runs over the full walk (not the folded,
	// on-screen set), so a shut folder still shows its whole matching count. Only files
	// are counted: the folders in between are the structure holding them, not things in
	// their own right. A file counts for every folder above it, so a nested file shows in
	// its own folder's tally and in each folder further up. Shown in the folder's format
	// cell in place of "---".
	const folder_count = $derived.by(() => {
		const matched = filter_rows(rows, picked_tags, $w_filter_text, $w_filter_mode, $w_filter_families);
		const map = new Map<string, number>();
		for (const r of matched) {
			for (const a of r.ancestor_ids) { map.set(a, (map.get(a) ?? 0) + 1); }
		}
		debug.log(`Folder counts: ${map.size} folder(s) hold at least one matching file; ${matched.length} file(s) of ${rows.length} row(s) match the filter (folders themselves are never counted).`);
		return map;
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

	// The spot at the top of the scrolled rows — saved across reloads, so the table
	// can return to the same place. A spot (document + its link), not a pixel distance
	// and not a bare document id, so a duplicate returns to the very row left.
	const w_table_top_id = preferences.persistent<string | null>(T_Preference.scroll_files_to, null);

	let scroller  = $state<HTMLElement | null>(null);   // the scrolling rows area
	let restored  = $state(false);                      // did this table showing already jump to the saved place?
	let save_wait: ReturnType<typeof setTimeout> | null = null;

	// The header is its own table above the scroller now, so the top of the scroller is
	// already just below it — a restored row needs no extra offset.
	function header_height(): number {
		return 0;
	}

	// The row now at the top: the first one sitting fully below the header line (its
	// top at or past it). Used to remember and restore the scroll place.
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

	function on_scroll() {
		if (save_wait !== null) { clearTimeout(save_wait); }
		save_wait = setTimeout(remember_top, 150);       // save once the scrolling settles
	}

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


	// Keep the viewer's run in sync: the on-screen showable rows (search and folds
	// applied), in table order. The viewer lives outside the list now, so it reads
	// this shared run to step. A duplicate that shows twice is two stops, told apart
	// by the row's place key.
	$effect(() => {
		w_viewable_run.set(shown.filter((r) => r.viewable).map((r) => ({ id: r.id, name: r.name, place_key: r.place_key })));
	});

	// Trash one document — and, for a folder, everything under it. Asked first.
	function delete_byID(document_id: string) {
		$w_hierarchy.delete_subtree(document_id);
		confirming = null;
		if ($w_view_document === document_id) { close_view(); }
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
		{ label: 'format', hover: null, op: null, width: '60px' },
		{ label: 'name',   hover: null, op: null, width: '60%'  },
		{ label: 'tags',   hover: null, op: null, width: 'auto' },
	];

	let hovered = $state<number | null>(null);

	// While the cursor is anywhere over the drop-opener zone — the two dividers and the column
	// header between them — the "drop files below" tab lights as if the cursor were on it. The
	// whole zone acts as one large hover target for that one tab.
	let drop_opener_hovered = $state(false);
	function set_drop_opener_hover(on: boolean): void {
		drop_opener_hovered = on;
	}
	// A click anywhere in the zone opens the drop box — the same action the tab runs. Stopped so
	// the background click-clearer below doesn't see it and bounce straight back to the list.
	function open_drop(event: MouseEvent): void {
		event.stopPropagation();
		w_operation.set(T_Operation.drop);
	}

	// One click handler for every header, told which column it was. The two middle
	// headers switch the content area to their add view; format and edit-tags do
	// nothing.
	function head_click(event: MouseEvent, col: number) {
		event.stopPropagation();                              // don't let this reach the background clearer
		const op = columns[col].op;
		if (!op) {
			return;
		}
		w_operation.set(op);
	}

	// A click on the empty background leaves the add view and returns to the list.
	// Clicks inside the drop box or the new-tag field are kept so they don't dismiss
	// mid-interaction. The picked filters are untouched — only the add view clears.
	function background_click(event: MouseEvent) {
		const target = event.target as HTMLElement;
		// A click outside an open per-row tag editor closes it (clicks on the picker keep it open).
		if (editing && !target.closest('.picker')) {
			editing = null;
		}
		if ($w_operation !== T_Operation.drop) { return; }    // only a click while adding returns to the list
		if (rows.length === 0) { return; }                   // empty store stays on the drop box — nothing to return to
		if (target.closest('.add-tag')) { return; }          // keep clicks inside the new-tag field; a click anywhere on the open document closes it
		w_operation.set(T_Operation.files);
		w_view_document.set(null);                            // a background click also leaves the view
	}

	// A drop anywhere on the documents view opens the add-documents view first, then
	// saves — no tags (the drop box handles its own, tagged, drops and stops them
	// from reaching here). Opening the drop box means the count and any question
	// report there, where there's room for them, rather than on the table.
	let dragging = $state(false);
	async function documents_drop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		w_operation.set(T_Operation.drop);
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
     and tags + the per-row buttons. -->
{#snippet document_row(row: (typeof rows)[number])}
	<td class='extension'><span>{row.family === T_DocumentFamily.folder ? (folder_count.get(row.id) ?? 0) : (row.extension ?? '')}</span></td>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<td class='name' class:viewable={row.viewable}
		style:padding-left='{row.depth * 5}px'
		use:tip={row.viewable ? `open "${row.name}"` : false}
		onclick={(e) => { if (row.viewable) { e.stopPropagation(); open_view(row); } }}>
		<span class='name-line'>
			<span class='tri-slot' style:width='{TRIANGLE}px'>
				{#if row.has_children}
					{@const open = !$w_closed.has(row.id)}
					{@const b = triangle_bounds(open)}
					{@const prefix = open ? 'collapse' : 'expand'}
					<button class='tri' aria-label={`${prefix} folder`} use:tip={`${prefix} "${row.name}"`} onclick={(e) => { e.stopPropagation(); toggle_folder(row.id); }}>
						<svg overflow='visible' width={b.width} height={b.height} viewBox='{b.minX} {b.minY} {b.width} {b.height}'>
							<path d={triangle_path(open)} />
						</svg>
					</button>
				{/if}
			</span><span class='name-text'>{#if row.is_dedup}<span class='dedup-mark' use:tip={'also here — the same file, shown under another parent'}>↳ </span>{/if}{row.display_name}</span>
		</span>
	</td>
	<td class='tag-actions'>
		<div class='tag-actions-row'>
			{#if editing === row.id}
				{#if tag_count > 0}
					<!-- The tag picker takes the buttons' place on the row, right-justified;
					     a click outside it (handled by the background) closes it. -->
					<Select_Tags
						selected={chosen_for(row.id)}
						ontoggle={(tag_id, on) => { toggle_tag(row.id, tag_id, on); editing = null; }} />
				{/if}
			{:else}
				<span class='tag-names'>{row.tag_names}</span>
				<!-- Over the buttons, drop the row highlight — they act on their own, not the row. -->
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<div class='row-actions' role='group'
					onmouseenter={() => hovered_row = null}
					onmouseleave={() => hovered_row = row.id}>
					{#if confirming === row.id}
						<button class='row-danger' use:tip={'delete for good'} onclick={() => delete_byID(row.id)}>delete</button>
						<button class='row-danger row-x' aria-label='keep' use:tip={'cancel'} onclick={() => confirming = null}>
							<svg class='row-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
								<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
							</svg>
						</button>
					{:else}
						{#if tag_count > 0}
							<button class='row-button' aria-label='edit tags' use:tip={`assign tags to "${row.name}"`}
								onclick={(e) => { e.stopPropagation(); editing = row.id; }}>✏️</button>
						{/if}
						<button class='row-button trash' aria-label='remove' use:tip={`remove "${row.name}"`}
							onclick={() => confirming = row.id}>
							<svg class='row-bin' viewBox='0 0 24 24'>
								<path d={trash_svgpath}
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
	{#if rows.length > 0}
		{#if tag_count > 0}
			<div class='tags'>
				<Select_Tags
					bind:selected={$w_filter_tags}
					bind:mode={$w_filter_mode} />
			</div>
		{/if}
		<div class='families'>
			{#each families as family}
				<button
					class='segment'
					class:current={$w_filter_families.includes(family)}
					use:tip={Document.endings_of(family).join(', ')}
					onclick={() => toggle_family(family)}>{family}</button>
			{/each}
		</div>
		<input class='search-text' type='search' placeholder='search file names' bind:value={$w_filter_text} />
	{/if}
	{#if rows.length === 0}
		<div class='top-sep'>
			<Separator thickness={k.separator.fat} title='drop files below' onclick={open_drop} />
		</div>
		<div class='empty'>no documents yet</div>
	{:else}
		<div class='table-region'>
		<!-- The two dividers and the column header between them form one zone: pointing anywhere in
		     here lights the "drop files below" tab, and clicking anywhere in it opens the drop box —
		     the same action the tab runs. The zone sits in a layer in front of the rows. -->
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div class='drop-opener'
			onclick={open_drop}
			use:tip={'click to drop files'}
			onmouseenter={() => set_drop_opener_hover(true)}
			onmouseleave={() => set_drop_opener_hover(false)}>
		<div class='top-sep'>
			<Separator thickness={k.separator.fat} title='drop files below' hovered={drop_opener_hovered} onclick={open_drop} />
		</div>
		<!-- The header is its own table, sitting still above the scroller, so the
		     scrollbar runs only beside the document rows — not past the title row. -->
		<div class='table-head'>
			<table class='files-table'>
				<colgroup>{#each columns as col}<col style:width={col.width} />{/each}</colgroup>
				<thead>
					<tr class='head'>
						{#each columns as col, i}
							<th>
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
			</table>
		</div>
			<div class='head-sep'><Separator /></div>
			</div>
			<div class='table-scroll' bind:this={scroller} onscroll={on_scroll}>
				<table class='files-table'>
					<colgroup>{#each columns as col}<col style:width={col.width} />{/each}</colgroup>
					<tbody>
						{#each shown as row, row_number (row.place_key)}
							<!-- svelte-ignore a11y_mouse_events_have_key_events -->
							<tr class='file' class:hovered={hovered_row === row.id} class:dedup={row.is_dedup}
								data-key={row.place_key} data-n={row_number} data-name={row.display_name}
								onmouseenter={() => { if (row.viewable) { hovered_row = row.id; } }}
								onmouseleave={() => { if (hovered_row === row.id) { hovered_row = null; } }}>
								{@render document_row(row)}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
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

	/* Holds the scrolling rows. */
	.table-region {
		flex           : 1 1 auto;
		position       : relative;
		flex-direction : column;
		display        : flex;
		width          : 100%;
		min-height     : 0;
	}

	/* The header table sits still above the scroller. It reserves the same 20px on the
	   right that the scroller gives its scrollbar, so the two tables' columns line up. */
	.table-head {
		box-sizing    : border-box;
		padding-right : 20px;
		width         : 100%;
		flex-shrink   : 0;
	}

	/* Only the table body scrolls; it fills the space under the fixed header. The gutter
	   is always reserved (even with few rows) so the header's 20px inset always matches. */
	.table-scroll {
		flex             : 1 1 auto;
		scrollbar-gutter : stable;
		overflow-y       : auto;
		width            : 100%;
		min-height       : 0;
	}

	/* A real 20px scrollbar that reserves its own width, so the content ends cleanly at
	   the scrollbar instead of running under a floating one. */
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

	/* A drag over the whole view — an accent frame says a drop will land. */
	.documents.dragging {
		outline        : var(--thickness-fat) var(--accent);
		outline-offset : calc(-1 * var(--gap));
	}

	/* Wraps the filter (toggle + chips); the bottom space sets it off the rule. */
	.tags {
		padding-bottom  : var(--gap-small);
		justify-content : center;
		display         : flex;
		flex-shrink     : 0;                     /* hold full height; a full table must not squeeze it */
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
		flex-shrink   : 0;                     /* hold full height; a full table must not squeeze it */
	}

	.search-text:hover:not(:focus) {
		background : var(--hover);
	}

	/* One pill under the search box with a segment per family; each toggles on its
	   own, filling --accent when picked. A whole family list can be on at once. */
	.families {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-base);
		margin-bottom : var(--gap-small);
		background    : var(--white);
		box-sizing    : border-box;
		align-self    : center;
		overflow      : hidden;
		display       : flex;
		flex-shrink   : 0;                     /* hold full height; a full table must not squeeze (and clip) the pill */
	}

	.families .segment {
		padding    : var(--pad-control);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		border     : none;
	}

	.families .segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.families .segment.current {
		background : var(--accent);
		color      : var(--text-on-accent);
	}

	.families .segment:not(.current):hover {
		background : var(--hover);
	}

	/* A --gap-huge of space below the top divider, before the table. */
	.top-sep {
		margin-bottom : var(--gap);
		margin-top    : var(--gap);
		flex-shrink   : 0;
	}

	/* The two dividers plus the header between them. Sits in a layer in front of the rows so its
	   whole area is one target: hovering lights the "drop files below" tab, clicking opens the
	   drop box. */
	.drop-opener {
		position    : relative;
		z-index     : 2;
		cursor      : pointer;
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

	.files-table {
		border-collapse : collapse;
		position        : relative;
		table-layout    : fixed;             /* honor the column widths set on the header, so the name can be capped */
		width           : 100%;
	}

	/* The header ignores scroll. Sticky must go on the cells, not the <thead>
	   -> a collapsed-border table ignores sticky on the row group.
	   Solid page-colored cells keep scrolling rows from showing through. The
	   closing line below the header is a Separator, sitting outside the scroller. */
	.head th {
		background  : var(--bg);
		position    : sticky;
		z-index     : 1;
	}

	/* The divider under the header — a title-less Separator where the old rule sat,
	   with a --gap of space below it before the rows, matching what was there. */
	.head-sep {
		margin-bottom : var(--gap);
		flex-shrink   : 0;
	}

	/* A faint accent line under each row. */
	.files-table .file td {
		border-bottom : var(--thickness-faint) solid var(--accent);
	}

	/* ...but not under the last row — its bottom line is see-through. */
	.files-table .file:last-child td {
		border-bottom-color : transparent;
	}

	/* ...and not under the first column (format) — its bottom stays see-through. */
	.files-table .file td.extension {
		border-bottom-color : transparent;
	}

	/* The cell is transparent so the rule shows through; only the label pill
	   below masks it. Each label is centered in its column. */
	.head th {
		padding    : 0 0 var(--gap);   /* content, then a --gap of pinned space down to the divider below */
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
		flex            : 0 0 auto;   /* width is set inline to the triangle size, so the slot always fits it */
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
		fill         : var(--accent);
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
		margin-left   : var(--gap);
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}

	.name.viewable {
		cursor : pointer;
	}

	/* A second appearance of the same file (its "also here" dedup under another
	   parent) reads lighter, so the home row is clearly the solid one. */
	.files-table .file.dedup td {
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
	.files-table .file.hovered td {
		background          : var(--hover);
		border-bottom-color : transparent;
	}

	.files-table .file.hovered td:first-child {
		border-top-left-radius    : var(--radius-pill);
		border-bottom-left-radius : var(--radius-pill);
	}

	.files-table .file.hovered td:last-child {
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
