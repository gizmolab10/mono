<script lang='ts'>
	import { k, core, u, show, colors, Point, builds, T_Layer } from '../../ts/common/Global_Imports';
	import Close_Button from '../mouse/Close_Button.svelte';
	import Steppers from '../mouse/Steppers.svelte';
	import { onMount } from 'svelte';
	const notesIndexed = Object.entries(builds.notes).reverse();
	const { w_id_popupView, w_t_directionals } = show;
	const notesLimit = notesIndexed.length - 1;
	const { w_background_color } = colors;
	let title = k.empty;
	let notesIndex = 0;
	let notes = [];
	
	updateNotes();

	function updateNotes() {
		const end = Math.min(notesLimit, notesIndex + 10);
		notes = notesIndexed.slice(notesIndex, end);
		const suffix = notesIndex < 10 ? ' (10 most recent)' : k.empty;
		title = `Seriously Build Notes${suffix}`;
	}
	
	function handle_key_down(event) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'escape': $w_id_popupView = null; break;
		}
	}

	function hit_closure(pointsUp, isLong) {
		if (isLong) {
			notesIndex = pointsUp ? 0 : notesLimit - 10;
		} else {			
			const nextIndex = notesIndex + (10 * (pointsUp ? -1 : 1));
			notesIndex = nextIndex.force_between(0, notesLimit - 10);
		}
		$w_t_directionals = [notesIndex > 0, notesIndex < notesLimit - 10];
		updateNotes();
	}

</script>

<svelte:document on:keydown={handle_key_down} />
<div class='notes-modal-overlay'
	on:keyup = {u.ignore}
	on:keydown = {u.ignore}
	on:click={() => $w_id_popupView = null}>
	<div class='notes-modal-content'
		style='background-color:{$w_background_color}'
		on:click|stopPropagation>
		<div class='top-bar'>
			<Steppers hit_closure={hit_closure}/>
			<div class='title'>{title}</div>
		</div>
		<Close_Button
			name='builds-close'
			size={k.height.dot * 1.5}
			closure={() => $w_id_popupView = null}
			origin={new Point(8, k.height.dot * 0.75)}/>
		<br>
		<table style='width:100%'>
			<tbody>
				<tr>
					<th>Build</th>
					<th>Date</th>
					<th>Note</th>
				</tr>
				{#each notes as [key, value]}
					<tr>
						<td>{key}</td>
						<td>{value[0]}</td>
						<td>&nbsp; {value[1]}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.notes-modal-overlay {
		background-color: rgba(0, 0, 0, 0.1);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}
	.notes-modal-content {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		background-color: #fff;
		border-radius: 4px;
		position: absolute;
		font-size: 0.8em;
		padding: 20px;
		width: 500px;
	}
	.top-bar {
		justify-content: center;
        align-items: center;
        display: flex;
        gap: 10px;
    }
	.title {
		font-size: 1.5em;
	}
	th {
		border-bottom: 1px solid black;
	}
</style>
