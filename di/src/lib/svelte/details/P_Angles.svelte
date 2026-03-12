<script lang='ts'>
	import { scenes, stores, hits_3d } from '../../ts/managers';
	import type { Axis_Name } from '../../ts/types/Types';
	import { constraints } from '../../ts/algebra';
	import { engine } from '../../ts/render';
	import Slider from '../mouse/Slider.svelte';

	const { w_selection, w_tick, w_forward_face } = stores;

	const SWAP_LABELS:  Record<Axis_Name, string>           = { z: 'swap x | y', x: 'swap y | z', y: 'swap x | z' };
	const SWAP_INDICES: Record<Axis_Name, [number, number]> = { z: [0, 1], x: [1, 2], y: [0, 2] };
	const FACE_TO_AXIS: Axis_Name[] = ['z', 'z', 'x', 'x', 'y', 'y'];
	const STICKY_ANGLES = [-45, -30, -22.5, 0, 22.5, 30, 45];
	const ALL_AXES = ['x', 'y', 'z'] as const;
	const STICKY_THRESHOLD = 1;

	let selected_so = $derived($w_selection?.so ?? null);
	let is_root = $derived(!selected_so?.scene?.parent);
	let angle_deg = $derived(read_angle_deg($w_tick));
	let angle_is_zero = $derived.by(() => { $w_tick; return !selected_so || Math.abs(selected_so.axis_by_name(rot_axis).angle.value) < 1e-6; });
	let angles = $derived(get_angles($w_tick));
	let rot_axis: Axis_Name = $state('z');

	$effect(() => {
		$w_tick;
		$w_forward_face;
		if (!selected_so) return;
		const face = hits_3d.front_most_face(selected_so);
		if (face >= 0) rot_axis = FACE_TO_AXIS[face];
	});

	function get_angles(_tick: number) {
		if (!selected_so) return { x: '0°', y: '0°', z: '0°' };
		const fmt = (rad: number) => {
			const degrees = Math.round(rad * (180 / Math.PI) * 2) / 2;
			return (degrees % 1 === 0 ? degrees.toFixed(0) : degrees.toFixed(1)) + '°';
		};
		return {
			x: fmt(selected_so.axes[0].angle.value),
			y: fmt(selected_so.axes[1].angle.value),
			z: fmt(selected_so.axes[2].angle.value),
		};
	}

	function sync_parent_repeater() {
		const parent = selected_so?.scene?.parent?.so;
		if (parent?.repeater) engine.sync_repeater(parent);
	}

	function commit_angle(axis: 'x' | 'y' | 'z', value: string) {
		if (!selected_so) return;
		const degrees = parseFloat(value.replace('°', ''));
		if (isNaN(degrees)) return;
		selected_so.touch_axis(axis, degrees * Math.PI / 180);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

	function angle_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
		if (e.key !== 'Tab') e.stopPropagation();
	}

	function nearest_base(total: number): number {
		// Round toward zero at ±45 boundary to prevent base flip at slider extremes
		const q = total / 90;
		return (q >= 0 ? Math.floor(q + 0.5 - 1e-9) : Math.ceil(q - 0.5 + 1e-9)) * 90;
	}

	function read_angle_deg(_tick: number): number {
		if (!selected_so) return 0;
		const total = selected_so.axis_by_name(rot_axis).angle.value * 180 / Math.PI;
		return total - nearest_base(total);
	}

	function base_deg(): number {
		if (!selected_so) return 0;
		const total = selected_so.axis_by_name(rot_axis).angle.value * 180 / Math.PI;
		return nearest_base(total);
	}

	function rotate_90(sign: 1 | -1) {
		if (!selected_so) return;
		if (is_root) {
			engine.rotate_root_90(rot_axis, sign);
			stores.tick();
			scenes.save();
			return;
		}
		const current = Math.round(selected_so.axis_by_name(rot_axis).angle.value * 180 / Math.PI);
		const next = current + sign * 90;
		selected_so.touch_axis(rot_axis, next * Math.PI / 180);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

	function swap() {
		if (!selected_so) return;
		const [a, b] = SWAP_INDICES[rot_axis];
		engine.swap_axes(selected_so, a, b);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

	function reset_angle() {
		if (!selected_so) return;
		selected_so.touch_axis(rot_axis, 0);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

	function handle_angle(deg: number) {
		if (!selected_so) return;
		selected_so.touch_axis(rot_axis, (base_deg() + deg) * Math.PI / 180);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

</script>

{#if !is_root}
	<div class='rotation-section'>
		<table class='angles'>
			<tbody>
				{#each ALL_AXES as axis}
					<tr class:active-axis={axis === rot_axis} onclick={() => rot_axis = axis}>
						<td class='angle-name'>{axis}</td>
						<td class='angle-val'>
							<input
								onblur    = {(e) => commit_angle(axis, (e.target as HTMLInputElement).value)}
								onkeydown = {angle_keydown}
								value     = {angles[axis]}
								class     = 'angle-cell'
								type      = 'text'
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class='rotation-row'>
			<span class='slider-label'>-45°</span>
			<Slider min={-45} max={45} divisions={180} style='line' fill sticky={STICKY_ANGLES} sticky_threshold={STICKY_THRESHOLD} onchange={handle_angle} value={angle_deg} />
			<span class='slider-label'>+45°</span>
		</div>
	</div>
{/if}
<div class='rotation-row' style:margin-top='var(--l-gap-tiny)'>
	<button class='action-btn' onclick={swap}>{SWAP_LABELS[rot_axis]}</button>
	{#if !is_root && !angle_is_zero}<span class='spacer'></span><button class='action-btn' onclick={reset_angle}>reset</button><span class='spacer'></span>{/if}
	<span class='far-right'>
		<button class='action-btn' onclick={() => rotate_90(-1)}>-90°</button>
		<button class='action-btn' onclick={() => rotate_90(1)}>+90°</button>
	</span>
</div>

<style>
	.rotation-section {
		gap            : var(--l-gap);
		flex-direction : column;
		display        : flex;
	}

	.rotation-row {
		gap         : var(--l-gap-small);
		align-items : center;
		display     : flex;
	}

	.spacer {
		flex      : 1 1 0px;
		min-width : 0;
	}

	.slider-label {
		font-size   : var(--h-font-common);
		opacity     : 0.5;
		flex-shrink : 0;
	}

	.far-right {
		gap         : var(--l-gap-small);
		margin-left : auto;
		display     : flex;
	}

	.action-btn {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		border-radius : var(--corner-common);
		font-size     : var(--h-font-common);
		z-index       : var(--z-action);
		background    : var(--c-white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 8px;
	}

	.action-btn:hover {
		background : var(--hover);
	}

	.angles {
		font-size       : var(--h-font-small);
		margin-top      : var(--l-gap);
		border-collapse : collapse;
		width           : 100%;
	}

	.angles td {
		border  : var(--th-border) solid currentColor;
		padding : 0;
	}

	.angle-name {
		background  : var(--bg);
		cursor      : pointer;
		text-align  : center;
		width       : 16px;
		min-width   : 16px;
		font-weight : 600;
		opacity     : 0.7;
	}

	.active-axis .angle-name {
		background  : var(--selected);
		opacity     : 1;
	}

	.angle-val {
		font-variant-numeric : tabular-nums;
		text-align           : right;
	}

	.angle-cell {
		background           : var(--c-white);
		font-variant-numeric : tabular-nums;
		box-sizing           : border-box;
		color                : inherit;
		font-size            : inherit;
		font-family          : inherit;
		text-align           : right;
		padding              : 0 4px;
		width                : 100%;
		border               : none;
		outline              : none;
		margin               : 0;
	}

	.angle-cell:not(:focus):hover {
		background : var(--hover);
	}

	.angle-cell:focus {
		outline        : var(--focus-outline);
		background     : var(--c-white);
		color          : var(--c-black);
		outline-offset : -1.5px;
	}

	.root-note {
		font-size   : var(--h-font-common);
		padding-top : var(--l-gap);
		text-align  : center;
		opacity     : 0.5;
		padding     : 0;
		line-height : 1;
	}
</style>
