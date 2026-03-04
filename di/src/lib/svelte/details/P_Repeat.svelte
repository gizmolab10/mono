<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { scenes, stores } from '../../ts/managers';
	import { w_unit_system } from '../../ts/types/Units';
	import { units } from '../../ts/types/Units';
	import { engine } from '../../ts/render';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

	let selected_so = $derived($w_selection?.so ?? null);

	function get_repeater(_tick: number) { return selected_so?.repeater ?? null; }
	let is_repeater = $derived(get_repeater($w_tick) !== null);
	let has_firewall = $derived(get_repeater($w_tick)?.firewall ?? false);

	function repeater_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
		e.stopPropagation();
	}

	function set_repeat_axis(axis: 0 | 1) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, repeat_axis: axis };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_gap(field: 'gap_min' | 'gap_max', value: string) {
		if (!selected_so?.repeater) return;
		const mm = units.parse_for_system(value, $w_unit_system);
		if (mm === null) return;
		selected_so.repeater = { ...selected_so.repeater, [field]: mm };
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

	function enable_gap_range() {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, gap_min: 152.4, gap_max: 203.2, spacing: undefined };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_gap_axis(axis: 0 | 1 | 2 | undefined) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, gap_axis: axis };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

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
		const clones = so.repeater.firewall ? (total + 1) / 2 : total;
		const fireblocks = so.repeater.firewall ? clones - 1 : 0;
		return { count: clones, fireblocks };
	}

	let repeater_display = $derived(get_repeater_display(selected_so ?? undefined, $w_all_sos, $w_tick));

	const stashed_repeaters = new Map<string, any>();

	function toggle_repeater() {
		if (!selected_so) return;
		if (is_repeater) {
			stashed_repeaters.set(selected_so.id, selected_so.repeater);
			engine.strip_clones(selected_so);
			selected_so.repeater = null;
		} else {
			selected_so.repeater = stashed_repeaters.get(selected_so.id) ?? {};
			stashed_repeaters.delete(selected_so.id);
			engine.sync_repeater(selected_so);
		}
		stores.tick();
		scenes.save();
	}
</script>

{#if is_repeater && selected_so}
	<div class='repeater-options'>
		<div class='repeater-option-row'>
			<button class='action-btn' use:hit_target={{ id: 'repeat', onpress: toggle_repeater }}>unrepeat</button>
		</div>
		<div class='repeater-option-row'>
			<span class='option-label'>axis</span>
			<div class='segmented'>
				<button class:active={selected_so?.repeater?.repeat_axis === 0} onclick={() => set_repeat_axis(0)}>x</button>
				<button class:active={selected_so?.repeater?.repeat_axis === 1} onclick={() => set_repeat_axis(1)}>y</button>
			</div>
			<button class='action-btn' class:active={has_firewall} onclick={toggle_firewall} style='margin-left:auto'>
				{has_firewall ? 'fireblocks ↔' : 'no fireblocks ↔'}
			</button>
		</div>
		<div class='repeater-option-row'>
			<span class='option-label'>constraint</span>
			<div class='segmented'>
				<button class:active={selected_so?.repeater?.gap_min != null} onclick={enable_gap_range}>range</button>
				<button class:active={selected_so?.repeater?.spacing === 304.8} onclick={() => set_spacing(304.8)}>12"</button>
				<button class:active={selected_so?.repeater?.spacing === 406.4} onclick={() => set_spacing(406.4)}>16"</button>
				<button class:active={selected_so?.repeater?.spacing === 609.6} onclick={() => set_spacing(609.6)}>24"</button>
			</div>
		</div>
		{#if selected_so?.repeater?.gap_min != null && selected_so?.repeater?.gap_max != null}
			<div class='repeater-option-row'>
				<span class='option-label'>gap along</span>
				<div class='segmented'>
					<button class:active={selected_so?.repeater?.gap_axis == null || selected_so?.repeater?.gap_axis === selected_so?.repeater?.repeat_axis} onclick={() => set_gap_axis(undefined)}>repeat</button>
					<button class:active={selected_so?.repeater?.gap_axis === 2} onclick={() => set_gap_axis(2)}>z</button>
				</div>
			</div>
			<div class='repeater-option-row'>
				<span class='option-label'>min</span>
				<input
					type      = 'text'
					class     = 'repeater-input'
					value     = {units.format_for_system(selected_so.repeater.gap_min, $w_unit_system, $w_precision)}
					onblur    = {(e) => set_gap('gap_min', (e.target as HTMLInputElement).value)}
					onkeydown = {repeater_keydown}
				/>
				<span class='option-label'>max</span>
				<input
					type      = 'text'
					class     = 'repeater-input'
					value     = {units.format_for_system(selected_so.repeater.gap_max, $w_unit_system, $w_precision)}
					onblur    = {(e) => set_gap('gap_max', (e.target as HTMLInputElement).value)}
					onkeydown = {repeater_keydown}
				/>
			</div>
		{/if}
		{#if repeater_display}
			<div class='repeater-display'>
				<span>{repeater_display.count} clones{#if repeater_display.fireblocks > 0}, {repeater_display.fireblocks} fire blocks{/if}</span>
			</div>
		{/if}
	</div>
{:else}
	<button class='action-btn' use:hit_target={{ id: 'repeat', onpress: toggle_repeater }}>repeat</button>
{/if}

<style>
	.repeater-options {
		display        : flex;
		flex-direction : column;
		gap            : 4px;
	}

	.repeater-option-row {
		display     : flex;
		align-items : center;
		gap         : 6px;
	}

	.option-label {
		font-size   : 11px;
		opacity     : 0.6;
		min-width   : 28px;
		flex-shrink : 0;
	}

	.segmented {
		display : flex;
		gap     : 0;
	}

	.segmented button {
		border        : 0.5px solid currentColor;
		background    : white;
		color         : inherit;
		font-size     : 11px;
		height        : 20px;
		padding       : 0 8px;
		cursor        : pointer;
		white-space   : nowrap;
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

	.action-btn.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.repeater-input {
		flex          : 1;
		min-width     : 0;
		border        : 0.5px solid currentColor;
		border-radius : 4px;
		background    : white;
		color         : inherit;
		font-size     : 11px;
		font-family   : inherit;
		height        : 20px;
		padding       : 0 6px;
		outline       : none;
		box-sizing    : border-box;
	}

	.repeater-input:focus {
		outline        : 1.5px solid cornflowerblue;
		outline-offset : -1.5px;
	}

	.repeater-display {
		font-size    : 11px;
		opacity      : 0.8;
		padding-left : 34px;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}
</style>
