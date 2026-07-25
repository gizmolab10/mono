<script lang='ts'>
	import { anything_llm } from '../../ts/database/AnythingLLM';
	import { debug } from '../../ts/common/Debug';

	// Ask a question of the LLM store's documents. The words were mirrored to AnythingLLM
	// (phase B); this sends the question there and shows the answer plus the documents it
	// drew from. Shown only when the LLM store is the chosen one.

	let question = $state('');
	let asking   = $state(false);
	let answer   = $state<string | null>(null);
	let sources  = $state<string[]>([]);

	async function ask() {
		const q = question.trim();
		if (!q || asking) { return; }
		asking = true; answer = null; sources = [];
		debug.log(`Ask the LLM store: "${q}".`);
		const result = await anything_llm.ask(q);
		asking = false;
		if (!result) { answer = "Couldn't reach the model — is AnythingLLM set up and its model running?"; return; }
		answer  = result.answer || '(no answer)';
		sources = result.sources;
	}

	function on_key(event: KeyboardEvent) {
		if (event.key === 'Enter') { event.preventDefault(); ask(); }
	}
</script>

<div class='ask'>
	<div class='ask-row'>
		<input class='ask-input' type='text' placeholder='ask a question'
			bind:value={question} onkeydown={on_key} disabled={asking} />
		<button class='ask-go' onclick={ask} disabled={asking || !question.trim()}>{asking ? '…' : 'ask'}</button>
	</div>
	{#if answer !== null}
		<div class='ask-answer'>{answer}</div>
		{#if sources.length > 0}
			<div class='ask-sources'>from: {#each sources as source, i}{i > 0 ? ', ' : ''}{source}{/each}</div>
		{/if}
	{/if}
</div>

<style>
	.ask {
		flex-direction : column;
		padding        : var(--gap);
		display        : flex;
		gap            : var(--gap);
	}

	.ask-row {
		align-items : center;
		display     : flex;
		gap         : var(--gap);
	}

	.ask-input {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-label);
		background    : var(--white);
		box-sizing    : border-box;
		border-radius : var(--radius);
		padding       : 0 var(--gap);
		flex          : 1;
	}

	.ask-input:focus {
		background : var(--hover);
		outline    : none;
	}

	.ask-go {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-label);
		background    : var(--accent);
		color         : var(--text-on-accent);
		box-sizing    : border-box;
		border-radius : var(--radius-pill);
		padding       : 0 var(--gap-fat);
		cursor        : pointer;
	}

	.ask-go:disabled {
		opacity : var(--opacity-label);
		cursor  : default;
	}

	.ask-answer {
		font-size   : var(--font-label);
		white-space : pre-wrap;
	}

	.ask-sources {
		opacity   : var(--opacity-label);
		font-size : var(--font-credit);
	}
</style>
