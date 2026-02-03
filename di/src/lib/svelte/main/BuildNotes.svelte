<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	const { w_text_color, w_background_color } = colors;

	let { onclose } : { onclose: () => void } = $props();

	const notes = __BUILD_NOTES__;
	const title = 'Build Notes';

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
		onclick={(e) => e.stopPropagation()}
		onkeyup={() => {}}
		role="dialog">
		<div class='header'>
			<span class='title'>{title}</span>
			<button class='close' onclick={onclose}>x</button>
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
		border-radius: 4px;
		font-size: 0.85em;
		padding: 16px 20px;
		min-width: 400px;
		max-width: 600px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.title {
		font-size: 1.25em;
		font-weight: 300;
	}

	.close {
		background: transparent;
		border: none;
		font-size: 1.25em;
		cursor: pointer;
		color: inherit;
		opacity: 0.6;
		padding: 0 4px;
	}

	.close:hover {
		opacity: 1;
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
