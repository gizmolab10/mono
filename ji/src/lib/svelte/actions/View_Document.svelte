<script lang='ts'>
	import { T_DocumentKind, view_mode } from '../../ts/types/DB_Records';
	import { databases } from '../../ts/database/Databases';
	import { debug } from '../../ts/common/Debug';

	// Show one document in the content area: its bytes read back and rendered by
	// type. The row's view button only lights for types a browser can show, so the
	// "can't show" branch is a guard, not the usual path.
	let { document_id, onclose }: { document_id: string; onclose: () => void } = $props();

	const doc  = $derived(databases.active.documents.find((d) => d.id === document_id) ?? null);
	const mode = $derived(doc ? view_mode(doc.kind) : null);

	// Read the bytes for the shown document, and re-read when the document changes.
	let content = $state<string | null>(null);
	let loaded  = $state(false);
	$effect(() => {
		const id = document_id;
		content = null;
		loaded  = false;
		databases.active.read_blob(id).then((bytes) => {
			content = bytes;
			loaded  = true;
			debug.log(`Viewer: read ${bytes?.length ?? 0} character(s) for document ${id}.`);
		});
	});

	// An svg is stored as its text; wrap it into a data-URL an image tag can show.
	// Every other image kind is already stored as a data-URL, so it is used as-is.
	const image_src = $derived.by(() => {
		if (content == null || doc == null) { return ''; }
		return doc.kind === T_DocumentKind.svg ? `data:image/svg+xml,${encodeURIComponent(content)}` : content;
	});
</script>

<div class='viewer'>
	<div class='view-head'>
		<span class='view-name'>{doc?.name ?? ''}</span>
		<button class='view-close' onclick={onclose}>close</button>
	</div>
	{#if !loaded}
		<div class='view-note'>loading…</div>
	{:else if content == null}
		<div class='view-note'>this document's bytes are missing</div>
	{:else if mode === 'image'}
		<img class='view-image' src={image_src} alt={doc?.name} />
	{:else if mode === 'pdf'}
		<iframe class='view-frame' src={content} title={doc?.name}></iframe>
	{:else if mode === 'text'}
		<pre class='view-text'>{content}</pre>
	{:else}
		<div class='view-note'>can't show this type here</div>
	{/if}
</div>

<style>
	.viewer {
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	.view-head {
		align-items     : center;
		justify-content : space-between;
		padding-bottom  : var(--gap);
		display         : flex;
	}

	.view-name {
		font-size : var(--font-label);
		color     : var(--text);
	}

	.view-close {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		box-sizing    : border-box;
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
		border-radius : var(--radius-pill);
	}

	.view-close:hover {
		background : var(--hover);
	}

	.view-image {
		object-fit : contain;
		max-height : 100%;
		max-width  : 100%;
		align-self : center;
	}

	.view-frame {
		border : none;
		width  : 100%;
		flex   : 1;
	}

	.view-text {
		font-size   : var(--font-label);
		color       : var(--text);
		white-space : pre-wrap;
		word-break  : break-word;
		overflow-y  : auto;
		margin      : 0;
		flex        : 1;
	}

	.view-note {
		opacity         : var(--opacity-label);
		font-size       : var(--font-base);
		color           : var(--text);
		align-items     : center;
		justify-content : center;
		display         : flex;
		flex            : 1;
	}
</style>
