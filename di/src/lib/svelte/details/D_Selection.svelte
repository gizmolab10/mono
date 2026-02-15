<script lang='ts'>
	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { scenes, stores } from '../../ts/managers';
	import { units } from '../../ts/types/Units';
	import { engine } from '../../ts/render';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import type { Bound } from '../../ts/runtime/Smart_Object';

	const { w_s_face_label } = face_label;
	const { w_root_so, w_selection, w_precision, w_tick } = stores;

	type BoundsRow = { label: string; bound: Bound | null; value: string; formula: string };

	let selected_so = $derived($w_selection?.so ?? $w_root_so);

	let tick = $derived($w_tick);

	function get_bounds(so: Smart_Object, _tick: number) {
		const fmt = (mm: number) => units.format_for_system(mm, $w_unit_system, $w_precision);
		const attr = (name: string) => so.attributes_dict_byName[name]?.formula ?? name;
		const p = so.scene?.position ?? [0, 0, 0];
		return [
			{ label: 'x', bound: 'x_min' as Bound, value: fmt(p[0] + so.x_min), formula: attr('x_min') },
			{ label: 'X', bound: 'x_max' as Bound, value: fmt(p[0] + so.x_max), formula: attr('x_max') },
			{ label: 'w', bound: null,              value: fmt(so.width),         formula: 'X - x' },
			{ label: 'y', bound: 'y_min' as Bound, value: fmt(p[1] + so.y_min), formula: attr('y_min') },
			{ label: 'Y', bound: 'y_max' as Bound, value: fmt(p[1] + so.y_max), formula: attr('y_max') },
			{ label: 'h', bound: null,              value: fmt(so.height),        formula: 'Y - y' },
			{ label: 'z', bound: 'z_min' as Bound, value: fmt(p[2] + so.z_min), formula: attr('z_min') },
			{ label: 'Z', bound: 'z_max' as Bound, value: fmt(p[2] + so.z_max), formula: attr('z_max') },
			{ label: 'd', bound: null,              value: fmt(so.depth),         formula: 'Z - z' },
		];
	}

	let bounds_rows = $derived(selected_so ? get_bounds(selected_so, tick) : []);

	const axes = ['x', 'y', 'z'] as const;

	function get_angles(so: Smart_Object, _tick: number) {
		// Extract Euler XYZ angles from orientation quaternion
		const q = so.orientation;
		const [qx, qy, qz, qw] = [q[0], q[1], q[2], q[3]];
		const sinr_cosp = 2 * (qw * qx + qy * qz);
		const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
		const rx = Math.atan2(sinr_cosp, cosr_cosp);
		const sinp = 2 * (qw * qy - qz * qx);
		const ry = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);
		const siny_cosp = 2 * (qw * qz + qx * qy);
		const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
		const rz = Math.atan2(siny_cosp, cosy_cosp);
		const fmt = (rad: number) => {
			const degrees = Math.round(rad * (180 / Math.PI) * 2) / 2;
			return (degrees % 1 === 0 ? degrees.toFixed(0) : degrees.toFixed(1)) + '°';
		};
		return { x: fmt(rx), y: fmt(ry), z: fmt(rz) };
	}

	let angles = $derived(selected_so ? get_angles(selected_so, tick) : { x: '0°', y: '0°', z: '0°' });

	function commit_formula(row: BoundsRow, value: string) {
		if (!selected_so || !row.bound) return;
		const attr = selected_so.attributes_dict_byName[row.bound];
		if (attr) {
			attr.formula = value.trim() || null;
			scenes.save();
		}
	}

	function commit_value(row: BoundsRow, value: string) {
		if (!selected_so || !row.bound) return;
		const mm = units.parse_for_system(value, $w_unit_system);
		if (mm !== null) {
			const p = selected_so.scene?.position ?? [0, 0, 0];
			const axis_index = row.bound[0] === 'x' ? 0 : row.bound[0] === 'y' ? 1 : 2;
			selected_so.set_bound(row.bound, mm - p[axis_index]);
			stores.tick();
			scenes.save();
		}
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

	function cell_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') {
			(e.target as HTMLInputElement).blur();
		}
	}

	let display_name = $derived(
		$w_s_face_label ? $w_s_face_label.current_name : selected_so?.name ?? ''
	);

	function handle_name(e: Event) {
		const input = e.target as HTMLInputElement;
		if (selected_so) {
			selected_so.name = input.value;
			scenes.save();
			stores.w_all_sos.update(sos => sos);
			face_label.sync(input.value);
		}
	}

	function handle_name_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			if (face_label.state) face_label.cancel();
			else stores.w_editing.set(T_Editing.none);
			(e.target as HTMLInputElement).blur();
		}
	}

	function handle_name_focus(e: FocusEvent) {
		stores.w_editing.set(T_Editing.details_name);
		const cur = face_label.cursor;
		if (cur) {
			const input = e.target as HTMLInputElement;
			requestAnimationFrame(() => input.setSelectionRange(cur.start, cur.end));
		}
	}

	function handle_name_blur(e: FocusEvent) {
		const input = e.target as HTMLInputElement;
		face_label.cursor = { start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 };
		setTimeout(() => {
			if (stores.editing() !== T_Editing.face_label) {
				if (face_label.state) {
					face_label.commit(selected_so?.name ?? '');
				} else {
					stores.w_editing.set(T_Editing.none);
				}
			}
		});
	}
</script>

{#if selected_so}
	<div class='name-row'>
		<input
			type      = 'text'
			value     = {display_name}
			oninput   = {handle_name}
			onkeydown = {handle_name_keydown}
			onfocus   = {handle_name_focus}
			onblur    = {handle_name_blur}
		/>
		<button class='action-btn' use:hit_target={{ id: 'add-child', onpress: () => engine.add_child_so() }}>add child</button>
	</div>
	<table class='bounds'>
		<tbody>
			{#each bounds_rows as row}
				<tr>
					<td class='attr-name'>{row.label}</td>
					<td class='attr-formula'>
						<input
							type      = 'text'
							class     = 'cell-input'
							value     = {row.formula}
							disabled  = {!row.bound}
							onblur    = {(e) => commit_formula(row, (e.target as HTMLInputElement).value)}
							onkeydown = {cell_keydown}
						/>
					</td>
					<td class='attr-value'>
						<input
							type      = 'text'
							class     = 'cell-input right'
							value     = {row.value}
							disabled  = {!row.bound}
							onblur    = {(e) => commit_value(row, (e.target as HTMLInputElement).value)}
							onkeydown = {cell_keydown}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<table class='bounds rotations'>
		<tbody>
			{#each axes as axis}
				<tr>
					<td class='attr-name'>{axis}</td>
					<td class='attr-value'>
						<input
							type      = 'text'
							class     = 'cell-input right'
							value     = {angles[axis]}
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
	.name-row {
		display     : flex;
		gap         : 6px;
		align-items : center;
	}

	.name-row input {
		flex          : 1;
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		font-size     : 0.875rem;
		color         : inherit;
		background    : white;
		padding       : 0 6px;
		height        : 20px;
		outline       : none;
		border-radius : 4px;
	}

	.name-row input:focus {
		border-color : currentColor;
		opacity      : 1;
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
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.bounds {
		width           : calc(100% + 2rem);
		margin-left     : -1rem;
		margin-right    : -1rem;
		border-collapse : collapse;
		margin-top      : 6px;
		font-size       : 11px;
	}

	.bounds td {
		border     : 0.5px solid currentColor;
		text-align : left;
		padding    : 0;
	}

	.attr-name {
		width       : 20px;
		font-weight : 600;
		opacity     : 0.7;
		text-align  : center !important;
		background  : var(--bg);
	}

	.attr-formula {
		width   : 70%;
	}

	.attr-value {
		text-align           : right !important;
		font-variant-numeric : tabular-nums;
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

	.cell-input:focus {
		background : white;
		color      : black;
	}

	.cell-input:disabled {
		opacity    : 0.5;
		cursor     : default;
	}

	.cell-input.right {
		text-align           : right;
		font-variant-numeric : tabular-nums;
	}

	p {
		font-size : 0.875rem;
		opacity   : 0.6;
		margin    : 0;
	}
</style>
