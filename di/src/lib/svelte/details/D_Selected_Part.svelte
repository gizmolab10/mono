<script lang='ts'>
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { scenes, stores } from '../../ts/managers';
	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { w_unit_system } from '../../ts/types/Units';
	import { units } from '../../ts/types/Units';
	import { engine } from '../../ts/render';
	import { orientation } from '../../ts/algebra';
	import type { Axis_Name } from '../../ts/types/Types';

	const { w_all_sos, w_selection, w_tick, w_precision } = stores;

	let selected_so = $derived($w_selection?.so ?? null);
	let is_root = $derived(!selected_so?.scene?.parent);
	let has_children = $derived($w_all_sos.some(so => so.scene?.parent?.so === selected_so));
	function get_visible_label(_tick: number) { return selected_so?.visible === false ? 'hidden' : 'visible'; }
	let visible_label = $derived(get_visible_label($w_tick));

	// Repeater state
	function get_repeater(_tick: number) { return selected_so?.repeater ?? null; }
	let is_repeater = $derived(get_repeater($w_tick) !== null);
	let has_firewall = $derived(get_repeater($w_tick)?.firewall ?? false);


	function repeater_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
		e.stopPropagation();
	}

	function set_repeat_axis(axis: 0 | 1) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, repeat_axis: axis };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_gap(field: 'gap_min' | 'gap_max', value: string) {
		if (!selected_so?.repeater) return;
		const mm = units.parse_for_system(value, $w_unit_system);
		if (mm === null) return;
		selected_so.repeater = { ...selected_so.repeater, [field]: mm };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_spacing(mm: number) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, spacing: mm, gap_min: undefined, gap_max: undefined };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function enable_gap_range() {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, gap_min: 152.4, gap_max: 203.2, spacing: undefined };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function set_gap_axis(axis: 0 | 1 | 2 | undefined) {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, gap_axis: axis };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function swap_xy() {
		if (!selected_so) return;
		engine.swap_axes(selected_so, 0, 1);
		stores.tick();
		scenes.save();
	}

	function toggle_firewall() {
		if (!selected_so?.repeater) return;
		selected_so.repeater = { ...selected_so.repeater, firewall: !selected_so.repeater.firewall };
		engine.sync_repeater(selected_so);
		stores.tick();
		scenes.save();
	}

	function get_repeater_display(so: Smart_Object | undefined, all_sos: Smart_Object[], _tick: number) {
		if (!so?.repeater) return null;
		const total = all_sos.filter(s => s.scene?.parent?.so === so).length;
		if (total === 0) return null;
		const clones = so.repeater.firewall ? (total + 1) / 2 : total;
		const fireblocks = so.repeater.firewall ? clones - 1 : 0;
		return { count: clones, fireblocks };
	}

	let repeater_display = $derived(get_repeater_display(selected_so ?? undefined, $w_all_sos, $w_tick));

	const stashed_repeaters = new Map<string, any>();

	function toggle_repeater() {
		if (!selected_so) return;
		if (is_repeater) {
			stashed_repeaters.set(selected_so.id, selected_so.repeater);
			engine.strip_clones(selected_so);
			selected_so.repeater = null;
		} else {
			selected_so.repeater = stashed_repeaters.get(selected_so.id) ?? {};
			stashed_repeaters.delete(selected_so.id);
			engine.sync_repeater(selected_so);
		}
		stores.tick();
		scenes.save();
	}

	function toggle_visible() {
		if (!selected_so) return;
		selected_so.visible = !selected_so.visible;
		stores.tick();
		scenes.save();
	}

	// Rotation state
	let rot_axis: Axis_Name = $state('z');

	// When selection changes, pick default rotation axis from geometry
	$effect(() => {
		if (selected_so) rot_axis = orientation.axis_from_bounds(selected_so) ?? 'z';
	});

	const SWAP_PAIRS: Record<Axis_Name, [number, number]> = { x: [1, 2], y: [0, 2], z: [0, 1] };
	const STICKY_ANGLES = [22.5, 30, 45, 60, 75.5];
	const STICKY_THRESHOLD = 2;

	function rotate_90(sign: 1 | -1) {
		if (!selected_so) return;
		const [a, b] = SWAP_PAIRS[rot_axis];
		if (sign > 0) engine.swap_axes(selected_so, a, b);
		else engine.swap_axes(selected_so, b, a);
		stores.tick();
		scenes.save();
	}

	function get_angle_deg(_tick: number): number {
		if (!selected_so) return 0;
		const axis = selected_so.axis_by_name(rot_axis);
		return axis.angle.value * 180 / Math.PI;
	}
	let angle_deg = $derived(get_angle_deg($w_tick));

	function set_angle(deg: number) {
		if (!selected_so) return;
		// Snap to sticky detents
		for (const sticky of STICKY_ANGLES) {
			if (Math.abs(deg - sticky) < STICKY_THRESHOLD) { deg = sticky; break; }
		}
		const axis = selected_so.axis_by_name(rot_axis);
		axis.angle.value = deg * Math.PI / 180;
		engine.fit_root();
		stores.tick();
		scenes.save();
	}

	// Name editing
	const { w_s_face_label } = face_label;

	let display_name = $derived(
		$w_s_face_label ? $w_s_face_label.current_name : selected_so?.name ?? ''
	);

	function handle_name(e: Event) {
		const input = e.target as HTMLInputElement;
		if (selected_so) {
			selected_so.name = input.value;
			scenes.save();
			stores.w_all_sos.update(sos => sos);
			face_label.sync(input.value);
		}
	}

	function handle_name_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			if (face_label.state) face_label.cancel();
			else stores.w_editing.set(T_Editing.none);
			(e.target as HTMLInputElement).blur();
		}
	}

	function handle_name_focus(e: FocusEvent) {
		stores.w_editing.set(T_Editing.details_name);
		const cur = face_label.cursor;
		if (cur) {
			const input = e.target as HTMLInputElement;
			requestAnimationFrame(() => input.setSelectionRange(cur.start, cur.end));
		}
	}

	function handle_name_blur(e: FocusEvent) {
		const input = e.target as HTMLInputElement;
		face_label.cursor = { start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 };
		setTimeout(() => {
			if (stores.editing() !== T_Editing.face_label) {
				if (face_label.state) {
					face_label.commit(selected_so?.name ?? '');
				} else {
					stores.w_editing.set(T_Editing.none);
				}
			}
		});
	}
</script>

{#if selected_so}
<div class='name-row'>
	<input
		type      = 'text'
		value     = {display_name}
		oninput   = {handle_name}
		onkeydown = {handle_name_keydown}
		onfocus   = {handle_name_focus}
		onblur    = {handle_name_blur}
	/>
</div>

<div class='actions-row'>
	{#if has_children}<button class='action-btn' use:hit_target={{ id: 'remove-children', onpress: () => engine.remove_all_children() }}>empty</button>{/if}
	{#if !is_root}<button class='action-btn' use:hit_target={{ id: 'duplicate', onpress: () => engine.duplicate_selected() }}>duplicate</button>{/if}
	<button class='action-btn' use:hit_target={{ id: 'repeat', onpress: toggle_repeater }}>{is_repeater ? 'unrepeat' : 'repeat'}</button>
	<button class='action-btn action-far-right' use:hit_target={{ id: 'toggle-visible', onpress: toggle_visible }}>↔ {visible_label}</button>
</div>

<div class='rotation-section'>
	<div class='rotation-row'>
		<span class='option-label'>axis</span>
		<div class='segmented'>
			<button class:active={rot_axis === 'x'} onclick={() => rot_axis = 'x'}>x</button>
			<button class:active={rot_axis === 'y'} onclick={() => rot_axis = 'y'}>y</button>
			<button class:active={rot_axis === 'z'} onclick={() => rot_axis = 'z'}>z</button>
		</div>
		<button class='action-btn' onclick={() => rotate_90(-1)}>-90°</button>
		<button class='action-btn' onclick={() => rotate_90(1)}>+90°</button>
	</div>
	<div class='rotation-row'>
		<span class='option-label'>angle</span>
		<input
			type='range'
			class='rotation-slider'
			min='0'
			max='90'
			step='0.5'
			value={angle_deg}
			oninput={(e) => set_angle(Number((e.target as HTMLInputElement).value))}
		/>
		<span class='angle-display'>{angle_deg.toFixed(1)}°</span>
	</div>
</div>

{#if is_repeater && selected_so}
<div class='separator'></div>
	<div class='repeater-options'>
		<div class='repeater-option-row'>
			<span class='option-label'>axis</span>
			<div class='segmented'>
				<button class:active={selected_so?.repeater?.repeat_axis === 0} onclick={() => set_repeat_axis(0)}>x</button>
				<button class:active={selected_so?.repeater?.repeat_axis === 1} onclick={() => set_repeat_axis(1)}>y</button>
			</div>
			<button class='action-btn' onclick={swap_xy}>swap x↔y</button>
			<button class='action-btn' class:active={has_firewall} onclick={toggle_firewall} style='margin-left:auto'>
				{has_firewall ? '↔ fireblocks' : '↔ no fireblocks'}
			</button>
		</div>
		<div class='repeater-option-row'>
			<span class='option-label'>constraint</span>
			<div class='segmented'>
				<button class:active={selected_so?.repeater?.gap_min != null} onclick={enable_gap_range}>range</button>
				<button class:active={selected_so?.repeater?.spacing === 304.8} onclick={() => set_spacing(304.8)}>12"</button>
				<button class:active={selected_so?.repeater?.spacing === 406.4} onclick={() => set_spacing(406.4)}>16"</button>
				<button class:active={selected_so?.repeater?.spacing === 609.6} onclick={() => set_spacing(609.6)}>24"</button>
			</div>
		</div>
		{#if selected_so?.repeater?.gap_min != null && selected_so?.repeater?.gap_max != null}
			<div class='repeater-option-row'>
				<span class='option-label'>gap along</span>
				<div class='segmented'>
					<button class:active={selected_so?.repeater?.gap_axis == null || selected_so?.repeater?.gap_axis === selected_so?.repeater?.repeat_axis} onclick={() => set_gap_axis(undefined)}>repeat</button>
					<button class:active={selected_so?.repeater?.gap_axis === 2} onclick={() => set_gap_axis(2)}>z</button>
				</div>
			</div>
			<div class='repeater-option-row'>
				<span class='option-label'>min</span>
				<input
					type      = 'text'
					class     = 'repeater-input'
					value     = {units.format_for_system(selected_so.repeater.gap_min, $w_unit_system, $w_precision)}
					onblur    = {(e) => set_gap('gap_min', (e.target as HTMLInputElement).value)}
					onkeydown = {repeater_keydown}
				/>
				<span class='option-label'>max</span>
				<input
					type      = 'text'
					class     = 'repeater-input'
					value     = {units.format_for_system(selected_so.repeater.gap_max, $w_unit_system, $w_precision)}
					onblur    = {(e) => set_gap('gap_max', (e.target as HTMLInputElement).value)}
					onkeydown = {repeater_keydown}
				/>
			</div>
		{/if}
		{#if repeater_display}
			<div class='repeater-display'>
				<span>{repeater_display.count} clones{#if repeater_display.fireblocks > 0}, {repeater_display.fireblocks} fire blocks{/if}</span>
			</div>
		{/if}
	</div>
{/if}
{/if}

<style>
	.name-row {
		display      : flex;
		gap          : 6px;
		align-items  : center;
	}

	.name-row input {
		flex          : 1;
		min-width     : 0;
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		font-size     : 0.875rem;
		color         : inherit;
		background    : white;
		padding       : 0 6px;
		height        : 20px;
		outline       : none;
		border-radius : 4px;
	}

	.name-row input:focus {
		border-color : currentColor;
		opacity      : 1;
	}

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

	.actions-row {
		display    : flex;
		gap        : 6px;
		margin-top : 8px;
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

	.action-far-right {
		margin-left : auto;
	}

	.action-btn:disabled {
		opacity        : 0.3;
		cursor         : default;
		pointer-events : none;
	}

	.action-btn.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.rotation-section {
		margin-top     : 8px;
		display        : flex;
		flex-direction : column;
		gap            : 4px;
	}

	.rotation-row {
		display     : flex;
		align-items : center;
		gap         : 6px;
	}

	.rotation-slider {
		flex       : 1;
		min-width  : 0;
		height     : 4px;
		cursor     : pointer;
		accent-color : var(--accent);
	}

	.angle-display {
		font-size  : 11px;
		min-width  : 32px;
		text-align : right;
		opacity    : 0.8;
	}

	.repeater-options {
		margin-top     : 0px;
		display        : flex;
		flex-direction : column;
		gap            : 4px;
	}

	.repeater-option-row {
		display     : flex;
		align-items : center;
		gap         : 6px;
	}

	.option-label {
		font-size   : 11px;
		opacity     : 0.6;
		min-width   : 28px;
		flex-shrink : 0;
	}

	.segmented {
		display : flex;
		gap     : 0;
	}

	.segmented button {
		border        : 0.5px solid currentColor;
		background    : white;
		color         : inherit;
		font-size     : 11px;
		height        : 20px;
		padding       : 0 8px;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.segmented button:first-child {
		border-radius : 10px 0 0 10px;
	}

	.segmented button:last-child {
		border-radius : 0 10px 10px 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		background  : var(--accent);
		font-weight : 600;
	}

	.segmented button:hover:not(.active) {
		background : var(--bg);
	}

	.repeater-input {
		flex          : 1;
		min-width     : 0;
		border        : 0.5px solid currentColor;
		border-radius : 4px;
		background    : white;
		color         : inherit;
		font-size     : 11px;
		font-family   : inherit;
		height        : 20px;
		padding       : 0 6px;
		outline       : none;
		box-sizing    : border-box;
	}

	.repeater-input:focus {
		outline        : 1.5px solid cornflowerblue;
		outline-offset : -1.5px;
	}

	.repeater-display {
		font-size    : 11px;
		opacity      : 0.8;
		padding-left : 34px;
	}

</style>
