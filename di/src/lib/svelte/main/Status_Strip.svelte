<script lang="ts">
	import { status } from '../../ts/managers/Status';
	import { w_dim_dropped_avg } from '../../ts/render/R_Dimensions';

	const w_queue = status.w_queue;
	$: current = $w_queue[0] ?? null;
</script>

{#if current}
	<div
		class:error={current.kind === 'error'}
		class='status-strip'>
		{current.text}
	</div>
{:else if $w_dim_dropped_avg > 0}
	<div class='status-strip'>
		{$w_dim_dropped_avg} dimension{$w_dim_dropped_avg === 1 ? '' : 's'} dropped (average)
	</div>
{:else}
	<div class='status-strip'></div>
{/if}

<style>
	.status-strip {
		font-size       : var(--font-common);
		color           : var(--c-track);
		align-items     : center;
		justify-content : center;
		display         : flex;
		pointer-events  : none;
		user-select     : none;
		flex            : 1;
	}

	.status-strip.error {
		color : rgb(255, 120, 120);
	}
</style>
