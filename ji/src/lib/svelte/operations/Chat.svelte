<script lang='ts'>
	import { anything_llm } from '../../ts/database/AnythingLLM';
	import type { Exchange } from '../../ts/types/DB_Records';
	import { debug } from '../../ts/common/Debug';

	// The chat view (the "ask" operation): a question box at the top, then the running
	// conversation below — each stored exchange newest first, its question above its
	// answer, the answer collapsible. AnythingLLM keeps the history itself, so a reload
	// resumes the conversation: we read it back on mount. Shown only for the LLM store.

	let question = $state('');
	let asking   = $state(false);
	let loading  = $state(false);
	let error    = $state<string | null>(null);
	let exchanges = $state<Exchange[]>([]);
	let collapsed = $state(new Set<number>());   // the times of exchanges whose answer is hidden

	// Read the saved conversation back, newest first. Runs on mount (so a refresh resumes)
	// and again after each new question.
	async function load() {
		loading = true;
		exchanges = await anything_llm.get_exchanges(50);
		loading = false;
		debug.log(`Chat: loaded ${exchanges.length} exchange(s) from the workspace.`);
	}
	$effect(() => { load(); });

	async function ask() {
		const q = question.trim();
		if (!q || asking) { return; }
		asking = true; error = null;
		debug.log(`Chat: asking "${q}".`);
		const result = await anything_llm.ask(q);
		asking = false;
		if (!result) {
			error = "Couldn't reach the model — is AnythingLLM set up and its model running?";
			debug.log('Chat: ask failed — model unreachable.');
			return;
		}
		question = '';
		await load();   // the new exchange is now stored — refresh to show it at the top
	}

	function on_key(event: KeyboardEvent) {
		if (event.key === 'Enter') { event.preventDefault(); ask(); }
	}

	// Collapse hides an answer; the question stays. One at a time, or all at once.
	function toggle_one(time: number) {
		const next = new Set(collapsed);
		if (next.has(time)) { next.delete(time); } else { next.add(time); }
		collapsed = next;
		debug.log(`Chat: ${next.has(time) ? 'collapsed' : 'expanded'} the answer for exchange at ${time}; ${next.size} collapsed of ${exchanges.length}.`);
	}
	function collapse_all() { collapsed = new Set(exchanges.map((e) => e.time)); debug.log(`Chat: collapsed all ${exchanges.length} answer(s).`); }
	function expand_all()   { collapsed = new Set(); debug.log('Chat: expanded all answers.'); }

	// One toggle for the lot: when every answer is hidden it offers to expand, else to
	// collapse.
	const all_collapsed = $derived(exchanges.length > 0 && collapsed.size === exchanges.length);
	function toggle_all() { if (all_collapsed) { expand_all(); } else { collapse_all(); } }

	// A stored second turned into a short, readable stamp.
	function when(time: number): string {
		return time ? new Date(time * 1000).toLocaleString() : '';
	}
</script>

<div class='chat'>
	<div class='ask-row'>
		<input class='ask-input' type='text' placeholder='ask a question'
			bind:value={question} onkeydown={on_key} disabled={asking} />
		<button class='ask-go' onclick={ask} disabled={asking || !question.trim()}>{asking ? '…' : 'ask'}</button>
	</div>

	{#if error}
		<div class='chat-error'>{error}</div>
	{/if}

	{#if exchanges.length > 0}
		<div class='chat-controls'>
			<button class='toggle-all' onclick={toggle_all}>{all_collapsed ? 'expand' : 'collapse'} all</button>
		</div>
	{/if}

	<div class='conversation'>
		{#each exchanges as ex, i (i)}
			<div class='exchange'>
				<button class='question' onclick={() => toggle_one(ex.time)} title={collapsed.has(ex.time) ? 'show answer' : 'hide answer'}>
					<span class='q-text'>{ex.question}</span>
					<span class='q-when'>{when(ex.time)}</span>
				</button>
				{#if !collapsed.has(ex.time)}
					<div class='answer'>{ex.reply}</div>
					{#if ex.sources.length > 0}
						<div class='sources'>from: {ex.sources.join(', ')}</div>
					{/if}
				{/if}
			</div>
		{/each}
		{#if !loading && exchanges.length === 0}
			<div class='empty'>no questions yet</div>
		{/if}
	</div>
</div>

<style>
	.chat {
		box-sizing     : border-box;
		padding        : var(--gap);
		gap            : var(--gap);
		flex-direction : column;
		display        : flex;
		height         : 100%;
		min-height     : 0;
	}

	.ask-row {
		gap         : var(--gap);
		align-items : center;
		display     : flex;
		flex-shrink : 0;
	}

	.ask-input {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-label);
		border-radius : var(--radius);
		background    : var(--white);
		padding       : 0 var(--gap);
		box-sizing    : border-box;
		flex          : 1;
	}

	.ask-input:focus {
		background : var(--hover);
		outline    : none;
	}

	.ask-go {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		color         : var(--text-on-accent);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		padding       : 0 var(--gap-fat);
		background    : var(--accent);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.ask-go:disabled {
		opacity : var(--opacity-label);
		cursor  : default;
	}

	.chat-error {
		color     : var(--accent-dark);
		font-size : var(--font-label);
	}

	.chat-controls {
		gap         : var(--gap);
		display     : flex;
		flex-shrink : 0;
	}

	.toggle-all {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		padding       : 0 var(--gap-fat);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.toggle-all:hover {
		background : var(--hover);
	}

	/* The running conversation scrolls; the question box and controls stay put. The
	   right padding sets a --gap between the exchanges and the scrollbar. */
	.conversation {
		gap            : var(--gap);
		padding-right  : var(--gap);
		flex-direction : column;
		overflow-y     : auto;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* Width alone is ignored on the overlay scrollbar — styling the thumb forces the
	   classic bar that honors it (the same trick the documents table uses). */
	.conversation::-webkit-scrollbar {
		width : var(--size-cross);
	}

	.conversation::-webkit-scrollbar-thumb {
		background    : var(--accent);
		border-radius : 999px;
	}

	.conversation::-webkit-scrollbar-track {
		background : transparent;
	}

	.exchange {
		gap            : var(--gap-tight);
		flex-direction : column;
		display        : flex;
	}

	/* The question reads as a header over its answer, lit in the accent; a click hides
	   or shows the answer. */
	.question {
		border          : var(--thickness-normal) solid var(--black);
		color           : var(--text-on-accent);
		padding         : var(--pad-control);
		font-size       : var(--font-label);
		border-radius   : var(--radius);
		background      : var(--accent);
		justify-content : space-between;
		box-sizing      : border-box;
		gap             : var(--gap);
		align-items     : baseline;
		cursor          : pointer;
		display         : flex;
		text-align      : left;
	}

	/* Let the question text take the room and wrap, even a long unbroken key, so a wide
	   line never pushes a horizontal scrollbar. */
	.q-text {
		overflow-wrap : anywhere;
		min-width     : 0;
		flex          : 1;
	}

	.q-when {
		opacity     : var(--opacity-label);
		font-size   : var(--font-credit);
		white-space : nowrap;
		flex-shrink : 0;
	}

	.answer {
		padding       : 0 var(--pad-control);
		font-size     : var(--font-label);
		white-space   : pre-wrap;
		overflow-wrap : anywhere;
	}

	.sources {
		padding       : 0 var(--pad-control);
		opacity       : var(--opacity-label);
		font-size     : var(--font-credit);
		overflow-wrap : anywhere;
	}

	.empty {
		opacity   : var(--opacity-label);
		font-size : var(--font-label);
	}
</style>
