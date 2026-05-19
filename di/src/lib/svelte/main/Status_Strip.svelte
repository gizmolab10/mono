<script lang="ts">
	import { status } from '../../ts/managers/Status';
	import { stores } from '../../ts/managers/Stores';
	import { w_dim_dropped_avg } from '../../ts/render/R_Dimensions';

	const w_queue = status.w_queue;
	const w_orientation = stores.w_orientation;
	const w_scale = stores.w_scale;
	$: current = $w_queue[0] ?? null;
	$: quat_text = format_quat($w_orientation);
	$: scale_text = format_scale($w_scale);

	function format_quat(q: number[]): string {
		const fmt = (n: number) => n.toFixed(2);
		return `[${fmt(q[0])}, ${fmt(q[1])}, ${fmt(q[2])}, ${fmt(q[3])}]`;
	}

	function format_scale(s: number): string {
		if (s < 10) return s.toFixed(2);
		if (s < 100) return s.toFixed(1);
		return s.toFixed(0);
	}
</script>

{#if current}
	<div
		class:error={current.kind === 'error'}
		class='status-strip'>
		{current.text}
	</div>
{:else if $w_dim_dropped_avg > 0}
	<div class='status-strip'>
		{$w_dim_dropped_avg} dimension{$w_dim_dropped_avg === 1 ? '' : 's'} dropped · {quat_text} tumble · zoom {scale_text}
	</div>
{:else}
	<div class='status-strip'>{quat_text} · zoom {scale_text}</div>
{/if}

<style>
	.status-strip {
		font-size       : var(--font-common);
		color           : var(--c-track);
		align-items     : center;
		justify-content : center;
		display         : flex;
		pointer-events  : auto;
		user-select     : text;
		flex            : 1;
	}

	.status-strip.error {
		color : rgb(255, 120, 120);
	}
</style>
