<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { scenes, stores, history } from '../../ts/managers';
	import type { Bound } from '../../ts/types/Types';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { givens } from '../../ts/algebra/Givens';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { constraints, tokenizer, errors, type S_Error } from '../../ts/algebra';
	import Separator from '../mouse/Separator.svelte';
	import P_Givens from './P_Givens.svelte';
	import { units } from '../../ts/types/Units';

	const { w_selection, w_precision, w_tick } = stores;

	type BoundsRow = { label: string; bound: string | null; value: string; formula: string; has_formula: boolean; is_invariant: boolean; axis_index: number; attr_index: number };

	let selected_so = $derived($w_selection?.so ?? null);
	let is_root = $derived(!selected_so?.scene?.parent);
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
		const fml = (bound: string | null) => {
			if (bound) {
				const stored = so.attributes_dict_byName[bound]?.formula_display;
				if (stored) return stored;
			}
			return '';
		};
		const has = (bound: string | null) => bound ? !!so.attributes_dict_byName[bound]?.compiled : false;
		return [
			{ label: 'x', bound: 'x_min' as Bound, value: val('x_min', 0, 0), formula: fml('x_min'), has_formula: has('x_min'), is_invariant: inv(0, 0), axis_index: 0, attr_index: 0 },
			{ label: 'y', bound: 'y_min' as Bound, value: val('y_min', 1, 0), formula: fml('y_min'), has_formula: has('y_min'), is_invariant: inv(1, 0), axis_index: 1, attr_index: 0 },
			{ label: 'z', bound: 'z_min' as Bound, value: val('z_min', 2, 0), formula: fml('z_min'), has_formula: has('z_min'), is_invariant: inv(2, 0), axis_index: 2, attr_index: 0 },
			{ label: 'w', bound: 'width',           value: val('width',  0, 2), formula: fml('width'), has_formula: has('width'), is_invariant: inv(0, 2), axis_index: 0, attr_index: 2 },
			{ label: 'd', bound: 'depth',           value: val('depth',  1, 2), formula: fml('depth'), has_formula: has('depth'), is_invariant: inv(1, 2), axis_index: 1, attr_index: 2 },
			{ label: 'h', bound: 'height',          value: val('height', 2, 2), formula: fml('height'), has_formula: has('height'), is_invariant: inv(2, 2), axis_index: 2, attr_index: 2 },
			{ label: 'X', bound: 'x_max' as Bound, value: val('x_max', 0, 1), formula: fml('x_max'), has_formula: has('x_max'), is_invariant: inv(0, 1), axis_index: 0, attr_index: 1 },
			{ label: 'Y', bound: 'y_max' as Bound, value: val('y_max', 1, 1), formula: fml('y_max'), has_formula: has('y_max'), is_invariant: inv(1, 1), axis_index: 1, attr_index: 1 },
			{ label: 'Z', bound: 'z_max' as Bound, value: val('z_max', 2, 1), formula: fml('z_max'), has_formula: has('z_max'), is_invariant: inv(2, 1), axis_index: 2, attr_index: 1 },
		];
	}

	let bounds_rows = $derived(selected_so ? get_bounds(selected_so, tick) : []);

	// Error overlay state
	let error_state: { saved_formula: string; active_bound: string; show_overlay: boolean; active_error: S_Error | null; source: 'formula' | 'value'; input: HTMLInputElement | null } =
		$state({ saved_formula: '', active_bound: '', show_overlay: false, active_error: null, source: 'formula', input: null });

	// Auto-show overlay when navigating back to an SO with a stored error
	$effect(() => {
		if (!selected_so) return;
		void tick;
		for (const row of bounds_rows) {
			const err = row.bound ? errors.get(selected_so.id, row.bound) : null;
			if (err) {
				error_state.active_bound = row.bound!;
				error_state.active_error = err;
				error_state.show_overlay = true;
				error_state.source = err.message.includes('Negative') ? 'value' : 'formula';
				error_state.input = null;
				return;
			}
		}
	});

	/** Index in bounds_rows of the error row, or -1 if no overlay. */
	let error_row_idx = $derived(
		error_state.show_overlay && error_state.active_bound
			? bounds_rows.findIndex(r => r.bound === error_state.active_bound)
			: -1
	);

	function dismiss_overlay() {
		error_state.show_overlay = false;
	}

	const bound_to_axis: Record<string, number> = { x_min: 0, x_max: 0, width: 0, y_min: 1, y_max: 1, depth: 1, z_min: 2, z_max: 2, height: 2 };
	const axis_hints: string[][] = [['x', 'X', 'w'], ['y', 'Y', 'd'], ['z', 'Z', 'h']];
	const context_hints = new Set(['s', 'e', 'l']);

	function is_good_hint(label: string): boolean {
		if (context_hints.has(label)) return true;
		const axis = bound_to_axis[error_state.active_bound];
		return axis !== undefined && axis_hints[axis].includes(label);
	}

	function apply_suggestion(suggestion: string, commit: boolean) {
		const input = error_state.input ?? document.querySelector('input.cell-error') as HTMLInputElement | null;
		if (!input) return;
		input.value = suggestion;
		if (commit) {
			const row = bounds_rows.find(r => r.bound === error_state.active_bound);
			if (row) {
				if (error_state.source === 'value') {
					commit_value(row, suggestion, input);
				} else {
					commit_formula(row, suggestion, input);
				}
			}
		} else {
			error_state.show_overlay = false;
			input.focus();
			input.setSelectionRange(suggestion.length, suggestion.length);
		}
	}

	function commit_formula(row: BoundsRow, value: string, input?: HTMLInputElement) {
		if (!selected_so || !row.bound) return;
		history.snapshot();
		const trimmed = value.trim().replace(/\.(\s*\.)+/g, '.').replace(/\.(\s*[+\-*/])/g, '$1').replace(/\.+$/, '');
		const parent_id = selected_so.scene?.parent?.so.id;
		if (trimmed) {
			let normalized: string;
			try {
				const tokens = tokenizer.merge_refs(tokenizer.tokenize(trimmed));
				normalized = tokenizer.untokenize(tokens).replace(/\s*\+\s*-\s*/g, ' - ').replace(/\s*-\s*\+\s*/g, ' - ').replace(/(?<=^|[+\-*/(])(\s*)- (?=[\d.a-zA-Z_])/g, '$1-');
			} catch (e: any) {
				if (input) input.value = trimmed;
				const span = errors.extract_span(e, trimmed);
				const err = errors.classify(trimmed, span, e);
				errors.set(selected_so.id, row.bound, err);
				error_state.active_bound = row.bound;
				error_state.active_error = err;
				error_state.show_overlay = true;
				error_state.source = 'formula';
				error_state.input = input ?? null;
				if (input) input.setSelectionRange(err.span[0], err.span[0] + err.span[1]);
				stores.tick();
				return;
			}
			if (input) input.value = normalized;
			const err = constraints.set_formula(selected_so, row.bound, normalized, parent_id);
			if (err) {
				error_state.active_bound = row.bound;
				error_state.active_error = err;
				error_state.show_overlay = true;
				error_state.source = 'formula';
				error_state.input = input ?? null;
				if (input) input.setSelectionRange(err.span[0], err.span[0] + err.span[1]);
				stores.tick();
				return;
			}
		} else {
			constraints.clear_formula(selected_so, row.bound);
			errors.clear(selected_so.id, row.bound);
		}
		error_state.active_error = null;
		error_state.show_overlay = false;
		constraints.propagate(selected_so);
		stores.tick();
		scenes.save();
	}

	const length_bounds = new Set(['width', 'depth', 'height']);

	function commit_value(row: BoundsRow, value: string, input?: HTMLInputElement) {
		if (!selected_so || !row.bound) return;
		history.snapshot();
		let mm = units.parse_for_system(value, $w_unit_system);
		if (mm === null) {
			// Before trying formula evaluation, check for obvious non-value junk
			const junk_err = errors.not_a_value(value);
			if (junk_err && selected_so) {
				errors.set(selected_so.id, row.bound, junk_err);
				error_state.active_bound = row.bound;
				error_state.active_error = junk_err;
				error_state.show_overlay = true;
				error_state.source = 'value';
				error_state.input = input ?? null;
				if (input) { input.focus(); input.setSelectionRange(junk_err.span[0], junk_err.span[0] + junk_err.span[1]); }
				stores.tick();
				return;
			}
			// No junk detected — try evaluating as a constant formula (e.g. "20 + 5")
			mm = constraints.evaluate_formula(value);
			if (mm === null) return;
		}
		if (mm < 0) {
			const err = errors.negative_value(value);
			errors.set(selected_so.id, row.bound, err);
			error_state.active_bound = row.bound;
			error_state.active_error = err;
			error_state.show_overlay = true;
			error_state.source = 'value';
			error_state.input = input ?? null;
			if (input) { input.focus(); input.setSelectionRange(err.span[0], err.span[0] + err.span[1]); }
			stores.tick();
			return;
		}
		errors.clear(selected_so.id, row.bound);
		error_state.active_error = null;
		error_state.show_overlay = false;
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
		stores.w_editing.set(T_Editing.none);
		if (error_state.show_overlay) dismiss_overlay();
		history.snapshot();
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

	let skip_blur_commit = false;

	function cell_keydown(e: KeyboardEvent, row?: BoundsRow) {
		const passive = e.key.startsWith('Arrow') || ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key);
		if (e.key === 'Enter') {
			e.preventDefault();
			const err = error_state.show_overlay && selected_so && error_state.active_bound
				? errors.get(selected_so.id, error_state.active_bound) : null;
			if (err?.suggestions.length === 1) {
				const s = err.suggestions[0];
				const btn = document.querySelector('.error-suggestion') as HTMLElement | null;
				if (btn) {
					btn.classList.add('blink');
					setTimeout(() => {
						btn.classList.remove('blink');
						apply_suggestion(s.formula, s.commit !== false);
					}, 120);
				} else {
					apply_suggestion(s.formula, s.commit !== false);
				}
				return;
			}
			if (row) {
				const input = e.target as HTMLInputElement;
				skip_blur_commit = true;
				commit_formula(row, input.value, input);
				if (error_state.show_overlay) {
					e.stopPropagation();
					return;
				}
			}
			(e.target as HTMLInputElement).blur();
			return;
		}
		if (error_state.show_overlay && !passive) {
			error_state.show_overlay = false;
		}
		if (e.key === 'Escape') {
			(e.target as HTMLInputElement).blur();
		}
		if (e.key !== 'Tab') {
			e.stopPropagation();
		} else if (error_state.show_overlay) {
			dismiss_overlay();
		}
	}

	let show_givens = $state(preferences.read<boolean>(T_Preference.showGivens) ?? true);

	function toggle_show_givens() { show_givens = !show_givens; preferences.write(T_Preference.showGivens, show_givens); }

	function add_given() {
		givens.add('', 0);
		stores.tick();
	}

	let formula_mode = $derived.by(() => {
		if (tick === undefined || !selected_so) return 'agnostic' as const;
		return constraints.detect_formula_mode(selected_so) === 'explicit' ? 'explicit' as const : 'agnostic' as const;
	});

</script>

{#snippet attr_row(row: typeof bounds_rows[0], i: number)}
	{@const row_disabled = is_root ? row.attr_index !== 2 : (row.is_invariant || row.has_formula)}
	{@const gpos = i % 3}
	{@const prev_inv = i > 0 && bounds_rows[i - 1]?.is_invariant}
	{@const is_merge_cont = row.is_invariant && prev_inv}
	{@const merge_span = row.is_invariant && !prev_inv ? (() => { let n = 1; while (i + n < bounds_rows.length && bounds_rows[i + n].is_invariant) n++; return n > 1 ? n : 0; })() : 0}
	{@const root_formula_cont = is_root && i !== 0 && i !== 6}
	{@const root_start_cont = is_root && row.attr_index === 0 && gpos > 0}
	{@const has_error_base = !!(selected_so && row.bound && error_state.active_error && error_state.active_bound === row.bound)}
	{@const has_formula_error = has_error_base && error_state.source === 'formula'}
	{@const has_value_error = has_error_base && error_state.source === 'value'}
	<tr class:merge-cont={is_merge_cont || root_formula_cont || root_start_cont}>
		{#if formula_mode === 'agnostic' && i % 3 === 0}
			<td class='attr-key' rowspan={3}>{['s', 'l', 'e'][Math.floor(i / 3)]}</td>
		{/if}
		<td class='attr-name'>
			{row.label}
		</td>
		<td class='attr-invariant' class:cross={row.is_invariant} class:disabled={is_root} onclick={() => set_invariant(row)}></td>
		{#if !(is_merge_cont || root_formula_cont)}
			{@const formula_disabled = is_root || row.is_invariant}
			<td class='attr-formula' class:merged={is_root || merge_span >= 2} class:cell-disabled={formula_disabled} rowspan={is_root ? (i === 0 ? 6 : 3) : merge_span || undefined}>
				<input
					type      = 'text'
					class     = 'cell-input'
					class:cell-error={has_formula_error}
					value     = {row.formula}
					disabled  = {formula_disabled}
					onfocus   = {(e) => { error_state.saved_formula = (e.target as HTMLInputElement).value; stores.w_editing.set(T_Editing.formula); }}
					onblur    = {(e) => { const input = e.target as HTMLInputElement; if (!skip_blur_commit) commit_formula(row, input.value, input); skip_blur_commit = false; stores.w_editing.set(T_Editing.none); }}
					onkeydown = {(e) => cell_keydown(e, row)}
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
					class:cell-error={has_value_error}
					value     = {is_root && row.attr_index === 0 ? '0' : row.value}
					disabled  = {row_disabled}
					onfocus   = {() => stores.w_editing.set(T_Editing.value)}
					onblur    = {(e) => { const input = e.target as HTMLInputElement; commit_value(row, input.value, input); stores.w_editing.set(T_Editing.none); }}
					onkeydown = {cell_keydown}
				/>
			</td>
		{/if}
	</tr>
{/snippet}

{#snippet error_overlay()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class='error-backdrop' onmousedown={(e) => { e.preventDefault(); dismiss_overlay(); }}></div>
	<div class='error-overlay'>
		<div class='error-message'>{@html error_state.active_error!.message.replace(/'([^']+)'/g, "&#39;<span class='error-quoted'>$1</span>&#39;")}</div>
		{#if error_state.active_error!.suggestions.length > 0}
			<div class='error-suggestions' class:single={error_state.active_error!.suggestions.length === 1}>
				{#each [...error_state.active_error!.suggestions].sort((a, b) => (is_good_hint(b.label) ? 1 : 0) - (is_good_hint(a.label) ? 1 : 0)) as suggestion}
					<button class='error-suggestion' class:hint={is_good_hint(suggestion.label)} onmousedown={(e) => { e.preventDefault(); apply_suggestion(suggestion.formula, suggestion.commit !== false); }}>{suggestion.label}</button>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

{#if selected_so}
	{@const split = error_row_idx >= 0 && error_row_idx < bounds_rows.length - 1 && error_state.active_error}
	<table class='bounds'>
		<tbody>
			{#each (split ? bounds_rows.slice(0, error_row_idx + 1) : bounds_rows) as row, i (selected_so?.id + row.label)}
				{@render attr_row(row, i)}
			{/each}
		</tbody>
	</table>
	{#if split}
		{@render error_overlay()}
		<table class='bounds'>
			<tbody>
				{#each bounds_rows.slice(error_row_idx + 1) as row, j (selected_so?.id + row.label)}
					{@render attr_row(row, error_row_idx + 1 + j)}
				{/each}
			</tbody>
		</table>
	{:else if error_state.show_overlay && error_state.active_error}
		{@render error_overlay()}
	{/if}
	<Separator />
	<div class='givens-header'>
		<button class='givens-toggle' onclick={toggle_show_givens}>
			{show_givens ? 'hide' : 'show'} givens
		</button>
		{#if show_givens}
			<button class='add-button' use:hit_target={{ id: 'add-given', onpress: add_given }}>
				+
			</button>
		{/if}
	</div>
	{#if show_givens}<P_Givens /><div style:height='3px'></div>{/if}
{:else}
	<p>-- no object selected --</p>
{/if}

<style>
	.bounds {
		font-size       : var(--h-font-small);
		border-collapse : collapse;
		width           : 100%;
	}

	.bounds td {
		border     : var(--th-border) solid currentColor;
		text-align : left;
		padding    : 0;
	}

	.attr-name {
		text-align  : center !important;
		background  : var(--bg);
		position    : relative;
		width       : 16px;
		min-width   : 16px;
		font-weight : 600;
		opacity     : 0.7;
	}

	.attr-key {
		text-align     : center !important;
		vertical-align : middle;
		background     : var(--bg);
		opacity        : 0.5;
		font-weight    : 600;
		min-width      : 1lh;
		width          : 1lh;
		padding        : 0;
	}

	.attr-invariant {
		cursor     : pointer;
		background : var(--c-white);
		width      : 12px;
		min-width  : 12px;
	}

	.attr-invariant:not(.disabled):hover {
		background : var(--hover);
	}

	.attr-invariant.disabled {
		background    : var(--bg);
		cursor        : default;
		pointer-events: none;
	}

	.attr-invariant.cross {
		background :
			linear-gradient(to top right, transparent calc(50% - 0.25px), currentColor 50%, transparent calc(50% + 0.25px)),
			linear-gradient(to bottom right, transparent calc(50% - 0.25px), currentColor 50%, transparent calc(50% + 0.25px)),
			var(--bg);
	}

	.merge-cont td {
		border-top : none !important;
	}

	.attr-formula {
		vertical-align : middle;
		width          : 70%;
	}

	.attr-formula.merged {
		padding : 0;
		height  : var(--th-tick);
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
		z-index       : var(--z-action);
		box-sizing    : border-box;
		color         : inherit;
		font-size     : inherit;
		font-family   : inherit;
		background    : var(--c-white);
		padding       : 0 4px;
		width         : 100%;
		height        : 100%;
		border        : none;
		outline       : none;
		margin        : 0;
	}

	.cell-input:not(:disabled):not(:focus):hover {
		background : var(--hover);
	}

	.cell-input:focus {
		outline        : var(--focus-outline);
		outline-offset : -1.5px;
		background     : var(--c-white);
		color          : var(--c-black);
	}

	.cell-error {
		outline        : 1.25px solid darkred;
		outline-offset : -1.25px;
	}

	.cell-disabled {
		background : var(--selected);
	}

	.cell-input:disabled {
		background : var(--selected);
		cursor     : default;
		opacity    : 0.7;
	}

	.cell-input.right {
		font-variant-numeric : tabular-nums;
		text-align           : right;
	}

	p {
		font-size  : var(--h-font-small);
		margin     : -5px 0 3px;
		text-align : center;
		opacity    : 0.6;
	}

	.givens-header {
		align-items   : center;
		display       : flex;
		gap           : 6px;
		margin-top    : 6px;
		margin-bottom : 6px;
	}

	.givens-toggle {
		border        : 0.25px solid currentColor;
		height        : var(--h-button-tiny);
		font-size     : var(--h-font-common);
		border-radius : var(--corner-common);
		z-index       : var(--z-action);
		background    : var(--c-white);
		cursor        : pointer;
		color         : inherit;
		text-align    : center;
		font-weight   : normal;
		flex          : 1;
		padding       : 0;
	}

	.givens-toggle:hover {
		background : var(--hover);
	}

	.add-button {
		border          : var(--th-border) solid currentColor;
		width           : var(--h-button-tiny);
		height          : var(--h-button-tiny);
		font-size       : var(--h-font-large);
		z-index         : var(--z-action);
		background      : var(--c-white);
		color           : inherit;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		font-weight     : 300;
		border-radius   : 50%;
		line-height     : 1;
		padding         : 0;
	}

	.add-button:hover {
		background : var(--hover);
	}

	.error-backdrop {
		position : fixed;
		inset    : 0;
		z-index  : 999;
	}

	.error-overlay {
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
	}

	.error-message :global(.error-quoted) {
		color : darkred;
	}

	.error-message {
		text-align    : center;
		margin-bottom : 8px;
	}

	.error-suggestions {
		display         : flex;
		flex-wrap       : wrap;
		justify-content : space-between;
		margin-bottom   : 4px;
		gap             : 3.95px;
	}

	.error-suggestions.single {
		justify-content : center;
	}

	.error-suggestion {
		background    : white;
		padding       : 2px 5px;
		border-radius : 5px;
		font-size     : var(--h-font-small);
		border        : var(--th-border) solid currentColor;
		cursor        : pointer;
		color         : inherit;
		line-height   : 1;
	}

	.error-suggestion.hint {
		background : #ddd;
	}

	.error-suggestion:hover {
		background : var(--selected);
		outline    : 2px solid var(--accent);
	}

	.error-suggestion.hint:hover {
		background : var(--bg);
		outline    : 2px solid var(--accent);
	}

	.error-suggestion:global(.blink) {
		background : var(--selected);
		outline    : 2px solid var(--accent);
	}


</style>
