<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	import { engine } from '../../ts/render';
	import { hits_3d, scenes, stores } from '../../ts/managers';
	import { T_Hit_3D, T_Units } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	const { w_text_color, w_background_color } = colors;
	const { w_selection } = hits_3d;
	const { w_root_so, w_all_sos, w_precision, w_solid, w_line_thickness } = stores;

	let selected_so = $derived($w_selection?.so ?? $w_root_so);

	function handle_name(e: Event) {
		const input = e.target as HTMLInputElement;
		if (selected_so) {
			selected_so.name = input.value;
			scenes.save();
		}
	}

	const imperial_ticks = ['foot', 'inch', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64'];
	const decimal_ticks  = ['whole', '1', '2', '3'];

	let ticks = $derived($w_unit_system === T_Units.imperial ? imperial_ticks : decimal_ticks);
	let max_tick = $derived(ticks.length - 1);

	// Clamp precision when unit system changes
	$effect(() => {
		if ($w_precision > max_tick) engine.set_precision(max_tick);
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
	{:else}
		<p>No object selected</p>
	{/if}
	<div class='settings'>
		<button class='action-btn' onclick={() => engine.add_child_so()}>add child</button>
		<button class='action-btn' onclick={() => stores.toggle_solid()}>{$w_solid ? 'solid' : 'see through'}</button>
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
					onclick={() => engine.set_precision(i)}>
					{label}
				</button>
			{/each}
		</div>
	</div>
	<div class='slider-group'>
		<span class='label'>line thickness</span>
		<input
			type    = 'range'
			min     = {0.5}
			max     = {4}
			step    = {0.5}
			value   = {$w_line_thickness}
			oninput = {(e) => w_line_thickness.set(Number((e.target as HTMLInputElement).value))}
		/>
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

	input[type='text'] {
		background    : white;
		border        : 0.5px solid currentColor;
		border-radius : 4px;
		color         : inherit;
		font-size     : 0.875rem;
		padding       : 0 6px;
		height        : 20px;
		box-sizing    : border-box;
		outline       : none;
	}

	input[type='text']:focus {
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
		background    : white;
		border        : 0.5px solid currentColor;
		border-radius : 4px;
		color         : inherit;
		padding       : 0 8px;
		font-size     : 11px;
		height        : 20px;
		box-sizing    : border-box;
		cursor        : pointer;
		opacity       : 0.5;
	}

	.so-btn:hover {
		opacity    : 1;
		background : black;
		color      : white;
	}

	.so-btn.selected {
		opacity    : 1;
		background : currentColor;
		color      : var(--bg, white);
	}

	.action-btn {
		background    : white;
		border        : 0.5px solid currentColor;
		border-radius : 10px;
		color         : inherit;
		padding       : 0 8px;
		font-size     : 11px;
		height        : 20px;
		box-sizing    : border-box;
		cursor        : pointer;
		margin-top    : 0.75rem;
	}

	.settings .action-btn {
		margin-top : 0;
	}

	.action-btn:hover {
		background : black;
		color      : white;
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
		height         : 20px;
		box-sizing     : border-box;
	}

	.segment {
		flex           : 1 1 auto;
		background     : white;
		border         : none;
		border-right   : 0.5px solid currentColor;
		color          : rgba(0, 0, 0, 0.5);
		font-size      : 9px;
		padding        : 0;
		cursor         : pointer;
		text-align     : center;
		white-space    : nowrap;
		display        : flex;
		align-items    : center;
		justify-content: center;
	}

	.segment:last-child {
		border-right : 0.5px solid transparent;
	}

	.segment:hover {
		background : black;
		color      : white;
	}

	.segment.active {
		opacity    : 1;
		background : transparent;
		color      : black;
	}

	.details-select {
		background         : white;
		background-image   : url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23999'/%3E%3C/svg%3E");
		background-repeat  : no-repeat;
		background-position: right 6px center;
		border             : 0.5px solid currentColor;
		border-radius      : 10px;
		color              : inherit;
		padding            : 0 18px 0 8px;
		font-size          : 11px;
		height             : 20px;
		box-sizing         : border-box;
		cursor             : pointer;
		outline            : none;
		appearance         : none;
		-webkit-appearance : none;
	}

	.details-select:hover {
		background       : black;
		background-image : none;
		color            : white;
	}

	.details-select:focus,
	.details-select:focus-visible {
		outline    : none;
		box-shadow : none;
		border     : 0.5px solid currentColor;
	}

	.slider-group {
		margin-top     : 1rem;
		display        : flex;
		align-items    : center;
		gap            : 8px;
	}

	.slider-group input[type='range'] {
		flex               : 1;
		min-width          : 0;
		height             : 14px;
		margin-top         : 4px;
		cursor             : pointer;
		appearance         : none;
		-webkit-appearance : none;
		background         : transparent;
	}

	.slider-group input[type='range']::-webkit-slider-runnable-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : 2px;
		height        : 4px;
		border        : none;
	}

	.slider-group input[type='range']::-webkit-slider-thumb {
		-webkit-appearance : none;
		width              : 14px;
		height             : 14px;
		border-radius      : 50%;
		background         : #007aff;
		border             : 1px solid rgba(0, 0, 0, 0.4);
		margin-top         : -5.5px;
	}

	.slider-group input[type='range']::-moz-range-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : 2px;
		height        : 4px;
		border        : none;
	}

	.slider-group input[type='range']::-moz-range-thumb {
		width         : 14px;
		height        : 14px;
		border-radius : 50%;
		background    : #007aff;
		border        : 1px solid rgba(0, 0, 0, 0.4);
	}

	.slider-group input[type='range']:focus {
		outline : none;
	}
</style>
