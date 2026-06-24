<script lang='ts'>
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/utilities/Colors';
	import { Identifiable } from '../../ts/runtime';
	import { k } from '../../ts/common/Constants';
	import { hits } from '../../ts/events/Hits';
	import Steppers from './Steppers.svelte';

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
		thumb_label,
		onchange_alt,
		format_label,
		fill = false,
		tick_interval,
		style = 'line',
		divisions = 200,
		vertical = false,
		show_value = false,
		tick_labels = true,
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
		vertical?: boolean;
		value_alt?: number;
		divisions?: number;
		show_value?: boolean;
		tick_labels?: boolean;
		logarithmic?: boolean;
		tick_interval?: number;
		show_steppers?: boolean;
		style?: 'pill' | 'line';
		sticky_threshold?: number;
		onchange: (value: number) => void;
		thumb_label?: (v: number) => string;
		onstep?: (smaller: boolean) => void;
		format_label?: (v: number) => string;
		onchange_alt?: (value: number) => void;
	} = $props();

	const border = `1px solid ${colors.border}`;

	// Hit target IDs — unique per instance to avoid RBush collision
	const slider_id     = `slider-${Identifiable.newID()}`;
	const slider_id_alt = `slider2-${Identifiable.newID()}`;
	const slider_hit_id     = T_Hit_Target.control + '-' + slider_id;
	const slider_hit_id_alt = T_Hit_Target.control + '-' + slider_id_alt;

	// Logarithmic: map [0..divisions] to [log10(min)..log10(max)]
	// Linear: map [0..divisions] to [min..max]
	// When the floor is 0 or below, a plain log10 blows up (log10(0) = -∞),
	// so shift everything by `log_offset` and take the log of (x + offset).
	// That keeps 0 reachable at the far left and still spaces small numbers
	// out. For a positive floor the offset is 0 — the pure-log path, unchanged.
	const log_offset = $derived(logarithmic && min <= 0 ? 1 - min : 0);
	const log_min_val = $derived(logarithmic ? Math.log10(min + log_offset) : 0);
	const log_max_val = $derived(logarithmic ? Math.log10(max + log_offset) : 0);
	const log_range = $derived(log_max_val - log_min_val);
	const step_size = $derived(logarithmic ? log_range / divisions : (max - min) / divisions);

	let slider_input_alt: HTMLInputElement | null = $state(null);
	let slider_input:  HTMLInputElement | null = $state(null);
	let is_dragging_alt = $state(false);
	let is_dragging  = $state(false);

	// Hover / sticky state
	const { w_s_hover } = hits;
	const isHoveringOn_slider  = $derived($w_s_hover?.id === slider_hit_id);
	const isHoveringOn_slider_alt = $derived($w_s_hover?.id === slider_hit_id_alt);
	const is_sticky  = $derived(!!sticky?.some(s => Math.abs(value - s) < 0.01));
	const is_sticky_alt = $derived(!!sticky?.some(s => Math.abs((value_alt ?? 0) - s) < 0.01));
	const sticky_dot       = 'radial-gradient(circle, rgba(0,0,0,0.25) 4px, var(--white) 5px)';
	const sticky_dot_hover = 'radial-gradient(circle, white 4px, var(--hover) 5px)';
	const current_thumb_color = $derived(
		is_sticky
			? (isHoveringOn_slider && !is_dragging) ? sticky_dot_hover : sticky_dot
			: (isHoveringOn_slider && !is_dragging) ? 'var(--hover)' : 'var(--c-thumb)'
	);
	const current_thumb_color_alt = $derived(
		is_sticky_alt
			? (isHoveringOn_slider_alt && !is_dragging_alt) ? sticky_dot_hover : sticky_dot
			: (isHoveringOn_slider_alt && !is_dragging_alt) ? 'var(--hover)' : 'var(--c-thumb)'
	);

	// Value → slider position (0..divisions)
	let slider_value = $derived(
		logarithmic
			? (value <= min ? 0 : (Math.log10(value + log_offset) - log_min_val) / step_size)
			: Math.max(0, Math.min(divisions, (value - min) / step_size))
	);
	let slider_value_alt = $derived(
		value_alt === undefined ? 0 :
		logarithmic
			? (value_alt <= min ? 0 : (Math.log10(value_alt + log_offset) - log_min_val) / step_size)
			: Math.max(0, Math.min(divisions, (value_alt - min) / step_size))
	);

	// Range fill/label percentages (two-thumb mode)
	// These are 0-100 fractions; template uses calc() to compensate for thumb inset
	const fill_left_pct         = $derived(slider_value  / divisions * 100);
	const fill_left_alt_pct     = $derived(value_alt !== undefined ? slider_value_alt / divisions * 100 : 100);
	const fill_right_from_right = $derived(value_alt !== undefined ? (1 - slider_value_alt / divisions) * 100 : 0);

	// Slider position → value
	function position_to_value(pos: number): number {
		if (logarithmic) {
			return Math.max(min, Math.pow(10, log_min_val + pos * step_size) - log_offset);
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
		// When the caller supplies explicit ticks (tick_interval), use those —
		// don't also draw the power-of-10 labelled ticks.
		if (!logarithmic || log_offset > 0 || tick_interval) return [];
		const ticks: { pct: number; label: string }[] = [];
		const exp_min = Math.ceil(Math.log10(min));
		const exp_max = Math.floor(Math.log10(max));
		for (let exp = exp_min; exp <= exp_max; exp++) {
			const pct = (exp - log_min_val) / log_range * 100;
			const power = exp + 3;
			ticks.push({ pct, label: power.toString() });
		}
		return ticks;
	});

	// Tick marks for sticky values
	const sticky_ticks = $derived.by(() => {
		if (!sticky?.length) return [];
		const range = max - min;
		return sticky.map(s => ({ pct: (s - min) / range * 100 }));
	});

	// Evenly-spaced tick marks (e.g. every 10). Visual only — they do NOT snap.
	const regular_ticks = $derived.by(() => {
		if (!tick_interval) return [];
		const range = max - min;
		if (range <= 0) return [];
		const ticks: { pct: number }[] = [];
		for (let v = min; v <= max + 1e-9; v += tick_interval) {
			const pct = logarithmic
				? (Math.log10(v + log_offset) - log_min_val) / log_range * 100
				: (v - min) / range * 100;
			ticks.push({ pct });
		}
		return ticks;
	});

	function near_thumb(element: HTMLElement | null, sv: number, point: { x: number; y: number }): boolean {
		if (!element) return false;
		const rect = element.getBoundingClientRect();
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
		{#if show_value}
			{#if logarithmic}
				<span class='current-value'>{Math.log10(value).toFixed(1)}</span>
			{:else}
				<span class='slider-label'>{Math.log10(value).toFixed(1)}</span>
			{/if}
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
						style:--thumb-color={current_thumb_color}
						min='0' step='any' max={divisions}
						bind:this={slider_input}
						value={slider_value}
						id={slider_hit_id}
						oninput={on_input}
						use:hit_target={{
							id: slider_id,
							onpress: () => is_dragging = true,
							onrelease: () => is_dragging = false,
							contains_point: value_alt !== undefined
								? (point) => !!point && near_thumb(slider_input, slider_value, point)
								: undefined
						}}
					/>
					<input type='range' class='range-input'
						id={slider_hit_id_alt}
						min='0' step='any' max={divisions}
						value={slider_value_alt}
						style:--thumb-color={current_thumb_color_alt}
						bind:this={slider_input_alt}
						oninput={on_input_alt}
						use:hit_target={{
							id: slider_id_alt,
							onpress: () => is_dragging_alt = true,
							onrelease: () => is_dragging_alt = false,
							contains_point: (point) => !!point && near_thumb(slider_input_alt, slider_value_alt, point)
						}}
					/>
				</div>
			</div>
		{:else}
			<!-- Single-thumb mode -->
			<div class='slider-border'
			class:vertical
				class:pill={style === 'pill'}
				class:line={style === 'line'}
				style:--border={border}
				style:--height="{height}px"
				style:--slider-length="{width}px"
				style:--thumb-height="{height * 0.8}px"
				style:--thumb-color={current_thumb_color}
				style:height={vertical ? `${width}px` : null}
				style:width={fill ? '100%' : `${vertical ? height : width}px`}>
				{#if style === 'line' && !vertical}
					<div class='track-line-bg'></div>
				{/if}
				<input class='slider-input'
					min='0'
					step='any'
					type='range'
					max={divisions}
					value={slider_value}
					bind:this={slider_input}
					oninput={on_input}
					use:hit_target={{
						id: slider_id,
						onpress: () => is_dragging = true,
						onrelease: () => is_dragging = false,
					}}
					style={vertical ? 'pointer-events: auto;' : 'flex: 1 1 auto; position: relative; min-width: 0; pointer-events: auto; z-index: 2;'}/>
				{#if thumb_label}
					<span class='thumb-label' style:left="calc(var(--h-slider) / 2 + {fill_left_pct} * (100% - var(--h-slider)) / 100)">{thumb_label(value)}</span>
				{/if}
				{#if logarithmic || sticky_ticks.length > 0 || regular_ticks.length > 0}
					<div class='tick-overlay'>
						{#each log_ticks as tick}
							<div class='tick' style:left="{tick.pct}%">
								<div class='tick-line'></div>
								{#if tick_labels}
									<span class='tick-label'>{tick.label}</span>
								{/if}
							</div>
						{/each}
						{#each sticky_ticks as tick}
							<div class='tick' style:left="{tick.pct}%">
								<div class='tick-line'></div>
							</div>
						{/each}
						{#each regular_ticks as tick}
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
	</div>
	{#if show_steppers && onstep}
		<div class='steppers-wrapper'>
			<Steppers horizontal size={k.height.controls} gap={6} hit_closure={onstep} />
		</div>
	{/if}
</div>

<style>

	.slider-compound {
		z-index      : var(--z-action);
		overflow     : visible;
		align-items  : center;
		display      : flex;
		margin-right : 6px;
		gap          : 0;
	}

	.fill {
		flex        : 1;
		min-width   : 0;
		margin-left : 0;
	}

	.fill .slider-with-label {
		width     : 100%;
		flex      : 1;
		min-width : 0;
	}

	.slider-with-label {
		position       : relative;
		overflow       : visible;
		flex-direction : column;
		align-items    : center;
		display        : flex;
		top            : -2px;
	}

	.current-value {
		font-size            : var(--font-small);
		font-variant-numeric : tabular-nums;
		text-align           : center;
		font-weight          : bold;
		margin-bottom        : -6px;
		line-height          : 1;
		margin-top           : 0;
		color                : var(--c-track);
	}

	.slider-label {
		font-size            : var(--font-small);
		font-variant-numeric : tabular-nums;
		position             : relative;
		text-align           : center;
		font-weight          : bold;
		top                  : 4px;
		margin-top           : 1px;
		line-height          : 1;
		color                : var(--c-track);
	}

	.slider-border {
		position    : relative;
		overflow    : visible;
		align-items : center;
		display     : flex;
		z-index     : 0;
	}

	.tick-overlay {
		left           : calc(var(--h-slider) / 1.8);
		right          : calc(var(--h-slider) / 1.8);
		position       : absolute;
		overflow       : visible;
		pointer-events : none;
		z-index        : 1;
		top            : 50%;
		height         : 0;
	}

	/* Visible track line, drawn as its own layer UNDER the ticks so the ticks
	   sit on top of the track but the (higher) thumb still covers them. */
	.track-line-bg {
		left          : calc(var(--h-slider) / 2);
		right         : calc(var(--h-slider) / 2);
		height        : var(--th-track);
		background    : var(--c-track);
		border-radius : var(--r-input);
		transform     : translateY(-50%);
		pointer-events: none;
		position      : absolute;
		z-index       : 0;
		top           : 50%;
	}

	.tick {
		position  : absolute;
		transform : translateX(-50%);
	}

	.thumb-label {
		transform            : translate(-50%, -50%);
		font-variant-numeric : tabular-nums;
		position             : absolute;
		white-space          : nowrap;
		text-align           : center;
		color                : black;
		pointer-events       : none;
		font-size            : 12px;
		top                  : 50%;
		z-index              : 10;
		line-height          : 1;
	}

	.tick-line {
		margin-top : calc(-1 * var(--th-track));
		height     : calc(var(--th-track) * 2);
		background : rgba(0, 0, 0, 0.5);
		width      : 1px;
	}

	.tick-label {
		font-size   : var(--font-small);
		transform   : translateX(-50%);
		color       : var(--c-track);
		position    : absolute;
		text-align  : center;
		white-space : nowrap;
		top         : 4px;
		left        : 50%;
		line-height : 1;
	}

	.value-display {
		font-size    : var(--font-common);
		margin-left  : var(--l-gap);
		display      : inline-block;
		text-align   : right;
		width        : 3em;
	}

	.steppers-wrapper {
		margin-left : -1px;
		margin-top  : -2px;
	}

	/* === Native range input styling (pill/single-thumb, scoped to .slider-border) === */

	.slider-border input[type='range'] {
		height             : var(--height);
		background         : transparent;
		-webkit-appearance : none;
		appearance         : none;
	}

	.slider-border input[type='range']::-webkit-slider-runnable-track {
		height        : var(--height);
		border        : var(--border);
		background    : var(--white);
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
		height        : var(--height);
		border        : var(--border);
		background    : var(--white);
		border-radius : 16px;
	}

	.slider-border input[type='range']::-ms-fill-lower,
	.slider-border input[type='range']::-ms-fill-upper {
		background    : var(--white);
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
		height        : var(--th-track);
		background    : transparent;
		border-radius : var(--r-input);
		border        : none;
	}

	.line input[type='range']::-webkit-slider-thumb {
		margin-top : calc((var(--th-track) - var(--h-slider)) / 2);
		background : var(--thumb-color);
		border     : 1px solid black;
		width      : var(--h-slider);
		height     : var(--h-slider);
	}

	.line input[type='range']::-moz-range-track {
		background    : transparent;
		border-radius : var(--r-input);
		height        : var(--th-track);
		border        : none;
	}

	.line input[type='range']::-moz-range-thumb {
		background : var(--thumb-color);
		border     : 1px solid black;
		width      : var(--h-slider);
		height     : var(--h-slider);
	}

	.line input[type='range']::-ms-fill-lower,
	.line input[type='range']::-ms-fill-upper {
		background    : var(--c-track);
		border-radius : var(--r-input);
		border        : none;
	}

	.line input[type='range']::-ms-thumb {
		background : var(--thumb-color);
		border     : 1px solid black;
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
		right      : calc(var(--h-slider) / 2);
		left       : calc(var(--h-slider) / 2);
		background : var(--c-track);
		height     : var(--th-track);
		position   : absolute;
		margin-top : -2px;
		top        : 50%;
	}

	.range-fill {
		background    : var(--accent, var(--c-focus));
		border-radius : var(--r-input);
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
		transform            : translate(-50%, calc(50% - 0.5em));
		font-size            : var(--font-small);
		color                : var(--c-track);
		font-variant-numeric : tabular-nums;
		position             : absolute;
		white-space          : nowrap;
		text-align           : center;
		top                  : 0;
	}

	.range-input {
		height             : var(--h-button-common);
		z-index            : var(--z-action);
		background         : transparent;
		position           : absolute;
		-webkit-appearance : none;
		appearance         : none;
		pointer-events     : none;
		width              : 100%;
		left               : 0;
		top                : 0;
		margin             : 0;
	}

	.range-input:focus {
		outline : none;
	}

	.range-input::-webkit-slider-runnable-track {
		height     : var(--th-track);
		background : transparent;
		border     : none;
	}

	.range-input::-moz-range-track {
		height     : var(--th-track);
		background : transparent;
		border     : none;
	}

	.range-input::-webkit-slider-thumb {
		margin-top         : calc((var(--th-track) - var(--h-slider)) / 2);
		background         : var(--thumb-color);
		border             : 1px solid black;
		width              : var(--h-slider);
		height             : var(--h-slider);
		cursor             : pointer;
		-webkit-appearance : none;
		pointer-events     : auto;
		border-radius      : 50%;
	}

	.range-input::-moz-range-thumb {
		background     : var(--thumb-color);
		border         : 1px solid black;
		width          : var(--h-slider);
		height         : var(--h-slider);
		cursor         : pointer;
		pointer-events : auto;
		border-radius  : 50%;
	}

	/* === Vertical orientation for single-thumb mode === */
	/* Keep the slider's horizontal styling and rotate the input visually. The slider-border
	   has its width and height swapped (slim and tall); the inner input keeps its horizontal
	   box of length × thickness, gets rotated counterclockwise around its center, and is
	   positioned so the rotated box centers inside the slider-border. */

	.slider-border.vertical {
		position : relative;
		overflow : visible;
	}

	.slider-border.vertical input[type='range'] {
		left             : calc((var(--height) - var(--slider-length)) / 2);
		top              : calc((var(--slider-length) - var(--height)) / 2);
		width            : var(--slider-length);
		transform        : rotate(-90deg);
		height           : var(--height);
		position         : absolute;
		transform-origin : center;
	}

</style>
