<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import D_Preferences from './D_Preferences.svelte';
	import { debug } from '../../ts/common/Debug';
	import Hideable from './Hideable.svelte';
	import D_Data from './D_Data.svelte';

	// The collapsible details region: the preferences and data panels. The frame
	// computes its width. Each section remembers whether it was left open — bound
	// to a stored flag, so a reload brings it back the way it was (open the first
	// time).
	let { width, buildNumber, onBuildOpen }: { width: number; buildNumber: number; onBuildOpen: () => void } = $props();

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

<!-- Pinned to the bottom-left of the whole frame (fixed to the window), so it holds
     its spot even though the details region owns it now — shown only while details is. -->
<div class='bottom-row layer-intersection'>
	<button class='build-button' onclick={onBuildOpen}>
		build {buildNumber}
	</button>
	<a class='author-credit' href='https://designintuition.app' target='_blank' rel='nobutton'>
		author: jonathan sand
	</a>
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

	/* Pinned to the bottom-left of the whole frame, above everything. */
	.bottom-row {
		bottom         : var(--inset-credit-bottom);
		left           : var(--inset-credit-left);
		gap            : var(--gap);
		align-items    : center;
		position       : fixed;
		display        : flex;
		flex-direction : row;
	}

	.build-button {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--gray);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.build-button:hover {
		background : var(--hover);
	}

	.author-credit {
		font-size       : var(--font-credit);
		color           : var(--white);
		text-decoration : underline;
		cursor          : pointer;
	}

	.author-credit:hover {
		color : var(--hover);
	}
</style>
