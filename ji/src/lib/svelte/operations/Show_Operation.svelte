<script lang='ts'>
	import { w_operation, w_view_document, T_Operation, w_can_step, step_view, close_view } from '../../ts/managers/Operations';
	import { databases } from '../../ts/database/Databases';
	import { T_Storage } from '../../ts/types/DB_Records';
	import Initialize_LocalStorage from './Initialize_LocalStorage.svelte';
	import Drop_Documents from './Drop_Documents.svelte';
	import List_Documents from './List_Documents.svelte';
	import View_Document from './View_Document.svelte';
	import Manage_Tags from './Manage_Tags.svelte';
	import Chat from './Chat.svelte';

	// The content region: shows exactly one view for the current operation — the drop
	// box when adding, the document viewer when viewing (handed the step callbacks), the
	// LLM ask box when the ask store is asking, else the documents list. The width is
	// worked out by the frame (it shrinks when the details region is open).
	let { width }: { width: number } = $props();

	const w_storage = databases.w_storage;
</script>

<div class='region content' style:width='{width}px'>
	{#if $w_operation === T_Operation.init}
		<Initialize_LocalStorage />
	{:else if $w_operation === T_Operation.drop}
		<Drop_Documents />
	{:else if $w_operation === T_Operation.view && $w_view_document}
		<View_Document document_id={$w_view_document} onclose={close_view}
			can_step={$w_can_step} onprev={() => step_view(-1)} onnext={() => step_view(1)} />
	{:else if $w_storage === T_Storage.llm && $w_operation === T_Operation.chat}
		<Chat />
	{:else if $w_operation === T_Operation.tags}
		<Manage_Tags />
	{:else}
		<List_Documents />
	{/if}
</div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	/* A flex column so the view it holds can fill the height (the drop box stretches
	   to full height this way, the list keeps its own scrolling). */
	.content {
		background     : var(--bg);
		flex-direction : column;
		display        : flex;
		flex           : 1;
	}
</style>
