<script module lang='ts'>
	import { writable } from 'svelte/store';

	// Whether the rows have a scrollbar right now. The count row above reads it so its own
	// right edge lines up with the column titles, which hold back room for the bar.
	export const w_scrollbar_showing = writable(false);

	// How wide the first column is, in pixels. It changes with what the filters leave, and the
	// count row above reads it so the folders button ends where the first title's words end.
	export const w_first_column = writable(0);
</script>

<script lang='ts'>
	import { VAULT, file_path_of, folder_path_of, obsidian_link, show_folder } from '../../ts/utilities/Saving';
	import { w_shut, w_show_folders, w_projects, w_kind, w_tags, ordered_tags, w_sorts, T_Sort } from '../../ts/managers/Filters';
	import { open_view, w_command_down, w_option_down } from '../../ts/managers/Operations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { free_thumb, type Free_Thumb } from '../../ts/common/Core';
	import { T_Hit_Target } from '../../ts/common/Core';
	import { project_of, type Filtered_File } from '../../ts/types/File';
	import { in_thousands } from '../../ts/common/Core';
	import { svg_paths } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import { show_status } from '../../ts/managers/Status';
	import { Separator } from '../../ts/common/Core';
	import { Point } from '../../ts/common/Core';
	import { Direction } from '../../ts/common/Core';
	import { files } from '../../ts/managers/Files';
	import { debug } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { get } from 'svelte/store';

	// The file list: every folder and file, folders leading their contents, each row
	// indented by how deep it sits. Ported from ji's document list — same open and shut
	// behaviour, same way a filter pulls a matched file's folders back on screen, same
	// remembered scroll place. What ji's version does with tag editing, deleting and
	// dropping is gone: nothing here is editable.
	//
	// The narrowing is not done here: the hierarchy works out what shows, and this draws it.
	const w_showing = files.w_showing;

	// The open/shut triangle: pointing down when the folder is open, right when shut.
	const TRIANGLE = k.size.small;
	function triangle_path(open: boolean): string {
		return svg_paths.soft_pointer(TRIANGLE, open ? Direction.down : Direction.right);
	}
	function triangle_bounds(open: boolean): { minX: number; minY: number; width: number; height: number } {
		return svg_paths.soft_pointer_bounds(TRIANGLE, open ? Direction.down : Direction.right);
	}
	// The mark in the name column's header points down while any collection is open, and a
	// press on it shuts every folder or opens every folder — the same either-or the top
	// heading's mark has while reading a file.
	let tops_open = $derived($w_showing.some((row) => row.file.is_folder && row.depth === 0 && !$w_shut.includes(row.key)));

	function toggle_all_folders() {
		if (tops_open) {
			const every_folder = [...files.hierarchy.all_files.values()]
				.filter((row) => row.file.is_folder).map((row) => row.key);
			w_shut.set(every_folder);
			debug.log(`Every folder shut — ${every_folder.length} of them.`);
			return;
		}
		w_shut.set([]);
		debug.log('Every folder opened.');
	}

	function toggle_folder(key: string, name: string) {
		w_shut.update((shut) => {
			const was = shut.includes(key);
			const next = was ? shut.filter((s) => s !== key) : [...shut, key];
			debug.log(`Folder "${name}" ${was ? 'opened' : 'shut'} — ${next.length} folder(s) now shut.`);
			return next;
		});
	}

	/** Where a file's own folder sits inside its collection. Nothing at all for one at the top. */
	function folder_of(path: string): string {
		const parts = path.split('/');
		return parts.slice(0, -1).join('/');
	}

	// The whole row answers, not just the name: a file opens for reading, a folder opens or
	// shuts. The row is a target of the middle kind, so the triangle standing in it — a control —
	// takes the cursor first and the row never hears that press at all.
	function click_row(row: Filtered_File, holding_command = false, holding_option = false) {
		if (row.file.is_folder) {
			// The command key shows the folder itself, on this machine, rather than opening it here.
			if (holding_command) {
				const where = folder_path_of(row.file.bundle, row.file.path);
				show_folder(where).then((answer) => {
					if (answer.ok) { debug.log(`Row clicked with the command key: showing the folder ${where} in the Finder.`); return; }
					show_status(`could not open ${where} — ${answer.why}`);
					debug.log(`Row clicked with the command key, but the folder ${where} was not shown — ${answer.why}.`);
				});
				return;
			}
			debug.log(`Row clicked: the folder "${row.file.name}" — it holds ${folder_count.get(row.key) ?? 0} matching file(s), so it is being ${$w_shut.includes(row.key) ? 'opened' : 'shut'}.`);
			toggle_folder(row.key, row.file.name);
			return;
		}
		// Command with option shows the folder this file sits in, the same as command alone does
		// on a folder's own row — so a file's folder can be reached without hunting for it.
		if (holding_command && holding_option) {
			const where = folder_path_of(row.file.bundle, folder_of(row.file.path));
			show_folder(where).then((answer) => {
				if (answer.ok) { debug.log(`Row clicked with command and option: showing the folder ${where}, which holds "${row.file.name}", in the Finder.`); return; }
				show_status(`could not open ${where} — ${answer.why}`);
				debug.log(`Row clicked with command and option, but the folder ${where} was not shown — ${answer.why}.`);
			});
			return;
		}
		// The command key alone hands the file to Obsidian; anything else opens it here.
		if (holding_command && !holding_option) {
			const where = file_path_of(row.file.bundle, row.file.path);
			const link  = obsidian_link(VAULT, where);
			window.open(link, '_self');
			debug.log(`Row clicked with the command key: handing "${where}" to Obsidian, in the "${VAULT}" vault. This app stays where it is.`);
			return;
		}
		debug.log(`Row clicked: opening the file "${row.file.name}".`);
		open_view(row.key);
	}

	// --- dragging a file into another folder ----------------------------------
	//
	// Only while the folders are on screen: with them hidden there is nothing to drop onto.
	// A file is picked up, a folder lights up as the cursor crosses it, and letting go moves
	// the file on disk. The app's own picture is put right straight after, so the list agrees
	// with the disk without every file being read again.

	let dragging   = $state<Filtered_File | null>(null);   // the file being carried
	let landing_on = $state<string | null>(null);           // the folder lit under the cursor

	function start_drag(event: DragEvent, row: Filtered_File) {
		if (!$w_show_folders || row.file.is_folder) { return; }
		dragging = row;
		event.dataTransfer?.setData('text/plain', row.key);
		if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; }
		debug.log(`Picked up "${row.file.name}" from ${row.key}. Drop it on a folder to move it there.`);
	}

	function end_drag() {
		dragging = null;
		landing_on = null;
	}

	/** Can this file land here? Only on a folder, and not the one it already sits in. */
	function can_land(row: Filtered_File): boolean {
		if (!dragging || !row.file.is_folder) { return false; }
		const holding = dragging.ancestor_keys[dragging.ancestor_keys.length - 1];
		return row.key !== holding;
	}

	function drag_over(event: DragEvent, row: Filtered_File) {
		if (!can_land(row)) { return; }
		event.preventDefault();                       // says "yes, it can land here"
		if (event.dataTransfer) { event.dataTransfer.dropEffect = 'move'; }
		landing_on = row.key;
	}

	function drop_on(event: DragEvent, row: Filtered_File) {
		event.preventDefault();
		const carried = dragging;
		const allowed = can_land(row);          // asked while the file is still being carried
		end_drag();
		if (!carried || !allowed) {
			debug.log(`Dropped on "${row.file.name}" but nothing moved — ${!carried ? 'nothing was being carried' : 'it cannot land there'}.`);
			return;
		}
		files.move(carried.file, row.file);
	}

	// What the hint over a row says, which depends on what clicking it would do.
	function row_hint(row: Filtered_File, holding_command: boolean, holding_option: boolean): string {
		if (!row.file.is_folder) {
			if (holding_command && holding_option) {
				const where = folder_of(row.file.path);
				return `open "${where === '' ? row.file.bundle : where.split('/').pop()}" in the finder`;
			}
			return `${holding_command ? 'edit in obsidian' : 'edit'} "${row.file.name}"`;
		}
		if (holding_command) { return `open "${row.file.name}" in the finder`; }
		return `${$w_shut.includes(row.key) ? 'open' : 'shut'} "${row.file.name}"`;
	}

	// The rows on screen, worked out by the hierarchy: the filters and the folds already
	// applied, in the order shown, folders included.
	const shown = $derived($w_showing);

	// How many matching files sit under each folder — worked out alongside the rows.
	const folder_count = $derived.by(() => { $w_showing; return files.hierarchy.folder_counts; });
	const folder_size  = $derived.by(() => { $w_showing; return files.hierarchy.folder_sizes; });

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

	// Where the rows stood when the hits manager was last told. A scroll moves every row by the
	// difference, and by exactly that — so the manager is handed the distance rather than asked to
	// read every rectangle again, which would make the browser settle its layout on every event.
	let told_scrolled_to = 0;

	function on_scroll() {
		measure_thumb();
		if (!!scroller) {
			const now = scroller.scrollTop;
			hits.shift_inside(scroller, new Point(0, told_scrolled_to - now));
			told_scrolled_to = now;
		}
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
	const shows_project = $derived(!$w_show_folders && $w_projects.length !== 1);
	// With the folders hidden and one kind picked, every row would read the same kind, so
	// that column goes too — the count row above says which kind was picked.
	const shows_kind = $derived($w_show_folders || $w_kind === '');
	const columns = $derived([
		// With a kind picked, this column holds only the folder counts, so it narrows to fit them.
		// With a kind picked, this column holds only the folder counts, so its title goes: the
		// count row above already says which kind was picked.
		// The one column says two things: a file's kind, and how many matching files a folder
		// holds — so while the folders show, its title names both. With them hidden there are
		// no folder counts to name, so it is just the kind.
		...(shows_kind    ? [{ label: $w_kind !== '' ? 'children' : $w_show_folders ? 'kind/children' : 'kind', width: $w_kind === '' ? '100px' : '60px', sort: T_Sort.kind }] : []),
		...(shows_project ? [{ label: 'project', width: '65px',  sort: T_Sort.project }] : []),
		// Both are left open, so whatever the fixed columns leave is split evenly between them.
		{ label: 'name', width: 'auto', sort: T_Sort.name },
		{ label: 'tags', width: 'auto', sort: T_Sort.tags },
		{ label: 'size', width: '30px', sort: T_Sort.size },
	]);

	// The count row above draws its folders button in a lane this wide, so the button's right
	// edge falls where the first title's words end. A width of "auto" means no fixed column is
	// left, and the row goes back to hugging the far left.
	$effect(() => {
		const first = columns[0]?.width ?? 'auto';
		w_first_column.set(first.endsWith('px') ? parseFloat(first) : 0);
	});

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
	const can_sort = $derived(!$w_show_folders && shown.filter((r) => !r.file.is_folder).length > 1);


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
		measure_thumb();
		// A folder opening or a filter narrowing moves every row below it, so every rectangle
		// the hits manager holds is asked again once the browser has drawn them.
		hits.defer_recalibrate();
		const watcher = new ResizeObserver(() => { measure_scrollbar(); measure_thumb(); hits.recalibrate_when_drawn(); });
		watcher.observe(scroller);
		const table = scroller.querySelector('table');
		if (table) { watcher.observe(table); }
		return () => watcher.disconnect();
	});

	// The thumb is never shorter than a fifth of its lane. Where the browser would have put
	// it, left alone, is drawn as a thin strip over the real one — so the two can be seen at
	// once. The strip is placed against the whole list, whose top is the header's, so the
	// header's height is handed along.
	let free = $state<Free_Thumb>({ top: 0, length: 0, shows: false });

	function measure_thumb() {
		if (!scroller) { free = { top: 0, length: 0, shows: false }; return; }
		free = free_thumb(scroller.clientHeight, scroller.scrollHeight, scroller.scrollTop, scroller.offsetTop);
	}
</script>

<!-- The three cells of a row: kind, name (with the open/shut triangle), and tags. -->
{#snippet file_row(row: Filtered_File)}
	{#if shows_kind}
		<!-- A folder shows how many matching files it holds. A file shows its kind, unless one
		     kind is picked — then every file would read the same, so the cell stays blank. -->
		<!-- A file that has never been labeled reads "---", the same three dashes a label block
		     opens with — it is waiting for one, and gets it the first time it is opened. -->
		<td class='kind'><span>{row.file.is_folder ? (folder_count.get(row.key) ?? 0) : ($w_kind !== '' ? '' : (row.file.kind || '---'))}</span></td>
	{/if}
	{#if shows_project}
		<td class='project'><span>{project_of(row.file)}</span></td>
	{/if}
	<!-- With the folders hidden the rows are a flat run, so nothing is stepped in and no room
	     is held back for a triangle that cannot appear. -->
	<td class='name' style:padding-left={$w_show_folders ? `calc(${row.depth} * var(--gap-big))` : '0'}>
		<span class='name-line'>
			<span class='tri-slot' style:width='{$w_show_folders ? TRIANGLE : 0}px'>
				{#if row.has_children}
					{@const open = !$w_shut.includes(row.key)}
					{@const b = triangle_bounds(open)}
					{@const prefix = open ? 'shut' : 'open'}
					<!-- Named by the folder it opens, since the list holds one of these per folder.
					     It acts when the press is let go, the same as the row behind it: the shape
					     turns when the folder does, and its own rectangle turns with it — so acting
					     on the way down moved the mark out from under the cursor, and the press was
					     let go on the row, which turned the folder straight back. -->
					<button class='tri' aria-label={`${prefix} folder`}
						use:hit_target={{ id: `list.folder.${row.key}`, tip: `${prefix} "${row.file.name}"`,
							onrelease: () => toggle_folder(row.key, row.file.name) }}>
						<svg overflow='visible' width={b.width} height={b.height} viewBox='{b.minX} {b.minY} {b.width} {b.height}'>
							<path d={triangle_path(open)} />
						</svg>
					</button>
				{/if}
			</span><span class='name-text'>{row.file.name}</span>
		</span>
	</td>
	<td class='tags-cell'><span class='tag-names'>{ordered_tags(row.tag_names, $w_tags).join(', ')}</span></td>
	<!-- How big the file's text is, in characters; a folder sums its matching files. -->
	<td class='size'><span>{in_thousands(row.file.is_folder ? (folder_size.get(row.key) ?? 0) : row.file.size)}</span></td>
{/snippet}

<div class='list'>
	{#if shown.length !== 0}
		<!-- The header is its own table, sitting still above the scrolled rows, so the
		     scrollbar runs only beside the rows and not past the titles. The divider runs
		     behind it, centered on the row, and each title's page-colored background breaks
		     the line so the titles read as words sitting on it. -->
		<div class='table-head' class:has-bar={scrollbar_showing}>
			<div class='head-line'>
				<Separator thickness={k.thickness.fat} />
			</div>
			<table class='files-table'>
				<colgroup>{#each columns as col}<col style:width={col.width} />{/each}</colgroup>
				<thead>
					<tr class='head'>
						{#each columns as col}
							{@const place = can_sort ? place_of.get(col.sort) : undefined}
							<th class:name-head={col.label === 'name'} class:flat={!$w_show_folders} class:kind-head={col.sort === T_Sort.kind} class:project-head={col.label === 'project'} class:tags-head={col.label === 'tags'}>
								<!-- A mark in the name column's own lane while the folders show, its
								     right edge 20px clear of the word. -->
								{#if col.label === 'name' && $w_show_folders}
									{@const b = triangle_bounds(tops_open)}
									<button class='head-mark' aria-label={tops_open ? 'shut every folder' : 'open every folder'}
										use:hit_target={{ id: 'list.folders.all', onrelease: toggle_all_folders,
											tip: tops_open ? 'shut every folder' : 'open every folder' }}>
										<svg overflow='visible' width={b.width} height={b.height} viewBox='{b.minX} {b.minY} {b.width} {b.height}'>
											<path d={triangle_path(tops_open)} />
										</svg>
									</button>
								{/if}
								<!-- A column with no title of its own draws nothing here, so the line
								     behind runs unbroken. -->
								{#if col.label !== '' || place}
									<!-- Named by its own column, since the header holds one per column. -->
									<button
										class='head-label'
										class:sortable={can_sort}
										class:sorted={!!place}
										use:hit_target={{ id: `list.head.${col.sort}`,
											tip: can_sort ? (place ? `turn ${col.label} around, or click again to stop sorting by it` : `sort by ${col.label}`) : null,
											onpress: can_sort ? () => sort_by_column(col.sort) : undefined }}><span class='head-words'>{col.label}{#if place}{place.up ? ' ▼' : ' ▲'}{#if $w_sorts.length > 1}<span class='order'>{place.at}</span>{/if}{/if}</span></button>
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
			</table>
		</div>
		<!-- Where the browser would have put the thumb with no floor under it, drawn over the
		     real one so both can be seen at once. Nothing to catch — it is only a marker. -->
		{#if free.shows}
			<div class='free-thumb' style:top='{free.top}px' style:height='{free.length}px'></div>
		{/if}
		<div class='table-scroll' class:has-bar={scrollbar_showing} bind:this={scroller} onscroll={on_scroll}>
			<table class='files-table'>
				<colgroup>{#each columns as col}<col style:width={col.width} />{/each}</colgroup>
				<tbody>
					{#each shown as row, row_number (row.key)}
						<!-- A row opens when the press is let go, never on the way down: a file is
						     dragged from its row into a folder, and acting on the way down opened the
						     file before the drag could begin. A drag that does begin ends in its own
						     way, so nothing is ever let go here and nothing opens. -->
						<!-- svelte-ignore a11y_mouse_events_have_key_events a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
						<tr class='file' class:hovered={hovered_row === row.key} class:folder={row.file.is_folder}
							class:opened={row.file.is_folder && row.has_children && !$w_shut.includes(row.key)}
							class:landing={landing_on === row.key}
							data-key={row.key} data-n={row_number} data-name={row.file.name}
							draggable={$w_show_folders && !row.file.is_folder}
							use:hit_target={{ id: `list.row.${row.key}`, type: T_Hit_Target.section,
								tip: row_hint(row, $w_command_down, $w_option_down),
								onrelease: () => click_row(row, $w_command_down, $w_option_down) }}
							ondragstart={(e) => start_drag(e, row)}
							ondragend={end_drag}
							ondragover={(e) => drag_over(e, row)}
							ondragleave={() => { if (landing_on === row.key) { landing_on = null; } }}
							ondrop={(e) => drop_on(e, row)}
							onmouseenter={() => hovered_row = row.key}
							onmouseleave={() => { if (hovered_row === row.key) { hovered_row = null; } }}>
							{@render file_row(row)}
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

	/* The header sits still above the rows. It holds back the same width on the right that the
	   scrolled area gives its scrollbar, so the two line up. It stands only as tall as its line:
	   the titles are pulled out of the flow and straddle that line, taking no height of their
	   own — the same way a word on any other line in the app does. So whatever stands above
	   measures its gap to the line, and the rows below stand one gap under it. */
	.table-head {
		/* Two gaps, not one: the titles straddle the line, so about half their height already
		   hangs into the first gap. The second is what actually stands clear below them. */
		margin-bottom : calc(var(--gap) * 2);
		box-sizing    : border-box;
		position      : relative;
		width         : 100%;
		flex-shrink   : 0;
	}

	/* With no scrollbar, the rows keep a fat gap at the right, so nothing runs against
	   the edge of the box. The titles match it through their table's own right offset —
	   the table is absolutely positioned, so a padding here would not reach it. */
	.table-scroll:not(.has-bar) {
		padding-right : var(--gap);
	}

	/* The divider, along the very top of the header row rather than through the middle of it.
	   That way whatever stands above the row measures its gap to the line itself, and the row
	   holds its own gap under it. It runs the full width — the scrollbar only exists beside the
	   rows, which begin below it, so there is nothing up here for it to stop short of. */
	.head-line {
		position : absolute;
		right    : 0;
		left     : 0;
		top      : 0;
	}

	/* The titles sit in front of the line and take no height: pulled out of the flow and lifted
	   by half their own height, so they straddle the line rather than standing under it. Its left
	   and right edges are the header's own, so the width held back for the scrollbar still counts
	   and the titles stay lined up with the columns below. */
	/* The layer is named here rather than on the titles themselves: lifting the header by half its
	   own height makes it a world of its own, and nothing inside can reach past the line unless
	   the header as a whole stands in front of it. */
	.table-head table {
		/* Half its own height centers the titles on the separator's own center. */
		transform : translateY(-50%);
		z-index   : var(--z-frontmost);
		position  : absolute;
		/* The rows hold a gap at the right; the titles end where the rows do. The table
		   wears width: 100%, and with left set a right offset is ignored (over-constrained
		   absolute layout drops it) — so the room is taken out of the width itself. */
		width     : calc(100% - var(--gap));
		left      : 0;
		top       : 0;
	}

	/* With a scrollbar showing, the rows lose its width too — so the titles hold back the
	   same room and stay lined up with the columns below. */
	.table-head.has-bar table {
		width : calc(100% - var(--width-bar) - var(--gap));
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

	/* The bar beside the rows. Every scrolling box has to name itself like this — the
	   app-wide form of the rule matches nothing at all. */
	.table-scroll::-webkit-scrollbar {
		width      : var(--width-bar);
		height     : var(--width-bar);
		background : transparent;
	}

	/* The marker showing where the browser alone would have put the thumb: half the lane's
	   width, in the dark accent, sitting on top of the real thumb and answering to nothing. */
	.free-thumb {
		width          : calc(var(--width-bar) / 2);
		right          : calc(var(--width-bar) / 4);
		background     : var(--accent-dark);
		position       : absolute;
		border-radius  : 999px;
		pointer-events : none;
		z-index        : 1;
	}

	/* The browser sets the thumb's length from how much of the rows fit on screen. A very
	   long list would shrink it to a speck, so it never goes below a fifth of the lane. */
	.table-scroll::-webkit-scrollbar-thumb {
		background    : var(--accent);
		border-radius : 999px;
		min-height    : 20%;
		min-width     : 20%;
	}

	.table-scroll::-webkit-scrollbar-track {
		background : transparent;
	}

	.table-scroll.has-bar {
		border-top-color : var(--accent);
		padding-right    : var(--gap);
	}

	.files-table {
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
		padding-left : calc(var(--size-small) + var(--gap));
		position     : relative;
		text-align   : left;
	}

	/* The mark in that lane, its right edge held 20px clear of the word. */
	/* One gap wider on each side, and moved that gap left, so the mark itself stays put while the
	   page color around it breaks a longer run of the line. */
	.head-mark {
		width           : calc(var(--size-small) + var(--gap) - 14px + var(--gap) * 2);
		background      : var(--bg);
		position        : absolute;
		cursor          : pointer;
		justify-content : center;
		align-items     : center;
		display         : flex;
		border          : none;
		/* The whole header is lifted two pixels so its words sit square on the line; the mark is
		   a drawn shape rather than a letter, so it takes those two back. */
		top             : calc(39% + 2px);
		left            : calc(3px - var(--gap));
		padding         : 0;
	}

	.head-mark path {
		stroke       : var(--accent);
		fill         : var(--white);
		stroke-width : 1;
	}

	.head-mark:global([data-hit]) path {
		fill : var(--hover);
	}

	/* With the folders hidden the names start at the column's edge, so the title does too —
	   plus enough to clear the gap the button carries inside it. */
	.head th.name-head.flat {
		padding-left : 8px;
	}


	/* The tags title hugs the right, matching the tags in the cells below — pulled out by the
	   gap the button carries inside it, so the words end where the tags end. */
	.head th.tags-head {
		text-align   : right;
		margin-right : 0;
		padding-right: 0;
	}

	.head th.tags-head .head-label {
		margin-right : calc(var(--gap-big) - var(--gap));
	}

	/* The size title ends where the sizes end — the same right padding the cells carry,
	   minus the gap the button carries inside it. */
	.head th:last-child {
		text-align   : right;
		padding-right: 0;
	}

	.head th:last-child .head-label {
		margin-right : calc(var(--gap-small) - var(--gap));
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
		font-size   : var(--font-tiny);
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
		opacity  : var(--opacity-header);
		/* The words ride 2px high in the button; relative offset moves them without
		   changing the button's own height. */
		display  : inline-block;
		position : relative;
		top      : -1.5px;
	}

	.head-label.sortable:global([data-hit]) .head-words,
	.head-label.sorted .head-words {
		opacity : 1;
	}

	/* Under the cursor a title fills as an outlined pill, so it reads as the button it is. */
	.head-label.sortable:global([data-hit]) {
		border-color : var(--black);
		background   : var(--hover);
	}

	/* With more than one column sorting, a small number says where this one comes in the
	   order — 1 decides, the rest only break ties. */
	.order {
		font-size     : var(--font-faint);
		margin-left   : 1px;
	}

	/* A faint accent line under each row. */
	.files-table .file td {
		border-bottom : var(--thick-faint) solid var(--accent);
	}

	/* The line starts well in from the left edge. Under the first cell it is painted rather than
	   drawn as an edge, so it can begin part-way across without the words moving. */
	.files-table .file td:first-child {
		background-image    : linear-gradient(var(--accent), var(--accent));
		background-size     : calc(100% - var(--gap)) var(--thick-faint);
		background-position : right bottom;
		border-bottom-color : transparent;
		background-repeat   : no-repeat;
	}

	/* ...but not under the last row. */
	.files-table .file:last-child td {
		border-bottom-color : transparent;
	}

	.files-table .file:last-child td:first-child {
		background-image : none;
	}

	.kind, .project, .name, .tags-cell {
		padding        : calc(var(--gap-tiny) - 1.5px) 0;
		font-size      : var(--font);
		color          : var(--text);
		vertical-align : middle;
		text-align     : left;
		position       : relative;      /* the lit pill's end strips hang off these */
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
		font-size     : var(--font-tiny);
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

	/* White inside an accent outline whichever way it points, filling to the hover color under
	   the cursor — the same look every drawn mark wears. */
	.tri path {
		stroke       : var(--accent);
		fill         : var(--white);
		stroke-width : 1;
	}

	.tri:global([data-hit]) path {
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

	/* The whole row answers to a click — a file opens, a folder opens or shuts. */
	.files-table .file {
		cursor : pointer;
	}

	/* A folder's name reads heavier than the files under it. */
	.files-table .file.folder .name-text {
		font-weight : var(--fw-big);
	}

	/* A folder standing open reads gray — its contents are on screen, so the folder itself
	   is no longer the thing to look at. */
	.files-table .file.folder.opened .name-text {
		color : var(--lightgray);
	}

	.tags-cell {
		text-align : right;
	}

	/* The size column hugs its right edge, the way numbers read. */
	td.size {
		font-size     : var(--font-micro);
		padding-right : var(--gap-small);
		text-align    : right;
	}

	.tag-names {
		opacity       : var(--opacity-label);
		font-size     : var(--font-tiny);
		text-overflow : ellipsis;
		white-space   : nowrap;
		overflow      : hidden;
		display       : block;
	}

	/* Hovering a row lights it as a row-sized pill. */
	.files-table .file.hovered td {
		background          : var(--hover);
		border-bottom-color : transparent;
	}

	.files-table .file.hovered td:first-child {
		border-top-left-radius    : var(--radius-pill);
		border-bottom-left-radius : var(--radius-pill);
	}

	/* At the right the pill reaches a gap further, drawn as a strip hanging off the last cell.
	   The rounding lives on the strip, so the two read as one pill and nothing inside the row
	   moves. The left end is unchanged. The cell is the strip's anchor — without this, the
	   strip anchors to the table and paints its whole right side. */
	.files-table .file td:last-child {
		position : relative;
	}

	.files-table .file.hovered td:last-child::after {
		border-top-right-radius    : var(--radius-pill);
		border-bottom-right-radius : var(--radius-pill);
		right                      : calc(var(--gap) * -1);
		background                 : var(--hover);
		position                   : absolute;
		width                      : var(--gap);
		bottom                     : 0;
		content                    : '';
		top                        : 0;
	}

	/* The folder a carried file would land in, lit on the accent so there is no doubt where
	   letting go would put it. */
	.files-table .file.landing td {
		background          : var(--accent);
		color               : var(--text-on-accent);
		border-bottom-color : transparent;
	}

	.files-table .file.landing td:first-child {
		border-top-left-radius    : var(--radius-pill);
		border-bottom-left-radius : var(--radius-pill);
	}

	.files-table .file.landing td:last-child {
		border-top-right-radius    : var(--radius-pill);
		border-bottom-right-radius : var(--radius-pill);
	}

</style>
