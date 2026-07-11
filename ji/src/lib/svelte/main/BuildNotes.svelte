<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import buildsRaw from '../../md/builds.md?raw';
	import { k } from '../../ts/common/Constants';

	const crossPath = svg_paths.x_cross(k.width.cross, k.width.cross / 6);
	console.log(`Close button: cross drawn from di path generator, size ${k.width.cross}, path ${crossPath}.`);

	const allNotes = buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => {
			const [_, build, date, note] = l.split('|').map(s => s.trim());
			return { build: parseInt(build), date, note };
		});
	const notesLimit = allNotes.length;
	const isNewestFirst = allNotes.length > 1 && allNotes[0].build > allNotes[1].build;
	console.log(`Build notes: read ${notesLimit} build rows from the markdown file. Newest first: ${isNewestFirst}.`);

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
		console.log(`Build notes: showing rows ${notesIndex + 1} to ${end} of ${notesLimit}. Up arrow ${show_up ? 'on' : 'off'}, down arrow ${show_down ? 'on' : 'off'}.`);
	}

	function hit_closure(pointsUp: boolean) {
		const nextIndex = notesIndex + (k.width.page * (pointsUp ? -1 : 1));
		notesIndex = Math.max(0, Math.min(nextIndex, notesLimit - k.width.page));
		console.log(`Build notes: ${pointsUp ? 'up' : 'down'} arrow clicked, new top row is ${notesIndex + 1}.`);
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
		<svg class='cross' width='16' height='16' viewBox='0 0 {k.width.cross} {k.width.cross}'>
			<path d={crossPath} fill='none' stroke='#1a1a1a' stroke-width={k.width.cross / 12} stroke-linecap='round' />
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
		box-shadow : 0 2px 8px rgba(0, 0, 0, 0.2);
		background : #ffffff;
		color      : #1a1a1a;
		border-radius: var(--radius-build);
		padding: 16px 20px;
		position: relative;
		font-size: 14px;
	}

	.steppers {
		position : absolute;
		top      : 11px;
		left     : 13px;
		display  : flex;
		gap      : 4px;
	}

	.close {
		position : absolute;
		top      : 11px;
		right    : 13px;
	}

	.stepper, .close {
		color      : #1a1a1a;
		cursor     : pointer;
		padding    : 0 4px;
		background : none;
		border     : none;
		font-size  : 18px;
		line-height: 1;
	}

	.close {
		border: 1px solid #1a1a1a;
		justify-content: center;
		box-sizing: border-box;
		align-items: center;
		border-radius: var(--radius-percent);
		display: flex;
		height: var(--h-build);
		width: 22px;
		padding: 0;
	}

	.cross {
		display: block;
	}

	.header {
		justify-content: center;
		align-items: center;
		margin-bottom: 12px;
		display: flex;
	}

	.title {
		font-weight: 300;
		font-size: 18px;
	}

	table {
		border-collapse: collapse;
		width: 100%;
	}

	th {
		border-bottom: 1px solid currentColor;
		padding: 4px 8px 4px 0;
		text-align: left;
		opacity: 0.7;
	}

	td {
		padding: 4px 8px 4px 0;
	}

	th:first-child, td:first-child {
		width: 50px;
	}

	th:nth-child(2), td:nth-child(2) {
		width: 120px;
	}
</style>
