<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { stores, scenes, history } from '../../ts/managers';
	import { hits_3d } from '../../ts/events';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Hit_3D, T_Editing } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import Separator from '../mouse/Separator.svelte';
	import P_Selected from './P_Selected.svelte';
	import { units } from '../../ts/types/Units';
	import { errors } from '../../ts/algebra';
	import { engine } from '../../ts/render';

	const { w_all_sos, w_selection, w_tick, w_precision, w_collapsed_ids } = stores;

	let show_position = $state(preferences.read<boolean>(T_Preference.showPosition) ?? true);
	let show_parts = $state(preferences.read<boolean>(T_Preference.showParts) ?? true);
	let selected_so = $derived($w_selection?.so ?? null);

	function toggle_show_parts() { show_parts = !show_parts; preferences.write(T_Preference.showParts, show_parts); }
	let editing_id: string | null = $state(null);
	let editing_original: string = '';
	let naming_error: string | null = $state(null);
	let naming_input: HTMLInputElement | null = null;

	function toggle_collapse(e: MouseEvent, so: Smart_Object) {
		e.stopPropagation();
		const ids = $w_collapsed_ids;
		if (ids.has(so.id)) { ids.delete(so.id); }
		else {
			ids.add(so.id);
			const sel = selected_so;
			if (sel && is_ancestor_collapsed(sel, ids)) select(so);
		}
		w_collapsed_ids.set(new Set(ids));
	}

	function is_ancestor_collapsed(so: Smart_Object, ids: Set<string>): boolean {
		let scene = so.scene?.parent;
		while (scene) {
			if (ids.has(scene.so.id)) return true;
			scene = scene.parent;
		}
		return false;
	}

	$effect(() => {
		const so = selected_so;
		if (so && is_ancestor_collapsed(so, $w_collapsed_ids)) stores.reveal_so(so);
	});

	function select(so: Smart_Object): void {
		hits_3d.set_selection({ so, type: T_Hit_3D.face, index: 0 });
	}

	function is_selected(so: Smart_Object, _tick: number): boolean {
		return selected_so === so;
	}

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
			so.name = trimmed;
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

	type Fmt_V = { whole: string; plus: boolean };

	function fmt(mm: number): Fmt_V {
		const full = units.format_for_system(mm, $w_unit_system, $w_precision, false);
		if (full.includes('/')) {
			const space = full.lastIndexOf(' ');
			return space === -1
				? { whole: '0', plus: true }
				: { whole: full.slice(0, space), plus: true };
		}
		const dot = full.indexOf('.');
		if (dot === -1) return { whole: full, plus: false };
		if (/^0+$/.test(full.slice(dot + 1))) return { whole: full.slice(0, dot), plus: false };
		return { whole: full.slice(0, dot), plus: true };
	}

	function position(so: Smart_Object, _tick: number): [Fmt_V, Fmt_V, Fmt_V] {
		return [fmt(so.x_min), fmt(so.y_min), fmt(so.z_min)];
	}

	function size(so: Smart_Object, _tick: number): [Fmt_V, Fmt_V, Fmt_V] {
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

	function has_children(so: Smart_Object, sos: Smart_Object[]): boolean {
		return sos.some(s => s.scene?.parent?.so === so);
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

<table class='hierarchy'>
	<thead>
		<tr>
			<th class='toggle-header' class:gap-r={show_parts} colspan={show_parts ? 1 : 5} use:hit_target={{ id: 'toggle-parts', onpress: toggle_show_parts }}>
				{show_parts ? 'hide parts' : 'show parts'}
			</th>
			{#if show_parts}
				<th class='hierarchy-eye static'>👁</th>
				<th class='toggle-header gap-l' colspan='3' use:hit_target={{ id: 'toggle-position', onpress: () => { show_position = !show_position; preferences.write(T_Preference.showPosition, show_position); } }}>
					{show_position ? 'position' : 'size'} ⟳
				</th>
			{/if}
		</tr>
	</thead>
	{#if show_parts}
		<tbody>
			<tr style:height='4px'></tr>
			{#each stores.tree_order($w_all_sos).filter(s => !is_clone(s, $w_all_sos, $w_tick) && !is_ancestor_collapsed(s, $w_collapsed_ids)) as so (so.id)}
				{@const n_rpt = repeat_count(so, $w_all_sos, $w_tick)}
				{@const values = show_position ? position(so, $w_tick) : size(so, $w_tick)}
				<tr
					class='hierarchy-row'
					class:selected={is_selected(so, $w_tick)}
					onclick={() => select(so)}>
					<td class='hierarchy-name' style:padding-left='{depth(so) * 8}px'
						onclick={(e) => handle_name_click(e, so)}>
						{#if editing_id === so.id}
							<input
								type      = 'text'
								value     = {so.name}
								class     = 'name-input'
								onkeydown = {(e) => name_keydown(e, so)}
								onfocus   = {() => stores.w_editing.set(T_Editing.value)}
								onblur    = {(e) => { const inp = e.target as HTMLInputElement; commit_name(so, inp.value, inp); if (!naming_error) stores.w_editing.set(T_Editing.none); }}
								use:autofocus
							/>
						{:else}
							{#if has_children(so, $w_all_sos)}
								<button class='collapse-tri' onclick={(e) => toggle_collapse(e, so)}>
									{$w_collapsed_ids.has(so.id) ? '▸' : '▾'}
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
					<td class='hierarchy-eye' onclick={(e) => toggle_visible(e, so)}>
						{so.visible !== false ? '👁' : '–'}
					</td>
					<td class='hierarchy-data'>{values[0].whole}<span class='faint' class:hidden={!values[0].plus}>+</span></td>
					<td class='hierarchy-data'>{values[1].whole}<span class='faint' class:hidden={!values[1].plus}>+</span></td>
					<td class='hierarchy-data'>{values[2].whole}<span class='faint' class:hidden={!values[2].plus}>+</span></td>
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
		<input
			type      = 'text'
			class     = 'collapsed-name'
			value     = {$w_selection.so.name}
			onkeydown = {(e) => name_keydown(e, $w_selection!.so)}
			onblur    = {(e) => { const inp = e.target as HTMLInputElement; commit_name($w_selection!.so, inp.value, inp); }}
		/>
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
		border-spacing  : 0;
	}

	.hierarchy-row {
		cursor : pointer;
	}

	.hierarchy-row:hover {
		background : var(--hover);
	}

	.hierarchy-row.selected {
		background  : var(--selected);
		font-weight : 600;
	}

	.hierarchy-name {
		padding    : 2px 0;
		text-align : left;
	}

	.hierarchy-eye {
		font-size  : var(--h-font-common);
		cursor     : pointer;
		text-align : center;
		width      : 1em;
		opacity    : 0.4;
		padding    : 0;
	}

	.hierarchy-eye:not(.static):hover {
		opacity : 1;
	}

	.hierarchy-eye.static {
		cursor  : default;
		opacity : 1;
	}

	.name-input {
		outline     : var(--focus-outline);
		z-index     : var(--z-action);
		background  : var(--c-white);
		box-sizing  : border-box;
		font-family : inherit;
		font-weight : inherit;
		font-size   : inherit;
		color       : inherit;
		width       : 100%;
		border      : none;
		padding     : 4;
		margin      : 0;
	}

	.collapse-tri {
		all              : unset;
		font-size        : var(--h-font-common);
		position         : relative;
		cursor           : pointer;
		vertical-align   : middle;
		top              : -2px;
		margin-right     : 1px;
		opacity          : 0.4;
		line-height      : 0;
	}

	.collapse-tri:not(.spacer):hover {
		opacity : 1;
	}

	.collapse-tri.spacer {
		visibility : hidden;
	}

	.repeat-badge {
		font-size   : var(--h-font-small);
		margin-left : var(--l-gap);
		opacity     : 0.5;
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
		padding       : 0 6px;
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
	.toggle-header.gap-l { border-left-width  : 3px; }

	.toggle-header:hover {
		background : var(--hover);
	}

	.hierarchy-data {
		color                : var(--c-black);
		padding              : 2px 0 2px 6px;
		font-variant-numeric : tabular-nums;
		white-space          : nowrap;
		text-align           : right;
	}

	.faint {
		opacity : 0.3;
	}

	.faint.hidden {
		visibility : hidden;
	}

	.duplicate-row {
		justify-content : center;
		display         : flex;
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
		position      : relative;
		z-index       : 1000;
		border        : 2px solid darkred;
		border-radius : 8px;
		background    : var(--c-white);
		padding       : 6px 8px;
		font-size     : var(--h-font-small);
		margin-top    : 8px;
		margin-bottom : 8px;
		box-sizing    : border-box;
		width         : 100%;
		text-align    : center;
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
		background    : white;
		padding       : 2px 5px;
		border-radius : 5px;
		font-size     : var(--h-font-small);
		border        : var(--th-border) solid currentColor;
		cursor        : pointer;
		color         : inherit;
		line-height   : 1;
	}

	.naming-suggestion:hover {
		background : var(--selected);
		outline    : 2px solid var(--accent);
	}

</style>
