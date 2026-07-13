<script lang='ts'>
	// Trimmed port of ws's D_Data: a readout of the document store plus a storage
	// switcher hidden behind a clickable separator. ws showed graph-model counts,
	// import/export, and the switcher; here we keep the counts that survive ji's
	// data (documents, tags, unsaved) and the switcher. Only the local store is
	// built, so the cloud segment is a dimmed placeholder until firestore lands.
	import { databases } from '../../ts/database/Databases';
	import { T_Storage } from '../../ts/database/DB_Records';

	const { w_storage } = databases;

	// Every storage the app knows, in switch order; local is built, remote is not.
	const storages = Object.values(T_Storage);
	const built = new Set<T_Storage>([T_Storage.local]);

	let show_others = $state(false);
	let documents   = $state(0);
	let tags        = $state(0);
	let unsaved     = $state(0);

	function refresh() {
		const db = databases.active;
		documents = db.documents.length;
		tags      = db.tags.length;
		unsaved   = db.persistable.total_dirty_count;
		// console.log(`Store readout on the ${db.storage} store: ${documents} document(s), ${tags} tag(s), ${unsaved} still need saving.`);
	}

	function choose(storage: T_Storage) {
		if (!built.has(storage)) {
			// console.log(`The ${storage} store is not built yet — staying on the ${$w_storage} store.`);
			return;
		}
		if (storage === $w_storage) { return; }
		databases.change_storage(storage);
		refresh();
	}

	function toggle_others() {
		show_others = !show_others;
		// console.log(`${show_others ? 'Showing' : 'Hiding'} the other stores; ${built.size} of ${storages.length} are built.`);
	}

	refresh();
</script>

<div class='data'>
	<div class='row'><span class='label'>documents</span><span class='count'>{documents}</span></div>
	<div class='row'><span class='label'>tags</span><span class='count'>{tags}</span></div>
	<div class='row'><span class='label'>unsaved</span><span class='count'>{unsaved}</span></div>

	<!-- The separator doubles as a clickable toggle for the storage switcher. -->
	<button class='separator' onclick={toggle_others}>
		<span class='separator-label'>{show_others ? 'hide other stores' : 'show other stores'}</span>
	</button>

	{#if show_others}
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

<style>
	.data {
		gap            : var(--gap);
		flex-direction : column;
		display        : flex;
	}

	.row {
		gap             : var(--gap-preferences);
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
		padding         : var(--pad-segment);
		background      : transparent;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		position        : relative;
		border          : none;
		display         : flex;
		width           : 100%;
	}

	.separator::before {
		content    : '';
		background : var(--black);
		position   : absolute;
		height     : var(--thickness-normal);
		top        : 50%;
		right      : 0;
		left       : 0;
	}

	.separator-label {
		background : var(--bg);
		padding    : 0 var(--gap);
		opacity    : var(--opacity-label);
		font-size  : var(--font-label);
		position   : relative;
	}

	.separator:hover .separator-label {
		opacity : 1;
	}

	/* One pill with a segment per storage; the active one fills --accent. */
	.switcher {
		border         : var(--thickness-normal) solid var(--black);
		height         : var(--height-group);
		border-radius  : var(--radius-pill);
		font-size      : var(--font-base);
		background     : var(--white);
		align-self     : center;
		overflow       : hidden;
		display        : flex;
	}

	.segment {
		padding    : var(--pad-segment);
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
