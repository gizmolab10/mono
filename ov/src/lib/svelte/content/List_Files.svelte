<script module lang='ts'>
	import { writable } from 'svelte/store';

	// Whether the rows have a scrollbar right now. The count row above reads it so its own
	// right edge lines up with the column titles, which hold back room for the bar.
	export const w_scrollbar_showing = writable(false);
</script>

<script lang='ts'>
	import { w_shut, w_show_folders, w_project, w_kind, w_sorts, T_Sort } from '../../ts/managers/Filters';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { open_view, w_command_down, w_option_down } from '../../ts/managers/Operations';
	import { VAULT, file_path_of, folder_path_of, obsidian_link, show_folder } from '../../ts/utilities/Saving';
	import { show_status } from '../../ts/managers/Status';
	import type { Filtered_Guide } from '../../ts/types/Guide';
	import Separator from '../support/Separator.svelte';
	import { guides } from '../../ts/managers/Guides';
	import { Direction } from '../../ts/types/Angle';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import { get } from 'svelte/store';

	// The guide list: every folder and file, folders leading their contents, each row
	// indented by how deep it sits. Ported from ji's document list — same open and shut
	// behaviour, same way a filter pulls a matched file's folders back on screen, same
	// remembered scroll place. What ji's version does with tag editing, deleting and
	// dropping is gone: nothing here is editable.
	//
	// The narrowing is not done here: the hierarchy works out what shows, and this draws it.
	const w_showing = guides.w_showing;

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

	// The whole row answers, not just the name: a file opens for reading, a folder opens or
	// shuts. The triangle keeps its own click, and stops it from reaching the row, so hitting
	// the triangle on a folder doesn't toggle it twice.
	function click_row(row: Filtered_Guide, holding_command = false, holding_option = false) {
		if (row.guide.is_folder) {
			// The command key shows the folder itself, on this machine, rather than opening it here.
			if (holding_command) {
				const where = folder_path_of(row.guide.bundle, row.guide.path);
				show_folder(where).then((answer) => {
					if (answer.ok) { debug.log(`Row clicked with the command key: showing the folder ${where} in the Finder.`); return; }
					show_status(`could not show ${where} — ${answer.why}`);
					debug.log(`Row clicked with the command key, but the folder ${where} was not shown — ${answer.why}.`);
				});
				return;
			}
			debug.log(`Row clicked: the folder "${row.guide.name}" — it holds ${folder_count.get(row.key) ?? 0} matching file(s), so it is being ${$w_shut.includes(row.key) ? 'opened' : 'shut'}.`);
			toggle_folder(row.key, row.guide.name);
			return;
		}
		// The command key alone hands the file to Obsidian; with the option key too, it opens
		// here for editing instead.
		if (holding_command && !holding_option) {
			const where = file_path_of(row.guide.bundle, row.guide.path);
			const link  = obsidian_link(VAULT, where);
			window.open(link, '_self');
			debug.log(`Row clicked with the command key: handing "${where}" to Obsidian, in the "${VAULT}" vault. This app stays where it is.`);
			return;
		}
		const for_editing = holding_command && holding_option;
		debug.log(`Row clicked: the file "${row.guide.name}" — opening it ${for_editing ? 'for editing, since both the command and option keys were held' : 'for reading'}.`);
		open_view(row.key, for_editing);
	}

	// --- dragging a file into another folder ----------------------------------
	//
	// Only while the folders are on screen: with them hidden there is nothing to drop onto.
	// A file is picked up, a folder lights up as the cursor crosses it, and letting go moves
	// the file on disk. The app's own picture is put right straight after, so the list agrees
	// with the disk without every file being read again.

	let dragging   = $state<Filtered_Guide | null>(null);   // the file being carried
	let landing_on = $state<string | null>(null);           // the folder lit under the cursor

	function start_drag(event: DragEvent, row: Filtered_Guide) {
		if (!$w_show_folders || row.guide.is_folder) { return; }
		dragging = row;
		event.dataTransfer?.setData('text/plain', row.key);
		if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; }
		debug.log(`Picked up "${row.guide.name}" from ${row.key}. Drop it on a folder to move it there.`);
	}

	function end_drag() {
		dragging = null;
		landing_on = null;
	}

	/** Can this file land here? Only on a folder, and not the one it already sits in. */
	function can_land(row: Filtered_Guide): boolean {
		if (!dragging || !row.guide.is_folder) { return false; }
		const holding = dragging.ancestor_keys[dragging.ancestor_keys.length - 1];
		return row.key !== holding;
	}

	function drag_over(event: DragEvent, row: Filtered_Guide) {
		if (!can_land(row)) { return; }
		event.preventDefault();                       // says "yes, it can land here"
		if (event.dataTransfer) { event.dataTransfer.dropEffect = 'move'; }
		landing_on = row.key;
	}

	function drop_on(event: DragEvent, row: Filtered_Guide) {
		event.preventDefault();
		const carried = dragging;
		const allowed = can_land(row);          // asked while the file is still being carried
		end_drag();
		if (!carried || !allowed) {
			debug.log(`Dropped on "${row.guide.name}" but nothing moved — ${!carried ? 'nothing was being carried' : 'it cannot land there'}.`);
			return;
		}
		guides.move(carried.guide, row.guide);
	}

	// What the hint over a row says, which depends on what clicking it would do.
	function row_hint(row: Filtered_Guide, holding_command: boolean, holding_option: boolean): string {
		if (!row.guide.is_folder) {
			const what = !holding_command ? 'open' : holding_option ? 'edit' : 'open in obsidian';
			return `${what} "${row.guide.name}"`;
		}
		if (holding_command) { return `show "${row.guide.name}" in the finder`; }
		return `${$w_shut.includes(row.key) ? 'open' : 'shut'} "${row.guide.name}"`;
	}

	// The rows on screen, worked out by the hierarchy: the filters and the folds already
	// applied, in the order shown, folders included.
	const shown = $derived($w_showing);

	// How many matching files sit under each folder — worked out alongside the rows.
	const folder_count = $derived.by(() => { $w_showing; return guides.hierarchy.folder_counts; });

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

	// The columns, in order. A folder's first cell shows how many matching files it holds;
	// a file's shows its kind.
	//
	// Which collection a file belongs to is normally plain from the folder it sits under.
	// With the folders hidden that's gone, so a project column steps in — but only while no
	// project is picked, since with one picked every row would read the same.
	const shows_project = $derived(!$w_show_folders && $w_project === '');
	// With the folders hidden and one kind picked, every row would read the same kind, so
	// that column goes too — the count row above says which kind was picked.
	const shows_kind = $derived($w_show_folders || $w_kind === '');
	const columns = $derived([
		// With a kind picked, this column holds only the folder counts, so it narrows to fit them.
		// With a kind picked, this column holds only the folder counts, so its title goes: the
		// count row above already says which kind was picked.
		// The one column says two things: a file's kind, and how many matching files a folder
		// holds — so its title names both.
		...(shows_kind    ? [{ label: $w_kind === '' ? 'kind/children' : 'children', width: $w_kind === '' ? '100px' : '60px', sort: T_Sort.kind }] : []),
		...(shows_project ? [{ label: 'project', width: '65px',  sort: T_Sort.project }] : []),
		// Both are left open, so whatever the fixed columns leave is split evenly between them.
		{ label: 'name', width: 'auto', sort: T_Sort.name },
		{ label: 'tags', width: 'auto', sort: T_Sort.tags },
	]);

	// A column that isn't on screen must not go on quietly ordering the list, so when either
	// the project or the kind column leaves, it stops sorting too.
	$effect(() => {
		if (shows_project) { return; }
		if ($w_sorts.some((s) => s.by === T_Sort.project)) {
			debug.log(`The project column is off screen, so it stopped sorting.`);
			w_sorts.update((sorts) => sorts.filter((s) => s.by !== T_Sort.project));
		}
	});

	$effect(() => {
		if (shows_kind) { return; }
		if ($w_sorts.some((s) => s.by === T_Sort.kind)) {
			debug.log(`The kind column is off screen, so it stopped sorting.`);
			w_sorts.update((sorts) => sorts.filter((s) => s.by !== T_Sort.kind));
		}
	});

	// A title is only worth clicking while the folders are hidden — with them shown the
	// list is folders leading their contents, which nothing can sort. One file alone can't
	// be sorted either, so the titles go quiet there too; what was picked is kept, and
	// comes back the moment a second file does.
	const can_sort = $derived(!$w_show_folders && shown.filter((r) => !r.guide.is_folder).length > 1);


	// Where each sorted column sits in the order, so a title can say whether it decides or
	// only breaks a tie. Nothing when that column isn't sorting.
	const place_of = $derived(new Map($w_sorts.map((s, at) => [s.by, { at: at + 1, up: s.up }])));

	/**
	 * Click a title three times to walk it through: sorting smallest first, then largest
	 * first, then not sorting at all. Columns apply in the order they were picked — the
	 * first decides, each one after it only breaks a tie in the ones before.
	 */
	function sort_by_column(which: string) {
		if (!can_sort) { return; }
		w_sorts.update((sorts) => {
			const at = sorts.findIndex((s) => s.by === which);
			if (at < 0) {
				const next = [...sorts, { by: which, up: true }];
				debug.log(`Sorting by ${which}, smallest first — it is now number ${next.length} of ${next.length} in the order.`);
				return next;
			}
			if (sorts[at].up) {
				const next = sorts.map((s, i) => i === at ? { by: s.by, up: false } : s);
				debug.log(`Sorting by ${which} turned around — now largest first, still number ${at + 1} of ${next.length}.`);
				return next;
			}
			const next = sorts.filter((s) => s.by !== which);
			debug.log(`Stopped sorting by ${which} — ${next.length} column(s) still sorting.`);
			return next;
		});
	}

	let hovered_row = $state<string | null>(null);

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
		w_scrollbar_showing.set(showing);       // the count row above holds back the same room
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
{#snippet guide_row(row: Filtered_Guide)}
	{#if shows_kind}
		<!-- A folder shows how many matching files it holds. A file shows its kind, unless one
		     kind is picked — then every file would read the same, so the cell stays blank. -->
		<td class='kind'><span>{row.guide.is_folder ? (folder_count.get(row.key) ?? 0) : ($w_kind !== '' ? '' : (row.guide.kind || '—'))}</span></td>
	{/if}
	{#if shows_project}
		<td class='project'><span>{row.guide.bundle}</span></td>
	{/if}
	<!-- With the folders hidden the rows are a flat run, so nothing is stepped in and no room
	     is held back for a triangle that cannot appear. -->
	<td class='name' style:padding-left='{$w_show_folders ? row.depth * 5 : 0}px'>
		<span class='name-line'>
			<span class='tri-slot' style:width='{$w_show_folders ? TRIANGLE : 0}px'>
				{#if row.has_children}
					{@const open = !$w_shut.includes(row.key)}
					{@const b = triangle_bounds(open)}
					{@const prefix = open ? 'shut' : 'open'}
					<button class='tri' aria-label={`${prefix} folder`} use:tip={`${prefix} "${row.guide.name}"`} onclick={(e) => { e.stopPropagation(); toggle_folder(row.key, row.guide.name); }}>
						<svg overflow='visible' width={b.width} height={b.height} viewBox='{b.minX} {b.minY} {b.width} {b.height}'>
							<path d={triangle_path(open)} />
						</svg>
					</button>
				{/if}
			</span><span class='name-text'>{row.guide.name}</span>
		</span>
	</td>
	<td class='tags-cell'><span class='tag-names'>{row.tag_names.join(', ')}</span></td>
{/snippet}

<div class='list'>
	{#if shown.length !== 0}
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
							{@const place = can_sort ? place_of.get(col.sort) : undefined}
							<th class:name-head={col.label === 'name'} class:flat={!$w_show_folders} class:kind-head={col.sort === T_Sort.kind} class:project-head={col.label === 'project'}>
								<!-- A column with no title of its own draws nothing here, so the line
								     behind runs unbroken. -->
								{#if col.label !== '' || place}
									<button
										class='head-label'
										class:sortable={can_sort}
										class:sorted={!!place}
										use:tip={can_sort ? (place ? `turn ${col.label} around, or click again to stop sorting by it` : `also sort by ${col.label}`) : false}
										onclick={() => sort_by_column(col.sort)}><span class='head-words'>{col.label}{#if place}{place.up ? ' ▼' : ' ▲'}{#if $w_sorts.length > 1}<span class='order'>{place.at}</span>{/if}{/if}</span></button>
								{/if}
							</th>
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
						<!-- svelte-ignore a11y_mouse_events_have_key_events a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
						<tr class='file' class:hovered={hovered_row === row.key} class:folder={row.guide.is_folder}
							class:opened={row.guide.is_folder && row.has_children && !$w_shut.includes(row.key)}
							class:landing={landing_on === row.key}
							data-key={row.key} data-n={row_number} data-name={row.guide.name}
							draggable={$w_show_folders && !row.guide.is_folder}
							use:tip={row_hint(row, $w_command_down, $w_option_down)}
							onclick={(e) => click_row(row, e.metaKey, e.altKey)}
							ondragstart={(e) => start_drag(e, row)}
							ondragend={end_drag}
							ondragover={(e) => drag_over(e, row)}
							ondragleave={() => { if (landing_on === row.key) { landing_on = null; } }}
							ondrop={(e) => drop_on(e, row)}
							onmouseenter={() => hovered_row = row.key}
							onmouseleave={() => { if (hovered_row === row.key) { hovered_row = null; } }}>
							{@render guide_row(row)}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
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

	/* With no scrollbar, both the titles and the rows keep the same fat gap at the right,
	   so nothing runs against the edge of the box. */
	.table-head:not(.has-bar),
	.table-scroll:not(.has-bar) {
		padding-right : var(--gap);
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
	/* A hairline exactly where the rows begin to disappear under the header. It is always
	   there, so nothing shifts; it simply turns see-through when everything fits and there
	   is no cut to draw. */
	.table-scroll {
		border-top : 0.1px solid transparent;
		box-sizing : border-box;
		flex       : 1 1 auto;
		overflow-y : auto;
		width      : 100%;
		min-height : 0;
	}

	/* A gap between the rows and the scrollbar — only when there is a scrollbar. */
	.table-scroll.has-bar {
		border-top-color : var(--accent);
		padding-right    : var(--gap);
		scrollbar-gutter : stable;
	}

	/* The sideways bar is given the same thickness as the one down the side, so the two match. */
	.table-scroll::-webkit-scrollbar {
		height : 20px;
		width  : 20px;
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
		text-align : center;
		padding    : 0;
	}

	/* Each title is a button carrying a gap of space inside it, which is what breaks the line
	   behind the words. So the cell is nudged by that same gap, and the words land exactly
	   where the column's own words do. */
	.head th.kind-head,
	.head th.project-head {
		padding-right : var(--gap-fat);
		text-align    : right;
	}

	/* The name title starts where the names themselves start — past the triangle slot and
	   the space after it. */
	.head th.name-head {
		padding-left : calc(var(--size-svg) + var(--gap));
		text-align   : left;
	}

	/* With the folders hidden the names start at the column's edge, so the title does too —
	   plus enough to clear the gap the button carries inside it. */
	.head th.name-head.flat {
		padding-left : 8px;
	}


	/* The tags title hugs the right, matching the tags in the cells below — pulled out by the
	   gap the button carries inside it, so the words end where the tags end. */
	.head th:last-child {
		margin-right : 0;
		padding-right: 0;
		text-align   : right;
	}

	.head th:last-child .head-label {
		margin-right : calc(0px - var(--gap));
	}

	.head th.kind-head .head-label,
	.head th.project-head .head-label {
		margin-right : calc(0px - var(--gap));
	}

	.head th.name-head .head-label {
		margin-left : calc(0px - var(--gap));
	}

	/* The page-colored background is what breaks the line, so the title reads as a word
	   sitting on it rather than crossed out by it. */
	/* The background stays solid so the divider behind is fully broken; only the words are
	   faded, which is why the fading sits on the words rather than the whole title. */
	.head-label {
		border      : 0.5px solid transparent;   /* held, so the hover edge adds no shift */
		font-size   : var(--font-label);
		padding     : 0 var(--gap);
		color       : var(--text);
		background  : var(--bg);
		font-family : inherit;
		cursor      : default;
		white-space : nowrap;   /* the title, its arrow and its number stay on one line */
	}

	/* While the folders are hidden the titles are buttons — the one in use reads solid. */
	.head-label.sortable {
		border-radius : var(--radius-pill);
		cursor        : pointer;
	}

	.head-words {
		opacity : var(--opacity-header);
	}

	.head-label.sortable:hover .head-words,
	.head-label.sorted .head-words {
		opacity : 1;
	}

	/* Under the cursor a title fills as an outlined pill, so it reads as the button it is. */
	.head-label.sortable:hover {
		border-color : var(--black);
		background   : var(--hover);
	}

	/* With more than one column sorting, a small number says where this one comes in the
	   order — 1 decides, the rest only break ties. */
	.order {
		font-size     : var(--font-credit);
		vertical-align: super;
		margin-left   : 1px;
	}

	/* A faint accent line under each row. */
	.guides-table .file td {
		border-bottom : var(--thickness-faint) solid var(--accent);
	}

	/* ...but not under the last row. */
	.guides-table .file:last-child td {
		border-bottom-color : transparent;
	}

	.kind, .project, .name, .tags-cell {
		padding        : calc(var(--gap-tight) - 1.5px) 0;
		font-size      : var(--font-base);
		color          : var(--text);
		vertical-align : middle;
		text-align     : left;
	}

	/* The column's own width decides this cell; the styling only says how its words sit. */
	.kind {
		padding-right : var(--gap-fat);
		text-align    : right;
	}

	/* Dim only the text, not the whole cell — otherwise the row's hover light is dimmed
	   with it and this column looks like it never lit. */
	.kind span,
	.project span {
		opacity : var(--opacity-label);
	}

	/* Which collection the file belongs to — shown only while the folders are hidden and
	   no project is picked. */
	.project {
		padding-right : var(--gap-fat);
		text-align    : right;
		width         : 99px;
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
		fill : var(--white);
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

	/* The whole row answers to a click — a file opens, a folder opens or shuts. */
	.guides-table .file {
		cursor : pointer;
	}

	/* A folder's name reads heavier than the files under it. */
	.guides-table .file.folder .name-text {
		font-weight : var(--fw-banner);
	}

	/* A folder standing open reads gray — its contents are on screen, so the folder itself
	   is no longer the thing to look at. */
	.guides-table .file.folder.opened .name-text {
		color : var(--lightgray);
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

	/* The folder a carried file would land in, lit on the accent so there is no doubt where
	   letting go would put it. */
	.guides-table .file.landing td {
		background          : var(--accent);
		color               : var(--text-on-accent);
		border-bottom-color : transparent;
	}

	.guides-table .file.landing td:first-child {
		border-top-left-radius    : var(--radius-pill);
		border-bottom-left-radius : var(--radius-pill);
	}

	.guides-table .file.landing td:last-child {
		border-top-right-radius    : var(--radius-pill);
		border-bottom-right-radius : var(--radius-pill);
	}

</style>
