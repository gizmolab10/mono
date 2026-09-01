<script lang='ts'>
	import { w_operation, w_viewed, w_can_back, w_can_forward, T_Operation, step_view, close_view } from '../../ts/managers/Operations';
	import Editor from './Editor.svelte';
	import Report from '../content/Report.svelte';
	import { debug } from '../../ts/common/Core';
	import Browse from './Browse.svelte';

	// The content box. It holds whichever of the two things is happening: looking through
	// the guides, or reading one.
	let { width }: { width: number } = $props();

	// A guide the list no longer shows (its file gone, or a filter now hiding it) closes
	// itself rather than showing nothing at all.
	$effect(() => {
		if ($w_operation === T_Operation.edit && $w_viewed === null) {
			debug.log(`Reading: the guide being read is not in the list now — back to the guides.`);
			close_view();
		}
	});
</script>

<div class='region content' style:width='{width}px'>
	{#if $w_operation === T_Operation.report}
		<Report />
	{:else if $w_operation === T_Operation.edit && $w_viewed}
		<Editor
			name={$w_viewed.file.name}
			address={$w_viewed.file.address}
			tags={$w_viewed.tag_names}
			guide={$w_viewed.file}
			can_back={$w_can_back}
			can_forward={$w_can_forward}
			onprev={(repeated) => step_view(-1, repeated)}
			onnext={(repeated) => step_view(1, repeated)}
			onclose={() => { debug.log(`Reading: closed "${$w_viewed?.file.name}" — back to the guides.`); close_view(); }} />
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
		overflow       : visible;     /* the editor's top clickable pokes above the border; the rows scroll inside their own boxes */
		display        : flex;
		flex-shrink    : 0;
		min-height     : 0;
	}
</style>
