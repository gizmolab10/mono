<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { databases, w_hierarchy } from '../../ts/database/Databases';
	import { T_Storage } from '../../ts/types/DB_Records';
	import { w_db_changed } from '../../ts/types/Signal';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import Stack from '../support/Stack.svelte';
	import Action, { T_Position } from '../../ts/types/Action';
	import { k } from '../../ts/common/Constants';

	const binPath = svg_paths.trashcan();

	// Trimmed port of ws's D_Data: a readout of the document store plus a storage
	// db-storage hidden behind a clickable separator. ws showed graph-model counts,
	// import/export, and the db-storage; here we keep the counts that survive ji's
	// data (documents, tags, unsaved) and the db-storage. Only the local store is
	// built, so the cloud segment is a dimmed placeholder until firestore lands.

	const { w_storage } = databases;

	// Every storage the app knows, in switch order; local is built, remote is not.
	const storages = Object.values(T_Storage);
	const built = new Set<T_Storage>([T_Storage.private, T_Storage.llm]);

	// The more/less choice, remembered across reloads.
	const w_show_others = preferences.persistent<boolean>(T_Preference.show_stores, false);

	// Pure derived counts — recomputed on every store change (a save or a storage
	// switch bumps the tick). No write-inside-effect, so nothing can loop.
	const local_documents = $derived.by(() => { $w_db_changed; return $w_hierarchy.documents.length; });
	const tags            = $derived.by(() => { $w_db_changed; return $w_hierarchy.tags.length; });
	const db_adjective    = $derived.by(() => { $w_db_changed; return derive_adjective(); });

	// The documents count shown: what this store's own records hold, on every store.
	// It used to ask AnythingLLM on the AI store, but that answer counts only the files
	// whose words were uploaded — a picture or a clip is stored and never counted — so
	// the number disagreed with the list. The records are the same thing the list draws.
	const documents = $derived(local_documents);

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

	// The word that folds the storage controls away, built here rather than by the separator it
	// stands on. The browser makes a button one drawing after we ask, so this holds nothing on the
	// first drawing and the made button on the next — which is itself a change, so the stack is told.
	let fold_word = $state<HTMLElement | null>(null);
	const fold_action = $derived(Object.assign(new Action(), { element: fold_word, position: T_Position.center }));

	// Erasing asks first, then wipes only the active store.
	let confirming = $state(false);
	function ask_erase()    { confirming = true; }
	function cancel_erase() { confirming = false; }
	async function do_erase() {
		await $w_hierarchy.erase_all();
		confirming = false;
	}
	function derive_adjective_from(storage: string): string {
		switch (storage) {
			case T_Storage.private: return 'my';
			// case T_Storage.ours: return 'our';
			case T_Storage.llm:  return 'AI';
			default: return storage;
		}
	}
	function derive_adjective(): string {
		return derive_adjective_from ($w_storage);
	}
</script>

<!-- The fold word, written out of sight: the moment the browser has made it, the stack takes it
     and puts it on the line above the storage controls instead. -->
<div class='out_of_sight'>
	<button type='button' class='fold-word' bind:this={fold_word}
		onclick={toggle_others}>{$w_show_others ? 'less' : 'more'}</button>
</div>

<!-- What this store holds. -->
{#snippet shows_counts()}
	<div class='counts'>
		<div class='row'><span class='label'>documents</span><span class='count'>{documents}</span></div>
		<div class='row'><span class='label'>tags</span><span class='count'>{tags}</span></div>
	</div>
{/snippet}

<!-- Which store is being read, and the way to erase it. -->
{#snippet shows_storage()}
	<div class='db-controls'>
		{#if confirming}
			<div class='confirm'>
				<button class='no' use:tip={'keep the data'} onclick={cancel_erase}>no</button>
				<button class='yes' use:tip={'erase everything for good'} onclick={do_erase}>yes</button>
				<span class='sure'>erase {db_adjective} data?</span>
			</div>
		{:else}
			{#if local_documents > 0}
				<button class='erase' aria-label='erase all data' use:tip={`erase all ${derive_adjective()} files`} onclick={ask_erase}>
					<svg class='erase-bin' viewBox='0 0 24 24'>
						<path d={binPath}
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
						use:tip={$w_storage === storage ? false : (built.has(storage) ? `explore ${derive_adjective_from(storage)} data` : 'not built yet')}
						onclick={() => choose(storage)}>{storage}</button>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Two sections, a line centred in the gap between them, carrying the word that folds the lower
     one away. Nothing stands below, so nobody draws a line at the foot — a fold down there comes
     down to its own line and nothing else, which is what was drawn here before. -->
<div class='data'>
	<Stack thickness={k.separator.normal} foot='none' sections={[
		{ subsection: shows_counts },
		{ subsection: shows_storage, rides: [fold_action], folded: !$w_show_others },
	]} />
</div>

<style>

	/* A gap above and below, so what this section shows stands clear of the two lines around it. */
	.data {
		padding        : var(--gap) 0;
		flex-direction : column;
		display        : flex;
	}

	/* Where the fold word is written before the stack takes it. It is taken out of here on the
	   very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* The word that folds the storage controls away, standing at the middle of the line above them.
	   Its page-colored background masks the line behind it, the same way a title does. */
	.fold-word {
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--bg);
		font-family   : inherit;
		cursor        : pointer;
		white-space   : nowrap;
		border        : none;
	}

	.fold-word:hover {
		border     : 0.5px solid var(--darkgray);
		background : var(--hover);
	}

	/* The two counts, one under the other. */
	.counts {
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

	.sure {
		flex       : 1;                        /* fill the space left of the buttons... */
		text-align : center;                   /* ...and center the question within it */
	}

	/* The db-storage is centered in the row; the erase control is pinned to the left.
	   Nudged down a gap so it stands clear of the word on the line above it. Nudged, not stepped
	   in: this moves what is drawn and leaves the section's own height where it was. */
	.db-controls {
		height          : var(--height-control);
		top             : var(--gap-small);
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
