<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Units } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { preferences } from '../../ts/managers/Preferences';
	import { stores } from '../../ts/managers';
	import { colors } from '../../ts/draw/Colors';
	import { engine } from '../../ts/render';

	const { w_accent_color } = colors;
	const { w_precision, w_line_thickness, w_edge_color } = stores;

	const imperial_ticks = ['foot', 'inch', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64'];
	const decimal_ticks  = ['whole', '1', '2', '3'];

	let ticks = $derived($w_unit_system === T_Units.imperial ? imperial_ticks : decimal_ticks);
	let max_tick = $derived(ticks.length - 1);

	$effect(() => {
		if ($w_precision > max_tick) engine.set_precision(max_tick);
	});

	function handle_unit_change(e: Event) {
		const select = e.target as HTMLSelectElement;
		w_unit_system.set(select.value as T_Units);
	}

	function reset() {
		preferences.reset();
		location.reload();
	}
</script>

<div class='settings'>
	<button class='action-btn' use:hit_target={{ id: 'reset-prefs', onpress: reset }}>reset</button>
	<select class='details-select right' value={$w_unit_system} onchange={handle_unit_change}>
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
				use:hit_target={{ id: `precision-${i}`, onpress: () => engine.set_precision(i) }}>
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
<div class='color-row'>
	<div class='color-group'>
		<span class='label'>accent</span>
		<input
			type    = 'color'
			value   = {$w_accent_color}
			oninput = {(e) => w_accent_color.set((e.target as HTMLInputElement).value)}
		/>
	</div>
	<div class='color-group'>
		<span class='label'>lines</span>
		<input
			type    = 'color'
			value   = {$w_edge_color}
			oninput = {(e) => w_edge_color.set((e.target as HTMLInputElement).value)}
		/>
	</div>
</div>

<style>
	.settings {
		display : flex;
		gap     : 6px;
	}

	.action-btn {
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		background    : white;
		padding       : 0 8px;
		border-radius : 10px;
		font-size     : 11px;
		height        : 20px;
		white-space   : nowrap;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.right {
		margin-left : auto;
	}

	.label {
		font-size : 0.75rem;
		opacity   : 0.6;
	}

	.precision-group {
		margin-top     : 0.75rem;
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

	.segment:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.segment.active {
		opacity    : 1;
		background : var(--accent);
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
		background       : var(--accent);
		background-image : none;
		color            : black;
	}

	.details-select:focus,
	.details-select:focus-visible {
		outline    : none;
		box-shadow : none;
		border     : 0.5px solid currentColor;
	}

	.slider-group {
		margin-top     : 0.75rem;
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

	.color-row {
		margin-top     : 0.75rem;
		display        : flex;
		align-items    : center;
		gap            : 16px;
	}

	.color-group {
		display        : flex;
		align-items    : center;
		gap            : 8px;
	}

	.color-group input[type='color'] {
		width              : 20px;
		height             : 20px;
		padding            : 0;
		border             : 0.5px solid currentColor;
		border-radius      : 50%;
		cursor             : pointer;
		appearance         : none;
		-webkit-appearance : none;
		background         : none;
	}

	.color-group input[type='color']::-webkit-color-swatch-wrapper {
		padding : 0;
	}

	.color-group input[type='color']::-webkit-color-swatch {
		border        : none;
		border-radius : 50%;
	}

	.color-group input[type='color']::-moz-color-swatch {
		border        : none;
		border-radius : 50%;
	}
</style>
