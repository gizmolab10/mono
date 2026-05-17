<script lang='ts'>
	import { stores, parts, selection, scenes, confirm } from '../../ts/managers';
	import { T_Hit_3D, T_Editing } from '../../ts/types/Enumerations';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import type { O_Scene } from '../../ts/types/Interfaces';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits_3d } from '../../ts/events/Hits_3D';
	import { k } from '../../ts/common/Constants';
	import { engine } from '../../ts/render';
	import { get } from 'svelte/store';

	const { w_selection, w_selections } = selection;
	const { w_all_sos, w_tick } = stores;
	const { w_collapsed_ids, w_naming_error, w_editing_id } = parts;
	const { w_hover } = hits_3d;

	let selected_so = $derived($w_selection?.so ?? null);

	function handle_triangle_click(e: MouseEvent, so: Smart_Object) {
		e.stopPropagation();
		parts.apply_generational(so, e.altKey, e.shiftKey);
	}

	function select(so: Smart_Object, e?: MouseEvent): void {
		const hit = { so, type: T_Hit_3D.face, index: 0 };
		if (e?.metaKey) {
			selection.toggle(hit);
		} else {
			selection.current = hit;
		}
	}

	function is_selected(so: Smart_Object, _tick: number): boolean {
		return $w_selections.some(h => h.so === so);
	}

	// Reveal the selected part's collapsed ancestors only when the selection
	// itself moves — not when the collapsed list changes. Reading the
	// collapsed list through a non-subscribing get keeps this effect from
	// fighting a user click that just collapsed a row.
	$effect(() => {
		const so = selected_so;
		if (so && parts.is_ancestor_collapsed(so, get(parts.w_collapsed_ids))) parts.reveal_so(so);
	});

	function handle_name_click(e: MouseEvent, so: Smart_Object) {
		if (is_selected(so, 0)) {
			e.stopPropagation();
			parts.begin_rename(so);
		}
	}

	function autofocus(node: HTMLInputElement) {
		requestAnimationFrame(() => { node.focus(); node.select(); });
	}

	function repeat_count(so: Smart_Object, sos: Smart_Object[], _tick: number): number {
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater) return 0;
		const siblings = sos.filter(s => s.scene?.parent?.so === parent);
		if (siblings[0] !== so) return 0; // only first child shows count
		return siblings.length;
	}

	function has_children(so: Smart_Object, sos: Smart_Object[]): boolean {
		return sos.some(s => s.scene?.parent?.so === so);
	}

	function leaf_descendants(so: Smart_Object, sos: Smart_Object[]): number {
		let count = 0;
		for (const s of sos) {
			let cur = s.scene?.parent;
			let is_desc = false;
			while (cur) {
				if (cur.so === so) { is_desc = true; break; }
				cur = cur.parent;
			}
			if (!is_desc) continue;
			if (!sos.some(c => c.scene?.parent?.so === s)) count++;
		}
		return count;
	}

	function show_down_triangle(so: Smart_Object, _collapsed: Set<string>, _sos: Smart_Object[], _tick: number): boolean {
		return parts.has_visible_descendant(so);
	}

	function delete_so(so: Smart_Object): void {
		if (!so.scene?.parent) return;
		confirm.ask(`Delete "${so.name}"?`, () => {
			selection.current = { so, type: T_Hit_3D.face, index: 0 };
			engine.delete_selected_so();
		});
	}

	// ── drag-and-drop reparenting ──

	let drag_so:        Smart_Object | null = $state(null);
	let drop_target_so: Smart_Object | null = $state(null);
	let drop_mode:      'child' | 'before' | 'after' | null = $state(null);

	let visible_rows = $derived(parts.tree_order($w_all_sos).filter(s => !parts.is_clone(s, $w_all_sos, $w_tick) && !parts.is_ancestor_collapsed(s, $w_collapsed_ids)));

	function siblings_in_tree(a: Smart_Object | undefined, b: Smart_Object | undefined): boolean {
		if (!a || !b) return false;
		return a.scene?.parent?.so === b.scene?.parent?.so;
	}

	function valid_drop(a: Smart_Object, target: Smart_Object, mode: 'child' | 'before' | 'after'): boolean {
		if (a === target && mode === 'child') return false;
		let new_parent: Smart_Object;
		if (mode === 'child') {
			new_parent = target;
		} else {
			if (!target.scene?.parent) return false;
			new_parent = target.scene.parent.so;
		}
		// No cycle: a must not be an ancestor of new_parent (or equal to it).
		let cur = new_parent.scene as O_Scene | undefined;
		while (cur) {
			if (cur.so === a) return false;
			cur = cur.parent;
		}
		// No drops onto a part that is set up as a repeater.
		if (new_parent.repeater) return false;
		return true;
	}

	function handle_dragstart(e: DragEvent, so: Smart_Object) {
		// Root cannot be moved.
		if (!so.scene?.parent) { e.preventDefault(); return; }
		drag_so = so;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', so.id);
		}
	}

	function handle_dragend() {
		drag_so = null;
		drop_target_so = null;
		drop_mode = null;
	}

	function handle_row_dragover(e: DragEvent, so: Smart_Object) {
		if (!drag_so) return;
		const row = e.currentTarget as HTMLElement;
		const rect = row.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const edge = 5;

		const idx = visible_rows.indexOf(so);
		let target: Smart_Object | null = null;
		let mode: 'child' | 'before' | 'after' | null = null;

		if (y < edge && idx > 0) {
			const above = visible_rows[idx - 1];
			if (siblings_in_tree(above, so)) {
				target = so;
				mode = 'before';
			} else {
				// Non-siblings: highlight the upper of the two; drop becomes child of upper.
				target = above;
				mode = 'child';
			}
		} else if (y > rect.height - edge && idx < visible_rows.length - 1) {
			const below = visible_rows[idx + 1];
			if (siblings_in_tree(so, below)) {
				target = so;
				mode = 'after';
			} else {
				// Non-siblings: highlight the upper (so); drop becomes child of so.
				target = so;
				mode = 'child';
			}
		} else {
			target = so;
			mode = 'child';
		}

		if (target && mode && valid_drop(drag_so, target, mode)) {
			drop_target_so = target;
			drop_mode = mode;
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		} else {
			drop_target_so = null;
			drop_mode = null;
			if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
		}
		e.stopPropagation();
	}

	function handle_row_drop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (drag_so && drop_target_so && drop_mode) {
			engine.reparent_so(drag_so, drop_target_so, drop_mode);
		}
		handle_dragend();
	}

	function handle_outside_dragover(e: DragEvent) {
		if (!drag_so) return;
		// Empty area below all rows: drop becomes child of root, last in order.
		const root = scenes.root_so;
		if (root && valid_drop(drag_so, root, 'child')) {
			drop_target_so = root;
			drop_mode = 'child';
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		}
	}

	function handle_outside_drop(e: DragEvent) {
		e.preventDefault();
		if (drag_so && drop_target_so && drop_mode) {
			engine.reparent_so(drag_so, drop_target_so, drop_mode);
		}
		handle_dragend();
	}

	function row_is_drop_active(so: Smart_Object): boolean {
		if (!drop_target_so) return false;
		if (so === drop_target_so) return true;
		// The other half of a sibling-between drop.
		const t_idx = visible_rows.indexOf(drop_target_so);
		if (t_idx < 0) return false;
		if (drop_mode === 'before' && so === visible_rows[t_idx - 1]) return true;
		if (drop_mode === 'after'  && so === visible_rows[t_idx + 1]) return true;
		return false;
	}

	function row_has_top_line(so: Smart_Object): boolean {
		return so === drop_target_so && drop_mode === 'before';
	}

	function row_has_bottom_line(so: Smart_Object): boolean {
		return so === drop_target_so && (drop_mode === 'child' || drop_mode === 'after');
	}

	function toggle_visible(e: MouseEvent, so: Smart_Object) {
		e.stopPropagation();
		const v = !so.visible;
		so.visible = v;
		// repeater group: sync visibility across template + clones
		const parent = so.scene?.parent?.so;
		if (parent?.repeater) {
			for (const s of $w_all_sos) {
				if (s.scene?.parent?.so === parent) s.visible = v;
			}
		}
		// Parent rows: keep the two eyeballs opposite so only one shows an eye at a time.
		if (has_children(so, $w_all_sos)) so.hide_children = v;
		stores.tick();
		scenes.save();
	}

	function toggle_hide_children(e: MouseEvent, so: Smart_Object) {
		e.stopPropagation();
		so.hide_children = !so.hide_children;
		stores.tick();
		scenes.save();
	}

	function depth(so: Smart_Object): number {
		let d = 0;
		let scene = so.scene;
		while (scene?.parent) { d++; scene = scene.parent; }
		return d;
	}

</script>

<table class='hierarchy' ondragover={handle_outside_dragover} ondrop={handle_outside_drop}>
	<tbody>
		<tr style:height='4px'></tr>
		{#each parts.tree_order($w_all_sos).filter(s => !parts.is_clone(s, $w_all_sos, $w_tick) && !parts.is_ancestor_collapsed(s, $w_collapsed_ids)) as so (so.id)}
			{@const n_rpt = repeat_count(so, $w_all_sos, $w_tick)}
			<tr
				class='hierarchy-row'
				class:selected={is_selected(so, $w_tick)}
				class:graph-hovered={$w_hover?.so === so}
				class:drop-active={row_is_drop_active(so)}
				class:drop-line-top={row_has_top_line(so)}
				class:drop-line-bottom={row_has_bottom_line(so)}
				draggable={true}
				ondragstart={(e) => handle_dragstart(e, so)}
				ondragover={(e) => handle_row_dragover(e, so)}
				ondragend={handle_dragend}
				ondrop={handle_row_drop}
				onclick={(e) => select(so, e)}>
				<td class='hierarchy-name' style:padding-left='{depth(so) * k.width.indent}px'
					onclick={(e) => handle_name_click(e, so)}>
					{#if $w_editing_id === so.id}
						<input
							type               = 'text'
							value              = {so.name}
							class              = 'name-input'
							onkeydown          = {(e) => parts.name_keydown(e, so)}
							oninput            = {(e) => parts.live_rename(so, (e.target as HTMLInputElement).value)}
							onfocus            = {() => stores.w_editing.set(T_Editing.value)}
							onblur             = {(e) => { const inp = e.target as HTMLInputElement; parts.commit_name(so, inp.value, inp); if (!$w_naming_error) stores.w_editing.set(T_Editing.none); }}
							use:autofocus
						/>
					{:else}
						{#if has_children(so, $w_all_sos)}
							<button class='collapse-tri' onclick={(e) => handle_triangle_click(e, so)}>
								<span class='tri-glyph'>{show_down_triangle(so, $w_collapsed_ids, $w_all_sos, $w_tick) ? '▾' : '▸'}</span>
							</button>
						{:else}
							<button class='collapse-tri spacer'>
								▸
							</button>
						{/if}
						{so.name}
						{#if n_rpt > 0}
							<span class='repeat-badge'>
								×{n_rpt}
							</span>
						{/if}
					{/if}
				</td>
				<td class='hierarchy-eye'
					class:has-content={has_children(so, $w_all_sos) && so.scene?.parent}
					onclick={(e) => has_children(so, $w_all_sos) && so.scene?.parent ? toggle_hide_children(e, so) : null}>
					{#if has_children(so, $w_all_sos) && so.scene?.parent}
						<span class='cell-glyph'>{so.hide_children ? leaf_descendants(so, $w_all_sos) : '👁︎'}</span>
					{/if}
				</td>
				<td class='hierarchy-eye has-content' onclick={(e) => toggle_visible(e, so)}>
					<span class='cell-glyph'>{so.visible !== false ? '👁︎' : '–'}</span>
				</td>
				<td class='hierarchy-remove'
					class:has-content={!!so.scene?.parent}
					onclick={(e) => e.stopPropagation()}>
					{#if so.scene?.parent}
						<button class='remove-button' use:hit_target={{ id: `remove-so-${so.id}`, onpress: () => delete_so(so) }}>🗑︎</button>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
<style>

	.hierarchy {
		font-size       : var(--font-small);
		z-index         : var(--z-action);
		border-collapse : separate;
		position        : relative;
		margin-top      : -10px;
		margin-bottom   : -7px;
		width           : 100%;
		border-spacing  : 0;
	}

	.hierarchy-row {
		cursor : pointer;
		height : var(--h-cell);
	}

	.hierarchy-row:hover:not(:has(.hierarchy-eye.has-content:hover, .hierarchy-remove.has-content:hover)) > td {
		background : var(--hover);
	}

	.hierarchy-row:hover:not(:has(.hierarchy-eye.has-content:hover, .hierarchy-remove.has-content:hover)) > td:first-child {
		border-top-left-radius    : var(--r-common);
		border-bottom-left-radius : var(--r-common);
	}

	.hierarchy-row:hover:not(:has(.hierarchy-eye.has-content:hover, .hierarchy-remove.has-content:hover)) > td:last-child {
		border-top-right-radius    : var(--r-common);
		border-bottom-right-radius : var(--r-common);
	}

	.hierarchy-row.graph-hovered > td {
		background : var(--hover);
	}

	.hierarchy-row.graph-hovered > td:first-child {
		border-top-left-radius    : var(--r-common);
		border-bottom-left-radius : var(--r-common);
	}

	.hierarchy-row.graph-hovered > td:last-child {
		border-top-right-radius    : var(--r-common);
		border-bottom-right-radius : var(--r-common);
	}

	.hierarchy-eye.has-content:hover,
	.hierarchy-remove.has-content:hover {
		background : var(--hover);
	}

	.hierarchy-remove.has-content:hover .remove-button {
		filter : brightness(0) invert(1);
	}

	.cell-glyph {
		display         : flex;
		align-items     : center;
		justify-content : center;
		height          : var(--h-cell);
	}

	.hierarchy-row.selected > td {
		background : var(--selected);
	}

	.hierarchy-row.selected > td:first-child {
		border-top-left-radius    : var(--r-common);
		border-bottom-left-radius : var(--r-common);
	}

	.hierarchy-row.selected > td:last-child {
		border-top-right-radius    : var(--r-common);
		border-bottom-right-radius : var(--r-common);
	}

	.hierarchy-row.drop-active {
		background : rgba(64, 128, 255, 0.18);
	}

	.hierarchy-row.drop-line-top > td {
		border-top : 1px solid #4080ff;
	}

	.hierarchy-row.drop-line-bottom > td {
		border-bottom : 1px solid #4080ff;
	}

	.hierarchy-name {
		width       : var(--w-title);
		text-align  : left;
		padding     : 0;
	}

	.hierarchy-eye {
		width              : var(--w-small);
		cursor             : pointer;
		vertical-align     : middle;
		text-align         : center;
		font-variant-emoji : text;
		opacity            : 0.85;
		padding            : 0;
	}

	.hierarchy-remove {
		width              : var(--w-small);
		vertical-align     : middle;
		text-align         : center;
		font-variant-emoji : text;
		padding            : 0;
	}

	.remove-button {
		font-size       : var(--font-tiny);
		background      : transparent;
		color           : inherit;
		cursor          : pointer;
		display         : flex;
		align-items     : center;
		justify-content : center;
		height          : 100%;
		width           : 100%;
		border          : none;
		opacity         : 0.5;
		line-height     : 1;
		padding         : 0;
	}

	.remove-button:hover {
		opacity : 1;
	}

	.name-input {
		outline        : var(--focus-outline);
		z-index        : var(--z-action);
		background     : var(--white);
		width          : var(--w-title);
		height         : var(--h-cell);
		line-height    : var(--h-cell);
		box-sizing     : border-box;
		outline-offset : -1.5px;
		display        : block;
		border         : none;
		padding-left   : 19px;
		appearance     : none;
		margin         : 0;
	}

	.collapse-tri {
		all              : unset;
		display          : inline-block;
		height           : var(--font-small);
		width            : var(--font-small);
		line-height      : var(--font-small);
		cursor           : pointer;
		overflow         : visible;
		vertical-align   : middle;
		margin-right     : 1px;
		opacity          : 0.4;
	}

	.collapse-tri .tri-glyph {
		font-size        : var(--font-huge);
		position         : relative;
		top              : -3.5px;
		pointer-events   : none;
	}

	.collapse-tri:not(.spacer):hover {
		opacity : 1;
	}

	.collapse-tri:not(.spacer):hover .tri-glyph {
		font-size : var(--font-monster);
		left      : -3px;
		top       : -5px;
	}

	.collapse-tri.spacer {
		visibility : hidden;
	}

	.repeat-badge {
		margin-left : var(--l-gap-tiny);
		font-size   : var(--font-small);
		opacity     : 0.6;
	}

</style>
