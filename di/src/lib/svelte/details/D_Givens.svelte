<script lang='ts'>
	import { scenes, stores, history } from '../../ts/managers';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { constraints, errors } from '../../ts/algebra';
	import { w_unit_system } from '../../ts/types/Units';
	import { givens } from '../../ts/algebra/Givens';
	import { units } from '../../ts/types/Units';

	let { add = $bindable<(() => void) | undefined>() }: { add?: () => void } = $props();

	const { w_precision, w_tick } = stores;

	type Row = { name: string; value_mm: number; locked?: boolean };

	let rows: Row[] = $state(givens.get_all());
	let naming_error: string | null = $state(null);
	let naming_input: HTMLInputElement | null = null;
	let pending_focus = $state(false);

	function add_constant(): void {
		const active = document.activeElement;
		if (active instanceof HTMLInputElement) active.blur();
		if (naming_error) return;
		pending_focus = true;
		givens.add('', 0);
		stores.tick();
	}

	add = add_constant;

	function focus_if_target(node: HTMLInputElement, should_focus: boolean) {
		if (should_focus) {
			requestAnimationFrame(() => { node.focus(); node.select(); pending_focus = false; });
		}
		return {
			update(next: boolean) {
				if (next) {
					requestAnimationFrame(() => { node.focus(); node.select(); pending_focus = false; });
				}
			}
		};
	}

	$effect(() => {
		$w_tick;
		rows = givens.get_all();
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
		history.snapshot();
		const name = rows[index].name;
		givens.remove(name);
		rows = givens.get_all();
		sync_and_propagate();
	}

	function commit_name(index: number, value: string, input?: HTMLInputElement): void {
		if (naming_error) return;
		if (!rows[index]) return;
		const old_name = rows[index].name;
		const new_name = value.replace(/_/g, ' ').trim();
		if (old_name === new_name) { naming_error = null; return; }
		if (!new_name) return;
		if (new_name) {
			const err = errors.validate_name(new_name, undefined, old_name);
			if (err) {
				naming_error = err;
				naming_input = input ?? null;
				return;
			}
		}
		naming_error = null;
		history.snapshot();
		givens.rename(old_name, new_name);
		if (old_name && new_name) constraints.rename_sd_in_formulas(old_name, new_name);
		rows = givens.get_all();
		sync_and_propagate();
	}

	function dismiss_naming(): void {
		naming_error = null;
		if (naming_input) { naming_input.value = ''; naming_input = null; }
	}

	function commit_value(index: number, value: string): void {
		if (!rows[index]) return;
		history.snapshot();
		const mm = units.parse_for_system(value, $w_unit_system);
		if (mm === null) return;
		const name = rows[index].name;
		if (!name) return;
		givens.set(name, mm);
		rows = givens.get_all();
		sync_and_propagate();
	}

	function toggle_lock(index: number): void {
		const name = rows[index].name;
		givens.set_locked(name, !givens.is_locked(name));
		rows = givens.get_all();
		scenes.save();
	}

	function cell_keydown(e: KeyboardEvent, index?: number): void {
		if (e.key === 'Escape') {
			(e.target as HTMLInputElement).blur();
		}
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
			e.stopPropagation();
			return;
		}
		if (e.key === 'Enter' && index !== undefined && rows[index]) {
			const inp = e.target as HTMLInputElement;
			const new_name = inp.value.trim();
			const old_name = rows[index].name;
			if (new_name && new_name !== old_name) {
				const err = errors.validate_name(new_name, undefined, old_name);
				if (err) {
					naming_error = err;
					naming_input = inp;
					const m = new_name.match(/[^a-zA-Z0-9_ ]+/);
					if (m) inp.setSelectionRange(m.index!, m.index! + m[0].length);
					else inp.select();
					e.preventDefault();
					e.stopPropagation();
					return;
				}
			}
		}
		if (e.key !== 'Enter' && e.key !== 'Tab') {
			e.stopPropagation();
		}
	}
</script>

{#if rows.length > 0}
	<div class='givens-wrap'>
		<table class='givens'><tbody>
			{#each rows as row, index}
				<tr>
					<td class='givens-name'>
						<input
							type        = 'text'
							placeholder = 'name'
							value       = {row.name}
							class       = 'cell-input'
							use:focus_if_target={pending_focus && index === rows.length - 1}
							onkeydown   = {(e) => cell_keydown(e, index)}
							onfocus     = {() => stores.w_editing.set(T_Editing.value)}
							onblur      = {(e) => { const inp = e.target as HTMLInputElement; commit_name(index, inp.value, inp); if (!naming_error) stores.w_editing.set(T_Editing.none); }}
						/>
					</td>
					<td class='givens-value'>
						<input
							type      = 'text'
							onkeydown = {cell_keydown}
							class     = 'cell-input right'
							value     = {format_value(row.value_mm)}
							onfocus   = {() => stores.w_editing.set(T_Editing.value)}
							onblur    = {(e) => { commit_value(index, (e.target as HTMLInputElement).value); stores.w_editing.set(T_Editing.none); }}
						/>
					</td>
					<td class='givens-lock'>
						<button class='lock-button' onclick={() => toggle_lock(index)}>
							{row.locked ? '🔒︎' : '–'}
						</button>
					</td>
					<td class='givens-remove'>
						<button
							class='remove-button'
							use:hit_target={{ id: `remove-givens-${index}`, onpress: () => remove_dimension(index) }}>
							🗑︎
						</button>
					</td>
				</tr>
			{/each}
		</tbody></table>
	</div>
	{#if naming_error}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class='naming-backdrop' onmousedown={(e) => { e.preventDefault(); dismiss_naming(); }}></div>
		<div class='naming-overlay'>
			<div class='naming-message'>{@html naming_error.replace(/'([^']+)'/g, "&#39;<span class='naming-quoted'>$1</span>&#39;")}</div>
			<div class='naming-suggestions'>
				<button class='naming-suggestion' onmousedown={(e) => { e.preventDefault(); dismiss_naming(); }}>delete it</button>
			</div>
		</div>
	{/if}
{/if}


<style>
	.givens-wrap {
		border        : var(--th-border) solid currentColor;
		overflow      : hidden;
		border-radius : 6px; 
	}

	.givens {
		font-size       : var(--font-small);
		border-collapse : collapse;
		width           : 100%;
	}

	.givens td {
		border  : var(--th-border) solid currentColor;
		padding : 0;
	}

	.givens tr:first-child td { border-top    : none; }
	.givens tr:last-child  td { border-bottom : none; }
	.givens td:first-child    { border-left   : none; }
	.givens td:last-child     { border-right  : none; }

	.givens-name {
		width : 50%;
	}

	.givens-value {
		font-variant-numeric : tabular-nums;
	}

	.givens-lock {
		font-variant-emoji : text;
		background         : var(--white);
		text-align         : center;
		min-width          : 1lh;
		width              : 1lh;
	}

	.lock-button {
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
		line-height     : 1;
		padding         : 0;
	}

	.givens-remove {
		font-variant-emoji : text;
		background         : var(--white);
		text-align         : center;
		min-width          : 1lh;
		width              : 1lh;
	}

	.givens-remove:hover,
	.givens-lock:hover {
		background : var(--hover);
	}

	.givens-remove:hover .remove-button,
	.givens-lock:hover .lock-button {
		filter : brightness(0) invert(1);
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
		opacity         : 0.8;
		line-height     : 1;
		padding         : 0;
	}

	.remove-button:hover {
		opacity : 1;
	}

	.cell-input {
		z-index     : var(--z-action);
		background  : var(--white);
		box-sizing  : border-box;
		font-family : inherit;
		font-size   : inherit;
		color       : inherit;
		padding     : 0 4px;
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
		background     : var(--white);
		color          : var(--c-default);
		outline-offset : -1.5px;
	}

	.cell-input.right {
		font-variant-numeric : tabular-nums;
		text-align           : right;
	}

	.naming-backdrop {
		position : fixed;
		inset    : 0;
		z-index  : 999;
	}

	.naming-overlay {
		font-size     : var(--font-small);
		border        : 2px solid darkred;
		background    : var(--white);
		box-sizing    : border-box;
		position      : relative;
		padding       : 6px 8px;
		text-align    : center;
		width         : 100%;
		z-index       : 1000;
		border-radius : 8px;
		margin-top    : 8px;
		margin-bottom : 8px;
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
		font-size     : var(--font-small);
		border-radius : var(--c-r-table);;
		cursor        : pointer;
		color         : inherit;
		padding       : 2px 5px;
		background    : white;
		line-height   : 1;
	}

	.naming-suggestion:hover {
		outline    : 2px solid var(--accent);
		background : var(--selected);
	}

</style>
