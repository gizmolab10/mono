<script lang='ts'>
	import { constants } from '../../ts/algebra/User_Constants';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { scenes, stores } from '../../ts/managers';
	import { constraints } from '../../ts/algebra';
	import { units } from '../../ts/types/Units';

	const { w_precision, w_tick } = stores;

	type Row = { name: string; value_mm: number };

	let rows: Row[] = $state(constants.get_all());

	// Re-sync rows when scene reloads (restore_constants replaces the SD store)
	$effect(() => {
		$w_tick;
		rows = constants.get_all();
	});

	function sync_and_propagate(): void {
		constraints.propagate_all();
		stores.tick();
		scenes.save();
	}

	function format_value(mm: number): string {
		return units.format_for_system(mm, $w_unit_system, $w_precision);
	}

	function remove_dimension(index: number): void {
		const name = rows[index].name;
		constants.remove(name);
		rows = constants.get_all();
		sync_and_propagate();
	}

	function commit_name(index: number, value: string): void {
		const old_name = rows[index].name;
		const new_name = value.trim();
		if (old_name === new_name) return;
		// Rename in SD store FIRST — bind_refs checks constants.has(new_name)
		constants.rename(old_name, new_name);
		if (old_name && new_name) constraints.rename_sd_in_formulas(old_name, new_name);
		rows = constants.get_all();
		sync_and_propagate();
	}

	function commit_value(index: number, value: string): void {
		const mm = units.parse_for_system(value, $w_unit_system);
		if (mm === null) return;
		const name = rows[index].name;
		if (!name) return;
		constants.set(name, mm);
		rows = constants.get_all();
		sync_and_propagate();
	}

	function cell_keydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			(e.target as HTMLInputElement).blur();
		}
		if (e.key !== 'Enter' && e.key !== 'Tab') {
			e.stopPropagation();
		}
	}
</script>

{#if rows.length > 0}
	<table class='standards'><tbody>
		{#each rows as row, index}
			<tr>
				<td class='std-name'>
					<input
						type      = 'text'
						placeholder = 'name'
						value     = {row.name}
						class     = 'cell-input'
						onkeydown = {cell_keydown}
						onfocus   = {() => stores.w_editing.set(T_Editing.value)}
						onblur    = {(e) => { commit_name(index, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
					/>
				</td>
				<td class='std-value'>
					<input
						type      = 'text'
						onkeydown = {cell_keydown}
						class     = 'cell-input right'
						value     = {format_value(row.value_mm)}
						onfocus   = {() => stores.w_editing.set(T_Editing.value)}
						onblur    = {(e) => { commit_value(index, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
					/>
				</td>
				<td class='std-remove'>
					<button
						class='remove-btn'
						use:hit_target={{ id: `remove-std-${index}`, onpress: () => remove_dimension(index) }}>
						×
					</button>
				</td>
			</tr>
		{/each}
	</tbody></table>
{/if}


<style>
	.standards {
		font-size       : var(--h-font-small);
		border-collapse : collapse;
		width           : 100%;
		top             : 8px;
	}

	.standards td {
		border  : var(--th-border) solid currentColor;
		padding : 0;
	}

	.std-name {
		width : 50%;
	}

	.std-value {
		font-variant-numeric : tabular-nums;
	}

	.std-remove {
		background : var(--bg);
		text-align : center;
		min-width  : 1lh;
		width      : 1lh;
	}

	.std-remove:hover {
		background : var(--hover);
	}

	.remove-btn {
		font-size   : var(--h-font-common);
		background  : transparent;
		color       : inherit;
		cursor      : pointer;
		border      : none;
		opacity     : 0.5;
		line-height : 1;
		padding     : 0;
	}

	.remove-btn:hover {
		opacity : 1;
	}

	.cell-input {
		z-index     : var(--z-action);
		box-sizing  : border-box;
		font-family : inherit;
		font-size   : inherit;
		color       : inherit;
		padding     : 0 4px;
		background  : var(--c-white);
		outline     : none;
		border      : none;
		height      : 100%;
		width       : 100%;
		margin      : 0;
	}

	.cell-input:not(:focus):hover {
		background : var(--hover);
	}

	.cell-input:focus {
		outline        : var(--focus-outline);
		outline-offset : -1.5px;
		background     : var(--c-white);
		color          : var(--c-black);
	}

	.cell-input.right {
		font-variant-numeric : tabular-nums;
		text-align           : right;
	}
</style>
