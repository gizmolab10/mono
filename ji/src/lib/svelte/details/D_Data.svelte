<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { databases, w_hierarchy } from '../../ts/database/Databases';
	import { T_Storage } from '../../ts/types/DB_Records';
	import { w_db_changed } from '../../ts/types/Signal';

	// Trimmed port of ws's D_Data: a readout of the document store plus a storage
	// db-storage hidden behind a clickable separator. ws showed graph-model counts,
	// import/export, and the db-storage; here we keep the counts that survive ji's
	// data (documents, tags, unsaved) and the db-storage. Only the local store is
	// built, so the cloud segment is a dimmed placeholder until firestore lands.

	const { w_storage } = databases;

	// Every storage the app knows, in switch order; local is built, remote is not.
	const storages = Object.values(T_Storage);
	const built = new Set<T_Storage>([T_Storage.mine, T_Storage.llm]);

	// The more/less choice, remembered across reloads.
	const w_show_others = preferences.persistent<boolean>(T_Preference.showOtherStores, false);

	// Pure derived counts — recomputed on every store change (a save or a storage
	// switch bumps the tick). No write-inside-effect, so nothing can loop.
	const documents    = $derived.by(() => { $w_db_changed; return $w_hierarchy.documents.length; });
	const tags         = $derived.by(() => { $w_db_changed; return $w_hierarchy.tags.length; });
	const db_adjective = $derived.by(() => { $w_db_changed; return derive_adjective(); });

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
	async function do_erase() {
		await $w_hierarchy.erase_all();
		confirming = false;
	}
	function derive_adjective(): string {
		switch ($w_storage) {
			case T_Storage.mine: return 'my';
			// case T_Storage.ours: return 'our';
			case T_Storage.llm:  return 'LLM';
		}
	}
</script>

<div class='data'>
	<div class='row'><span class='label'>documents</span><span class='count'>{documents}</span></div>
	<div class='row'><span class='label'>tags</span><span class='count'>{tags}</span></div>

	<!-- The separator doubles as a clickable toggle for the storage db-storage. -->
	<button class='separator' onclick={toggle_others}>
		<span class='separator-label'>{$w_show_others ? 'less' : 'more'}</span>
	</button>

	{#if $w_show_others}
		<div class='db-controls'>
			{#if confirming}
				<div class='confirm'>
					<button class='no' onclick={cancel_erase}>no</button>
					<button class='yes' onclick={do_erase}>yes</button>
					<span class='sure'>erase {db_adjective} data?</span>
				</div>
			{:else}
				{#if documents > 0}
					<button class='erase' title='erase all data' onclick={ask_erase}>
						<svg class='erase-bin' viewBox='0 0 24 24'>
							<path d='M4 6 H20 M9 6 V4 H15 V6 M6 6 L7 20 H17 L18 6 M10 10 V17 M14 10 V17'
								fill='none' stroke='currentColor' stroke-width='1.6'
								stroke-linecap='round' stroke-linejoin='round' />
						</svg>
					</button>
				{/if}
				<div class='db-storage'>
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

	/* The db-storage is centered in the row; the erase control is pinned to the left. */
	.db-controls {
		height          : var(--height-control);
		position        : relative;
		justify-content : center;
		align-items     : center;
		display         : flex;
		width           : 100%;
		margin-top      : -3px;                /* pull the erase + db-storage 3px closer to the rule */
		margin-bottom   : 2px;                 /* give back the 6px pulled up, keeping the space below */
	}

	/* The erase control is the same drawn trashcan as the documents table's row delete;
	   on hover it lights to a round --accent-outlined --hover pill. The transparent
	   border is always there so the hover outline doesn't nudge the icon. */
	.erase {
		border          : var(--thickness-normal) solid transparent;
		height          : var(--height-control);
		width           : var(--height-control);
		border-radius   : var(--radius-percent);
		color           : var(--accent-dark);
		background      : transparent;
		box-sizing      : border-box;
		position        : absolute;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
		left            : 0;
	}

	.erase-bin {
		width   : var(--size-svg);
		height  : var(--size-svg);
		display : block;
	}

	.erase:hover {
		border     : var(--thickness-normal) solid var(--accent);
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
		height        : var(--height-control);
		box-sizing    : border-box;
		padding       : var(--pad-control);
		background    : var(--white);
		cursor        : pointer;
		border-radius : 999px;
	}

	.yes:hover, .no:hover {
		background : var(--hover);
	}

	/* One pill with a segment per storage; the active one fills --accent. */
	.db-storage {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-base);
		background    : var(--white);
		box-sizing    : border-box;
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
		color      : var(--text-on-accent);
		cursor     : default;             /* already chosen — nothing to click */
	}

	.segment.disabled {
		opacity : var(--opacity-label);
		cursor  : not-allowed;
	}

	/* Light a segment under the cursor — but not the one already chosen, and not a
	   segment that isn't built. */
	.segment:not(.disabled):not(.current):hover {
		background : var(--hover);
	}

</style>
