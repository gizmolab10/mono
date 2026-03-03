<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { hits_3d, stores, scenes } from '../../ts/managers';
	import { T_Hit_3D } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { units } from '../../ts/types/Units';
	import D_Selected_Part from './D_Selected_Part.svelte';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

	let show_position = $state(true);
	let editing_id: string | null = $state(null);
	let editing_original: string = '';

	function select(so: Smart_Object): void {
		hits_3d.set_selection({ so, type: T_Hit_3D.face, index: 0 });
	}

	function is_selected(so: Smart_Object, _tick: number): boolean {
		return $w_selection?.so === so;
	}

	function handle_name_click(e: MouseEvent, so: Smart_Object) {
		if (is_selected(so, 0)) {
			e.stopPropagation();
			editing_id = so.id;
			editing_original = so.name;
		}
	}

	function commit_name(so: Smart_Object, value: string) {
		const trimmed = value.trim();
		if (trimmed.length > 0) {
			so.name = trimmed;
			scenes.save();
			stores.w_all_sos.update(sos => sos);
		}
		editing_id = null;
	}

	function cancel_name(so: Smart_Object) {
		so.name = editing_original;
		editing_id = null;
	}

	function name_keydown(e: KeyboardEvent, so: Smart_Object) {
		if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
		else if (e.key === 'Escape') { cancel_name(so); }
		e.stopPropagation();
	}

	function autofocus(node: HTMLInputElement) {
		requestAnimationFrame(() => { node.focus(); node.select(); });
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
		<th class='toggle-header' colspan='3' onclick={() => show_position = !show_position}>
			↔ {show_position ? 'position' : 'size'}
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
			<td class='hierarchy-name' style:padding-left='{depth(so) * 12}px'
				onclick={(e) => handle_name_click(e, so)}>
				{#if editing_id === so.id}
					<!-- svelte-ignore element_invalid_self_closing_tag -->
					<input
						class     = 'name-input'
						type      = 'text'
						value     = {so.name}
						onblur    = {(e) => commit_name(so, (e.target as HTMLInputElement).value)}
						onkeydown = {(e) => name_keydown(e, so)}
						use:autofocus
					/>
				{:else}
					{so.name}{#if n_rpt > 0}<span class='repeat-badge'>×{n_rpt}</span>{/if}
				{/if}
			</td>
			<td class='hierarchy-data'>{values[0]}</td>
			<td class='hierarchy-data'>{values[1]}</td>
			<td class='hierarchy-data'>{values[2]}</td>
		</tr>
	{/each}
</tbody></table>

<div class='separator'></div>
<D_Selected_Part />

<style>
	.separator {
		background     : var(--accent);
		margin         : 0 -8px;
		display        : flex;
		flex-direction : column;
		gap            : 2px;
	}

	.separator::before,
	.separator::after {
		content       : '';
		display       : block;
		background    : var(--bg);
	}

	.separator::before {
		height        : 8px;
		border-radius : 0 0 8px 8px;
	}

	.separator::after {
		height        : 8px;
		border-radius : 8px 8px 0 0;
	}

	.hierarchy {
		width           : 100%;
		border-collapse : separate;
		border-spacing  : 0;
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

	.name-input {
		width       : 100%;
		border      : none;
		background  : white;
		color       : inherit;
		font-size   : inherit;
		font-family : inherit;
		font-weight : inherit;
		padding     : 0;
		margin      : 0;
		outline     : 1.5px solid cornflowerblue;
		box-sizing  : border-box;
	}

	.repeat-badge {
		margin-left : 4px;
		opacity     : 0.5;
		font-size   : 8px;
	}

	.toggle-header {
		cursor        : pointer;
		text-align    : center;
		font-size     : 9px;
		border        : 0.25px solid currentColor;
		border-radius : 3px;
	}

	.toggle-header:hover {
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
