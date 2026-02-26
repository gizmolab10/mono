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

<div class='unit-system'>
	<select class='units-select' value={$w_unit_system} onchange={handle_unit_change}>
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
<div class='separator'></div>
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
	<button class='action-btn right' use:hit_target={{ id: 'reset-prefs', onpress: reset }}>reset</button>
</div>

<style>
	.unit-system {
		gap             : 6px;
		display         : flex;
		justify-content : flex-end;
	}

	.action-btn {
		border-radius : 10px;
		font-size     : 11px;
		height        : 20px;
		padding       : 0 8px;
		background    : white;
		white-space   : nowrap;
		cursor        : pointer;
		color         : inherit;
		box-sizing    : border-box;
		border        : 0.5px solid currentColor;
	}

	.action-btn:global([data-hitting]) {
		color      : black;
		background : var(--accent);
	}

	.right {
		margin-left : auto;
	}

	.label {
		opacity   : 0.8;
		font-size : 0.7rem;
	}

	.precision-group {
		gap            : 4px;
		display        : flex;
		margin-top     : -8px;
		flex-direction : column;
	}

	.segmented {
		border-radius  : 6px;
		height         : 20px;
		display        : flex;
		overflow       : hidden;
		box-sizing     : border-box;
		border         : 0.5px solid currentColor;
	}

	.segment {
		padding        : 0;
		font-size      : 9px;
		border         : none;
		display        : flex;
		background     : white;
		white-space    : nowrap;
		text-align     : center;
		align-items    : center;
		justify-content: center;
		cursor         : pointer;
		flex           : 1 1 auto;
		color          : rgba(0, 0, 0, 0.5);
		border-right   : 0.5px solid currentColor;
	}

	.segment:last-child {
		border-right : 0.5px solid transparent;
	}

	.segment:global([data-hitting]) {
		color      : black;
		background : var(--accent);
	}

	.segment.active {
		opacity    : 1;
		color      : black;
		background : var(--accent);
	}

	.units-select {
		border-radius      : 10px;
		font-size          : 11px;
		height             : 20px;
		outline            : none;
		appearance         : none;
		-webkit-appearance : none;
		background         : white;
		color              : inherit;
		cursor             : pointer;
		background-repeat  : no-repeat;
		box-sizing         : border-box;
		padding            : 0 18px 0 8px;
		background-position: right 6px center;
		border             : 0.5px solid currentColor;
		background-image   : url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23999'/%3E%3C/svg%3E");
	}

	.units-select:hover {
		background-image : none;
		color            : black;
		background       : var(--accent);
	}

	.units-select:focus,
	.units-select:focus-visible {
		outline    : none;
		box-shadow : none;
		border     : 0.5px solid currentColor;
	}

	.separator {
		gap            : 2px;
		display        : flex;
		margin         : 0 -8px;
		flex-direction : column;
		background     : var(--accent);
	}

	.separator::before,
	.separator::after {
		content       : '';
		display       : block;
		background    : var(--bg);
	}

	.separator::before {
		height        : 8px;
		border-radius : 0 0 8px 8px;
	}

	.separator::after {
		height        : 8px;
		border-radius : 8px 8px 0 0;
	}

	.slider-group {
		gap            : 8px;
		display        : flex;
		align-items    : center;
	}

	.slider-group input[type='range'] {
		flex               : 1;
		min-width          : 0;
		margin-top         : 0px;
		height             : 14px;
		appearance         : none;
		-webkit-appearance : none;
		cursor             : pointer;
		background         : transparent;
	}

	.slider-group input[type='range']::-webkit-slider-runnable-track {
		border-radius : 2px;
		height        : 4px;
		border        : none;
		background    : rgba(0, 0, 0, 0.15);
	}

	.slider-group input[type='range']::-webkit-slider-thumb {
		border-radius      : 50%;
		-webkit-appearance : none;
		width              : 14px;
		height             : 14px;
		margin-top         : -5.5px;
		background         : #007aff;
		border             : 1px solid rgba(0, 0, 0, 0.4);
	}

	.slider-group input[type='range']::-moz-range-track {
		border-radius : 2px;
		height        : 4px;
		border        : none;
		background    : rgba(0, 0, 0, 0.15);
	}

	.slider-group input[type='range']::-moz-range-thumb {
		border-radius : 50%;
		width         : 14px;
		height        : 14px;
		background    : #007aff;
		border        : 1px solid rgba(0, 0, 0, 0.4);
	}

	.slider-group input[type='range']:focus {
		outline : none;
	}

	.color-row {
		gap            : 16px;
		display        : flex;
		align-items    : center;
		margin-top     : 0.3rem;
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
