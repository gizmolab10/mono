<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { scenes, stores } from '../../ts/managers';
	import type { Bound } from '../../ts/types/Types';
	import { constraints } from '../../ts/algebra';
	import { units } from '../../ts/types/Units';

	const { w_root_so, w_selection, w_precision, w_tick } = stores;

	type BoundsRow = { label: string; bound: string | null; value: string; formula: string; has_formula: boolean; is_invariant: boolean; axis_index: number; attr_index: number };

	let selected_so = $derived($w_selection?.so ?? $w_root_so);
	let is_root = $derived(!selected_so?.scene?.parent);
	let prev_so_id: string | undefined;
	$effect(() => { if (selected_so?.id !== prev_so_id) { prev_so_id = selected_so?.id; display_mode_override = null; } });

	let tick = $derived(stores.is_editing() ? 0 : $w_tick);

	function get_bounds(so: Smart_Object, _tick: number) {
		const fmt = (mm: number) => units.format_for_system(mm, $w_unit_system, $w_precision);
		const inv = (axis_index: number, attr_index: number) => so.axes[axis_index].invariant === attr_index;
		// For children, show raw attr.value (offset from parent's origin).
		// For root, show absolute (attr.value is absolute since root has no parent).
		const val = (bound: string, axis_index: number, attr_index: number) => {
			// Dimensions (w, d, h) are always absolute
			if (attr_index === 2) return fmt(so.axes[axis_index].length.value);
			return fmt(so.attributes_dict_byName[bound]?.value ?? 0);
		};
		// Formula for a row: stored formula first, then invariant derivation if marked, else empty
		const fml = (label: string, bound: string | null, axis_index: number, attr_index: number) => {
			if (bound) {
				const stored = so.attributes_dict_byName[bound]?.formula_display;
				if (stored) return stored;
			}
			if (inv(axis_index, attr_index)) return constraints.invariant_formula_for(label, formula_mode) ?? '';
			return '';
		};
		const has = (bound: string | null) => bound ? !!so.attributes_dict_byName[bound]?.compiled : false;
		return [
			{ label: 'x', bound: 'x_min' as Bound, value: val('x_min', 0, 0), formula: fml('x', 'x_min', 0, 0), has_formula: has('x_min'), is_invariant: inv(0, 0), axis_index: 0, attr_index: 0 },
			{ label: 'y', bound: 'y_min' as Bound, value: val('y_min', 1, 0), formula: fml('y', 'y_min', 1, 0), has_formula: has('y_min'), is_invariant: inv(1, 0), axis_index: 1, attr_index: 0 },
			{ label: 'z', bound: 'z_min' as Bound, value: val('z_min', 2, 0), formula: fml('z', 'z_min', 2, 0), has_formula: has('z_min'), is_invariant: inv(2, 0), axis_index: 2, attr_index: 0 },
			{ label: 'w', bound: 'width',           value: val('width',  0, 2), formula: fml('w', 'width', 0, 2), has_formula: has('width'), is_invariant: inv(0, 2), axis_index: 0, attr_index: 2 },
			{ label: 'd', bound: 'depth',           value: val('depth',  1, 2), formula: fml('d', 'depth', 1, 2), has_formula: has('depth'), is_invariant: inv(1, 2), axis_index: 1, attr_index: 2 },
			{ label: 'h', bound: 'height',          value: val('height', 2, 2), formula: fml('h', 'height',2, 2), has_formula: has('height'), is_invariant: inv(2, 2), axis_index: 2, attr_index: 2 },
			{ label: 'X', bound: 'x_max' as Bound, value: val('x_max', 0, 1), formula: fml('X', 'x_max', 0, 1), has_formula: has('x_max'), is_invariant: inv(0, 1), axis_index: 0, attr_index: 1 },
			{ label: 'Y', bound: 'y_max' as Bound, value: val('y_max', 1, 1), formula: fml('Y', 'y_max', 1, 1), has_formula: has('y_max'), is_invariant: inv(1, 1), axis_index: 1, attr_index: 1 },
			{ label: 'Z', bound: 'z_max' as Bound, value: val('z_max', 2, 1), formula: fml('Z', 'z_max', 2, 1), has_formula: has('z_max'), is_invariant: inv(2, 1), axis_index: 2, attr_index: 1 },
		];
	}

	let bounds_rows = $derived(selected_so ? get_bounds(selected_so, tick) : []);

	const axes = ['x', 'y', 'z'] as const;

	function get_angles(so: Smart_Object, _tick: number) {
		// Read axis angle values directly (radians → degrees)
		const fmt = (rad: number) => {
			const degrees = Math.round(rad * (180 / Math.PI) * 2) / 2;
			return (degrees % 1 === 0 ? degrees.toFixed(0) : degrees.toFixed(1)) + '°';
		};
		return {
			x: fmt(so.axes[0].angle.value),
			y: fmt(so.axes[1].angle.value),
			z: fmt(so.axes[2].angle.value),
		};
	}

	let angles = $derived(selected_so ? get_angles(selected_so, tick) : { x: '0°', y: '0°', z: '0°' });

	function commit_formula(row: BoundsRow, value: string) {
		if (!selected_so || !row.bound) return;
		const trimmed = value.trim();
		const parent_id = selected_so.scene?.parent?.so.id;
		if (trimmed) {
			constraints.set_formula(selected_so, row.bound, trimmed, parent_id);
		} else {
			constraints.clear_formula(selected_so, row.bound);
		}
		constraints.propagate(selected_so);
		stores.tick();
		scenes.save();
	}

	const length_bounds = new Set(['width', 'depth', 'height']);

	function commit_value(row: BoundsRow, value: string) {
		if (!selected_so || !row.bound) return;
		const mm = units.parse_for_system(value, $w_unit_system) ?? constraints.evaluate_formula(value);
		if (mm === null) return;
		if (length_bounds.has(row.bound)) {
			constraints.write(selected_so.id, row.label, mm);
		} else {
			// Write raw offset directly — table displays attr.value (offset from parent's origin)
			const attr = selected_so.attributes_dict_byName[row.bound];
			if (attr) {
				attr.value = mm;
				// Sync length when an endpoint changes
				const axis = selected_so.axes[row.axis_index];
				if (!axis.length.compiled) {
					axis.length.value = selected_so.get_bound(axis.end.name as Bound) - selected_so.get_bound(axis.start.name as Bound);
				}
			}
		}
		constraints.propagate(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_invariant(row: BoundsRow) {
		if (!selected_so || is_root) return;
		const axis = selected_so.axes[row.axis_index];
		// Before changing invariant, sync length from geometry so it's never stale
		if (!axis.length.compiled) {
			axis.length.value = selected_so.get_bound(axis.end.name as Bound) - selected_so.get_bound(axis.start.name as Bound);
		}
		// Clear any existing formula on the attribute being marked as invariant —
		// invariant values come from enforce_invariants, not user formulas
		const inv_attr = axis.attributes[row.attr_index];
		if (inv_attr.compiled) {
			constraints.clear_formula(selected_so, inv_attr.name);
		}
		axis.invariant = row.attr_index;
		constraints.enforce_invariants(selected_so);
		stores.tick();
		scenes.save();
	}

	function commit_angle(axis: 'x' | 'y' | 'z', value: string) {
		if (!selected_so) return;
		const degrees = parseFloat(value.replace('°', ''));
		if (isNaN(degrees)) return;
		const radians = degrees * Math.PI / 180;
		selected_so.set_rotation(axis, radians);
		stores.tick();
		scenes.save();
	}

	function set_locked(index: number) {
		if (!selected_so) return;
		selected_so.rotation_lock = index;
		stores.tick();
		scenes.save();
	}

	function cell_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') {
			(e.target as HTMLInputElement).blur();
		}
		e.stopPropagation();
	}

	let display_mode_override: 'explicit' | 'agnostic' | null = $state(null);
	let formula_mode = $derived.by(() => {
		if (tick === undefined || !selected_so) return 'agnostic' as const;
		const detected = constraints.detect_formula_mode(selected_so);
		if (detected === 'agnostic') return 'agnostic' as const;
		if (detected === 'explicit') return display_mode_override ?? 'explicit' as const;
		return display_mode_override ?? 'agnostic' as const;
	});

	function translate() {
		if (!selected_so) return;
		const direction = formula_mode === 'explicit' ? 'agnostic' : 'explicit';
		constraints.translate_formulas(selected_so, direction);
		display_mode_override = direction;
		stores.tick();
		scenes.save();
	}

</script>

{#if selected_so}
	<table class='bounds'>
		<tbody>
			{#each bounds_rows as row, i (selected_so?.id + row.label)}
				{@const row_disabled = is_root ? row.attr_index !== 2 : (row.is_invariant || row.has_formula)}
				{@const gpos = i % 3}
				{@const prev_inv = gpos > 0 && bounds_rows[i - 1].is_invariant}
				{@const next_inv = gpos < 2 && bounds_rows[i + 1].is_invariant}
				{@const next2_inv = gpos === 0 && bounds_rows[i + 2]?.is_invariant}
				{@const merge_span = formula_mode === 'agnostic' && row.is_invariant && !prev_inv && next_inv ? (next2_inv ? 3 : 2) : 0}
				{@const is_merge_cont = formula_mode === 'agnostic' && row.is_invariant && prev_inv}
				{@const root_formula_cont = is_root && i > 0 && i < 6}
				{@const root_start_cont = is_root && row.attr_index === 0 && gpos > 0}
				<tr class:merge-cont={is_merge_cont || root_formula_cont || root_start_cont}>
					<td class='attr-name'>
						{#if formula_mode === 'agnostic' && row.axis_index === 1}
							<span class='ctx' class:ctx-l={row.attr_index === 2}>{['s', 'e', 'l'][row.attr_index]}</span>
						{/if}
						{row.label}
					</td>
					<td class='attr-sep' class:cross={row.is_invariant} class:disabled={is_root} onclick={() => set_invariant(row)}></td>
					{#if !(is_merge_cont || root_formula_cont)}
						{@const formula_disabled = is_root || row.is_invariant}
						<td class='attr-formula' class:merged={is_root || merge_span >= 2} class:cell-disabled={formula_disabled} rowspan={is_root ? (i === 0 ? 6 : 3) : merge_span || undefined}>
							<input
								type      = 'text'
								class     = 'cell-input'
								value     = {row.formula}
								disabled  = {formula_disabled}
								onfocus   = {() => stores.w_editing.set(T_Editing.formula)}
								onblur    = {(e) => { commit_formula(row, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
								onkeydown = {cell_keydown}
							/>
						</td>
					{/if}
					{#if root_start_cont}
						<!-- spanned by first start row -->
					{:else}
						<td class='attr-value' class:cell-disabled={row_disabled} rowspan={is_root && row.attr_index === 0 && gpos === 0 ? 3 : undefined}>
							<input
								type      = 'text'
								class     = 'cell-input right'
								value     = {is_root && row.attr_index === 0 ? '0' : row.value}
								disabled  = {row_disabled}
								onfocus   = {() => stores.w_editing.set(T_Editing.value)}
								onblur    = {(e) => { commit_value(row, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
								onkeydown = {cell_keydown}
							/>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	<div class='translate-row'>
		<button class='translate-btn' onclick={translate}>
			&harr; {formula_mode === 'explicit' ? 'agnostic' : 'explicit'}
		</button>
	</div>
	<table class='bounds rotations'>
		<tbody>
			{#each axes as axis, i}
				<tr>
					<td class='attr-name'>{axis}</td>
					<td class='attr-sep' class:cross={is_root || selected_so?.rotation_lock === i} class:disabled={is_root} onclick={() => set_locked(i)}></td>
					<td class='attr-value'>
						<input
							type      = 'text'
							class     = 'cell-input right'
							value     = {angles[axis]}
							disabled  = {is_root || selected_so?.rotation_lock === i}
							onblur    = {(e) => commit_angle(axis, (e.target as HTMLInputElement).value)}
							onkeydown = {cell_keydown}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No object selected</p>
{/if}

<style>
	.bounds {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 11px;
	}

	.bounds td {
		border     : 0.5px solid currentColor;
		text-align : left;
		padding    : 0;
	}

	.attr-name {
		width       : 16px;
		min-width   : 16px;
		font-weight : 600;
		opacity     : 0.7;
		text-align  : center !important;
		background  : var(--bg);
		position    : relative;
	}

	.ctx {
		position    : absolute;
		right       : calc(100% + 2px);
		opacity     : 0.5;
		font-weight : 600;
	}

	.ctx-l {
		right : calc(100% + 3px);
	}

	.attr-sep {
		width      : 12px;
		min-width  : 12px;
		background : white;
		cursor     : pointer;
	}

	.attr-sep:not(.disabled):hover {
		background : var(--accent);
	}

	.attr-sep.disabled {
		background    : var(--bg);
		cursor        : default;
		pointer-events: none;
	}

	.attr-sep.cross {
		background :
			linear-gradient(to top right, transparent calc(50% - 0.25px), currentColor 50%, transparent calc(50% + 0.25px)),
			linear-gradient(to bottom right, transparent calc(50% - 0.25px), currentColor 50%, transparent calc(50% + 0.25px)),
			var(--bg);
	}

	.merge-cont td {
		border-top : none !important;
	}

	.attr-formula {
		width          : 70%;
		vertical-align : middle;
	}

	.attr-formula.merged {
		padding : 0;
		height  : 1px;
	}

	.attr-formula.merged .cell-input {
		height     : 100%;
		display    : block;
	}

	.attr-value {
		text-align           : right !important;
		font-variant-numeric : tabular-nums;
		min-width            : 80px;
	}

	.cell-input {
		width         : 100%;
		height        : 100%;
		border        : none;
		background    : white;
		color         : inherit;
		font-size     : inherit;
		font-family   : inherit;
		padding       : 0 4px;
		margin        : 0;
		outline       : none;
		box-sizing    : border-box;
	}

	.cell-input:not(:disabled):not(:focus):hover {
		background : var(--accent);
	}

	.cell-input:focus {
		background     : white;
		color          : black;
		outline        : 1.5px solid cornflowerblue;
		outline-offset : -1.5px;
	}

	.cell-disabled {
		background : var(--accent);
	}

	.cell-input:disabled {
		cursor     : default;
		background : var(--accent);
		opacity    : 0.7;
	}

	.cell-input.right {
		text-align           : right;
		font-variant-numeric : tabular-nums;
	}

	.translate-row {
		display     : flex;
		justify-content : flex-end;
		padding         : 4px 0;
	}

	.translate-btn {
		padding       : 1px 8px;
		font-size     : 10px;
		font-family   : inherit;
		border        : 0.5px solid currentColor;
		border-radius : 9px;
		background    : var(--bg);
		color         : inherit;
		cursor        : pointer;
		opacity       : 0.7;
	}

	.translate-btn:hover {
		background : var(--accent);
		opacity    : 1;
	}

	p {
		font-size : 0.875rem;
		opacity   : 0.6;
		margin    : 0;
	}

</style>
