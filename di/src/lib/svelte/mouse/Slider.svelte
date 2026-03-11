<script lang='ts'>
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { Identifiable } from '../../ts/runtime';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import Steppers from './Steppers.svelte';
	import { onMount } from 'svelte';
	import { k } from '../../ts/common/Constants';

	let {
		sticky,
		onstep,
		onchange,
		max = 10,
		min = 0.1,
		value = 1,
		value_alt,
		width = 120,
		height = 20,
		onchange_alt,
		format_label,
		fill = false,
		style = 'line',
		divisions = 200,
		show_value = false,
		logarithmic = false,
		show_steppers = true,
		sticky_threshold = 1,
	}: {
		min?: number;
		max?: number;
		value?: number;
		width?: number;
		fill?: boolean;
		height?: number;
		sticky?: number[];
		value_alt?: number;
		divisions?: number;
		show_value?: boolean;
		logarithmic?: boolean;
		show_steppers?: boolean;
		style?: 'pill' | 'line';
		sticky_threshold?: number;
		onchange: (value: number) => void;
		format_label?: (v: number) => string;
		onchange_alt?: (value: number) => void;
		onstep?: (pointsUp: boolean, isLong: boolean) => void;
	} = $props();

	const { w_accent_color } = colors;
	const border = `1px solid ${colors.border}`;

	// Hit targets — unique IDs per instance to avoid RBush collision
	const sliderTarget  = new S_Hit_Target(T_Hit_Target.control, `slider-${Identifiable.newID()}`);
	const sliderTarget2 = new S_Hit_Target(T_Hit_Target.control, `slider2-${Identifiable.newID()}`);

	// Logarithmic: map [0..divisions] to [log10(min)..log10(max)]
	// Linear: map [0..divisions] to [min..max]
	const log_min_val = $derived(logarithmic ? Math.log10(min) : 0);
	const log_max_val = $derived(logarithmic ? Math.log10(max) : 0);
	const log_range = $derived(log_max_val - log_min_val);
	const step_size = $derived(logarithmic ? log_range / divisions : (max - min) / divisions);

	let slider_input_alt: HTMLInputElement | null = $state(null);
	let slider_input:  HTMLInputElement | null = $state(null);
	let is_dragging_alt = $state(false);
	let is_dragging  = $state(false);

	// Hover / sticky state
	const { w_s_hover } = hits;
	const hoverSlider  = $derived($w_s_hover?.id === sliderTarget.id);
	const hoverSlider2 = $derived($w_s_hover?.id === sliderTarget2.id);
	const is_sticky  = $derived(!!sticky?.some(s => Math.abs(value - s) < 0.01));
	const is_sticky2 = $derived(!!sticky?.some(s => Math.abs((value_alt ?? 0) - s) < 0.01));
	const current_thumb_color = $derived(
		(hoverSlider && !is_dragging) ? 'var(--selected)' : is_sticky ? 'var(--c-white)' : $w_accent_color
	);
	const current_thumb_color2 = $derived(
		(hoverSlider2 && !is_dragging_alt) ? 'var(--selected)' : is_sticky2 ? 'var(--c-white)' : $w_accent_color
	);

	// Value → slider position (0..divisions)
	let slider_value = $derived(
		logarithmic
			? (value <= min ? 0 : (Math.log10(value) - log_min_val) / step_size)
			: Math.max(0, Math.min(divisions, (value - min) / step_size))
	);
	let slider_value_alt = $derived(
		value_alt === undefined ? 0 :
		logarithmic
			? (value_alt <= min ? 0 : (Math.log10(value_alt) - log_min_val) / step_size)
			: Math.max(0, Math.min(divisions, (value_alt - min) / step_size))
	);

	// Range fill/label percentages (two-thumb mode)
	// These are 0-100 fractions; template uses calc() to compensate for thumb inset
	const fill_left_pct         = $derived(slider_value  / divisions * 100);
	const fill_left_alt_pct     = $derived(value_alt !== undefined ? slider_value_alt / divisions * 100 : 100);
	const fill_right_from_right = $derived(value_alt !== undefined ? (1 - slider_value_alt / divisions) * 100 : 0);

	onMount(() => {
		return () => {
			hits.delete_hit_target(sliderTarget);
			hits.delete_hit_target(sliderTarget2);
		};
	});

	// Register slider hit targets
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
		if (slider_input_alt && value_alt !== undefined) {
			// Two-thumb mode: add proximity to both thumbs so they disambiguate correctly
			sliderTarget.contains_point = (point) =>
				!!point && near_thumb(sliderTarget, slider_value, point);
			sliderTarget2.set_html_element(slider_input_alt);
			sliderTarget2.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) is_dragging_alt = true;
				else if (s_mouse.isUp) is_dragging_alt = false;
				return false;
			};
			sliderTarget2.contains_point = (point) =>
				!!point && near_thumb(sliderTarget2, slider_value_alt, point);
		}
	});

	// Slider position → value
	function position_to_value(pos: number): number {
		if (logarithmic) {
			return Math.max(min, Math.pow(10, log_min_val + pos * step_size));
		}
		const raw = min + pos * step_size;
		return Math.max(min, Math.min(max, Math.round(raw * 100) / 100));
	}

	function on_input(e: Event) {
		const target = e.target as HTMLInputElement;
		const pos = parseFloat(target.value);
		let new_value = position_to_value(pos);
		if (sticky) {
			for (const s of sticky) {
				if (Math.abs(new_value - s) < sticky_threshold) {
					new_value = s;
					// Force thumb to snapped position
					const snapped_pos = logarithmic
						? (Math.log10(new_value) - log_min_val) / step_size
						: (new_value - min) / step_size;
					target.value = String(snapped_pos);
					break;
				}
			}
		}
		if (new_value !== value) {
			onchange(new_value);
		}
	}

	function on_input_alt(e: Event) {
		const target = e.target as HTMLInputElement;
		const pos = parseFloat(target.value);
		let new_value = position_to_value(pos);
		if (sticky) {
			for (const s of sticky) {
				if (Math.abs(new_value - s) < sticky_threshold) {
					new_value = s;
					const snapped_pos = logarithmic
						? (Math.log10(new_value) - log_min_val) / step_size
						: (new_value - min) / step_size;
					target.value = String(snapped_pos);
					break;
				}
			}
		}
		if (new_value !== value_alt) {
			onchange_alt?.(new_value);
		}
	}

	// Power-of-10 tick marks for logarithmic sliders
	const log_ticks = $derived.by(() => {
		if (!logarithmic) return [];
		const ticks: { pct: number; label: string }[] = [];
		const exp_min = Math.ceil(Math.log10(min));
		const exp_max = Math.floor(Math.log10(max));
		const total = exp_max - exp_min + 1;
		const step = total > 5 ? 2 : 1; // skip every other when crowded
		for (let exp = exp_min; exp <= exp_max; exp += step) {
			const val = Math.pow(10, exp);
			const pct = (exp - log_min_val) / log_range * 100;
			if (pct <= 2 || pct >= 98) continue;
			ticks.push({ pct, label: val < 1 ? val.toString() : val.toFixed(0) });
		}
		return ticks;
	});

	// Tick marks for sticky values
	const sticky_ticks = $derived.by(() => {
		if (!sticky?.length) return [];
		const range = max - min;
		return sticky.map(s => ({ pct: (s - min) / range * 100 }));
	});

	function near_thumb(target: S_Hit_Target, sv: number, point: { x: number; y: number }): boolean {
		const rect = target.element_rect;
		if (!rect) return false;
		const h = k.height.slider;
		let cx: number, cy: number;
		if (rect.height > rect.width) {
			cx = rect.x + rect.width / 2;
			cy = rect.y + h / 2 + (sv / divisions) * (rect.height - h);
		} else {
			cx = rect.x + h / 2 + (sv / divisions) * (rect.width - h);
			cy = rect.y + rect.height / 2;
		}
		const dx = point.x - cx;
		const dy = point.y - cy;
		return dx * dx + dy * dy <= (h / 2) * (h / 2);
	}
</script>

<div class='slider-compound' class:fill>
	<div class='slider-with-label'>
		{#if logarithmic && show_value}
			<span class='current-value'>{Math.log10(value).toFixed(1)}</span>
		{/if}
		{#if value_alt !== undefined}
			<!-- Two-thumb range mode -->
			<div class='range-area' style:width={fill ? '100%' : `${width}px`}>
				{#if format_label}
					<span class='range-label' style:left="calc(var(--h-slider) / 2 + {fill_left_pct} * (100% - var(--h-slider)) / 100)">{format_label(value)}</span>
					<span class='range-label' style:left="calc(var(--h-slider) / 2 + {fill_left_alt_pct} * (100% - var(--h-slider)) / 100)">{format_label(value_alt)}</span>
				{/if}
				<div class='range-thumb-wrap'>
					<div class='range-track'>
						<div class='range-fill'
							style:left="calc(var(--h-slider) / 2 + {fill_left_pct} * (100% - var(--h-slider)) / 100)"
							style:right="calc(var(--h-slider) / 2 + {fill_right_from_right} * (100% - var(--h-slider)) / 100)"
						></div>
					</div>
					{#each sticky_ticks as tick}
						<span class='range-tick' style:left="calc(var(--h-slider) / 2 + {tick.pct} * (100% - var(--h-slider)) / 100)"></span>
					{/each}
					<input type='range' class='range-input'
						id={sliderTarget.id}
						min='0' step='any' max={divisions}
						value={slider_value}
						style:--thumb-color={current_thumb_color}
						bind:this={slider_input}
						oninput={on_input}
					/>
					<input type='range' class='range-input'
						id={sliderTarget2.id}
						min='0' step='any' max={divisions}
						value={slider_value_alt}
						style:--thumb-color={current_thumb_color2}
						bind:this={slider_input_alt}
						oninput={on_input_alt}
					/>
				</div>
			</div>
		{:else}
			<!-- Single-thumb mode -->
			<div class='slider-border'
				class:pill={style === 'pill'}
				class:line={style === 'line'}
				style:width={fill ? '100%' : `${width}px`}
				style:--border={border}
				style:--height="{height}px"
				style:--thumb-height="{height * 0.8}px"
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
				{#if logarithmic || sticky_ticks.length > 0}
					<div class='tick-overlay'>
						{#each log_ticks as tick}
							<div class='tick' style:left="{tick.pct}%">
								<div class='tick-line'></div>
								<span class='tick-label'>{tick.label}</span>
							</div>
						{/each}
						{#each sticky_ticks as tick}
							<div class='tick' style:left="{tick.pct}%">
								<div class='tick-line'></div>
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
		{/if}
		{#if !logarithmic && show_value}
			<span class='slider-label'>{Math.log10(value).toFixed(1)}</span>
		{/if}
	</div>
	{#if show_steppers && onstep}
		<div class='steppers-wrapper'>
			<Steppers size={20} gap={0} hit_closure={onstep} />
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
		z-index     : var(--z-action);
	}

	.fill {
		flex        : 1;
		min-width   : 0;
		margin-left : 0;
	}

	.fill .slider-with-label {
		flex      : 1;
		min-width : 0;
		width     : 100%;
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
		font-size            : var(--h-font-small);
		font-weight          : bold;
		font-variant-numeric : tabular-nums;
		text-align           : center;
		line-height          : 1;
		user-select          : none;
		margin-top           : 0;
		margin-bottom        : -6px;
	}

	.slider-label {
		font-size            : var(--h-font-small);
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
		left           : calc(var(--h-slider) / 1.8);
		right          : calc(var(--h-slider) / 1.8);
		position       : absolute;
		overflow       : visible;
		pointer-events : none;
		top            : 50%;
		height         : 0;
	}

	.tick {
		position  : absolute;
		transform : translateX(-50%);
	}

	.tick-line {
		margin-top : calc(-1 * var(--th-track));
		height     : calc(var(--th-track) * 2);
		background : rgba(0, 0, 0, 0.5);
		width      : 1px;
	}

	.tick-label {
		font-size   : var(--h-font-small);
		transform   : translateX(-50%);
		color       : var(--c-black);
		position    : absolute;
		text-align  : center;
		white-space : nowrap;
		user-select : none;
		top         : 4px;
		left        : 50%;
		line-height : 1;
	}

	.value-display {
		font-size    : var(--h-font-common);
		margin-left  : var(--l-gap);
		display      : inline-block;
		text-align   : right;
		width        : 3em;
	}

	.steppers-wrapper {
		margin-left : -1px;
	}

	/* === Native range input styling (pill/single-thumb, scoped to .slider-border) === */

	.slider-border input[type='range'] {
		height             : var(--height);
		background         : transparent;
		-webkit-appearance : none;
		appearance         : none;
	}

	.slider-border input[type='range']::-webkit-slider-runnable-track {
		background    : var(--c-white);
		height        : var(--height);
		border        : var(--border);
		border-radius : 16px;
	}

	.slider-border input[type='range']::-webkit-slider-thumb {
		background         : var(--thumb-color);
		width              : var(--height);
		height             : var(--height);
		border             : var(--border);
		margin-top         : -1.1px;
		-webkit-appearance : none;
		border-radius      : 50%;
	}

	.slider-border input[type='range']::-moz-range-thumb {
		background    : var(--thumb-color);
		width         : var(--height);
		height        : var(--height);
		border        : var(--border);
		border-radius : 50%;
	}

	.slider-border input[type='range']::-moz-range-track {
		background    : var(--c-white);
		height        : var(--height);
		border        : var(--border);
		border-radius : 16px;
	}

	.slider-border input[type='range']::-ms-fill-lower,
	.slider-border input[type='range']::-ms-fill-upper {
		background    : var(--c-white);
		border        : var(--border);
		border-radius : 16px;
	}

	.slider-border input[type='range']::-ms-thumb {
		background    : var(--thumb-color);
		width         : var(--height);
		height        : var(--height);
		border        : var(--border);
		border-radius : 50%;
	}

	.slider-border input[type='range']:focus {
		outline : none;
	}

	/* === Line style: thin track, small round thumb === */

	.line input[type='range']::-webkit-slider-runnable-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : var(--corner-input);
		height        : var(--th-track);
		border        : none;
	}

	.line input[type='range']::-webkit-slider-thumb {
		margin-top : calc((var(--th-track) - var(--h-slider)) / 2);
		border     : 1px solid rgba(0, 0, 0, 0.4);
		background : var(--thumb-color);
		width      : var(--h-slider);
		height     : var(--h-slider);
	}

	.line input[type='range']::-moz-range-track {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : var(--corner-input);
		height        : var(--th-track);
		border        : none;
	}

	.line input[type='range']::-moz-range-thumb {
		border     : 1px solid rgba(0, 0, 0, 0.4);
		background : var(--thumb-color);
		width      : var(--h-slider);
		height     : var(--h-slider);
	}

	.line input[type='range']::-ms-fill-lower,
	.line input[type='range']::-ms-fill-upper {
		background    : rgba(0, 0, 0, 0.15);
		border-radius : var(--corner-input);
		border        : none;
	}

	.line input[type='range']::-ms-thumb {
		border     : 1px solid rgba(0, 0, 0, 0.4);
		background : var(--thumb-color);
		width      : var(--h-slider);
		height     : var(--h-slider);
	}

	/* === Two-thumb range mode === */

	.range-area {
		position   : relative;
		padding-top: 15px;
	}

	.range-thumb-wrap {
		height      : var(--h-button-common);
		position    : relative;
		align-items : center;
		display     : flex;
		min-width   : 0;
	}

	.range-track {
		background : rgba(0, 0, 0, 0.15);
		height     : var(--th-track);
		position   : absolute;
		right      : calc(var(--h-slider) / 2);
		left       : calc(var(--h-slider) / 2);
		top        : 50%;
		margin-top : -2px;
	}

	.range-fill {
		background    : var(--accent, var(--c-focus));
		border-radius : var(--corner-input);
		position      : absolute;
		height        : 100%;
		top           : 0;
	}

	.range-tick {
		transform      : translate(-0.5px, -50%);
		height         : var(--th-thumb);
		background     : currentColor;
		position       : absolute;
		pointer-events : none;
		opacity        : 0.6;
		width          : 1px;
		top            : 50%;
	}

	.range-label {
		font-size            : var(--h-font-small);
		transform            : translate(-50%, calc(50% - 0.5em));
		font-variant-numeric : tabular-nums;
		position             : absolute;
		white-space          : nowrap;
		user-select          : none;
		text-align           : center;
		top                  : 0;
	}

	.range-input {
		height             : var(--h-button-common);
		background         : transparent;
		-webkit-appearance : none;
		appearance         : none;
		pointer-events     : none;
		position           : absolute;
		width              : 100%;
		z-index            : var(--z-action);
		left               : 0;
		top                : 0;
		margin             : 0;
	}

	.range-input:focus {
		outline : none;
	}

	.range-input::-webkit-slider-runnable-track {
		background : transparent;
		height     : var(--th-track);
		border     : none;
	}

	.range-input::-moz-range-track {
		background : transparent;
		height     : var(--th-track);
		border     : none;
	}

	.range-input::-webkit-slider-thumb {
		margin-top         : calc((var(--th-track) - var(--h-slider)) / 2);
		background         : var(--thumb-color);
		border             : 1px solid rgba(0, 0, 0, 0.4);
		width              : var(--h-slider);
		height             : var(--h-slider);
		-webkit-appearance : none;
		pointer-events     : auto;
		border-radius      : 50%;
		cursor             : pointer;
	}

	.range-input::-moz-range-thumb {
		background     : var(--thumb-color);
		border         : 1px solid rgba(0, 0, 0, 0.4);
		width          : var(--h-slider);
		height         : var(--h-slider);
		pointer-events : auto;
		border-radius  : 50%;
		cursor         : pointer;
	}


</style>
