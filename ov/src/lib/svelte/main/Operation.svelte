<script lang='ts'>
	import { w_operation, w_view_guide, w_viewable_run, w_can_step, T_Operation, step_view, close_view } from '../../ts/managers/Operations';
	import View_Guide from '../content/View_Guide.svelte';
	import { debug } from '../../ts/common/Debug';
	import Browse from '../content/Browse.svelte';

	// The content box. It holds whichever of the two things is happening: looking through
	// the guides, or reading one.
	let { width }: { width: number } = $props();

	// The guide being read, found in the run by where it sits. A guide the list no longer
	// shows (its file gone, or a filter now hiding it) closes itself rather than showing
	// nothing at all.
	const viewed = $derived($w_viewable_run.find((r) => r.key === $w_view_guide) ?? null);

	$effect(() => {
		if ($w_operation === T_Operation.view && $w_view_guide !== null && viewed === null && $w_viewable_run.length > 0) {
			debug.log(`Reading: the guide "${$w_view_guide}" is not in the list now — back to the guides.`);
			close_view();
		}
	});
</script>

<div class='region content' style:width='{width}px'>
	{#if $w_operation === T_Operation.view && viewed}
		<View_Guide
			name={viewed.name}
			address={viewed.address}
			can_step={$w_can_step}
			onprev={() => step_view(-1)}
			onnext={() => step_view(1)}
			onclose={() => { debug.log(`Reading: closed "${viewed?.name}" — back to the guides.`); close_view(); }} />
	{:else}
		<Browse />
	{/if}
</div>

<style>
	.content {
		border-radius  : var(--radius);
		padding        : var(--gap);
		box-sizing     : border-box;
		gap            : var(--gap);
		background     : var(--bg);
		position       : relative;
		flex-direction : column;
		overflow       : hidden;      /* the filters stay put; only the rows scroll */
		display        : flex;
		flex-shrink    : 0;
		min-height     : 0;
	}
</style>
