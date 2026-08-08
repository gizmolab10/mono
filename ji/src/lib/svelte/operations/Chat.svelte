<script lang='ts'>
	import { start_llm_heartbeat, stop_llm_heartbeat } from '../../ts/database/LLM_Docs';
	import { anything_llm, w_llm_reachable } from '../../ts/database/AnythingLLM';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import Separator from '../support/Separator.svelte';
	import { tip } from '../../ts/utilities/Tooltip';
	import type { Exchange } from '../../ts/types/DB_Records';
	import { debug } from '../../ts/common/Debug';
	import { get } from 'svelte/store';

	// Whether answers show or stay hidden — saved, so the choice holds across reloads.
	// Managed by the show/hide-all buttons below (collapse_all / expand_all) and applied
	// once on launch. Per-question toggles don't touch it.
	const w_show_chat_replies = preferences.persistent<boolean>(T_Preference.show_chat_replies, true);

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

	// The name of the model AnythingLLM asked for and could not find, once one ask has hit
	// it. Kept so the note stays up: no ask can work until that model is installed.
	let missing_model = $state<string | null>(null);

	// Turn the model's own complaint into something to act on. The one seen so far is a
	// model that isn't installed, which every ask will hit until it is.
	function say_trouble(trouble: string): string {
		const missing = /model ['"]?([^'"]+?)['"]? not found/i.exec(trouble);
		if (missing) {
			missing_model = missing[1];
			debug.log(`Chat: AnythingLLM asked for the model "${missing[1]}" and it is not installed — every ask fails until it is.`);
			return `AnythingLLM is set to use the model "${missing[1]}", and that model is not installed. Install it where AnythingLLM looks for its models, or choose one you already have in its workspace settings.`;
		}
		return `The model answered with nothing — ${trouble}`;
	}

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
	// While this is on screen, the AI is asked for its documents every few seconds. That check
	// is what notices the connection coming back — otherwise nothing here would call it until
	// a question was asked, and the note would sit there whatever the AI was doing.
	$effect(() => {
		start_llm_heartbeat();
		return () => stop_llm_heartbeat();
	});

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
		// Both notes are cleared before asking: the standing one about a model that wasn't
		// installed must not outlive the installing. If it is still missing, this ask says so
		// again.
		asking = true; error = null; missing_model = null;
		pending = { question: q, reply: '' };
		question = '';
		debug.log(`Chat: asking "${q}" (streaming).`);
		const result = await anything_llm.ask_stream(q, (word) => {
			if (pending) { pending = { question: pending.question, reply: pending.reply + word }; }
		});
		asking = false;
		pending = null;
		if (!result) {
			question = q;   // hand the question back, so it isn't lost with the failure
			error = "Couldn't reach the model — is AnythingLLM set up and its model running?";
			debug.log('Chat: streaming ask failed — model unreachable.');
			return;
		}
		// It answered, but with nothing. That is a failure, not an empty reply: say what the
		// model complained about and give the question back rather than quietly dropping both.
		if (result.trouble) {
			question = q;
			error = say_trouble(result.trouble);
			debug.log(`Chat: the ask ended with no words — ${result.trouble}. The question is back in the box.`);
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
	}
	function collapse_all() { collapsed = new Set(exchanges.map((e) => e.time)); w_show_chat_replies.set(false); }
	function expand_all()   { collapsed = new Set(); w_show_chat_replies.set(true); }

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

	// The conversation keeps a gap on its right so the exchanges clear the scrollbar. When the
	// list is short enough that there's no scrollbar, that gap is dead space — so drop it then
	// and give it back the moment the scrollbar returns. Measured from the real content vs box
	// height, re-checked on every resize and whenever the conversation's contents change.
	let convo_el = $state<HTMLDivElement | undefined>(undefined);
	let overflowing = $state(false);

	function measure_scroll() {
		if (!convo_el) { return; }
		const over = convo_el.scrollHeight > convo_el.clientHeight + 1;   // +1 shrugs off sub-pixel rounding
		if (over !== overflowing) {
			overflowing = over;
			debug.log_soon(`Chat scroll: content ${convo_el.scrollHeight}px vs box ${convo_el.clientHeight}px — ${over ? 'scrollbar showing, keep the right gap' : 'no scrollbar, drop the right gap'}.`);
		}
	}

	// Re-measure when the contents change (a new answer, a collapse, the streaming reply growing).
	$effect(() => {
		exchanges.length; collapsed; pending;   // read so this re-runs on any of them
		measure_scroll();
	});

	// Re-measure when the box itself resizes (window, details opening, zoom).
	$effect(() => {
		if (!convo_el) { return; }
		const observer = new ResizeObserver(() => measure_scroll());
		observer.observe(convo_el);
		return () => observer.disconnect();
	});

</script>

<div class='chat'>
	<!-- The chat is always here, whether or not the AI is answering. It used to be replaced by
	     a note while the connection was lost — which left nothing on screen that would call the
	     AI, so nothing ever noticed it come back. Now the note sits above the chat, and asking
	     a question is itself what finds out. -->
	{#if !$w_llm_reachable}
		<div class='starting'>
			<svg class='gear' viewBox='0 0 {GEAR_BOX} {GEAR_BOX}' aria-hidden='true'>
				<path d={gearPath} fill-rule='evenodd' />
			</svg>
			<span>waiting for the AI — ask anyway to try it</span>
		</div>
	{/if}
	<div class='ask-row'>
		{#if asking}
			<svg class='gear' viewBox='0 0 {GEAR_BOX} {GEAR_BOX}' aria-hidden='true'><path d={gearPath} fill-rule='evenodd' /></svg>
		{:else}
			<button class='ask-go' onclick={ask} disabled={!question.trim()} use:tip={question.trim() ? 'post my question' : false}>ask</button>
		{/if}
		<input class='ask-input' type='search' placeholder='enter a question'
			bind:value={question} onkeydown={on_key} disabled={asking} />
	</div>

	{#if error}
		<div class='chat-error'>{error}</div>
	{:else if missing_model}
		<!-- Stays up once a missing model is known: no ask can work until it is installed,
		     so the note outlives the one failure that found it. -->
		<div class='chat-error'>the model "{missing_model}" is not installed — no question can be answered until it is</div>
	{/if}

	{#if exchanges.length > 0}
		<div class='replies-sep'><Separator title='{all_collapsed ? "show" : "hide"} all responses' onclick={toggle_all} /></div>
	{/if}

	<div class='conversation' class:flush-right={!overflowing} bind:this={convo_el}>
		{#if pending}
			<div class='exchange'>
				<div class='question pending-question'><span class='q-text'>{pending.question}</span></div>
				<div class='answer'>{pending.reply}</div>
			</div>
		{/if}
		{#each exchanges as ex, i (i)}
			<div class='exchange' class:collapsed={collapsed.has(ex.time)}>
				<button class='question' onclick={() => toggle_one(ex.time)}
					use:tip={collapsed.has(ex.time) ? 'show response' : 'hide answer'}>
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

	.ask-input:hover,
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
		background : var(--lightgray);
		color      : var(--darkgray);
		cursor     : default;
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

	/* No scrollbar showing: drop the right gap so the answers reach the edge. */
	.conversation.flush-right {
		padding-right : 0;
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

	/* The question reads as a header over its answer, on a soft accent fill; a click hides
	   or shows the answer. The fill sits close to the page color, so the plain text color
	   reads better than the on-accent one. */
	.question {
		border          : var(--thickness-normal) solid var(--black);
		padding         : var(--pad-control);
		background      : var(--mild-accent);
		font-size       : var(--font-label);
		justify-content : space-between;
		border-radius   : var(--radius);
		color           : var(--text);
		box-sizing      : border-box;
		gap             : var(--gap);
		align-items     : baseline;
		cursor          : pointer;
		display         : flex;
		text-align      : left;
	}

	/* Hovering a question (a real, collapsible one) lifts it to the shared hover color. */
	.question:not(.pending-question):hover {
		background : var(--hover);
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
