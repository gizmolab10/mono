<script lang='ts'>
	import { T_Hit_3D } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { w_unit_system } from '../../ts/types/Units';
	import { hits_3d, scenes, stores } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { units } from '../../ts/types/Units';
	import { engine } from '../../ts/render';

	const { w_all_sos, w_selection, w_tick, w_precision, w_root_so } = stores;

	let selected_so = $derived($w_selection?.so ?? $w_root_so);
	let is_root = $derived(!selected_so?.scene?.parent);
	let has_children = $derived($w_all_sos.some(so => so.scene?.parent?.so === selected_so));
	let visible_label = $derived(selected_so?.visible === false ? 'show' : 'hide');

	// Repeater state
	function get_repeater(_tick: number) { return selected_so?.repeater ?? null; }
	let is_repeater = $derived(get_repeater($w_tick) !== null);
	let has_firewall = $derived(get_repeater($w_tick)?.firewall ?? false);

	const axis_labels = ['x', 'y', 'z'] as const;

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

	function swap_xy() {
		if (!selected_so) return;
		engine.swap_axes(selected_so, 0, 1);
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
		const r = so.repeater;
		const repeat_ai = r.repeat_axis ?? 0;
		const gap_ai = r.gap_axis ?? repeat_ai;
		const parent_dims = [so.width, so.depth, so.height];
		const fmt = (mm: number) => units.format_for_system(mm, $w_unit_system, $w_precision);

		const count = all_sos.filter(s => s.scene?.parent?.so === so).length;
		if (count === 0) return null;

		if (r.gap_min != null && r.gap_max != null) {
			const gap_length = parent_dims[gap_ai];
			if (gap_length <= 0) return null;
			return { count, gap: fmt(gap_length / count), total: fmt(gap_length), label: axis_labels[gap_ai] };
		}
		if (r.spacing != null && r.spacing > 0) {
			return { count, gap: fmt(r.spacing), total: fmt(parent_dims[repeat_ai]), label: axis_labels[repeat_ai] };
		}
		return null;
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

	function toggle_visible() {
		if (!selected_so) return;
		selected_so.visible = !selected_so.visible;
		stores.tick();
		scenes.save();
	}

	let show_position = true;

	function select(so: Smart_Object): void {
		hits_3d.set_selection({ so, type: T_Hit_3D.face, index: 0 });
	}

	function is_selected(so: Smart_Object, _tick: number): boolean {
		return $w_selection?.so === so;
	}

	function fmt(mm: number): string {
		return units.format_for_system(mm, $w_unit_system, $w_precision, false);
	}

	function position(so: Smart_Object, _tick: number): [string, string, string] {
		return [fmt(so.x_min), fmt(so.y_min), fmt(so.z_min)];
	}

	function size(so: Smart_Object, _tick: number): [string, string, string] {
		return [fmt(so.axes[0].length.value), fmt(so.axes[1].length.value), fmt(so.axes[2].length.value)];
	}

	function repeat_count(so: Smart_Object, sos: Smart_Object[], _tick: number): number {
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater) return 0;
		const siblings = sos.filter(s => s.scene?.parent?.so === parent);
		if (siblings[0] !== so) return 0; // only first child shows count
		return siblings.length;
	}

	function is_clone(so: Smart_Object, sos: Smart_Object[], _tick: number): boolean {
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater) return false;
		const siblings = sos.filter(s => s.scene?.parent?.so === parent);
		return siblings[0] !== so;
	}

	function depth(so: Smart_Object): number {
		let d = 0;
		let scene = so.scene;
		while (scene?.parent) { d++; scene = scene.parent; }
		return d;
	}
</script>

<table class='hierarchy'>
	<thead><tr>
		<th class='hierarchy-header'></th>
		<th class='hierarchy-toggle' colspan='3' onclick={() => show_position = !show_position}>
			{show_position ? 'position' : 'size'} ⇄
		</th>
	</tr></thead>
	<tbody>
	{#each $w_all_sos.filter(s => !is_clone(s, $w_all_sos, $w_tick)) as so (so.id)}
		{@const n_rpt = repeat_count(so, $w_all_sos, $w_tick)}
		{@const values = show_position ? position(so, $w_tick) : size(so, $w_tick)}
		<tr
			class='hierarchy-row'
			class:selected={is_selected(so, $w_tick)}
			onclick={() => select(so)}>
			<td class='hierarchy-name' style:padding-left='{depth(so) * 12}px'>
				{so.name}{#if n_rpt > 0}<span class='repeat-badge'>×{n_rpt}</span>{/if}
			</td>
			<td class='hierarchy-data'>{values[0]}</td>
			<td class='hierarchy-data'>{values[1]}</td>
			<td class='hierarchy-data'>{values[2]}</td>
		</tr>
	{/each}
</tbody></table>

<div class='actions-row'>
	<button class='action-btn' disabled={!has_children} use:hit_target={{ id: 'remove-children', onpress: () => engine.remove_all_children() }}>empty</button>
	<button class='action-btn' disabled={is_root} use:hit_target={{ id: 'duplicate', onpress: () => engine.duplicate_selected() }}>duplicate</button>
	<button class='action-btn' use:hit_target={{ id: 'repeat', onpress: toggle_repeater }}>{is_repeater ? 'unrepeat' : 'repeat'}</button>
	<button class='action-btn' use:hit_target={{ id: 'toggle-visible', onpress: toggle_visible }}>{visible_label}</button>
</div>

{#if is_repeater && selected_so}
	<div class='repeater-options'>
		<div class='repeater-option-row'>
			<span class='option-label'>axis</span>
			<div class='segmented'>
				<button class:active={selected_so?.repeater?.repeat_axis === 0} onclick={() => set_repeat_axis(0)}>x</button>
				<button class:active={selected_so?.repeater?.repeat_axis === 1} onclick={() => set_repeat_axis(1)}>y</button>
			</div>
			<button class='action-btn' onclick={swap_xy}>swap x↔y</button>
			<button class='action-btn' class:active={has_firewall} onclick={toggle_firewall} style='margin-left:auto'>
				{has_firewall ? 'has fireblocks' : 'no fireblocks'}
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
				<span>{repeater_display.count} × {repeater_display.gap} ({repeater_display.label})</span>
				<span class='dim'>= {repeater_display.total}</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.hierarchy {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 9px;
		margin-top      : -4px;
	}

	.hierarchy-row {
		cursor : pointer;
	}

	.hierarchy-row:hover {
		background : var(--accent);
	}

	.hierarchy-row.selected {
		background  : var(--accent);
		font-weight : 600;
	}

	.hierarchy-name {
		padding    : 2px 0;
		text-align : left;
	}

	.clone {
		opacity : 0.35;
	}

	.repeat-badge {
		margin-left : 4px;
		opacity     : 0.5;
		font-size   : 8px;
	}

	.hierarchy-header {
		/* empty name column header */
	}

	.hierarchy-toggle {
		text-align   : center;
		font-weight  : normal;
		color        : rgba(0, 0, 0, 0.8);
		cursor       : pointer;
		padding      : 0;
		user-select  : none;
	}

	.hierarchy-toggle:hover {
		color : rgba(0, 0, 0, 1.0);
	}

	.hierarchy-data {
		padding              : 2px 0 2px 6px;
		text-align           : right;
		font-variant-numeric : tabular-nums;
		color                : black;
		white-space          : nowrap;
	}

	.actions-row {
		display    : flex;
		gap        : 6px;
		margin-top : 8px;
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

	.action-btn:disabled {
		opacity        : 0.3;
		cursor         : default;
		pointer-events : none;
	}

	.action-btn.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.repeater-options {
		margin-top     : 8px;
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

	.repeater-display .dim {
		opacity : 0.5;
	}
</style>
