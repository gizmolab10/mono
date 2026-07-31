<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { guides } from '../../ts/managers/Guides';
	import Separator from '../support/Separator.svelte';
	import { debug } from '../../ts/common/Debug';
	import Filters from './Filters.svelte';

	// The content box: the three filters across the top, and — for now — a count of what
	// they leave. The list of the surviving files arrives in the next phase.
	let { width }: { width: number } = $props();

	// All three filters are remembered across visits.
	const w_kind  = preferences.persistent<string>(T_Preference.filter_kind, '');
	const w_tags  = preferences.persistent<string[]>(T_Preference.filter_tags, []);
	const w_words = preferences.persistent<string>(T_Preference.filter_text, '');

	const w_ready = guides.w_ready;

	let matching = $derived($w_ready ? guides.filtered($w_kind, $w_tags, $w_words) : []);
	let total    = $derived($w_ready ? guides.files.length : 0);

	// Say what each filter did, with the real numbers, whenever the choice changes.
	let said_last = '';
	$effect(() => {
		if (!$w_ready) { return; }
		const line = `${$w_kind}|${$w_tags.join('+')}|${$w_words}`;
		if (line === said_last) { return; }
		said_last = line;
		debug.log(`Filters: kind "${$w_kind || 'all'}", tags [${$w_tags.join(', ') || 'any'}], words "${$w_words || 'none'}" — ${matching.length} of ${total} guides match.`);
	});
</script>

<div class='region content' style:width='{width}px'>
	<Filters {w_kind} {w_tags} {w_words} />
	<Separator />
	<div class='count'>
		{#if $w_ready}
			{matching.length} of {total} guides
		{:else}
			reading the guides…
		{/if}
	</div>
</div>

<style>
	.content {
		border-radius  : var(--radius);
		background     : var(--bg);
		padding        : var(--gap);
		flex-direction : column;
		box-sizing     : border-box;
		position       : relative;
		overflow       : auto;
		display        : flex;
		gap            : var(--gap);
		flex-shrink    : 0;
	}

	.count {
		font-size : var(--font-label);
		opacity   : var(--opacity-header);
	}
</style>
