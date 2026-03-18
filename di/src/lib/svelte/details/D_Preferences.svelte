<script lang='ts'>
	import { preferences } from '../../ts/managers/Preferences';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Units } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { colors } from '../../ts/utilities/Colors';
	import Separator from '../mouse/Separator.svelte';
	import { stores } from '../../ts/managers';
	import { engine } from '../../ts/render';

	const { w_accent_color } = colors;
	const { w_precision, w_line_thickness, w_edge_color } = stores;
	const chevron_url = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23999'/%3E%3C/svg%3E\")";
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
	<select class='units-select' style:background-image={chevron_url} value={$w_unit_system} onchange={handle_unit_change}>
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
<Separator />
<div class='slider-group'>
	<span class='label'>line thickness</span>
	<input
		max     = {4}
		min     = {0.5}
		step    = {0.5}
		type    = 'range'
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
	<button class='action-button right' use:hit_target={{ id: 'reset-prefs', onpress: reset }}>factory reset</button>
</div>

<style>
	.unit-system {
		gap             : var(--l-gap-small);
		justify-content : flex-end;
		display         : flex;
	}

	.action-button {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		border-radius : var(--corner-common);
		font-size     : var(--h-font-common);
		z-index       : var(--z-action);
		background    : var(--c-white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 8px;
	}

	.action-button:global([data-hit]) {
		color      : var(--c-black);
		background : var(--hover);
	}

	.right {
		margin-left : auto;
	}

	.label {
		font-size : var(--h-font-small);
		opacity   : 0.8;
	}

	.precision-group {
		z-index        : var(--z-action);
		gap            : var(--l-gap);
		margin-bottom  : var(--l-gap);
		position       : relative;
		flex-direction : column;
		margin-top     : -8px;
		display        : flex;
	}

	.segmented {
		border         : var(--th-border) solid currentColor;
		height         : var(--h-button-common);
		border-radius  : var(--corner-common);
		background     : var(--c-white);
		box-sizing     : border-box;
		overflow       : hidden;
		display        : flex;
	}

	.segment {
		border         : none;
		background     : var(--c-white);
		border-right   : var(--th-border) solid currentColor;
		font-size      : var(--h-font-small);
		z-index        : var(--z-action);
		flex           : 1 1 auto;
		cursor         : pointer;
		white-space    : nowrap;
		text-align     : center;
		align-items    : center;
		justify-content: center;
		display        : flex;
		opacity        : 0.5;
		padding        : 0;
	}

	.segment:last-child {
		border-right : var(--th-border) solid transparent;
	}

	.segment:global([data-hit]) {
		color      : var(--c-black);
		background : var(--hover);
		opacity    : 1;
	}

	.segment.active {
		background : var(--selected);
		color      : var(--c-black);
		opacity    : 1;
	}

	.units-select {
		background         : var(--c-white);
		border             : var(--th-border) solid currentColor;
		height             : var(--h-button-common);
		border-radius      : var(--corner-common);
		font-size          : var(--h-font-common);
		background-position: right 6px center;
		z-index            : var(--z-action);
		padding            : 0 18px 0 8px;
		box-sizing         : border-box;
		background-repeat  : no-repeat;
		color              : inherit;
		cursor             : pointer;
		appearance         : none;
		-webkit-appearance : none;
	}

	.units-select:hover {
		color            : var(--c-black);
		background-color : var(--hover);
	}

	.units-select:focus,
	.units-select:focus-visible {
		border     : var(--th-border) solid currentColor;
		box-shadow : none;
		outline    : none;
	}


	.slider-group {
		z-index        : var(--z-action);
		margin-top     : var(--l-gap);
		position       : relative;
		align-items    : center;
		display        : flex;
		gap            : 8px;
	}

	.slider-group input[type='range'] {
		height             : var(--h-slider);
		background         : transparent;
		cursor             : pointer;
		appearance         : none;
		-webkit-appearance : none;
		margin-top         : 0px;
		min-width          : 0;
		flex               : 1;
	}

	.slider-group input[type='range']::-webkit-slider-runnable-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : var(--corner-input);
		height        : var(--th-track);
		border        : none;
	}

	.slider-group input[type='range']::-webkit-slider-thumb {
		margin-top         : calc((var(--th-track) - var(--h-slider)) / 2);
		border             : 1px solid rgba(0, 0, 0, 0.4);
		width              : var(--h-slider);
		height             : var(--h-slider);
		background         : var(--c-thumb);
		appearance         : none;
		-webkit-appearance : none;
		border-radius      : 50%;
	}

	.slider-group input[type='range']::-moz-range-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : var(--corner-input);
		height        : var(--th-track);
		border        : none;
	}

	.slider-group input[type='range']::-moz-range-thumb {
		border        : 1px solid rgba(0, 0, 0, 0.4);
		width         : var(--h-slider);
		height        : var(--h-slider);
		background    : var(--c-thumb);
		border-radius : 50%;
	}

	.slider-group input[type='range']:focus {
		outline : none;
	}

	.slider-group input[type='range']::-webkit-slider-thumb:hover {
		background : var(--hover);
	}

	.slider-group input[type='range']::-moz-range-thumb:hover {
		background : var(--hover);
	}

	.color-row {
		align-items    : center;
		margin-top     : 0.3rem;
		display        : flex;
		gap            : 16px;
	}

	.color-group {
		align-items    : center;
		display        : flex;
		gap            : 8px;
	}

	.color-group input[type='color'] {
		border             : var(--th-border) solid currentColor;
		width              : var(--h-button-common);
		height             : var(--h-button-common);
		z-index            : var(--z-action);
		cursor             : pointer;
		appearance         : none;
		-webkit-appearance : none;
		background         : none;
		border-radius      : 50%;
		padding            : 0;
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
