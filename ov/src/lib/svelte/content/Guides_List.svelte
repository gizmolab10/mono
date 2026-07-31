<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { w_viewable_run, open_view } from '../../ts/managers/Operations';
	import Separator from '../support/Separator.svelte';
	import { guides } from '../../ts/managers/Guides';
	import { Direction } from '../../ts/types/Angle';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import type { Writable } from 'svelte/store';
	import { get } from 'svelte/store';

	// The guide list: every folder and file, folders leading their contents, each row
	// indented by how deep it sits. Ported from ji's document list — same open and shut
	// behaviour, same way a filter pulls a matched file's folders back on screen, same
	// remembered scroll place. What ji's version does with tag editing, deleting and
	// dropping is gone: nothing here is editable.
	let { w_kind, w_tags, w_words }: {
		w_kind  : Writable<string>;
		w_tags  : Writable<string[]>;
		w_words : Writable<string>;
	} = $props();

	const w_ready = guides.w_ready;

	// --- the rows -------------------------------------------------------------

	// Which folders are shut, remembered across visits. Saved by where a folder sits
	// rather than by the number it happens to get this launch, since those numbers are
	// made fresh every time and would not line up again.
	const w_shut = preferences.persistent<string[]>(T_Preference.folders_shut, []);

	// The open/shut triangle: pointing down when the folder is open, right when shut.
	const TRIANGLE = k.size.svg;
	function triangle_path(open: boolean): string {
		return svg_paths.soft_pointer(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function triangle_bounds(open: boolean): { minX: number; minY: number; width: number; height: number } {
		return svg_paths.soft_pointer_bounds(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function toggle_folder(key: string, name: string) {
		w_shut.update((shut) => {
			const was = shut.includes(key);
			const next = was ? shut.filter((s) => s !== key) : [...shut, key];
			debug.log(`Folder "${name}" ${was ? 'opened' : 'shut'} — ${next.length} folder(s) now shut.`);
			return next;
		});
	}

	// Walk parent-first, child-next so folders lead their contents. Each row carries how
	// deep it sits (for the indent) and the folder chain above it (so a matched file can
	// keep its folders on screen).
	const rows = $derived.by(() => {
		if (!$w_ready) { return []; }
		const walked = guides.hierarchy.list_guides();
		const key_byID = new Map(walked.map((l) => [l.guide.id, `${l.guide.bundle}/${l.guide.path}`]));
		return walked.map((listed) => {
			const guide = listed.guide;
			return {
				id            : guide.id,
				key           : `${guide.bundle}/${guide.path}`,
				address       : guide.address,
				name          : guide.name,
				title         : guide.title,
				description   : guide.description,
				kind          : guide.kind,
				is_folder     : guide.is_folder,
				depth         : listed.depth,
				ancestor_keys : listed.ancestor_ids.map((id) => key_byID.get(id) ?? ''),
				has_children  : listed.has_children,
				tag_names     : listed.tag_names.join(', '),
				tags          : listed.tag_names,
			};
		});
	});

	// Everything not sitting under a shut folder.
	const open_rows = $derived.by(() => {
		const shut = new Set($w_shut);
		return rows.filter((r) => !r.ancestor_keys.some((a) => shut.has(a)));
	});

	// One row against the three filters. Folders never match on their own — they come
	// back only by holding something that did.
	function matches(row: (typeof rows)[number]): boolean {
		if (row.is_folder) { return false; }
		if ($w_kind !== '' && row.kind !== $w_kind) { return false; }
		if ($w_tags.length > 0 && !$w_tags.some((tag) => row.tags.includes(tag))) { return false; }
		const looking_for = $w_words.trim().toLowerCase();
		if (looking_for !== '' && !`${row.title} ${row.description}`.toLowerCase().includes(looking_for)) { return false; }
		return true;
	}

	// A filter looks through the WHOLE list, so a match inside a shut folder is found —
	// but the display still honors the folds: a shut folder shows as the way to its
	// matches, while its matched files stay hidden until it is opened. With no filter on,
	// only the open rows show.
	const shown = $derived.by(() => {
		const filtering = $w_kind !== '' || $w_tags.length > 0 || $w_words.trim() !== '';
		// Always look through the WHOLE list, so a match inside a shut folder is still found
		// and every folder on the way to it is kept. Matching over only the open rows would
		// make a shut folder vanish along with its contents — shutting a folder hides what is
		// inside it, never the folder itself.
		const matched = rows.filter(matches);
		const keep = new Set(matched.map((r) => r.key));
		for (const r of matched) { for (const a of r.ancestor_keys) { keep.add(a); } }
		const display = open_rows.filter((r) => keep.has(r.key));
		debug.log(`List: ${filtering ? 'filter on' : 'no filter'} — looked through all ${rows.length} row(s); ${matched.length} match(es); showing ${display.length} row(s), of which ${display.filter((r) => r.is_folder).length} are folders (a shut folder stays on screen; only what is inside it is hidden).`);
		return display;
	});

	// How many files under each folder match — the ones on screen plus the ones a shut
	// folder is hiding. Counted over the whole walk, so a shut folder still shows its
	// full tally. Only files count; the folders between are the structure holding them.
	const folder_count = $derived.by(() => {
		const matched = rows.filter(matches);
		const map = new Map<string, number>();
		for (const r of matched) {
			for (const a of r.ancestor_keys) { map.set(a, (map.get(a) ?? 0) + 1); }
		}
		debug.log(`Folder counts: ${map.size} folder(s) hold at least one matching file; ${matched.length} file(s) of ${rows.length} row(s) match.`);
		return map;
	});

	// --- remembering where the list was scrolled ------------------------------

	const row_number_byKey = $derived.by(() => {
		const map = new Map<string, number>();
		shown.forEach((r, i) => { map.set(r.key, i); });
		return map;
	});

	// The row at the top of the scrolled area, saved across visits.
	const w_top = preferences.persistent<string | null>(T_Preference.scroll_files_to, null);

	let scroller = $state<HTMLElement | null>(null);
	let restored = $state(false);
	let save_wait: ReturnType<typeof setTimeout> | null = null;

	// The row now at the top: the first one sitting fully inside the scrolled area.
	function top_row_element(): HTMLElement | null {
		if (!scroller) { return null; }
		const cutoff = scroller.getBoundingClientRect().top;
		for (const tr of scroller.querySelectorAll('tbody tr')) {
			if (tr.getBoundingClientRect().top >= cutoff - 1) { return tr as HTMLElement; }
		}
		return null;
	}

	function remember_top() {
		const tr = top_row_element();
		if (!tr) { return; }
		w_top.set(tr.dataset.key ?? null);
		debug.log(`List scroll: the top row is now "${tr.dataset.name}" (row ${tr.dataset.n}).`);
	}

	function on_scroll() {
		if (save_wait !== null) { clearTimeout(save_wait); }
		save_wait = setTimeout(remember_top, 150);       // save once the scrolling settles
	}

	// Put the rows back where they were. On a fresh load the scrolled area often has no
	// height yet, so asking it to scroll clamps to the top — hence the retry over a few
	// frames until the area is tall enough to actually hold the place asked for.
	function restore_top() {
		if (!scroller) { return; }
		const key = get(w_top);
		if (!key) { return; }
		const n = row_number_byKey.get(key);
		if (n === undefined) { scroller.scrollTop = 0; debug.log(`List scroll: the saved top row "${key}" is not in the list now — starting at the top.`); return; }

		let tries = 0;
		const apply = () => {
			if (!scroller) { return; }
			const tr = scroller.querySelectorAll('tbody tr')[n] as HTMLElement | undefined;
			if (!tr) { if (tries++ < 10) { requestAnimationFrame(apply); } return; }   // rows not drawn yet
			const want = Math.max(0, tr.offsetTop);
			scroller.scrollTop = want;
			if (want > 0 && scroller.scrollTop < want - 1 && tries++ < 10) {
				requestAnimationFrame(apply);
			} else {
				debug.log(`List scroll: back to "${tr.dataset.name}" (row ${n}) — scrolled ${scroller.scrollTop} of a wanted ${want}, after ${tries} extra frame(s).`);
			}
		};
		requestAnimationFrame(apply);
	}

	$effect(() => {
		if (!scroller) { restored = false; return; }
		if (!restored && shown.length > 0) { restore_top(); restored = true; }
	});

	// The three columns, in order. A folder's first cell shows how many matching files it
	// holds; a file's shows its kind.
	const columns = [
		{ label: 'kind', width: '90px' },
		{ label: 'name', width: '55%'  },
		{ label: 'tags', width: 'auto' },
	];

	let hovered_row = $state<string | null>(null);

	// The run to step through while reading: the files on screen, in list order. Folders
	// are not stops. Left where the reading view can find it, since that lives outside
	// this list but steps through what this list shows.
	$effect(() => {
		const run = shown.filter((r) => !r.is_folder).map((r) => ({ key: r.key, name: r.name, address: r.address }));
		w_viewable_run.set(run);
	});

	// Is there actually a scrollbar right now? Only then is room held back for it, and only
	// then does a gap sit between the rows and it. Worked out by measuring — the rows'
	// full height against the height on screen — since a stylesheet cannot ask that.
	let scrollbar_showing = $state(false);
	let said_bar = false;

	function measure_scrollbar() {
		if (!scroller) { return; }
		const all = scroller.scrollHeight;
		const seen = scroller.clientHeight;
		const showing = all > seen + 1;
		if (showing === scrollbar_showing && said_bar) { return; }
		scrollbar_showing = showing;
		said_bar = true;
		debug.log(`List scrollbar: the rows are ${Math.round(all)} tall and ${Math.round(seen)} is on screen — ${showing ? 'a scrollbar is showing, so room and a gap are held back for it' : 'everything fits, so no room is held back'}.`);
	}

	// Re-measure whenever the area changes size or the rows change.
	$effect(() => {
		shown.length;                                  // re-run when the rows change
		if (!scroller) { return; }
		measure_scrollbar();
		const watcher = new ResizeObserver(() => measure_scrollbar());
		watcher.observe(scroller);
		const table = scroller.querySelector('table');
		if (table) { watcher.observe(table); }
		return () => watcher.disconnect();
	});
</script>

<!-- The three cells of a row: kind, name (with the open/shut triangle), and tags. -->
{#snippet guide_row(row: (typeof rows)[number])}
	<td class='kind'><span>{row.is_folder ? (folder_count.get(row.key) ?? 0) : (row.kind || '—')}</span></td>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<td class='name' class:viewable={!row.is_folder}
		style:padding-left='{row.depth * 5}px'
		use:tip={row.is_folder ? false : `open "${row.name}"`}
		onclick={() => { if (!row.is_folder) { open_view({ key: row.key, name: row.name, address: row.address }); } }}>
		<span class='name-line'>
			<span class='tri-slot' style:width='{TRIANGLE}px'>
				{#if row.has_children}
					{@const open = !$w_shut.includes(row.key)}
					{@const b = triangle_bounds(open)}
					{@const prefix = open ? 'shut' : 'open'}
					<button class='tri' aria-label={`${prefix} folder`} use:tip={`${prefix} "${row.name}"`} onclick={(e) => { e.stopPropagation(); toggle_folder(row.key, row.name); }}>
						<svg overflow='visible' width={b.width} height={b.height} viewBox='{b.minX} {b.minY} {b.width} {b.height}'>
							<path d={triangle_path(open)} />
						</svg>
					</button>
				{/if}
			</span><span class='name-text'>{row.name}</span>
		</span>
	</td>
	<td class='tags-cell'><span class='tag-names'>{row.tag_names}</span></td>
{/snippet}

<div class='list'>
		<!-- The header is its own table, sitting still above the scrolled rows, so the
		     scrollbar runs only beside the rows and not past the titles. The divider runs
		     behind it, centered on the row, and each title's page-colored background breaks
		     the line so the titles read as words sitting on it. -->
		<div class='table-head' class:has-bar={scrollbar_showing}>
			<div class='head-line'><Separator /></div>
			<table class='guides-table'>
				<colgroup>{#each columns as col}<col style:width={col.width} />{/each}</colgroup>
				<thead>
					<tr class='head'>
						{#each columns as col}
							<th><span class='head-label'>{col.label}</span></th>
						{/each}
					</tr>
				</thead>
			</table>
		</div>
		<div class='table-scroll' class:has-bar={scrollbar_showing} bind:this={scroller} onscroll={on_scroll}>
			<table class='guides-table'>
				<colgroup>{#each columns as col}<col style:width={col.width} />{/each}</colgroup>
				<tbody>
					{#each shown as row, row_number (row.key)}
						<!-- svelte-ignore a11y_mouse_events_have_key_events -->
						<tr class='file' class:hovered={hovered_row === row.key} class:folder={row.is_folder}
							data-key={row.key} data-n={row_number} data-name={row.name}
							onmouseenter={() => hovered_row = row.key}
							onmouseleave={() => { if (hovered_row === row.key) { hovered_row = null; } }}>
							{@render guide_row(row)}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
</div>

<style>
	.list {
		flex           : 1 1 auto;
		flex-direction : column;
		position       : relative;
		display        : flex;
		width          : 100%;
		min-height     : 0;
	}

	/* The header table sits still above the rows. It holds back the same 20px on the
	   right that the scrolled area gives its scrollbar, so the two line up. */
	.table-head {
		box-sizing    : border-box;
		margin-bottom : var(--gap);
		position      : relative;
		width         : 100%;
		flex-shrink   : 0;
	}

	/* With a scrollbar showing, the titles hold back its width plus the gap, so they stay
	   lined up with the columns below. With none, they use the whole width. */
	.table-head.has-bar {
		padding-right : calc(20px + var(--gap));
	}

	/* The divider, running behind the titles, a touch below their center. It runs the
	   full width — the scrollbar only exists beside the rows, which begin below it, so
	   there is nothing up here for it to stop short of. */
	.head-line {
		transform : translateY(-50%);
		position  : absolute;
		right     : 0;
		left      : 0;
		top       : calc(50% + 2px);
	}

	/* The titles sit in front of the line. */
	.table-head table {
		position : relative;
	}

	/* Only the rows scroll; they fill the space under the header. The scrollbar's room is
	   always held back, even with few rows, so the header's inset always matches. */
	.table-scroll {
		flex       : 1 1 auto;
		overflow-y : auto;
		box-sizing : border-box;
		width      : 100%;
		min-height : 0;
	}

	/* A gap between the rows and the scrollbar — only when there is a scrollbar. */
	.table-scroll.has-bar {
		scrollbar-gutter : stable;
		padding-right    : var(--gap);
	}

	.table-scroll::-webkit-scrollbar {
		width : 20px;
	}

	.table-scroll::-webkit-scrollbar-thumb {
		background    : var(--accent);
		border-radius : var(--radius-pill);
	}

	.table-scroll::-webkit-scrollbar-track {
		background : transparent;
	}

	.guides-table {
		border-collapse : collapse;
		table-layout    : fixed;             /* honor the column widths, so a long name can be capped */
		position        : relative;
		width           : 100%;
	}

	/* Each cell is see-through so the line behind shows; only the title itself masks it. */
	.head th {
		background : transparent;
		padding    : 0;
		text-align : center;
	}

	/* The tags title hugs the right, matching the tags in the cells below. */
	.head th:last-child {
		text-align : right;
	}

	/* The page-colored background is what breaks the line, so the title reads as a word
	   sitting on it rather than crossed out by it. */
	.head-label {
		background : var(--bg);
		font-size  : var(--font-label);
		color      : var(--text);
		opacity    : var(--opacity-header);
		padding    : 0 var(--gap);
	}

	/* A faint accent line under each row. */
	.guides-table .file td {
		border-bottom : var(--thickness-faint) solid var(--accent);
	}

	/* ...but not under the last row, nor under the first column. */
	.guides-table .file:last-child td,
	.guides-table .file td.kind {
		border-bottom-color : transparent;
	}

	.kind, .name, .tags-cell {
		padding        : calc(var(--gap-tight) - 1.5px) 0;
		font-size      : var(--font-base);
		color          : var(--text);
		vertical-align : middle;
		text-align     : left;
	}

	.kind {
		padding-right : var(--gap-fat);
		text-align    : right;
		width         : 90px;
	}

	/* Dim only the text, not the whole cell — otherwise the row's hover light is dimmed
	   with it and this column looks like it never lit. */
	.kind span {
		opacity : var(--opacity-label);
	}

	/* The name row: a fixed triangle slot, then the name. The slot is always there, even
	   for files, so every name lines up at its indent. */
	.name-line {
		align-items : center;
		display     : flex;
		min-width   : 0;
	}

	.tri-slot {
		flex            : 0 0 auto;
		align-items     : center;
		justify-content : center;
		display         : flex;
	}

	.tri {
		background      : transparent;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border          : none;
		padding         : 0;
	}

	.tri path {
		fill         : var(--accent);
		stroke       : var(--black);
		stroke-width : 0.6;
	}

	.tri:hover path {
		fill : var(--hover);
	}

	/* The name is capped by its column. Clipping lives on this inner block, not the cell
	   — clipping a table cell is unreliable. */
	.name-text {
		flex          : 1;
		min-width     : 0;
		margin-left   : var(--gap);
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}

	/* A file's name opens it. */
	.name.viewable {
		cursor : pointer;
	}

	/* A folder's name reads heavier than the files under it. */
	.guides-table .file.folder .name-text {
		font-weight : var(--fw-banner);
	}

	.tags-cell {
		text-align : right;
	}

	.tag-names {
		opacity       : var(--opacity-label);
		font-size     : var(--font-label);
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
		display       : block;
	}

	/* Hovering a row lights it as a row-sized pill. */
	.guides-table .file.hovered td {
		background          : var(--hover);
		border-bottom-color : transparent;
	}

	.guides-table .file.hovered td:first-child {
		border-top-left-radius    : var(--radius-pill);
		border-bottom-left-radius : var(--radius-pill);
	}

	.guides-table .file.hovered td:last-child {
		border-top-right-radius    : var(--radius-pill);
		border-bottom-right-radius : var(--radius-pill);
	}

</style>
