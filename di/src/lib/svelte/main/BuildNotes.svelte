<script lang='ts'>
	import Close_Button from '../mouse/Close_Button.svelte';
	import Steppers from '../mouse/Steppers.svelte';
	import { colors } from '../../ts/draw/Colors';
	import { Point } from '../../ts/types/Coordinates';
	const { w_text_color, w_background_color } = colors;

	let { onclose } : { onclose: () => void } = $props();

	const allNotes = __BUILD_NOTES__;
	const notesLimit = allNotes.length;
	const pageSize = 12;
	const modalWidth = 600;
	const isNewestFirst = allNotes.length > 1 && allNotes[0].build > allNotes[1].build;
	let notesIndex = $state(0);
	let notes = $state(allNotes.slice(0, pageSize));
	let title = $state(isNewestFirst ? `Build Notes (${pageSize} most recent)` : 'Build Notes');
	let show_up = $state(false);
	let show_down = $state(notesLimit > pageSize);

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
	class='overlay'
	onclick={onclose}
	onkeyup={() => {}}
	role="button"
	tabindex="-1">
	<div
		class='modal'
		style:color={$w_text_color}
		style:background={$w_background_color}
		style:width="{modalWidth}px"
		onclick={(e) => e.stopPropagation()}
		onkeyup={() => {}}
		role="dialog">
		<Steppers {show_up} {show_down} {hit_closure} />
		<Close_Button size={24} origin={new Point(8, 8)} {onclose} />
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
</div>

<style>
	.overlay {
		background-color: rgba(0, 0, 0, 0.1);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
		z-index: 100;
	}

	.modal {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		border-radius: 12px;
		font-size: 0.85em;
		padding: 16px 20px;
		position: relative;
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
