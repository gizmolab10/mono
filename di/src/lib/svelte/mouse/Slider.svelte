<script lang='ts'>
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { colors } from '../../ts/draw/Colors';
	import { Direction } from '../../ts/types/Angle';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
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
	const buttonSize = 15;

	// Hit targets
	const sliderTarget = new S_Hit_Target(T_Hit_Target.control, 'slider-thumb');
	const upTarget = new S_Hit_Target(T_Hit_Target.button, 'slider-step-up');
	const downTarget = new S_Hit_Target(T_Hit_Target.button, 'slider-step-down');

	let slider_input: HTMLInputElement | null = $state(null);
	let upElement: HTMLElement | null = $state(null);
	let downElement: HTMLElement | null = $state(null);
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
			return Math.max(min, Math.round(Math.pow(10, pos * step_size)));
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

	// Hover state
	const { w_s_hover } = hits;
	const hoverSlider = $derived($w_s_hover?.id === sliderTarget.id);
	const hoverUp = $derived($w_s_hover?.id === upTarget.id);
	const hoverDown = $derived($w_s_hover?.id === downTarget.id);
	const current_thumb_color = $derived(
		(hoverSlider || is_dragging) ? 'black' : thumb_color_default
	);

	const upPath = $derived(svg_paths.fat_polygon(buttonSize, Direction.up));
	const downPath = $derived(svg_paths.fat_polygon(buttonSize, Direction.down));

	// Register hit targets
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

	$effect(() => {
		if (upElement && onstep) {
			upTarget.set_html_element(upElement);
			upTarget.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) onstep(true, s_mouse.event?.metaKey ?? false);
				return true;
			};
		}
	});

	$effect(() => {
		if (downElement && onstep) {
			downTarget.set_html_element(downElement);
			downTarget.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) onstep(false, s_mouse.event?.metaKey ?? false);
				return true;
			};
		}
	});

	onMount(() => {
		return () => {
			hits.delete_hit_target(sliderTarget);
			hits.delete_hit_target(upTarget);
			hits.delete_hit_target(downTarget);
		};
	});
</script>

<div class='slider-compound'>
	<div class='slider-border'
		class:pill={style === 'pill'}
		class:line={style === 'line'}
		style:width="{width}px"
		style:--border={border}
		style:--height="{height}px"
		style:--thumb-color={current_thumb_color}>
		<input class='slider-input'
			min='0'
			step='1'
			type='range'
			max={divisions}
			value={slider_value}
			bind:this={slider_input}
			oninput={on_input}
			style='flex: 1 1 auto; position: relative; min-width: 0; pointer-events: auto;'/>
		{#if show_value}
			<span class='value-display'>
				{value}
			</span>
		{/if}
	</div>
	{#if show_steppers && onstep}
		<div class='steppers'>
			<div class='stepper-button'
				bind:this={upElement}
				role="button"
				tabindex="0">
				<svg width={buttonSize} height={buttonSize} viewBox="0 0 {buttonSize} {buttonSize}">
					<path
						d={upPath}
						fill={hoverUp ? colors.default : 'white'}
						stroke={colors.default}
						stroke-width="0.375"
					/>
				</svg>
			</div>
			<span class='stepper-value'>{value.toFixed(1)}</span>
			<div class='stepper-button'
				bind:this={downElement}
				role="button"
				tabindex="0">
				<svg width={buttonSize} height={buttonSize} viewBox="0 0 {buttonSize} {buttonSize}">
					<path
						d={downPath}
						fill={hoverDown ? colors.default : 'white'}
						stroke={colors.default}
						stroke-width="0.375"
					/>
				</svg>
			</div>
		</div>
	{/if}
</div>

<style>
	.slider-compound {
		display     : flex;
		align-items : center;
		margin-left : 6px;
		gap         : 0;
	}
	.slider-border {
		position    : relative;
		display     : flex;
		align-items : center;
	}
	.value-display {
		font-size    : 11px;
		margin-left  : 4px;
		display      : inline-block;
		width        : 3em;
		text-align   : right;
	}
	.steppers {
		display        : flex;
		flex-direction : column;
		align-items    : center;
		position       : relative;
		top            : 1px;
		margin-left    : -1px;
	}
	.stepper-value {
		font-size   : 8px;
		font-weight : bold;
		text-align  : center;
		min-width   : 2.5em;
		line-height : 1;
		margin      : -3px 0;
		position    : relative;
		top         : -0.75px;
		user-select : none;
	}
	.stepper-button {
		cursor      : pointer;
		user-select : none;
		position    : relative;
		top         : 0.5px;
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
