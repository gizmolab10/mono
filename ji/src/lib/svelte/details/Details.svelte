<script lang='ts'>
	import Hideable from './Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';
	import D_Data from './D_Data.svelte';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { debug } from '../../ts/common/Debug';

	// The collapsible details region: the preferences and data panels. The frame
	// computes its width. Each section remembers whether it was left open — bound
	// to a stored flag, so a reload brings it back the way it was (open the first
	// time).
	let { width }: { width: number } = $props();

	const w_preferences_open = preferences.persistent<boolean>(T_Preference.detailsPreferencesOpen, true);
	const w_data_open        = preferences.persistent<boolean>(T_Preference.detailsDataOpen, true);

	$effect(() => {
		debug.log(`Details sections — preferences ${$w_preferences_open ? 'open' : 'closed'}, data ${$w_data_open ? 'open' : 'closed'}.`);
	});
</script>

<div class='region details' style:width='{width}px'>
	<Hideable title='preferences' bind:open={$w_preferences_open}>
		<D_Preferences />
	</Hideable>
	<Hideable title='data' bind:open={$w_data_open}>
		<D_Data />
	</Hideable>
</div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.details {
		background     : var(--accent);
		flex-direction : column;
		display        : flex;
		gap            : var(--gap-details);
		flex-shrink    : 0;
	}
</style>
