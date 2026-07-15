<script lang='ts'>
	// Trimmed port of ws's D_Data: a readout of the document store plus a storage
	// switcher hidden behind a clickable separator. ws showed graph-model counts,
	// import/export, and the switcher; here we keep the counts that survive ji's
	// data (documents, tags, unsaved) and the switcher. Only the local store is
	// built, so the cloud segment is a dimmed placeholder until firestore lands.
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { T_Storage } from '../../ts/database/DB_Records';
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/database/Signal';

	const { w_storage } = databases;

	// Every storage the app knows, in switch order; local is built, remote is not.
	const storages = Object.values(T_Storage);
	const built = new Set<T_Storage>([T_Storage.private]);

	// The more/less choice, remembered across reloads.
	const w_show_others = preferences.persistent<boolean>(T_Preference.showOtherStores, false);

	// Pure derived counts — recomputed on every store change (a save or a storage
	// switch bumps the tick). No write-inside-effect, so nothing can loop.
	const documents = $derived.by(() => { $w_db_changed; return databases.active.documents.length; });
	const tags      = $derived.by(() => { $w_db_changed; return databases.active.tags.length; });

	function choose(storage: T_Storage) {
		if (!built.has(storage)) {
			// debug.log(`The ${storage} store is not built yet — staying on the ${$w_storage} store.`);
			return;
		}
		if (storage === $w_storage) { return; }
		databases.change_storage(storage);
	}

	function toggle_others() {
		w_show_others.update((shown) => !shown);
	}

	// Erasing asks first, then wipes only the active store.
	let confirming = $state(false);
	function ask_erase()    { confirming = true; }
	function cancel_erase() { confirming = false; }
	function do_erase() {
		databases.active.erase_all();
		confirming = false;
	}
</script>

<div class='data'>
	<div class='row'><span class='label'>documents</span><span class='count'>{documents}</span></div>
	<div class='row'><span class='label'>tags</span><span class='count'>{tags}</span></div>

	<!-- The separator doubles as a clickable toggle for the storage switcher. -->
	<button class='separator' onclick={toggle_others}>
		<span class='separator-label'>{$w_show_others ? 'less' : 'more'}</span>
	</button>

	{#if $w_show_others}
		<div class='switcher-row'>
			{#if confirming}
				<div class='confirm'>
					<button class='no' onclick={cancel_erase}>no</button>
					<button class='yes' onclick={do_erase}>yes</button>
					<span class='sure'>erase {$w_storage} data?</span>
				</div>
			{:else}
				<button class='erase' title='erase all data' onclick={ask_erase}>erase</button>
				<div class='switcher'>
					{#each storages as storage}
						<button
							class='segment'
							class:disabled={!built.has(storage)}
							class:current={$w_storage === storage}
							title={built.has(storage) ? '' : 'not built yet'}
							onclick={() => choose(storage)}>{storage}</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>

	.data {
		gap            : var(--gap);
		flex-direction : column;
		display        : flex;
	}

	.row {
		gap             : var(--gap-fat);
		justify-content : space-between;
		align-items     : center;
		display         : flex;
	}

	.label {
		opacity   : var(--opacity-label);
		font-size : var(--font-label);
	}

	.count {
		font-size : var(--font-label);
	}

	/* A full-width rule with the centered label floating over it; the label's
	   background masks the line so it reads as text sitting on a broken line. */
	.separator {
		padding         : var(--pad-control);
		background      : transparent;
		position        : relative;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		margin-top      : -3px;                /* nudge the rule (and all below) up 3px */
		border          : none;
		display         : flex;
		width           : 100%;
	}

	.separator::before {
		height     : var(--thickness-faint);
		background : var(--black);
		position   : absolute;
		top        : 50%;
		content    : '';
		right      : 0;
		left       : 0;
	}

	.sure {
		flex       : 1;                        /* fill the space left of the buttons... */
		text-align : center;                   /* ...and center the question within it */
	}

	.separator-label {
		border        : var(--thickness-faint) solid var(--bg);
		opacity    	  : var(--opacity-label);
		font-size  	  : var(--font-label);
		padding    	  : 0 var(--gap);
		background 	  : var(--bg);
		position   	  : relative;
		border-radius : 999px;
		opacity       : 1;
	}

	.separator:hover .separator-label {
		border     : var(--thickness-faint) solid var(--black);
		background : var(--white);
	}

	/* The switcher sits at the far right; the erase control is pinned to the left. */
	.switcher-row {
		height          : var(--height-control);
		position        : relative;
		align-items     : center;
		justify-content : flex-end;
		display         : flex;
		width           : 100%;
		margin-top      : -3px;                /* pull the erase + switcher 3px closer to the rule */
		margin-bottom   : 2px;                 /* give back the 6px pulled up, keeping the space below */
	}

	.erase {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		position      : absolute;
		cursor        : pointer;
		border-radius : 999px;
		left          : 0;
	}

	.erase:hover {
		background : var(--hover);
	}

	/* Full-width row: the question centers in the free space, the buttons sit right. */
	.confirm {
		font-size   : var(--font-label);
		gap         : var(--gap-tight);
		position    : absolute;
		align-items : center;
		display     : flex;
		right       : 0;
		left        : 0;
	}

	.yes, .no {
		border        : var(--thickness-normal) solid var(--black);
		padding       : var(--pad-control);
		background    : var(--white);
		cursor        : pointer;
		border-radius : 999px;
	}

	.yes:hover, .no:hover {
		background : var(--hover);
	}

	/* One pill with a segment per storage; the active one fills --accent. */
	.switcher {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-base);
		background    : var(--white);
		align-self    : center;
		overflow      : hidden;
		border-radius : 999px;
		display       : flex;
	}

	.segment {
		padding    : var(--pad-control);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		border     : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.segment.current {
		background : var(--accent);
	}

	.segment.disabled {
		opacity : var(--opacity-label);
		cursor  : not-allowed;
	}

	.segment:not(.disabled):hover {
		background : var(--hover);
	}

</style>
