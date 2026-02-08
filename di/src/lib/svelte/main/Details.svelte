<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	import { w_root_so, w_all_sos, add_child_so, set_precision, w_precision } from '../../ts/render/Setup';
	import { hits_3d, scenes } from '../../ts/managers';
	import { T_Hit_3D, T_Units } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	const { w_text_color, w_background_color } = colors;
	const { w_selection } = hits_3d;

	let selected_so = $derived($w_selection?.so ?? $w_root_so);

	function handle_name(e: Event) {
		const input = e.target as HTMLInputElement;
		if (selected_so) {
			selected_so.name = input.value;
			scenes.save();
		}
	}

	const imperial_ticks = ['whole', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64'];
	const decimal_ticks  = ['whole', '1', '2', '3'];

	let ticks = $derived($w_unit_system === T_Units.imperial ? imperial_ticks : decimal_ticks);
	let max_tick = $derived(ticks.length - 1);

	// Clamp precision when unit system changes
	$effect(() => {
		if ($w_precision > max_tick) set_precision(max_tick);
	});

	function handle_unit_change(e: Event) {
		const select = e.target as HTMLSelectElement;
		w_unit_system.set(select.value as T_Units);
	}

	function select_so(so: Smart_Object) {
		const face = hits_3d.front_most_face(so);
		if (face >= 0) {
			hits_3d.set_selection({ so, type: T_Hit_3D.face, index: face });
		}
		scenes.save();
	}
</script>

<div
	class            = 'details'
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	<h2>Details</h2>
	{#if $w_all_sos.length > 1}
		<div class='so-row'>
			{#each $w_all_sos as so}
				<button
					class='so-btn'
					class:selected = {selected_so === so}
					onclick={() => select_so(so)}>
					{so.name}
				</button>
			{/each}
		</div>
	{/if}
	{#if selected_so}
		<label class='field'>
			<span class='label'>Name</span>
			<input
				type     = 'text'
				value    = {selected_so.name}
				oninput  = {handle_name}
			/>
		</label>
		<button class='action-btn' onclick={add_child_so}>add child</button>
	{:else}
		<p>No object selected</p>
	{/if}
	<div class='settings'>
		<select class='details-select' value={$w_unit_system} onchange={handle_unit_change}>
			{#each Object.values(T_Units) as system}
				<option value={system}>{system}</option>
			{/each}
		</select>
	</div>
	<div class='precision-group'>
		<span class='label'>precision</span>
		<div class='segmented'>
			{#each ticks as label, i}
				<button
					class='segment'
					class:active={i === $w_precision}
					onclick={() => set_precision(i)}>
					{label}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.details {
		width      : 100%;
		height     : 100%;
		padding    : 1rem;
		box-sizing : border-box;
	}

	.details h2 {
		margin      : 0 0 1rem;
		font-size   : 1rem;
		font-weight : 500;
	}

	.field {
		display        : flex;
		flex-direction : column;
		gap            : 0.25rem;
	}

	.label {
		font-size : 0.75rem;
		opacity   : 0.6;
	}

	input {
		background    : transparent;
		border        : 0.5px solid currentColor;
		border-radius : 4px;
		color         : inherit;
		font-size     : 0.875rem;
		padding       : 4px 6px;
		outline       : none;
	}

	input:focus {
		border-color : currentColor;
		opacity      : 1;
	}

	.so-row {
		display   : flex;
		gap       : 4px;
		flex-wrap : wrap;
		margin-bottom : 0.75rem;
	}

	.so-btn {
		background    : transparent;
		border        : 0.5px solid currentColor;
		border-radius : 4px;
		color         : inherit;
		padding       : 2px 8px;
		font-size     : 11px;
		cursor        : pointer;
		opacity       : 0.5;
	}

	.so-btn:hover {
		opacity : 0.8;
	}

	.so-btn.selected {
		opacity    : 1;
		background : currentColor;
		color      : var(--bg, white);
	}

	.action-btn {
		background    : transparent;
		border        : 0.5px solid currentColor;
		border-radius : 10px;
		color         : inherit;
		padding       : 2px 8px;
		font-size     : 11px;
		cursor        : pointer;
		margin-top    : 0.75rem;
	}

	.action-btn:hover {
		background : currentColor;
		color      : var(--bg, white);
	}

	p {
		margin    : 0;
		opacity   : 0.6;
		font-size : 0.875rem;
	}

	.settings {
		display    : flex;
		gap        : 6px;
		margin-top : 1rem;
	}

	.precision-group {
		margin-top     : 1rem;
		display        : flex;
		flex-direction : column;
		gap            : 4px;
	}

	.segmented {
		display        : flex;
		border         : 0.5px solid currentColor;
		border-radius  : 6px;
		overflow       : hidden;
	}

	.segment {
		flex           : 1;
		background     : transparent;
		border         : none;
		border-right   : 0.5px solid currentColor;
		color          : inherit;
		font-size      : 9px;
		padding        : 3px 0;
		cursor         : pointer;
		text-align     : center;
		opacity        : 0.5;
	}

	.segment:last-child {
		border-right : none;
	}

	.segment:hover {
		opacity    : 0.8;
		background : rgba(128, 128, 128, 0.1);
	}

	.segment.active {
		opacity    : 1;
		background : currentColor;
		color      : var(--bg, white);
	}

	.details-select {
		background         : transparent;
		border             : 0.5px solid currentColor;
		border-radius      : 10px;
		color              : inherit;
		padding            : 2px 8px;
		font-size          : 11px;
		cursor             : pointer;
		outline            : none;
		box-sizing         : border-box;
		appearance         : none;
		-webkit-appearance : none;
	}

	.details-select:focus,
	.details-select:focus-visible {
		outline    : none;
		box-shadow : none;
		border     : 0.5px solid currentColor;
	}
</style>
