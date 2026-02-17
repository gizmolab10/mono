<script lang='ts'>
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import Steppers from './Steppers.svelte';
	import { onMount } from 'svelte';

	let {
		min = 0.1,
		max = 10,
		value = 1,
		logarithmic = false,
		divisions = 100,
		width = 120,
		height = 20,
		show_value = false,
		show_steppers = true,
		style = 'line',
		onstep,
		onchange,
	}: {
		min?: number;
		max?: number;
		value?: number;
		logarithmic?: boolean;
		divisions?: number;
		width?: number;
		height?: number;
		show_value?: boolean;
		show_steppers?: boolean;
		style?: 'pill' | 'line';
		onstep?: (pointsUp: boolean, isLong: boolean) => void;
		onchange: (value: number) => void;
	} = $props();

	const border = '1px solid darkgray';
	const thumb_color_default = '#007aff';

	// Hit target for slider thumb
	const sliderTarget = new S_Hit_Target(T_Hit_Target.control, 'slider-thumb');

	let slider_input: HTMLInputElement | null = $state(null);
	let is_dragging = $state(false);

	// Logarithmic: divide the log range into N divisions
	// Linear: divide the value range into N divisions
	const step_size = $derived(
		logarithmic ? Math.log10(max) / divisions : max / divisions
	);

	// Value → slider position (0..divisions)
	let slider_value = $derived(
		value <= min ? 0 : (logarithmic ? Math.log10(value) / step_size : value / step_size)
	);

	// Slider position → value
	function position_to_value(pos: number): number {
		if (logarithmic) {
			return Math.max(min, Math.pow(10, pos * step_size));
		}
		// For linear: round to 2 decimal places
		const raw = pos * step_size;
		return Math.max(min, Math.round(raw * 100) / 100);
	}

	function on_input(e: Event) {
		const target = e.target as HTMLInputElement;
		const pos = parseFloat(target.value);
		const new_value = position_to_value(pos);
		if (new_value !== value) {
			onchange(new_value);
		}
	}

	// Power-of-10 tick marks for logarithmic sliders
	const log_ticks = $derived.by(() => {
		if (!logarithmic) return [];
		const log_max = Math.log10(max);
		const log_min = Math.floor(Math.log10(min));
		const ticks: { pct: number; label: string }[] = [];
		for (let exp = log_min; exp <= Math.ceil(log_max); exp++) {
			const val = Math.pow(10, exp);
			if (val <= min || val > max) continue;
			const pct = (Math.log10(val) / log_max) * 100;
			ticks.push({ pct, label: val < 1 ? val.toString() : val.toFixed(0) });
		}
		return ticks;
	});

	// Hover state
	const { w_s_hover } = hits;
	const hoverSlider = $derived($w_s_hover?.id === sliderTarget.id);
	const current_thumb_color = $derived(
		(hoverSlider || is_dragging) ? 'black' : thumb_color_default
	);

	// Register slider hit target
	$effect(() => {
		if (slider_input) {
			sliderTarget.set_html_element(slider_input);
			sliderTarget.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) is_dragging = true;
				else if (s_mouse.isUp) is_dragging = false;
				return false;
			};
		}
	});

	onMount(() => {
		return () => {
			hits.delete_hit_target(sliderTarget);
		};
	});
</script>

<div class='slider-compound'>
	<div class='slider-with-label'>
		{#if logarithmic}
			<span class='current-value'>{Math.abs(value - Math.round(value)) < 0.05 ? Math.round(value) : value.toFixed(1)}</span>
		{/if}
		<div class='slider-border'
			class:pill={style === 'pill'}
			class:line={style === 'line'}
			style:width="{width}px"
			style:--border={border}
			style:--height="{height}px"
			style:--thumb-color={current_thumb_color}>
			<input class='slider-input'
				min='0'
				step='any'
				type='range'
				max={divisions}
				value={slider_value}
				bind:this={slider_input}
				oninput={on_input}
				style='flex: 1 1 auto; position: relative; min-width: 0; pointer-events: auto;'/>
			{#if logarithmic}
				<div class='tick-overlay'>
					{#each log_ticks as tick}
						<div class='tick' style:left="{tick.pct}%">
							<div class='tick-line'></div>
							<span class='tick-label'>{tick.label}</span>
						</div>
					{/each}
				</div>
			{/if}
			{#if show_value}
				<span class='value-display'>
					{value}
				</span>
			{/if}
		</div>
		{#if !logarithmic}
			<span class='slider-label'>{Math.log10(value).toFixed(1)}</span>
		{/if}
	</div>
	{#if show_steppers && onstep}
		<div class='steppers-wrapper'>
			<Steppers size={15} gap={-5} hit_closure={onstep} />
		</div>
	{/if}
</div>

<style>
	.slider-compound {
		display     : flex;
		align-items : center;
		margin-left : 6px;
		gap         : 0;
		overflow    : visible;
	}
	.slider-with-label {
		display        : flex;
		flex-direction : column;
		align-items    : center;
		overflow       : visible;
		position       : relative;
		top            : -2px;
	}
	.current-value {
		font-size            : 9px;
		font-weight          : bold;
		font-variant-numeric : tabular-nums;
		text-align           : center;
		line-height          : 1;
		user-select          : none;
		margin-top           : 0;
		margin-bottom        : -6px;
	}
	.slider-label {
		font-size            : 8px;
		font-weight          : bold;
		font-variant-numeric : tabular-nums;
		text-align           : center;
		line-height          : 1;
		margin-top           : 1px;
		user-select          : none;
		position             : relative;
		top                  : 4px;
	}
	.slider-border {
		position    : relative;
		display     : flex;
		align-items : center;
		overflow    : visible;
	}
	.tick-overlay {
		position       : absolute;
		top            : 50%;
		left           : 7px;
		right          : 7px;
		height         : 0;
		overflow       : visible;
		pointer-events : none;
	}
	.tick {
		position  : absolute;
		transform : translateX(-50%);
	}
	.tick-line {
		width      : 1px;
		height     : 4px;
		margin-top : -2px;
		background : rgba(0, 0, 0, 0.3);
	}
	.tick-label {
		position    : absolute;
		top         : 4px;
		left        : 50%;
		transform   : translateX(-50%);
		font-size   : 6px;
		line-height : 1;
		text-align  : center;
		color       : rgba(0, 0, 0, 1);
		user-select : none;
		white-space : nowrap;
	}
	.value-display {
		font-size    : 11px;
		margin-left  : 4px;
		display      : inline-block;
		width        : 3em;
		text-align   : right;
	}
	.steppers-wrapper {
		margin-left : -1px;
	}

	/* === Native range input styling === */

	input[type='range'] {
		appearance         : none;
		height             : var(--height);
		background         : transparent;
		-webkit-appearance : none;
	}
	input[type='range']::-webkit-slider-runnable-track {
		background    : white;
		border-radius : 16px;
		height        : var(--height);
		border        : var(--border);
	}
	input[type='range']::-webkit-slider-thumb {
		border-radius      : 50%;
		margin-top         : -1.1px;
		width              : var(--height);
		height             : var(--height);
		border             : var(--border);
		-webkit-appearance : none;
		background         : var(--thumb-color);
	}
	input[type='range']::-moz-range-thumb {
		border-radius : 50%;
		width         : var(--height);
		height        : var(--height);
		border        : var(--border);
		background    : var(--thumb-color);
	}
	input[type='range']::-moz-range-track {
		background    : white;
		border-radius : 16px;
		height        : var(--height);
		border        : var(--border);
	}
	input[type='range']::-ms-fill-lower,
	input[type='range']::-ms-fill-upper {
		background    : white;
		border-radius : 16px;
		border        : var(--border);
	}
	input[type='range']::-ms-thumb {
		border-radius : 50%;
		width         : var(--height);
		height        : var(--height);
		border        : var(--border);
		background    : var(--thumb-color);
	}
	input[type='range']:focus {
		outline : none;
	}

	/* === Line style: thin track, small round thumb === */

	.line input[type='range']::-webkit-slider-runnable-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : 2px;
		height        : 4px;
		border        : none;
	}
	.line input[type='range']::-webkit-slider-thumb {
		width      : 14px;
		height     : 14px;
		margin-top : -5.5px;
		background : var(--thumb-color);
		border     : 1px solid rgba(0, 0, 0, 0.4);
	}
	.line input[type='range']::-moz-range-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : 2px;
		height        : 4px;
		border        : none;
	}
	.line input[type='range']::-moz-range-thumb {
		width      : 14px;
		height     : 14px;
		background : var(--thumb-color);
		border     : 1px solid rgba(0, 0, 0, 0.4);
	}
	.line input[type='range']::-ms-fill-lower,
	.line input[type='range']::-ms-fill-upper {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : 2px;
		border        : none;
	}
	.line input[type='range']::-ms-thumb {
		width      : 14px;
		height     : 14px;
		background : var(--thumb-color);
		border     : 1px solid rgba(0, 0, 0, 0.4);
	}
</style>
