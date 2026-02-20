<script lang='ts'>
	import { T_Hit_3D } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { hits_3d, stores } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { units } from '../../ts/types/Units';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

	function select(so: Smart_Object): void {
		hits_3d.set_selection({ so, type: T_Hit_3D.face, index: 0 });
	}

	function is_selected(so: Smart_Object, _tick: number): boolean {
		return $w_selection?.so === so;
	}

	function fmt(mm: number): string {
		return units.format_for_system(mm, $w_unit_system, $w_precision, false);
	}

	function position(so: Smart_Object, _tick: number): string {
		return `${fmt(so.x_min)}, ${fmt(so.y_min)}, ${fmt(so.z_min)}`;
	}

	function size(so: Smart_Object, _tick: number): string {
		return `${fmt(so.axes[0].length.value)}, ${fmt(so.axes[1].length.value)}, ${fmt(so.axes[2].length.value)}`;
	}
</script>

<table class='list'><tbody>
	{#each $w_all_sos as so (so.id)}
		<tr
			class='list-row'
			class:selected={is_selected(so, $w_tick)}
			onclick={() => select(so)}>
			<td class='list-name'>{so.name}</td>
			<td class='list-position'>{position(so, $w_tick)}</td>
			<td class='list-size'>{size(so, $w_tick)}</td>
		</tr>
	{/each}
</tbody></table>

<style>
	.list {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 9px;
	}

	.list-row {
		cursor : pointer;
	}

	.list-row:hover {
		background : var(--accent);
	}

	.list-row.selected {
		background  : var(--accent);
		font-weight : 600;
	}

	.list-name {
		padding    : 2px 0;
		text-align : left;
	}

	.list-position,
	.list-size {
		padding              : 2px 0 2px 6px;
		text-align           : right;
		font-variant-numeric : tabular-nums;
		opacity              : 0.6;
		white-space          : nowrap;
	}
</style>
