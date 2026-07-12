<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import buildsRaw from '../../md/builds.md?raw';
	import { k } from '../../ts/common/Constants';

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	const allNotes = buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => {
			const [_, build, date, note] = l.split('|').map(s => s.trim());
			return { build: parseInt(build), date, note };
		});
	const notesLimit = allNotes.length;
	const isNewestFirst = allNotes.length > 1 && allNotes[0].build > allNotes[1].build;

	let { onclose } : { onclose: () => void } = $props();
	let title = $state(isNewestFirst ? `Build Notes (${k.width.page} most recent)` : 'Build Notes');
	let notes = $state(allNotes.slice(0, k.width.page));
	let show_down = $state(notesLimit > k.width.page);
	let show_up = $state(false);
	let notesIndex = $state(0);

	function updateNotes() {
		const end = Math.min(notesLimit, notesIndex + k.width.page);
		notes = allNotes.slice(notesIndex, end);
		const showingMostRecent = isNewestFirst && notesIndex === 0;
		title = showingMostRecent ? `Build Notes (${k.width.page} most recent)` : 'Build Notes';
		show_up = notesIndex > 0;
		show_down = notesIndex < notesLimit - k.width.page;
	}

	function hit_closure(pointsUp: boolean) {
		const nextIndex = notesIndex + (k.width.page * (pointsUp ? -1 : 1));
		notesIndex = Math.max(0, Math.min(nextIndex, notesLimit - k.width.page));
		updateNotes();
	}

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
	style:width="{k.width.modal}px"
	onclick={(e) => e.stopPropagation()}>
	<div class='steppers'>
		{#if show_up}
			<button class='stepper' aria-label='newer builds' onclick={() => hit_closure(true)}>▲</button>
		{/if}
		{#if show_down}
			<button class='stepper' aria-label='older builds' onclick={() => hit_closure(false)}>▼</button>
		{/if}
	</div>
	<button class='close' aria-label='close' onclick={onclose}>
		<svg class='cross' width={k.svg.cross} height={k.svg.cross} viewBox='0 0 {k.size.cross} {k.size.cross}'>
			<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
		</svg>
	</button>
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
		<tbody>
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
	.modal {
		border-radius	: var(--radius-build);
		box-shadow	 	: var(--shadow-modal);
		font-size	 	: var(--font-banner);
		background	 	: var(--white);
		color		 	: var(--black);
		padding		 	: var(--pad-modal);
		position	 	: relative;
	}

	.steppers {
		top      		: var(--inset-popup-edge);
		left     		: var(--inset-popup-side);
		gap      		: var(--gap-tight);
		position 		: absolute;
		display  		: flex;
	}

	.close {
		position 		: absolute;
		top      		: var(--inset-popup-edge);
		right    		: var(--inset-popup-side);
	}

	.stepper, .close {
		font-size  		: var(--font-large);
		color      		: var(--black);
		cursor     		: pointer;
		padding    		: var(--pad-stepper);
		background 		: none;
		border     		: none;
		line-height		: 1;
	}

	.close {
		border			: var(--thickness-normal) solid var(--black);
		border-radius	: var(--radius-percent);
		width			: var(--size-cross);
		height			: var(--size-cross);
		box-sizing		: border-box;
		justify-content	: center;
		align-items		: center;
		display			: flex;
		padding			: 0;
	}

	.close:hover {
		background		: var(--hover);
	}

	.cross {
		display			: block;
	}

	.cross path {
		stroke			: var(--black);
	}

	.header {
		justify-content	: center;
		align-items		: center;
		margin-bottom	: var(--margin-header);
		display			: flex;
	}

	.title {
		font-size		: var(--font-large);
		font-weight		: var(--fw-title);
	}

	table {
		border-collapse	: collapse;
		width			: 100%;
	}

	th {
		border-bottom	: var(--thickness-normal) solid currentColor;
		padding			: var(--pad-cell);
		text-align		: left;
		opacity			: var(--opacity-header);
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
</style>
