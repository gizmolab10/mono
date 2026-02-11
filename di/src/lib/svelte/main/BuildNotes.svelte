<script lang='ts'>
	import Close_Button from '../mouse/Close_Button.svelte';
	import { Point } from '../../ts/types/Coordinates';
	import Steppers from '../mouse/Steppers.svelte';
	import { colors } from '../../ts/draw/Colors';
	import { k } from '../../ts/common/Constants';
	const { w_text_color, w_background_color } = colors;

	let { onclose } : { onclose: () => void } = $props();

	const pageSize = 7;
	const modalWidth = 600;
	const allNotes = k.build_notes;
	const notesLimit = allNotes.length;
	const isNewestFirst = allNotes.length > 1 && allNotes[0].build > allNotes[1].build;
	let title = $state(isNewestFirst ? `Build Notes (${pageSize} most recent)` : 'Build Notes');
	let notes = $state(allNotes.slice(0, pageSize));
	let show_down = $state(notesLimit > pageSize);
	let show_up = $state(false);
	let notesIndex = $state(0);

	function updateNotes() {
		const end = Math.min(notesLimit, notesIndex + pageSize);
		notes = allNotes.slice(notesIndex, end);
		const showingMostRecent = isNewestFirst && notesIndex === 0;
		title = showingMostRecent ? `Build Notes (${pageSize} most recent)` : 'Build Notes';
		show_up = notesIndex > 0;
		show_down = notesIndex < notesLimit - pageSize;
	}

	function hit_closure(pointsUp: boolean, isLong: boolean) {
		if (isLong) {
			notesIndex = pointsUp ? 0 : Math.max(0, notesLimit - pageSize);
		} else {
			const nextIndex = notesIndex + (pageSize * (pointsUp ? -1 : 1));
			notesIndex = Math.max(0, Math.min(nextIndex, notesLimit - pageSize));
		}
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
	style:color={$w_text_color}
	style:background={$w_background_color}
	style:width="{modalWidth}px"
	onclick={(e) => e.stopPropagation()}
	onkeyup={() => {}}
	role="dialog"
	tabindex="-1">
	<div class='steppers-position'>
		<Steppers {show_up} {show_down} gap={0} {hit_closure} />
	</div>
	<Close_Button size={24} origin={new Point(13, 13)} {onclose} />
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
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		border-radius: 12px;
		font-size: 0.85em;
		padding: 16px 20px;
		position: relative;
	}

	.steppers-position {
		position : absolute;
		top      : 11px;
		left     : 13px;
	}

	.header {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 12px;
	}

	.title {
		font-size: 1.25em;
		font-weight: 300;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		border-bottom: 1px solid currentColor;
		padding: 4px 8px 4px 0;
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
