<script lang='ts'>
	import { scenes, stores } from '../../ts/managers';
	import { engine } from '../../ts/render';
	import type { Axis_Name } from '../../ts/types/Types';

	const { w_selection, w_tick } = stores;

	let selected_so = $derived($w_selection?.so ?? null);
	let is_root = $derived(!selected_so?.scene?.parent);

	let rot_axis: Axis_Name = $state('z');

	const STICKY_ANGLES = [-30, -22.5, 0, 22.5, 30];
	const STICKY_THRESHOLD = 2;
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

	function commit_angle(axis: 'x' | 'y' | 'z', value: string) {
		if (!selected_so) return;
		const degrees = parseFloat(value.replace('°', ''));
		if (isNaN(degrees)) return;
		selected_so.touch_axis(axis, degrees * Math.PI / 180);
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
		stores.tick();
		scenes.save();
	}

	const SWAP_INDICES: Record<Axis_Name, [number, number]> = { z: [0, 1], x: [1, 2], y: [0, 2] };
	const SWAP_LABELS:  Record<Axis_Name, string>          = { z: 'swap x | y', x: 'swap y | z', y: 'swap x | z' };

	function swap() {
		if (!selected_so) return;
		const [a, b] = SWAP_INDICES[rot_axis];
		engine.swap_axes(selected_so, a, b);
		stores.tick();
		scenes.save();
	}

	function set_angle(deg: number) {
		if (!selected_so) return;
		for (const sticky of STICKY_ANGLES) {
			if (Math.abs(deg - sticky) < STICKY_THRESHOLD) { deg = sticky; break; }
		}
		selected_so.touch_axis(rot_axis, (base_deg() + deg) * Math.PI / 180);
		stores.tick();
		scenes.save();
	}
</script>

{#if selected_so && is_root}
<div class='root-note'>root has no angles</div>
{:else if selected_so}
<div class='rotation-section'>
	<div class='rotation-row'>
		<span class='option-label' style:margin-right='-8px'>axis</span>
		<div class='segmented'>
			<button class:active={rot_axis === 'x'} onclick={() => rot_axis = 'x'}>x</button>
			<button class:active={rot_axis === 'y'} onclick={() => rot_axis = 'y'}>y</button>
			<button class:active={rot_axis === 'z'} onclick={() => rot_axis = 'z'}>z</button>
		</div>
		<button class='action-btn' onclick={() => rotate_90(-1)}>-90°</button>
		<button class='action-btn' onclick={() => rotate_90(1)}>+90°</button>
		<button class='action-btn' onclick={swap}>{SWAP_LABELS[rot_axis]}</button>
	</div>
	<div class='rotation-row'>
		<span class='option-label'>angle</span>
		<input
			type='range'
			class='rotation-slider'
			min='-45'
			max='45'
			step='0.5'
			value={angle_deg}
			oninput={(e) => set_angle(Number((e.target as HTMLInputElement).value))}
		/>
	</div>
	<table class='angles'>
		<tbody>
			{#each ALL_AXES as axis}
				<tr>
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
	<div style:height='0px'></div>
</div>
{/if}

<style>
	.rotation-section {
		display        : flex;
		flex-direction : column;
		gap            : 4px;
	}

	.rotation-row {
		display     : flex;
		align-items : center;
		gap         : 6px;
	}

	.option-label {
		font-size   : 11px;
		opacity     : 0.6;
		min-width    : 28px;
		flex-shrink  : 0;
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

	.rotation-slider {
		flex         : 1;
		min-width    : 0;
		height       : 4px;
		cursor       : pointer;
		accent-color : var(--accent);
	}

	.angles {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 11px;
		margin-top      : 4px;
	}

	.angles td {
		border  : 0.5px solid currentColor;
		padding : 0;
	}

	.angle-name {
		width       : 16px;
		min-width   : 16px;
		font-weight : 600;
		opacity     : 0.7;
		text-align  : center;
		background  : var(--bg);
	}

	.angle-val {
		text-align           : right;
		font-variant-numeric : tabular-nums;
	}

	.angle-cell {
		width                : 100%;
		border               : none;
		background           : white;
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
		background : var(--accent);
	}

	.angle-cell:focus {
		background     : white;
		color          : black;
		outline        : 1.5px solid cornflowerblue;
		outline-offset : -1.5px;
	}

	.root-note {
		font-size   : 11px;
		opacity     : 0.5;
		text-align  : center;
		padding     : 0;
		line-height : 1;
	}
</style>
