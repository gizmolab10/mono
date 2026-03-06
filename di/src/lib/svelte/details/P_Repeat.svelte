<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { scenes, stores } from '../../ts/managers';
	import { w_unit_system, units } from '../../ts/types/Units';
	import { T_Units } from '../../ts/types/Enumerations';
	import { engine } from '../../ts/render';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

	let selected_so = $derived($w_selection?.so ?? null);

	function get_repeater(_tick: number) { return selected_so?.repeater ?? null; }
	let is_repeater = $derived.by(() => { $w_tick; return selected_so?.repeater?.is_repeating !== false && selected_so?.repeater != null; });
	let has_firewall = $derived(get_repeater($w_tick)?.firewall ?? false);
	let has_children = $derived($w_all_sos.some(s => s.scene?.parent?.so === selected_so));
	let is_diagonal = $derived.by((): boolean | null => {
		$w_tick;
		const r = selected_so?.repeater;
		if (!r) return null;
		return r.is_diagonal;
	});
	let repeat_axis = $derived.by(() => { $w_tick; return selected_so?.repeater?.run_axis ?? 0; });
	let rise_axis = $derived.by(() => { $w_tick; return selected_so?.repeater?.rise_axis ?? null; });
	let rise_choices = $derived([0, 1, 2].filter(a => a !== repeat_axis) as (0 | 1 | 2)[]);

	function set_repeat_axis(axis: 0 | 1 | 2) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, run_axis: axis };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_rise_axis(axis: 0 | 1 | 2) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, rise_axis: axis };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_spacing(mm: number) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, spacing: mm, gap_min: undefined, gap_max: undefined };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	const INCH = 25.4;
	const IMPERIAL_DENOMS = [0, 1, 2, 4, 8, 16, 32, 64];
	const GAP_MIN_MM = 4 * INCH;
	const GAP_MAX_MM = 12 * INCH;
	const GAP_RANGE_MM = GAP_MAX_MM - GAP_MIN_MM;
	const STICKY_THRESHOLD_MM = 0.15 * INCH;
	const TICK_MM = [4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => i * INCH);

	// Spacing slider constants
	const SP_MIN_MM = 6 * INCH;
	const SP_MAX_MM = 36 * INCH;
	const SP_RANGE_MM = SP_MAX_MM - SP_MIN_MM;
	const SP_TICK_MM = [6, 12, 16, 24, 36].map(i => i * INCH);
	const SP_STICKY_MM = 0.5 * INCH;

	function sp_to_pct(mm: number): number { return (mm - SP_MIN_MM) / SP_RANGE_MM * 100; }
	function is_on_sp_tick(mm: number): boolean { return SP_TICK_MM.some(t => Math.abs(mm - t) < 0.5); }

	function format_spacing(mm: number): string {
		const inches = mm / INCH;
		if (inches >= 12 && inches % 12 < 0.01) return `${Math.round(inches / 12)}'`;
		if (Math.abs(inches - Math.round(inches)) < 0.01) return `${Math.round(inches)}"`;
		return units.format_for_system(mm, $w_unit_system, $w_precision);
	}

	let spacing_mm = $derived.by(() => { $w_tick; return selected_so?.repeater?.spacing ?? 16 * INCH; });
	let sp_sticky = $derived(is_on_sp_tick(spacing_mm));

	function set_spacing_slider(raw_mm: number) {
		if (!selected_so?.repeater) return;
		let val = raw_mm;
		for (const t of SP_TICK_MM) {
			if (Math.abs(val - t) < SP_STICKY_MM) { val = t; break; }
		}
		if (!SP_TICK_MM.includes(val)) val = Math.round(val / INCH) * INCH;
		val = Math.max(SP_MIN_MM, Math.min(SP_MAX_MM, val));
		set_spacing(val);
	}

	function enable_gap_range() {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, gap_min: 6 * INCH, gap_max: 9 * INCH, spacing: undefined };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function mm_to_pct(mm: number): number { return (mm - GAP_MIN_MM) / GAP_RANGE_MM * 100; }
	function is_on_tick(mm: number): boolean { return TICK_MM.some(t => Math.abs(mm - t) < 0.1); }

	function format_gap(mm: number): string {
		if ($w_unit_system === T_Units.imperial) {
			return units.format_for_system(mm, T_Units.imperial, $w_precision);
		}
		return units.format_for_system(mm, $w_unit_system, $w_precision);
	}

	let slider_step = $derived.by(() => {
		if ($w_unit_system === T_Units.imperial) {
			const denom = IMPERIAL_DENOMS[Math.min($w_precision, IMPERIAL_DENOMS.length - 1)];
			return denom > 0 ? INCH / denom : INCH;
		}
		const dp = Math.min($w_precision, 3);
		return Math.pow(10, -dp);
	});

	function set_gap_slider(field: 'gap_min' | 'gap_max', raw_mm: number) {
		if (!selected_so?.repeater) return;
		let val = Math.round(raw_mm / slider_step) * slider_step;
		for (const t of TICK_MM) {
			if (Math.abs(val - t) < STICKY_THRESHOLD_MM) { val = t; break; }
		}
		val = Math.max(GAP_MIN_MM, Math.min(GAP_MAX_MM, val));

		let gap_min = field === 'gap_min' ? val : (selected_so.repeater.gap_min ?? val);
		let gap_max = field === 'gap_max' ? val : (selected_so.repeater.gap_max ?? val);
		if (gap_min > gap_max) { if (field === 'gap_min') gap_max = gap_min; else gap_min = gap_max; }

		selected_so.repeater = { ...selected_so.repeater, gap_min, gap_max };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	let gap_min_mm = $derived.by(() => { $w_tick; const r = selected_so?.repeater; return r?.gap_min ?? 6 * INCH; });
	let gap_max_mm = $derived.by(() => { $w_tick; const r = selected_so?.repeater; return r?.gap_max ?? 9 * INCH; });
	let min_sticky = $derived(is_on_tick(gap_min_mm));
	let max_sticky = $derived(is_on_tick(gap_max_mm));

	function toggle_firewall() {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, firewall: !selected_so.repeater.firewall };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function get_repeater_display(so: Smart_Object | undefined, all_sos: Smart_Object[], _tick: number) {
		if (!so?.repeater) return null;
		const total = all_sos.filter(s => s.scene?.parent?.so === so).length;
		if (total === 0) return null;
		const clones = so.repeater.firewall ? Math.ceil(total / 2) : total;
		const fireblocks = so.repeater.firewall ? Math.floor(total / 2) : 0;
		return { count: clones, fireblocks };
	}

	let repeater_display = $derived(get_repeater_display(selected_so ?? undefined, $w_all_sos, $w_tick));

	function toggle_repeater() {
		if (!selected_so) return;
		if (is_repeater) {
			selected_so.repeater = { ...selected_so.repeater, is_repeating: false };
			engine.strip_clones(selected_so);
		} else {
			if (is_diagonal) repeat_diagonal();
			else repeat_straight();
			return;
		}
		stores.tick();
		scenes.save();
	}

	function repeat_straight() {
		if (!selected_so) return;
		const existing = selected_so.repeater ?? { run_axis: 0 as const, spacing: 16 * INCH };
		selected_so.repeater = { ...existing, is_diagonal: false, is_repeating: true };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function repeat_diagonal() {
		if (!selected_so) return;
		const existing = selected_so.repeater ?? { run_axis: 0 as const, rise_axis: 1 as const, gap_min: 6 * INCH, gap_max: 9 * INCH };
		selected_so.repeater = { ...existing, is_diagonal: true, is_repeating: true };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}
</script>

{#if is_repeater && selected_so}
	<div class='repeater-options'>
		<div class='repeater-option-row' style:position='relative'>
			<span class='option-label' style:margin-right='-7px'>run</span>
			<div class='segmented'>
				<button class:active={repeat_axis === 0} onclick={() => set_repeat_axis(0)}>x</button>
				<button class:active={repeat_axis === 1} onclick={() => set_repeat_axis(1)}>y</button>
				<button class:active={repeat_axis === 2} onclick={() => set_repeat_axis(2)}>z</button>
			</div>
			<button class='action-btn repeat-btn' use:hit_target={{ id: 'repeat', onpress: toggle_repeater }}>unrepeat</button>
			{#if repeater_display}
				<span class='clone-count'>{repeater_display.count} repeats</span>
			{/if}
		</div>
		{#if !is_diagonal}
			<div class='repeater-option-row'>
				<div class='spacing-slider'>
					<div class='slider-wrap'>
						<div class='range-track'></div>
						{#each SP_TICK_MM as tick}
							<span class='tick' style:left="calc(7px + {sp_to_pct(tick)} * (100% - 14px) / 100)"></span>
						{/each}
						<input type='range'
							min={SP_MIN_MM} max={SP_MAX_MM} step='any'
							value={spacing_mm}
							style:pointer-events='auto'
							style:--thumb-bg={sp_sticky ? 'white' : '#007aff'}
							style:--thumb-border={sp_sticky ? '0.5px solid black' : 'none'}
							oninput={(e) => set_spacing_slider(parseFloat((e.target as HTMLInputElement).value))}
						/>
					</div>
					<div class='rise-endpoints'>
						<span class='rise-endpoint' style:margin-left='2px'>6"</span>
						<span class='slider-caption'>{format_spacing(spacing_mm)} spacing</span>
						<span class='rise-endpoint' style:margin-right='3px'>3'</span>
					</div>
				</div>
				<button class='action-btn' class:active={has_firewall} onclick={toggle_firewall} style:flex-shrink='0' style:position='relative' style:top='-5.5px'>
					{has_firewall ? 'fireblocks ↔' : 'no fireblocks ↔'}
				</button>
			</div>
		{:else}
			<div class='repeater-option-row rise-row'>
				<span class='option-label' style:margin-right='-7px'>rise</span>
				<div class='segmented'>
					{#each rise_choices as a}
						<button class:active={rise_axis === a} onclick={() => set_rise_axis(a)}>{['x','y','z'][a]}</button>
					{/each}
				</div>
				<div class='range-slider' style:flex='1'>
					<span class='range-label' style:left="calc(7px + {mm_to_pct(gap_min_mm)} * (100% - 14px) / 100)">{format_gap(gap_min_mm)}</span>
					<span class='range-label' style:left="calc(7px + {mm_to_pct(gap_max_mm)} * (100% - 14px) / 100)">{format_gap(gap_max_mm)}</span>
					<div class='slider-wrap'>
						<div class='range-track'>
							<div class='range-fill'
								style:left="calc(7px + {mm_to_pct(gap_min_mm)} * (100% - 14px) / 100)"
								style:right="calc(7px + {100 - mm_to_pct(gap_max_mm)} * (100% - 14px) / 100)"
							></div>
						</div>
						{#each TICK_MM as tick}
							<span class='tick' style:left="calc(7px + {mm_to_pct(tick)} * (100% - 14px) / 100)"></span>
						{/each}
						<input type='range'
							min={GAP_MIN_MM} max={GAP_MAX_MM} step='any'
							value={gap_min_mm}
							style:--thumb-bg={min_sticky ? 'white' : '#007aff'}
							style:--thumb-border={min_sticky ? '0.5px solid black' : 'none'}
							oninput={(e) => set_gap_slider('gap_min', parseFloat((e.target as HTMLInputElement).value))}
						/>
						<input type='range'
							min={GAP_MIN_MM} max={GAP_MAX_MM} step='any'
							value={gap_max_mm}
							style:--thumb-bg={max_sticky ? 'white' : '#007aff'}
							style:--thumb-border={max_sticky ? '0.5px solid black' : 'none'}
							oninput={(e) => set_gap_slider('gap_max', parseFloat((e.target as HTMLInputElement).value))}
						/>
					</div>
					<div class='rise-endpoints'>
						<span class='rise-endpoint' style:margin-left='2px'>4"</span>
						<span class='slider-caption'>rise range</span>
						<span class='rise-endpoint'>12"</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else if selected_so && !has_children}
	<div class='hint'>need one child for the template</div>
{:else if selected_so}
	<div class='repeater-option-row' style:justify-content='center' style:padding-bottom='2px'>
		<div class='segmented'>
			<button class:active={is_diagonal === false} onclick={repeat_straight}>straight</button>
			<button class:active={is_diagonal === true} onclick={repeat_diagonal}>diagonal</button>
		</div>
	</div>
{/if}

<style>
	.repeater-options {
		flex-direction : column;
		display        : flex;
		padding-bottom : 2px;
		gap            : 4px;
	}

	.repeater-option-row {
		align-items : center;
		display     : flex;
		min-height  : 18px;
		gap         : 6px;
	}

	.option-label {
		font-size   : 11px;
		min-width   : 25px;
		opacity     : 0.6;
		flex-shrink : 0;
	}

	.segmented {
		display : flex;
		gap     : 0;
	}

	.segmented button {
		border        : 0.5px solid currentColor;
		z-index       : var(--z-action);
		color         : inherit;
		cursor        : pointer;
		white-space   : nowrap;
		background    : white;
		padding       : 0 5px;
		font-size     : 10px;
		height        : 18px;
	}

	.segmented button:first-child {
		border-radius : 10px 0 0 10px;
	}

	.segmented button:last-child {
		border-radius : 0 10px 10px 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.segmented button:hover:not(.active) {
		background : var(--bg);
	}

	.action-btn {
		border        : 0.5px solid currentColor;
		z-index       : var(--z-action);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		background    : white;
		padding       : 0 8px;
		border-radius : 10px;
		font-size     : 11px;
		height        : 18px;
	}

	.repeat-btn {
		transform : translateX(-50%);
		position  : absolute;
		left      : 50%;
	}

	.action-btn.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.spacing-slider {
		position  : relative;
		min-width : 0;
		flex      : 1;
	}

	.slider-row {
		align-items : center;
		display     : flex;
		gap         : 0;
	}

	.slider-label {
		margin      : 0 -3px 0 0;
		font-size   : 9px;
		opacity     : 0.5;
		flex-shrink : 0;
	}

	.slider-label:last-child {
		margin : 0 0 0 -3px;
	}

	.rise-row {
		margin-top : -3px;
	}

	.rise-endpoints {
		justify-content : space-between;
		align-items     : center;
		display         : flex;
	}

	.rise-endpoint {
		font-size : 9px;
		opacity   : 0.5;
	}

	.range-slider {
		position       : relative;
		margin         : -2px 0 0;
		padding-top    : 14px;
	}

	.slider-caption {
		text-align : center;
		display    : block;
		margin-top : 0px;
		font-size  : 9px;
		opacity    : 0.5;
	}

	.slider-wrap {
		position    : relative;
		align-items : center;
		height      : 16px;
		display     : flex;
		flex        : 1;
		min-width   : 0;
	}

	.range-track {
		background    : rgba(0, 0, 0, 0.15);
		position      : absolute;
		margin-top    : -2px;
		height        : 4px;
		right         : 7px;
		left          : 7px;
		top           : 50%;
	}

	.range-fill {
		background    : var(--accent, cornflowerblue);
		position      : absolute;
		height        : 100%;
		border-radius : 2px;
		top           : 0;
	}

	.range-label {
		transform            : translateY(+50%);
		font-variant-numeric : tabular-nums;
		position             : absolute;
		white-space          : nowrap;
		user-select          : none;
		font-size            : 7px;
		top                  : 0;
	}

	.tick {
		transform      : translate(-0.5px, -50%);
		background     : currentColor;
		position       : absolute;
		pointer-events : none;
		opacity        : 0.6;
		height         : 8px;
		width          : 1px;
		top            : 50%;
	}

	:is(.range-slider, .spacing-slider) input[type='range'] {
		z-index            : var(--z-action);
		background         : transparent;
		position           : absolute;
		appearance         : none;
		-webkit-appearance : none;
		pointer-events     : none;
		height             : 16px;
		width              : 100%;
		top                : 0;
		left               : 0;
		margin             : 0;
	}

	:is(.range-slider, .spacing-slider) input[type='range']::-webkit-slider-thumb {
		background         : var(--thumb-bg, #007aff);
		border             : var(--thumb-border, none);
		cursor             : pointer;
		-webkit-appearance : none;
		pointer-events     : auto;
		width              : 14px;
		height             : 14px;
		margin-top         : -5px;
		border-radius      : 50%;
	}

	:is(.range-slider, .spacing-slider) input[type='range']::-moz-range-thumb {
		background     : var(--thumb-bg, #007aff);
		border         : var(--thumb-border, none);
		cursor         : pointer;
		pointer-events : auto;
		width          : 14px;
		height         : 14px;
		border-radius  : 50%;
	}

	:is(.range-slider, .spacing-slider) input[type='range']::-webkit-slider-runnable-track {
		background : transparent;
		border     : none;
		height     : 4px;
	}

	:is(.range-slider, .spacing-slider) input[type='range']::-moz-range-track {
		background : transparent;
		border     : none;
		height     : 4px;
	}

	:is(.range-slider, .spacing-slider) input[type='range']:focus {
		outline : none;
	}

	.clone-count {
		position  : absolute;
		right     : 0;
		font-size : 11px;
		opacity   : 0.6;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.hint {
		font-size   : 11px;
		opacity     : 0.5;
		text-align  : center;
		line-height : 1;
	}
</style>
