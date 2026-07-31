<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import Guides_List from './Guides_List.svelte';
	import Separator from '../support/Separator.svelte';
	import Filters from '../support/Filters.svelte';
	import { guides } from '../../ts/managers/Guides';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Looking through the guides: the three filters across the top, how many they leave,
	// and the list itself.

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

<Filters {w_kind} {w_tags} {w_words} />
<Separator thickness={k.separator.huge}/>
<div class='count'>
	{matching.length} guides (of {total})
</div>
<Guides_List {w_kind} {w_tags} {w_words} />

<style>
	/* Pulled 2px closer to the dividers above and below, so the row takes less height
	   without anything overlapping. */
	.count {
		opacity    : var(--opacity-header);
		font-size  : var(--font-label);
		text-align : center;
		margin     : -2px 0;
	}
</style>
