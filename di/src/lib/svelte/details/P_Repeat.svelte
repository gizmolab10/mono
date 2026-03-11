<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { scenes, stores } from '../../ts/managers';
	import { w_unit_system, units } from '../../ts/types/Units';
	import { T_Units } from '../../ts/types/Enumerations';
	import { engine } from '../../ts/render';
	import Slider from '../mouse/Slider.svelte';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

	let selected_so = $derived($w_selection?.so ?? null);

	function get_repeater(_tick: number) { return selected_so?.repeater ?? null; }
	let is_repeater = $derived.by(() => { $w_tick; return selected_so?.repeater?.is_repeating !== false && selected_so?.repeater != null; });
	let has_firewall = $derived(get_repeater($w_tick)?.firewall ?? false);
	let has_children = $derived($w_all_sos.some(s => s.scene?.parent?.so === selected_so));
	let is_diagonal = $derived.by((): boolean | null | undefined => {
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
		selected_so.repeater = { ...selected_so.repeater, spacing: mm };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	const INCH = 25.4;
	const IMPERIAL_DENOMS = [0, 1, 2, 4, 8, 16, 32, 64];
	const GAP_MIN_MM = 4 * INCH;
	const GAP_MAX_MM = 12 * INCH;
const STICKY_THRESHOLD_MM = 0.15 * INCH;
	const TICK_MM = [4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => i * INCH);

	// Spacing slider constants
	const SP_MIN_MM = 6 * INCH;
	const SP_MAX_MM = 36 * INCH;
	const SP_TICK_MM = [6, 12, 16, 24, 36].map(i => i * INCH);
	const SP_STICKY_MM = 0.5 * INCH;

	function format_spacing(mm: number): string {
		const inches = mm / INCH;
		if (inches >= 12 && inches % 12 < 0.01) return `${Math.round(inches / 12)}'`;
		if (Math.abs(inches - Math.round(inches)) < 0.01) return `${Math.round(inches)}"`;
		return units.format_for_system(mm, $w_unit_system, $w_precision);
	}

	let spacing_mm = $derived.by(() => { $w_tick; return selected_so?.repeater?.spacing ?? GAP_MAX_MM; });

	function handle_spacing(mm: number) {
		// Slider already did sticky snap; round non-tick values to nearest inch
		const is_tick = SP_TICK_MM.some(t => Math.abs(mm - t) < 0.01);
		const val = is_tick ? mm : Math.round(mm / INCH) * INCH;
		set_spacing(Math.max(SP_MIN_MM, Math.min(SP_MAX_MM, val)));
	}


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

		let gap_min = field === 'gap_min' ? val : selected_so.repeater.gap_min!;
		let gap_max = field === 'gap_max' ? val : selected_so.repeater.gap_max!;
		if (gap_min > gap_max) { if (field === 'gap_min') gap_max = gap_min; else gap_min = gap_max; }

		selected_so.repeater = { ...selected_so.repeater, gap_min, gap_max };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	let gap_min_mm = $derived.by(() => { $w_tick; const r = selected_so?.repeater; return r?.gap_min ?? GAP_MIN_MM; });
	let gap_max_mm = $derived.by(() => { $w_tick; const r = selected_so?.repeater; return r?.gap_max ?? GAP_MAX_MM; });

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
		const fireblocks = so.repeater.firewall ? Math.floor(total / 2) : 0;
		const studs = total - fireblocks;
		return { count: studs, fireblocks };
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
		engine.strip_clones(selected_so);
		const existing = selected_so.repeater ?? { run_axis: 0 as const, rise_axis: 1 as const, spacing: 16 * INCH, gap_min: GAP_MIN_MM, gap_max: GAP_MAX_MM };
		selected_so.repeater = { ...existing, is_diagonal: false, is_repeating: true };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function repeat_diagonal() {
		if (!selected_so) return;
		engine.strip_clones(selected_so);
		const existing = selected_so.repeater ?? { run_axis: 0 as const, rise_axis: 1 as const, spacing: 16 * INCH, gap_min: GAP_MIN_MM, gap_max: GAP_MAX_MM };
		selected_so.repeater = { ...existing, is_diagonal: true, is_repeating: true };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}
</script>

{#if is_repeater && selected_so}
	<div class='repeater-options'>
		<div class='repeater-option-row'>
			<span class='option-label'>run</span>
			<div class='segmented'>
				<button class:active={repeat_axis === 0} onclick={() => set_repeat_axis(0)}>x</button>
				<button class:active={repeat_axis === 1} onclick={() => set_repeat_axis(1)}>y</button>
				<button class:active={repeat_axis === 2} onclick={() => set_repeat_axis(2)}>z</button>
			</div>
			<span class='flex-spacer'></span>
			<button class='action-btn' use:hit_target={{ id: 'repeat', onpress: toggle_repeater }}>unrepeat</button>
			<span class='flex-spacer'></span>
			{#if repeater_display}
				<span class='clone-count'>{repeater_display.count} repeats</span>
			{/if}
		</div>
		{#if !is_diagonal}
			<div class='repeater-option-row'>
				<div class='spacing-slider'>
					<Slider
						min={SP_MIN_MM} max={SP_MAX_MM}
						divisions={200}
						value={spacing_mm}
						fill style='line'
						sticky={SP_TICK_MM}
						sticky_threshold={SP_STICKY_MM}
						onchange={handle_spacing}
					/>
					<div class='rise-endpoints'>
						<span class='rise-endpoint' style:margin-left='2px'>6"</span>
						<span class='slider-caption'>{format_spacing(spacing_mm)} spacing</span>
						<span class='rise-endpoint' style:margin-right='3px'>3'</span>
					</div>
				</div>
				<button class='action-btn fireblocks-btn' class:active={has_firewall} onclick={toggle_firewall}>
					{has_firewall ? 'blocks ⟳' : 'no blocks ⟳'}
				</button>
			</div>
		{:else}
			<div class='repeater-option-row rise-row'>
				<span class='option-label'>rise</span>
				<div class='segmented'>
					{#each rise_choices as a}
						<button class:active={rise_axis === a} onclick={() => set_rise_axis(a)}>{['x','y','z'][a]}</button>
					{/each}
				</div>
				<div class='gap-slider-wrap'>
					<Slider
						fill
						divisions={200}
						sticky={TICK_MM}
						value={gap_min_mm}
						value_alt={gap_max_mm}
						format_label={format_gap}
						min={GAP_MIN_MM} max={GAP_MAX_MM}
						sticky_threshold={STICKY_THRESHOLD_MM}
						onchange={(mm) => set_gap_slider('gap_min', mm)}
						onchange_alt={(mm) => set_gap_slider('gap_max', mm)}
					/>
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
		gap            : var(--l-gap);
	}

	.repeater-option-row {
		align-items : center;
		display     : flex;
		min-height  : var(--h-button-common);
		position    : relative;
		gap         : var(--l-gap);
	}

	.option-label {
		font-size   : var(--h-font-small);
		min-width   : 20px;
		opacity     : 0.6;
		flex-shrink : 0;
	}

	.segmented {
		display : flex;
		gap     : 0;
	}

	.segmented button {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		font-size     : var(--h-font-common);
		padding       : 0 var(--l-padding);
		z-index       : var(--z-action);
		color         : inherit;
		cursor        : pointer;
		white-space   : nowrap;
		background    : var(--c-white);
	}

	.segmented button:first-child {
		border-radius : var(--corner-common) 0 0 var(--corner-common);
	}

	.segmented button:last-child {
		border-radius : 0 var(--corner-common) var(--corner-common) 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		background  : var(--selected);
		font-weight : 600;
	}

	.segmented button:hover:not(.active) {
		background : var(--selected);
	}

	.action-btn {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		font-size     : var(--h-font-common);
		border-radius : var(--corner-common);
		z-index       : var(--z-action);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		background    : var(--c-white);
		padding       : 0 var(--l-padding);
	}

	.flex-spacer {
		flex : 1;
	}

	/* sits in a flex row alongside a grow-able slider; nudged up to optical center */
	.fireblocks-btn {
		flex-shrink : 0;
		position    : relative;
		top         : -5.5px;
	}

	.action-btn.active {
		background  : var(--selected);
		font-weight : 600;
	}

	.spacing-slider {
		position  : relative;
		min-width : 0;
		flex      : 1;
	}

	.rise-row {
		margin-top : -1px;
	}

	.rise-row .option-label,
	.rise-row .segmented {
		position : relative;
		top      : -1px;
	}

	.rise-endpoints {
		justify-content : space-between;
		align-items     : center;
		display         : flex;
		margin-top      : -2px;
	}

	.rise-endpoint {
		font-size : var(--h-font-small);
		opacity   : 0.5;
	}

	.gap-slider-wrap {
		position    : relative;
		margin      : -2px 0 0;
		flex        : 1;
		min-width   : 0;
	}

	.slider-caption {
		font-size  : var(--h-font-small);
		text-align : center;
		display    : block;
		margin-top : 0px;
		opacity    : 0.5;
	}


.clone-count {
		font-size   : var(--h-font-small);
		opacity     : 0.6;
		flex-shrink : 0;
	}

	.action-btn:global([data-hit]) {
		background : var(--selected);
		color      : var(--c-black);
	}

	.hint {
		font-size   : var(--h-font-common);
		text-align  : center;
		opacity     : 0.5;
		line-height : 1;
	}
</style>
