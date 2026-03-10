<script lang='ts'>
	import { scenes, stores, hits_3d } from '../../ts/managers';
	import { constraints } from '../../ts/algebra';
	import { engine } from '../../ts/render';
	import type { Axis_Name } from '../../ts/types/Types';

	const { w_selection, w_tick, w_forward_face } = stores;

	let selected_so = $derived($w_selection?.so ?? null);
	let is_root = $derived(!selected_so?.scene?.parent);

	let rot_axis: Axis_Name = $state('z');

	const FACE_TO_AXIS: Axis_Name[] = ['z', 'z', 'x', 'x', 'y', 'y'];

	$effect(() => {
		$w_tick;
		$w_forward_face;
		if (!selected_so) return;
		const face = hits_3d.front_most_face(selected_so);
		if (face >= 0) rot_axis = FACE_TO_AXIS[face];
	});

	const STICKY_ANGLES = [-45, -30, -22.5, 0, 22.5, 30, 45];
	const STICKY_THRESHOLD = 1;
	const ALL_AXES = ['x', 'y', 'z'] as const;

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

	let angles = $derived(get_angles($w_tick));

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
	let angle_deg = $derived(read_angle_deg($w_tick));
	let is_sticky = $derived(STICKY_ANGLES.some(s => Math.abs(angle_deg - s) < 0.01));
	function base_deg(): number {
		if (!selected_so) return 0;
		const total = selected_so.axis_by_name(rot_axis).angle.value * 180 / Math.PI;
		return nearest_base(total);
	}

	function rotate_90(sign: 1 | -1) {
		if (!selected_so) return;
		const current = Math.round(selected_so.axis_by_name(rot_axis).angle.value * 180 / Math.PI);
		const next = current + sign * 90;
		selected_so.touch_axis(rot_axis, next * Math.PI / 180);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

	const SWAP_INDICES: Record<Axis_Name, [number, number]> = { z: [0, 1], x: [1, 2], y: [0, 2] };
	const SWAP_LABELS:  Record<Axis_Name, string>          = { z: 'swap x | y', x: 'swap y | z', y: 'swap x | z' };

	function swap() {
		if (!selected_so) return;
		const [a, b] = SWAP_INDICES[rot_axis];
		engine.swap_axes(selected_so, a, b);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}

	function set_angle(e: Event) {
		if (!selected_so) return;
		const input = e.target as HTMLInputElement;
		let deg = Number(input.value);
		for (const sticky of STICKY_ANGLES) {
			if (Math.abs(deg - sticky) < STICKY_THRESHOLD) { deg = sticky; break; }
		}
		input.value = String(deg);
		selected_so.touch_axis(rot_axis, (base_deg() + deg) * Math.PI / 180);
		constraints.propagate(selected_so);
		sync_parent_repeater();
		stores.tick();
		scenes.save();
	}
</script>

{#if is_root}
	<div class='root-note'>root has no angles</div>
{:else}
	<div class='rotation-section'>
		<table class='angles'>
			<tbody>
				{#each ALL_AXES as axis}
					<tr class:active-axis={axis === rot_axis} onclick={() => rot_axis = axis}>
						<td class='angle-name'>{axis}</td>
						<td class='angle-val'>
							<input
								type      = 'text'
								class     = 'angle-cell'
								value     = {angles[axis]}
								onblur    = {(e) => commit_angle(axis, (e.target as HTMLInputElement).value)}
								onkeydown = {angle_keydown}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class='rotation-row'>
			<span class='slider-label'>-45°</span>
			<div class='slider-wrap'>
				<input
					type='range'
					class='rotation-slider'
					class:sticky={is_sticky}
					min='-45'
					max='45'
					step='0.5'
					value={angle_deg}
					oninput={set_angle}
				/>
				{#each STICKY_ANGLES as a}
					<span class='tick' style:left='calc(7px + {(a + 45) / 90} * (100% - 14px))'></span>
				{/each}
			</div>
			<span class='slider-label'>+45°</span>
		</div>
		<div class='rotation-row'>
			<button class='action-btn' onclick={swap}>{SWAP_LABELS[rot_axis]}</button>
			<span class='far-right'>
				<button class='action-btn' onclick={() => rotate_90(-1)}>-90°</button>
				<button class='action-btn' onclick={() => rotate_90(1)}>+90°</button>
			</span>
		</div>
		<div style:height='0px'></div>
	</div>
{/if}

<style>
	.rotation-section {
		display        : flex;
		flex-direction : column;
		gap            : var(--l-gap);
	}

	.rotation-row {
		display     : flex;
		align-items : center;
		gap         : var(--l-gap-small);
	}

	.slider-label {
		font-size   : var(--h-font-common);
		opacity     : 0.5;
		flex-shrink : 0;
	}

	.far-right {
		margin-left : auto;
		display     : flex;
		gap         : var(--l-gap-small);
	}

	.action-btn {
		border        : var(--th-border) solid currentColor;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		background    : var(--c-white);
		padding       : 0 8px;
		border-radius : var(--corner-common);
		font-size     : var(--h-font-common);
		height        : var(--h-button-common);
		z-index       : var(--z-action);
	}

	.action-btn:hover {
		background : var(--selected);
	}

	.slider-wrap {
		flex           : 1;
		position       : relative;
		min-width      : 0;
		height         : var(--h-button-common);
		display        : flex;
		align-items    : center;
	}

	.rotation-slider {
		width              : 100%;
		height             : var(--th-track);
		margin             : 0;
		padding            : 0;
		cursor             : pointer;
		accent-color       : var(--selected);
		-webkit-appearance : none;
		appearance         : none;
		background         : var(--c-track);
		border-radius      : var(--corner-input);
	}

	.rotation-slider::-webkit-slider-thumb {
		-webkit-appearance : none;
		width              : var(--h-slider);
		height             : var(--h-slider);
		margin-top         : calc((var(--th-track) - var(--h-slider)) / 2);
		border-radius      : 50%;
		background         : var(--selected);
		border             : none;
		cursor             : pointer;
	}

	.rotation-slider::-moz-range-thumb {
		width         : var(--h-slider);
		height        : var(--h-slider);
		border-radius : 50%;
		background    : var(--selected);
		border        : none;
		cursor        : pointer;
	}

	.rotation-slider.sticky::-webkit-slider-thumb {
		background : var(--c-white);
		border     : var(--th-border) solid var(--c-black);
	}

	.rotation-slider.sticky::-moz-range-thumb {
		background : var(--c-white);
		border     : var(--th-border) solid var(--c-black);
	}

	.tick {
		position       : absolute;
		top            : 50%;
		width          : 1px;
		height         : var(--th-thumb);
		background     : currentColor;
		opacity        : 0.6;
		transform      : translate(-0.5px, -50%);
		pointer-events : none;
	}

	.angles {
		width           : 100%;
		border-collapse : collapse;
		font-size       : var(--h-font-common);
		margin-top      : var(--l-gap);
	}

	.angles td {
		border  : var(--th-border) solid currentColor;
		padding : 0;
	}

	.angle-name {
		width       : 16px;
		min-width   : 16px;
		font-weight : 600;
		opacity     : 0.7;
		text-align  : center;
		background  : var(--bg);
		cursor      : pointer;
	}

	.active-axis .angle-name {
		background  : var(--selected);
		opacity     : 1;
	}

	.angle-val {
		text-align           : right;
		font-variant-numeric : tabular-nums;
	}

	.angle-cell {
		width                : 100%;
		border               : none;
		background           : var(--c-white);
		color                : inherit;
		font-size            : inherit;
		font-family          : inherit;
		padding              : 0 4px;
		margin               : 0;
		outline              : none;
		box-sizing           : border-box;
		text-align           : right;
		font-variant-numeric : tabular-nums;
	}

	.angle-cell:not(:focus):hover {
		background : var(--selected);
	}

	.angle-cell:focus {
		background     : var(--c-white);
		color          : var(--c-black);
		outline        : var(--focus-outline);
		outline-offset : -1.5px;
	}

	.root-note {
		padding-top    : var(--l-gap);
		font-size   : var(--h-font-common);
		opacity     : 0.5;
		text-align  : center;
		padding     : 0;
		line-height : 1;
	}
</style>
