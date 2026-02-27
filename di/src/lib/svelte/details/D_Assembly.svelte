<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { hits_3d, stores } from '../../ts/managers';
	import { T_Hit_3D } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { units } from '../../ts/types/Units';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

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
		<th colspan='3'>
			<button class='toggle-btn' onclick={() => show_position = !show_position}>
				↔ {show_position ? 'position' : 'size'}
			</button>
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

	.repeat-badge {
		margin-left : 4px;
		opacity     : 0.5;
		font-size   : 8px;
	}

	.toggle-btn {
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		background    : white;
		padding       : 0 8px;
		border-radius : 10px;
		font-size     : 9px;
		height        : 16px;
		float         : right;
	}

	.toggle-btn:hover {
		background : var(--accent);
	}

	.hierarchy-data {
		padding              : 2px 0 2px 6px;
		text-align           : right;
		font-variant-numeric : tabular-nums;
		color                : black;
		white-space          : nowrap;
	}
</style>
