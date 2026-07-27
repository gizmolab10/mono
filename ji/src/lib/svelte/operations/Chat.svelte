<script lang='ts'>
	import { anything_llm, w_llm_reachable } from '../../ts/database/AnythingLLM';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import Separator from '../support/Separator.svelte';
	import type { Exchange } from '../../ts/types/DB_Records';
	import { debug } from '../../ts/common/Debug';
	import { get } from 'svelte/store';

	// Whether answers show or stay hidden — saved, so the choice holds across reloads.
	// Managed by the show/hide-all buttons below (collapse_all / expand_all) and applied
	// once on launch. Per-question toggles don't touch it.
	const w_show_chat_replies = preferences.persistent<boolean>(T_Preference.showChatReplies, true);

	// The chat view (the "ask" operation): a question box at the top, then the running
	// conversation below — each stored exchange newest first, its question above its
	// answer, the answer collapsible. AnythingLLM keeps the history itself, so a reload
	// resumes the conversation: we read it back on mount. Shown only for the LLM store.

	let question  = $state('');
	let asking    = $state(false);
	let error     = $state<string | null>(null);
	let exchanges = $state<Exchange[]>([]);
	let collapsed = $state(new Set<number>());   // the times of exchanges whose answer is hidden

	let applied_initial = false;   // has the saved show/hide-all choice been applied yet?

	// Read the saved conversation back, newest first. Runs on mount (so a refresh resumes)
	// and again after each new question.
	async function load() {
		exchanges = await anything_llm.get_exchanges(50);
		debug.log(`Chat: loaded ${exchanges.length} exchange(s) from the workspace.`);
		// On launch, apply the saved choice: replies shown means all open, hidden means all
		// collapsed. Only once, so a later reload (after asking) doesn't undo per-question toggles.
		if (!applied_initial) {
			applied_initial = true;
			const show = get(w_show_chat_replies);
			collapsed = show ? new Set() : new Set(exchanges.map((e) => e.time));
			debug.log(`Chat: applied saved "replies shown" = ${show} on launch — ${collapsed.size} collapsed.`);
		}
	}
	// Read the history on open, and again the moment the connection returns — so history that
	// couldn't be read during an outage (or while the address was churning back) comes back
	// on its own, instead of staying blank.
	let was_reachable = false;
	$effect(() => {
		const reachable = $w_llm_reachable;
		if (reachable && !was_reachable) {
			debug.log(`Chat: connection ${was_reachable ? 'is up' : 'came up'} — reading the history.`);
			load();
		}
		was_reachable = reachable;
	});

	// The question-and-answer being written right now: the answer grows word by word as the
	// model streams it, shown at the top of the conversation until it's stored and reloaded.
	let pending = $state<{ question: string; reply: string } | null>(null);

	async function ask() {
		const q = question.trim();
		if (!q || asking) { return; }
		asking = true; error = null;
		pending = { question: q, reply: '' };
		question = '';
		debug.log(`Chat: asking "${q}" (streaming).`);
		const result = await anything_llm.ask_stream(q, (word) => {
			if (pending) { pending = { question: pending.question, reply: pending.reply + word }; }
		});
		asking = false;
		pending = null;
		if (!result) {
			error = "Couldn't reach the model — is AnythingLLM set up and its model running?";
			debug.log('Chat: streaming ask failed — model unreachable.');
			return;
		}
		await load();   // the finished exchange is now stored — refresh to show it with its sources
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
	function collapse_all() { collapsed = new Set(exchanges.map((e) => e.time)); w_show_chat_replies.set(false); debug.log(`Chat: collapsed all ${exchanges.length} answer(s).`); }
	function expand_all()   { collapsed = new Set(); w_show_chat_replies.set(true); debug.log('Chat: expanded all answers.'); }

	// One toggle for the lot: when every answer is hidden it offers to expand, else to
	// collapse.
	const all_collapsed = $derived(exchanges.length > 0 && collapsed.size === exchanges.length);
	function toggle_all() { if (all_collapsed) { expand_all(); } else { collapse_all(); } }

	// A stored second turned into a short, readable stamp.
	function when(time: number): string {
		return time ? new Date(time * 1000).toLocaleString() : '';
	}

	// The spinning gear shown while reconnecting — centered so it turns in place (see
	// svg_paths.gear). The box and the drawing share this one number, so the gear's center
	// always sits at the box center; the style scales it on screen to --size-svg (the size knob).
	const GEAR_BOX = 100;
	const gearPath = svg_paths.gear(GEAR_BOX);
</script>

<div class='chat'>
	{#if !$w_llm_reachable}
		<div class='starting'>
			<svg class='gear' viewBox='0 0 {GEAR_BOX} {GEAR_BOX}' aria-hidden='true'>
				<path d={gearPath} fill-rule='evenodd' />
			</svg>
			<span>starting the AI</span>
		</div>
	{:else}
		<div class='ask-row'>
			{#if asking}
				<svg class='gear' viewBox='0 0 {GEAR_BOX} {GEAR_BOX}' aria-hidden='true'><path d={gearPath} fill-rule='evenodd' /></svg>
			{:else}
				<button class='ask-go' onclick={ask} disabled={!question.trim()}>ask</button>
			{/if}
			<input class='ask-input' type='search' placeholder='ask a question'
				bind:value={question} onkeydown={on_key} disabled={asking} />
		</div>

		{#if error}
			<div class='chat-error'>{error}</div>
		{/if}

		{#if exchanges.length > 0}
			<div class='replies-sep'><Separator title='{all_collapsed ? "show" : "hide"} responses' onclick={toggle_all} /></div>
		{/if}

		<div class='conversation'>
			{#if pending}
				<div class='exchange'>
					<div class='question pending-question'><span class='q-text'>{pending.question}</span></div>
					<div class='answer'>{pending.reply}</div>
				</div>
			{/if}
			{#each exchanges as ex, i (i)}
				<div class='exchange' class:collapsed={collapsed.has(ex.time)}>
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
		</div>
	{/if}
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

	/* A quiet note while the AI's address is being restarted; it clears itself the moment
	   the connection answers again. Shown only while starting (the connection is lost). */
	.starting {
		opacity     : var(--opacity-label);
		font-size   : var(--font-label);
		color       : var(--text);
		gap         : var(--gap);
		align-items : center;
		display     : flex;
		flex-shrink : 0;
	}

	/* The gear turns while ji keeps trying to reach the AI again. An SVG whose teeth are
	   centered on the middle of its box, so it spins cleanly in place (a text glyph sits
	   off-center in its line box and wobbles). Its on-screen size is --size-svg (the knob for
	   how big it draws); follows the text color. */
	.gear {
		animation        : gear-spin 1.4s linear infinite;
		width            : var(--size-svg);
		height           : var(--size-svg);
		fill             : var(--accent);
		stroke           : var(--black);
		transform-origin : center;
		stroke-width     : 0.7px;
		flex-shrink      : 0;
	}

	/* Keep the outline a true 0.5px on screen, not scaled up by the gear's box size. */
	.gear path {
		vector-effect : non-scaling-stroke;
	}

	@keyframes gear-spin {
		to   { transform: rotate(360deg); }
		from { transform: rotate(0deg); }
	}

	/* A --gap of space above and below the show/hide-responses divider. */
	.replies-sep {
		margin      : var(--gap) 0;
		flex-shrink : 0;
	}

	/* The running conversation scrolls; the question box and controls stay put. The
	   right padding sets a --gap between the exchanges and the scrollbar. */
	.conversation {
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

	/* Space below only when the answer is hidden, so collapsed exchanges read as a list
	   while an open one sits snug against the next. */
	.exchange.collapsed {
		margin-bottom : var(--gap);
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

	/* The question being answered right now reads the same as a stored one, but isn't a
	   button — nothing to collapse yet. */
	.pending-question {
		cursor : default;
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
</style>
