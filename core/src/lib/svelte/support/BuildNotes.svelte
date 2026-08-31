<script lang='ts'>
	import { svg_paths } from '../../ts/utilities';
	import { hit_target } from '../../ts/events';
	import { Direction } from '../../ts/types';
	import buildsRaw from '../../md/builds.md?raw';
	import { debug } from '../../ts/common';
	import { k } from '../../ts/common';


	// The newer/older steppers: the same fat triangle mark the viewer uses to step files, pointing up
	// (newer) and down (older), at the same size.
	const STEP_TRIANGLE = k.size.normal * 1.1;
	const up_path     = svg_paths.fat_polygon(STEP_TRIANGLE, Direction.up);
	const up_bounds   = svg_paths.fat_polygon_bounds(STEP_TRIANGLE, Direction.up);
	const down_path   = svg_paths.fat_polygon(STEP_TRIANGLE, Direction.down);
	const down_bounds = svg_paths.fat_polygon_bounds(STEP_TRIANGLE, Direction.down);

	const allNotes = buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => {
			const [_, build, date, note] = l.split('|').map(s => s.trim());
			return { build: parseInt(build), date, note };
		});
	const notesLimit = allNotes.length;
	const pageCap = Math.min(k.paging.notes, notesLimit);   // most rows a page ever shows, even if the window could hold more
	const isNewestFirst = allNotes.length > 1 && allNotes[0].build > allNotes[1].build;

	let { onclose } : { onclose: () => void } = $props();
	// How many rows a page shows. Starts at the constant, then is fitted to the window height so the
	// popup never grows taller than the screen (which would scroll its title and controls off top).
	let pageSize = $state(k.paging.notes);
	let notesIndex = $state(0);
	let title = $state(isNewestFirst ? `build notes (${k.paging.notes} most recent)` : 'build notes');
	let notes = $state(allNotes.slice(0, k.paging.notes));
	let show_down = $state(notesLimit > k.paging.notes);
	let show_up = $state(false);
	let modal_el = $state<HTMLElement | null>(null);
	let tbody_el = $state<HTMLElement | null>(null);

	const MIN_GAP = 20;   // least space kept above the popup (and, since the backdrop centers it, below too)

	function updateNotes() {
		const end = Math.min(notesLimit, notesIndex + pageSize);
		notes = allNotes.slice(notesIndex, end);
		const showingMostRecent = isNewestFirst && notesIndex === 0;
		title = showingMostRecent ? `build notes (${pageSize} most recent)` : 'build notes';
		show_up = notesIndex > 0;
		show_down = notesIndex < notesLimit - pageSize;
	}

	function hit_closure(pointsUp: boolean) {
		const nextIndex = notesIndex + (pageSize * (pointsUp ? -1 : 1));
		notesIndex = Math.max(0, Math.min(nextIndex, notesLimit - pageSize));
		updateNotes();
	}

	function set_page(size: number) {
		const clamped = Math.max(1, Math.min(pageCap, size));
		if (clamped === pageSize) { return; }
		pageSize   = clamped;
		notesIndex = Math.max(0, Math.min(notesIndex, Math.max(0, notesLimit - pageSize)));
		updateNotes();
	}

	// Fit the row count to the window using the popup's real height: if it spills past the bottom of
	// the window, drop enough rows to fit; if there's room for a whole extra row, add one. Growing
	// needs a full row's worth of slack while shrinking triggers on any spill, so the two can never
	// flip-flop (no oscillation), and it reads the true height so compression can't fool it.
	function fit_rows() {
		if (!modal_el || !tbody_el || notes.length === 0) { return; }
		let tallest = 0;
		tbody_el.querySelectorAll('tr').forEach((r) => { tallest = Math.max(tallest, (r as HTMLElement).offsetHeight); });
		if (tallest <= 0) { return; }
		const spill = modal_el.offsetHeight - (window.innerHeight - 2 * MIN_GAP);   // > 0 means it would leave less than the min gap top and bottom
		if (spill > 0 && pageSize > 1) {
			const drop = Math.max(1, Math.ceil(spill / tallest));
			debug.log_soon(`Build notes: popup ${modal_el.offsetHeight}px spills ${spill.toFixed(0)}px past the ${window.innerHeight}px window — dropping ${drop} of ${pageSize} row(s).`);
			set_page(pageSize - drop);
		} else if (-spill >= tallest && pageSize < pageCap) {
			debug.log_soon(`Build notes: popup ${modal_el.offsetHeight}px leaves ${(-spill).toFixed(0)}px in the ${window.innerHeight}px window (a row is ${tallest.toFixed(0)}px) — adding one to ${pageSize}.`);
			set_page(pageSize + 1);
		}
	}

	// Re-fit after each render (the row count or a resize can change the numbers); converges once the
	// fitted count stops changing.
	$effect(() => { fit_rows(); });
	$effect(() => {
		const on_resize = () => fit_rows();
		window.addEventListener('resize', on_resize);
		return () => window.removeEventListener('resize', on_resize);
	});

	function handle_key_down(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose();
		}
	}
</script>

<svelte:document onkeydown={handle_key_down} />

<div
	class='modal'
	role="dialog"
	tabindex="-1"
	onkeyup={() => {}}
	bind:this={modal_el}
	style:width={`min(${k.width.fat}px, calc(100vw - 2 * var(--gap)))`}
	style:top={pageSize < k.paging.notes ? '20px' : '50%'}
	style:left="50%"
	style:transform={`translate(-50%, ${pageSize < k.paging.notes ? '0' : '-50%'})`}
	onclick={onclose}>
	<!-- Both steppers are always placed (their slots pinned); the current show/hide logic just makes
	     them visible or not, so hiding one never shifts the other. -->
	<div class='steppers'>
		<!-- The box behind these closes on a press, so each stops the press reaching it. The
		     manager hands a press to one target only, so nothing has to be stopped by hand. -->
		<button class='stepper' aria-label='newer builds'
			style:visibility={show_up ? 'visible' : 'hidden'}
			use:hit_target={{ id: 'builds.newer', onpress: () => hit_closure(true), tip: 'newer builds' }}>
			<svg overflow='visible' width={up_bounds.width} height={up_bounds.height} viewBox='{up_bounds.minX} {up_bounds.minY} {up_bounds.width} {up_bounds.height}'><path d={up_path} /></svg>
		</button>
		<button class='stepper' aria-label='older builds'
			style:visibility={show_down ? 'visible' : 'hidden'}
			use:hit_target={{ id: 'builds.older', onpress: () => hit_closure(false), tip: 'older builds' }}>
			<svg overflow='visible' width={down_bounds.width} height={down_bounds.height} viewBox='{down_bounds.minX} {down_bounds.minY} {down_bounds.width} {down_bounds.height}'><path d={down_path} /></svg>
		</button>
	</div>
	<div class='header'>
		<span class='title'>{title}</span>
	</div>
	<table>
		<thead>
			<tr>
				<th>Build</th>
				<th>Date</th>
				<th>Note</th>
			</tr>
		</thead>
		<tbody bind:this={tbody_el}>
			{#each notes as note}
				<tr>
					<td>{note.build}</td>
					<td>{note.date}</td>
					<td>{note.note}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/* Positioned inside the fixed backdrop; the inline top/left/transform place it — centered by
	   default, or pinned 20px from the top (when fewer than the full set of rows fit) and/or a --gap
	   in from the left (when the window is too narrow to center the fixed width). Absolute so the
	   backdrop's flex can't squeeze the rows, and so top/left land exactly. */
	.modal {
		border-radius	: var(--radius-small);
		box-shadow	 	: var(--shadow-modal);
		font-size	 	: var(--font-big);
		padding		 	: var(--pad-modal);
		color		 	: var(--black);
		box-sizing	 	: border-box;   /* the capped width includes the padding, so the --gap margins hold */
		background	 	: var(--bg);
		position	 	: absolute;
	}

	.steppers {
		top      		: var(--inset-popup-edge);
		left     		: var(--inset-popup-side);
		gap      		: var(--gap-tiny);
		position 		: absolute;
		flex-direction	: column;   /* newer above older */
		display  		: flex;
	}

	.stepper {
		padding    		: var(--pad-stepper);
		font-size  		: var(--font-fat);
		color      		: var(--black);
		cursor     		: pointer;
		background 		: none;
		border     		: none;
		line-height		: 1;
	}

	/* The step triangles: page-colored inside with an accent outline, filling to the hover color
	   under the cursor — the same look as the viewer's file steppers. */
	.stepper {
		justify-content : center;
		align-items     : center;
		display         : flex;
	}

	.stepper path {
		stroke       : var(--accent);
		fill         : var(--white);
		stroke-width : 1;
	}

	.stepper:global([data-hit]) path {
		fill         : var(--hover);
	}


	.header {
		margin-bottom	: var(--margin-header);
		justify-content	: center;
		align-items		: center;
		display			: flex;
	}

	.title {
		font-size		: var(--font-fat);
		font-weight		: var(--fw-huge);
	}

	table {
		margin-top		: var(--gap-fat);
		border-collapse	: collapse;
		table-layout	: fixed;   /* build + date keep their set widths; the note takes the rest and clips */
		width			: 100%;
	}

	th {
		border-bottom	: var(--thick) solid currentColor;
		opacity			: var(--opacity-header);
		padding			: var(--pad-cell);
		text-align		: left;
	}

	td {
		padding			: var(--pad-cell);
	}

	th:first-child, td:first-child {
		width			: var(--notes-build);
	}

	th:nth-child(2), td:nth-child(2) {
		width			: var(--notes-date);
	}

	/* The note column takes the leftover width; when the popup narrows it clips to one line with an
	   ellipsis rather than wrapping (which would grow the row height). */
	th:nth-child(3), td:nth-child(3) {
		text-overflow	: ellipsis;
		white-space		: nowrap;
		overflow		: hidden;
	}

</style>
