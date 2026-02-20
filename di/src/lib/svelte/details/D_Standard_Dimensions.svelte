<script lang='ts'>
	import { standard_dimensions } from '../../ts/algebra/Standard_Dimensions';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { w_unit_system } from '../../ts/types/Units';
	import { units } from '../../ts/types/Units';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { constraints } from '../../ts/algebra';
	import { scenes, stores } from '../../ts/managers';

	const { w_precision, w_tick } = stores;

	type Row = { name: string; value_mm: number };

	let rows: Row[] = $state(standard_dimensions.get_all());

	// Re-sync rows when scene reloads (restore_standard_dimensions replaces the SD store)
	$effect(() => {
		$w_tick;
		rows = standard_dimensions.get_all();
	});

	function sync_and_propagate(): void {
		constraints.propagate_all();
		stores.tick();
		scenes.save();
	}

	function format_value(mm: number): string {
		return units.format_for_system(mm, $w_unit_system, $w_precision);
	}

	function add_dimension(): void {
		standard_dimensions.add('', 0);
		rows = standard_dimensions.get_all();
	}

	function remove_dimension(index: number): void {
		const name = rows[index].name;
		standard_dimensions.remove(name);
		rows = standard_dimensions.get_all();
		sync_and_propagate();
	}

	function commit_name(index: number, value: string): void {
		const old_name = rows[index].name;
		const new_name = value.trim();
		if (old_name === new_name) return;
		// Rename in SD store FIRST — bind_refs checks standard_dimensions.has(new_name)
		standard_dimensions.rename(old_name, new_name);
		if (old_name && new_name) constraints.rename_sd_in_formulas(old_name, new_name);
		rows = standard_dimensions.get_all();
		sync_and_propagate();
	}

	function commit_value(index: number, value: string): void {
		const mm = units.parse_for_system(value, $w_unit_system);
		if (mm === null) return;
		const name = rows[index].name;
		if (!name) return;
		standard_dimensions.set(name, mm);
		rows = standard_dimensions.get_all();
		sync_and_propagate();
	}

	function cell_keydown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === 'Escape') {
			(e.target as HTMLInputElement).blur();
		}
		e.stopPropagation();
	}
</script>

<div class='settings'>
	<button class='action-btn' use:hit_target={{ id: 'add-standard', onpress: add_dimension }}>add</button>
</div>

{#if rows.length > 0}
	<table class='standards'><tbody>
		{#each rows as row, index}
			<tr>
				<td class='std-name'>
					<input
						type      = 'text'
						class     = 'cell-input'
						value     = {row.name}
						placeholder = 'name'
						onfocus   = {() => stores.w_editing.set(T_Editing.value)}
						onblur    = {(e) => { commit_name(index, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
						onkeydown = {cell_keydown}
					/>
				</td>
				<td class='std-value'>
					<input
						type      = 'text'
						class     = 'cell-input right'
						value     = {format_value(row.value_mm)}
						onfocus   = {() => stores.w_editing.set(T_Editing.value)}
						onblur    = {(e) => { commit_value(index, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
						onkeydown = {cell_keydown}
					/>
				</td>
				<td class='std-remove'>
					<button class='remove-btn' use:hit_target={{ id: `remove-std-${index}`, onpress: () => remove_dimension(index) }}>×</button>
				</td>
			</tr>
		{/each}
	</tbody></table>
{/if}

<style>
	.settings {
		display : flex;
		gap     : 6px;
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

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.standards {
		width           : 100%;
		border-collapse : collapse;
		margin-top      : 8px;
		font-size       : 11px;
	}

	.standards td {
		border  : 0.5px solid currentColor;
		padding : 0;
	}

	.std-name {
		width : 50%;
	}

	.std-value {
		font-variant-numeric : tabular-nums;
	}

	.std-remove {
		width      : 20px;
		min-width  : 20px;
		text-align : center;
		background : var(--bg);
	}

	.remove-btn {
		border     : none;
		background : transparent;
		color      : inherit;
		cursor     : pointer;
		font-size  : 13px;
		padding    : 0;
		line-height: 1;
		opacity    : 0.5;
	}

	.remove-btn:hover {
		opacity : 1;
	}

	.cell-input {
		width       : 100%;
		height      : 100%;
		border      : none;
		background  : white;
		color       : inherit;
		font-size   : inherit;
		font-family : inherit;
		padding     : 0 4px;
		margin      : 0;
		outline     : none;
		box-sizing  : border-box;
	}

	.cell-input:focus {
		background : white;
		color      : black;
	}

	.cell-input.right {
		text-align           : right;
		font-variant-numeric : tabular-nums;
	}
</style>
