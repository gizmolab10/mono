<script lang='ts'>
	import { w_operation, w_viewed, T_Operation, step_view, close_view } from '../../ts/managers/Operations';
	import Report from '../content/Report.svelte';
	import { debug } from '../../ts/common/Core';
	import { type File } from '../../ts/types/File';
	import type { Snippet } from 'svelte';
	import Browse from './Browse.svelte';
	import Edit from './Edit.svelte';

	// The content box, panel's region, given its width and height. It holds whichever of the two
	// things is happening: looking through the guides, or reading one. The host's three snippets
	// for this region pass through to where each is rendered.
	let { width, height, browse_filter, edit_filter, search_row, operation_view }: {
		width           : number;
		height          : number;
		browse_filter?  : Snippet;
		edit_filter?    : Snippet<[File, string, (words: string) => void]>;
		search_row?     : Snippet<[string]>;
		operation_view? : Snippet<[File, number, number, string, (words: string) => void, (message: string) => void]>;
	} = $props();

	// A guide the list no longer shows (its file gone, or a filter now hiding it) closes
	// itself rather than showing nothing at all.
	$effect(() => {
		if ($w_operation === T_Operation.edit && $w_viewed === null) {
			debug.log(`Reading: the guide being read is not in the list now — back to the guides.`);
			close_view();
		}
	});
</script>

{#if $w_operation === T_Operation.report}
	<Report />
{:else if $w_operation === T_Operation.edit && $w_viewed}
	<Edit
		name={$w_viewed.file.name}
		address={$w_viewed.file.address}
		tags={$w_viewed.tag_names}
		guide={$w_viewed.file}
		{width} {height} {edit_filter} {search_row} {operation_view}
		onprev={(repeated) => step_view(-1, repeated)}
		onnext={(repeated) => step_view(1, repeated)}
		onclose={() => { debug.log(`Reading: closed "${$w_viewed?.file.name}" — back to the guides.`); close_view(); }} />
{:else}
	<Browse {browse_filter} />
{/if}
