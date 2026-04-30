<script lang='ts'>
	import { stores, parts, selection, scenes, history } from '../../ts/managers';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { T_Hit_3D, T_Editing } from '../../ts/types/Enumerations';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import type { O_Scene } from '../../ts/types/Interfaces';
	import { hit_target } from '../../ts/events/Hit_Target';
	import Separator from '../mouse/Separator.svelte';
	import { k } from '../../ts/common/Constants';
	import P_Selected from './P_Selected.svelte';
	import { errors, constraints } from '../../ts/algebra';
	import { engine } from '../../ts/render';

	const { w_all_sos, w_tick } = stores;
	const { w_collapsed_ids } = parts;
	const { w_selection, w_selections } = selection;

	let parts_count = $derived($w_all_sos.filter(s => !$w_all_sos.some(c => c.scene?.parent?.so === s)).length);
	let show_parts = $state(preferences.read<boolean>(T_Preference.showParts) ?? true);
	let selected_so = $derived($w_selection?.so ?? null);
	let naming_input: HTMLInputElement | null = null;
	let naming_error: string | null = $state(null);
	let editing_id: string | null = $state(null);
	let editing_original: string = '';

	// Row position: "N of M" where N is the selected row's position in the
	// visible parts list and M is the total number of visible rows.
	// Suppressed when the selection is root, or when the selection is not in
	// the visible list.
	let sibling_position = $derived.by(() => {
		$w_tick;
		const sel = $w_selection;
		if (!sel) return null;
		if (!sel.so.scene?.parent) return null;
		const visible = parts.tree_order($w_all_sos).filter(s => !is_clone(s, $w_all_sos, $w_tick) && !parts.is_ancestor_collapsed(s, $w_collapsed_ids));
		const index = visible.indexOf(sel.so);
		if (index < 0) return null;
		return { index, total: visible.length };
	});

	function toggle_show_parts() { show_parts = !show_parts; preferences.write(T_Preference.showParts, show_parts); }

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

	$effect(() => {
		const so = selected_so;
		if (so && parts.is_ancestor_collapsed(so, $w_collapsed_ids)) parts.reveal_so(so);
	});

	function handle_name_click(e: MouseEvent, so: Smart_Object) {
		naming_error = null;
		if (is_selected(so, 0)) {
			e.stopPropagation();
			editing_id = so.id;
			editing_original = so.name;
		}
	}

	function commit_name(so: Smart_Object, value: string, input?: HTMLInputElement) {
		if (naming_error) return;
		const trimmed = value.trim();
		if (trimmed.length > 0 && trimmed !== editing_original) {
			const err = errors.validate_name(trimmed, so.id);
			if (err) {
				naming_error = err;
				naming_input = input ?? null;
				return;
			}
			history.snapshot();
			const old_name = so.name;
			so.name = trimmed.replace(/_/g, ' ');
			if (so.name !== old_name) constraints.rename_so_in_formulas(old_name, so.name);
			scenes.save();
			stores.w_all_sos.update(sos => sos);
		}
		naming_error = null;
		editing_id = null;
	}

	function dismiss_naming(_so: Smart_Object) {
		naming_error = null;
		if (naming_input) { naming_input.value = ''; naming_input = null; }
	}

	function cancel_name(so: Smart_Object) {
		so.name = editing_original;
		editing_id = null;
	}

	function name_keydown(e: KeyboardEvent, so: Smart_Object) {
		if (naming_error && (e.key === 'Enter' || e.key === 'Delete' || e.key === 'Backspace')) {
			const inp = e.target as HTMLInputElement;
			naming_error = null;
			naming_input = null;
			if (e.key === 'Enter') {
				e.preventDefault();
				const pos = inp.selectionStart ?? 0;
				inp.value = inp.value.slice(0, pos) + inp.value.slice(inp.selectionEnd ?? inp.value.length);
				inp.setSelectionRange(pos, pos);
			}
		} else if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') { cancel_name(so); }
		e.stopPropagation();
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

	function is_clone(so: Smart_Object, sos: Smart_Object[], _tick: number): boolean {
		const parent = so.scene?.parent?.so;
		if (!parent?.repeater) return false;
		const siblings = sos.filter(s => s.scene?.parent?.so === parent);
		return siblings[0] !== so;
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

	// ── drag-and-drop reparenting ──

	let drag_so:        Smart_Object | null = $state(null);
	let drop_target_so: Smart_Object | null = $state(null);
	let drop_mode:      'child' | 'before' | 'after' | null = $state(null);

	let visible_rows = $derived(parts.tree_order($w_all_sos).filter(s => !is_clone(s, $w_all_sos, $w_tick) && !parts.is_ancestor_collapsed(s, $w_collapsed_ids)));

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
	<thead>
		<tr>
			<th class='toggle-header' class:gap-r={show_parts} colspan={show_parts ? 2 : 7} use:hit_target={{ id: 'toggle-parts', onpress: toggle_show_parts }}>
				{show_parts ? 'hide' : 'show'} {parts_count} parts
			</th>
			{#if show_parts}
				<th class='hierarchy-eye static'>⋮</th>
				<th class='hierarchy-eye static'>👁</th>
			{/if}
		</tr>
	</thead>
	{#if show_parts}
		<tbody>
			<tr style:height='4px'></tr>
			{#each parts.tree_order($w_all_sos).filter(s => !is_clone(s, $w_all_sos, $w_tick) && !parts.is_ancestor_collapsed(s, $w_collapsed_ids)) as so, row_index (so.id)}
				{@const n_rpt = repeat_count(so, $w_all_sos, $w_tick)}
				<tr
					class='hierarchy-row'
					class:selected={is_selected(so, $w_tick)}
					class:drop-active={row_is_drop_active(so)}
					class:drop-line-top={row_has_top_line(so)}
					class:drop-line-bottom={row_has_bottom_line(so)}
					draggable={true}
					ondragstart={(e) => handle_dragstart(e, so)}
					ondragover={(e) => handle_row_dragover(e, so)}
					ondragend={handle_dragend}
					ondrop={handle_row_drop}
					onclick={(e) => select(so, e)}>
					<td class='hierarchy-sibling'>{so.scene?.parent ? row_index : ''}</td>
					<td class='hierarchy-name' style:padding-left='{depth(so) * k.width.indent}px'
						onclick={(e) => handle_name_click(e, so)}>
						{#if editing_id === so.id}
							<input
								type               = 'text'
								value              = {so.name}
								class              = 'name-input'
								onkeydown          = {(e) => name_keydown(e, so)}
								onfocus            = {() => stores.w_editing.set(T_Editing.value)}
								onblur             = {(e) => { const inp = e.target as HTMLInputElement; commit_name(so, inp.value, inp); if (!naming_error) stores.w_editing.set(T_Editing.none); }}
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
					<td class='hierarchy-eye' onclick={(e) => has_children(so, $w_all_sos) && so.scene?.parent ? toggle_hide_children(e, so) : null}>
						{#if has_children(so, $w_all_sos) && so.scene?.parent}
							{so.hide_children ? leaf_descendants(so, $w_all_sos) : '👁'}
						{/if}
					</td>
					<td class='hierarchy-eye' onclick={(e) => toggle_visible(e, so)}>
						{so.visible !== false ? '👁' : '–'}
					</td>
				</tr>
			{/each}
		</tbody>
	{/if}
</table>
{#if naming_error}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class='naming-backdrop' onmousedown={(e) => { e.preventDefault(); if (selected_so) dismiss_naming(selected_so); }}></div>
	<div class='naming-overlay'>
		<div class='naming-message'>{@html naming_error.replace(/'([^']+)'/g, "&#39;<span class='naming-quoted'>$1</span>&#39;")}</div>
		<div class='naming-suggestions'>
			<button class='naming-suggestion' onmousedown={(e) => { e.preventDefault(); if (selected_so) dismiss_naming(selected_so); }}>delete it</button>
		</div>
	</div>
{/if}
{#if $w_selection}
	{#if !show_parts}
		<div class='edit-title-row'>
			{#if sibling_position}
				<span class='sibling-position'>{sibling_position.index} of {sibling_position.total}</span>
			{/if}
			<input
				type      = 'text'
				class     = 'collapsed-name'
				value     = {$w_selection.so.name}
				onkeydown = {(e) => name_keydown(e, $w_selection!.so)}
				onblur    = {(e) => { const inp = e.target as HTMLInputElement; commit_name($w_selection!.so, inp.value, inp); }}
			/>
		</div>
	{/if}
	{#if $w_selection.so.scene?.parent}
		<div class='duplicate-row'>
			<button class='action-button' use:hit_target={{ id: 'duplicate', onpress: () => engine.duplicate_so() }}>duplicate</button>
		</div>
	{/if}
	<Separator />
	<P_Selected />
{:else}
	<div style:height='1px'></div>
{/if}

<style>

	.hierarchy {
		font-size       : var(--h-font-small);
		z-index         : var(--z-action);
		border-collapse : separate;
		position        : relative;
		width           : 100%;
		margin-top      : 1px;
		margin-bottom   : 8px;
		border-spacing  : 0;
	}

	.hierarchy-row {
		cursor : pointer;
	}

	.hierarchy-row:hover {
		background : var(--hover);
	}

	.hierarchy-row.selected {
		background : var(--selected);
	}

	.hierarchy-row.drop-active {
		background : rgba(64, 128, 255, 0.18);
	}

	.hierarchy-row.drop-line-top > td {
		border-top : 2px solid #4080ff;
	}

	.hierarchy-row.drop-line-bottom > td {
		border-bottom : 2px solid #4080ff;
	}

	.hierarchy-name {
		width       : var(--w-title);
		text-align  : left;
	}

	.hierarchy-sibling {
		color       : rgba(0, 0, 0, 0.5);
		font-size   : var(--h-font-small);
		width       : var(--w-small);
		user-select : none;
	}

	.hierarchy-eye {
		width      : var(--w-small);
		cursor     : pointer;
		text-align : center;
		opacity    : 0.85;
		padding    : 0;
	}

	.hierarchy-eye.static {
		cursor : default;
	}

	.name-input {
		outline      : var(--focus-outline);
		z-index      : var(--z-action);
		background   : var(--c-white);
		width        : var(--w-title);
		box-sizing   : border-box;
		border       : none;
		padding-left : 19px;
		margin       : 0;
	}

	.collapse-tri {
		all              : unset;
		display          : inline-block;
		height           : var(--h-font-small);
		width            : var(--h-font-small);
		line-height      : var(--h-font-small);
		cursor           : pointer;
		overflow         : visible;
		vertical-align   : middle;
		margin-right     : 1px;
		opacity          : 0.4;
	}

	.collapse-tri .tri-glyph {
		font-size        : var(--h-font-huge);
		position         : relative;
		top              : -3.5px;
		pointer-events   : none;
	}

	.collapse-tri:not(.spacer):hover {
		opacity : 1;
	}

	.collapse-tri:not(.spacer):hover .tri-glyph {
		font-size : var(--h-font-monster);
		left      : -3px;
		top       : -5px;
	}

	.collapse-tri.spacer {
		visibility : hidden;
	}

	.repeat-badge {
		font-size   : var(--h-font-small);
		margin-left : var(--l-gap);
		opacity     : 0.5;
	}

	.edit-title-row {
		align-items : center;
		display     : flex;
		gap         : 6px;
	}

	.sibling-position {
		font-size      : var(--h-font-small);
		color          : rgba(0, 0, 0, 0.5);
		white-space    : nowrap;
		user-select    : none;
		pointer-events : none;
	}

	.collapsed-name {
		border        : 0.5px solid rgba(0, 0, 0, 0.6);
		font-size     : var(--h-font-small);
		z-index       : var(--z-action);
		height        : var(--h-slider);
		background    : var(--c-white);
		margin-top    : var(--l-gap);
		margin-bottom : var(--l-gap);
		box-sizing    : border-box;
		color         : inherit;
		font-family   : inherit;
		width         : 100%;
		outline       : none;
		text-align    : left;
		border-radius : 3px;
	}

	.collapsed-name:focus {
		outline        : var(--focus-outline);
		background     : var(--c-white);
		outline-offset : -1.5px;
	}

	.toggle-header {
		box-shadow      : inset 0 0 0 0.25px currentColor;
		line-height     : calc(var(--h-collapse) - 1px);
		font-size       : var(--h-font-common);
		border          : 0 solid transparent;
		height          : var(--h-collapse);
		background      : var(--c-white);
		cursor          : pointer;
		text-align      : center;
		font-weight     : normal;
		vertical-align  : middle;
		border-radius   : 8px;
	}

	.toggle-header.gap-r { border-right-width : 3px; }

	.toggle-header:hover {
		background : var(--hover);
	}

	.duplicate-row {
		justify-content : center;
		display         : flex;
		margin-bottom   : 7px;
	}

	.action-button {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-tiny);
		border-radius : var(--corner-common);
		font-size     : var(--h-font-common);
		z-index       : var(--z-action);
		background    : var(--c-white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		padding       : 0 8px;
	}

	.action-button:hover {
		background : var(--hover);
	}

	.naming-backdrop {
		position : fixed;
		inset    : 0;
		z-index  : 999;
	}

	.naming-overlay {
		font-size     : var(--h-font-small);
		border        : 2px solid darkred;
		background    : var(--c-white);
		box-sizing    : border-box;
		position      : relative;
		padding       : 6px 8px;
		text-align    : center;
		width         : 100%;
		z-index       : 1000;
		margin-top    : 8px;
		margin-bottom : 8px;
		border-radius : 8px;
	}

	.naming-message :global(.naming-quoted) {
		color : darkred;
	}

	.naming-suggestions {
		justify-content : center;
		display         : flex;
		margin-top      : 8px;
	}

	.naming-suggestion {
		border        : var(--th-border) solid currentColor;
		font-size     : var(--h-font-small);
		cursor        : pointer;
		color         : inherit;
		padding       : 2px 5px;
		background    : white;
		border-radius : 5px;
		line-height   : 1;
	}

	.naming-suggestion:hover {
		outline    : 2px solid var(--accent);
		background : var(--selected);
	}

</style>
