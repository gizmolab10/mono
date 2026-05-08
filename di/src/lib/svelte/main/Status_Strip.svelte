<script lang="ts">
	import { status } from '../../ts/managers/Status';

	const w_queue = status.w_queue;
	$: current = $w_queue[0] ?? null;
</script>

{#if current}
	<div
		class:error={current.kind === 'error'}
		class='status-strip'>
		{current.text}
	</div>
{/if}

<style>
	.status-strip {
		right           : calc(var(--w-guides-slider) + 2 * var(--l-gap));
		left            : calc(var(--w-build-button) + 2 * var(--l-gap));
		height          : var(--h-button-common);
		font-size       : var(--font-common);
		color           : rgba(0, 0, 0, 0.7);
		bottom          : var(--l-padding);
		z-index         : var(--z-action);
		position        : absolute;
		align-items     : center;
		justify-content : center;
		display         : flex;
		pointer-events  : none;
		user-select     : none;
	}

	.status-strip.error {
		color : rgb(200, 30, 30);
	}
</style>
