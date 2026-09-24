<script lang='ts'>
	import { preferences, T_Preference, w_search_at, w_search_text } from '../../ts/common/Kb';
	import { hit_target, gap_below_line, Steppers, debug } from '../../ts/common/Core';
	import { what_to_open } from '../../ts/utilities/Searching';
	import { get } from 'svelte/store';

	// Looking through the guide on screen, ai's since step 13 of the plan, handed to kb as the
	// search row and rendered in the label form's first subsection. The words looked for here are
	// the very ones typed into the list's search field — one value, kb's, shown by both screens, so
	// words typed in the list are already in the field when a guide opens. Which place is
	// highlighted is held alongside it, kb's too. This drawing owns neither; it only reads and
	// writes them, so both carry across the list, the next guide, and a refresh.

	// The row is somebody else's subsection: the stack it sits in draws the line above, the gap
	// and the fold word, and this draws the field, the count and the steppers. The form that drew
	// a section of its own, behind a bare prop, went 15 September 2026, rendered nowhere.
	let { name, page }: {
		name : string;                  // what the file is called, for the log
		page : HTMLElement | null;      // the drawn words, which is what is looked through
	} = $props();

	// Whether the search row is on screen at all. Folded away, the words below take its gap,
	// and the clickable on the line above, the stack's, brings it back. Remembered across visits.
	const w_show_search = preferences.persistent<boolean>(T_Preference.show_search, true);

	// How far the field stands below the line above it, said in the log once the browser has drawn.
	// Every other section is measured the same way from the editor, so the four numbers can be read
	// side by side.
	let field = $state<HTMLInputElement | null>(null);
	$effect(() => {
		if (!field || !$w_show_search) { return; }
		const seen = field;
		requestAnimationFrame(() => gap_below_line(seen, 'the editor\'s search field'));
	});


	let marked: HTMLElement | null = null;      // the run of words highlighted right now, if any

	/**
	 * Put the highlighted words back the way they were. Whatever was opened to reach them stays
	 * open: the next place is often inside that very piece, and folding it here only to open it
	 * again is what blinked on every keystroke.
	 */
	export function unmark() {
		if (!marked) { return; }
		const holder = marked.parentNode;
		if (holder) {
			holder.replaceChild(document.createTextNode(marked.textContent ?? ''), marked);
			holder.normalize();                 // rejoin the split text, so the next search sees whole words
		}
		marked = null;
	}

	// Emptied words mean nothing to highlight, wherever the emptying came from — the clear on
	// the line, the list's clear, or the field itself. Watching the value here means no caller
	// has to remember to say so: the highlighted words go back, the piece the search opened folds
	// back, and the place is the first again, the three things an empty field asks for.
	$effect(() => {
		if ($w_search_text === '') {
			unmark();
			hits_found = 0;
			w_search_at.set(0);
			fold_after_search(null);
		}
	});

	/** The drawing being left behind takes its highlighted words with it. */
	export function forget() {
		marked = null;
		shown_for_search = null;
	}

	// How many places the words turn up, and which of them is highlighted right now (counting
	// from zero). The triangles beside the field walk that run, wrapping at both ends.
	let hits_found = $state(0);
	let hit_at     = $derived($w_search_at);

	/**
	 * Highlight one place these words turn up in the guide, and move to it. The words are looked
	 * for a run at a time, ignoring capitals; anything highlighted before goes back to plain
	 * first, so only ever one place is highlighted. Which place is asked for by number, wrapping
	 * around.
	 */
	export function light_hit(which: number) {
		if (!page) { return; }
		unmark();
		// Taken exactly as typed — a space is a character to look for like any other, so
		// "the end" finds those two words together rather than just "the".
		const wanted = $w_search_text.toLowerCase();
		if (wanted === '') {
			hits_found = 0;
			w_search_at.set(0);
			fold_after_search(null);
			debug.log(`Search in "${name}": the field is empty, so nothing to look for.`);
			return;
		}

		// Every place the words sit, gathered first, so the count can be shown and the
		// triangles can walk them.
		const places: Array<{ run: Text; at: number }> = [];
		const runs = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
		while (runs.nextNode()) {
			const run = runs.currentNode as Text;
			const words_here = run.data.toLowerCase();
			let from = words_here.indexOf(wanted);
			while (from >= 0) {
				places.push({ run, at: from });
				from = words_here.indexOf(wanted, from + wanted.length);
			}
		}
		hits_found = places.length;
		if (places.length === 0) {
			w_search_at.set(0);
			fold_after_search(null);
			// Nothing highlighted is answer enough while the words are still being typed, so this
			// stays quiet on screen and says it only to the log.
			debug.log(`Search in "${name}" for "${$w_search_text}": not there.`);
			return;
		}
		w_search_at.set(((which % places.length) + places.length) % places.length);   // wraps at both ends
		const { run, at } = places[get(w_search_at)];
		const rest = run.splitText(at);
		rest.splitText(wanted.length);
		const lit = document.createElement('mark');
		lit.className = 'hit';
		lit.textContent = rest.data;
		rest.parentNode?.replaceChild(lit, rest);
		marked = lit;
		fold_after_search(piece_holding(lit));
		lit.scrollIntoView({ block: 'center' });
		debug.log(`Search in "${name}" for "${$w_search_text}": showing ${get(w_search_at) + 1} of ${places.length}.`);
	}

	// A match can sit inside a folded section, where it would be highlighted but out of sight.
	// That one piece is shown while it holds the highlighted words, whatever the folds say. The
	// folds themselves are not changed.
	let shown_for_search: HTMLElement | null = null;

	/** Which piece of the page a run of words sits in — the outermost one, under the words area. */
	function piece_holding(words: HTMLElement): HTMLElement | null {
		if (!page) { return null; }
		let piece: HTMLElement | null = words;
		while (piece && piece.parentElement !== page) { piece = piece.parentElement; }
		// Only a piece the file's own folds put away is ever opened by a search.
		return piece && piece.style.display === 'none' ? piece : null;
	}

	/**
	 * Fold away whatever the last search opened, and open what this one needs — worked out
	 * together, so a piece is never folded only to be opened again on the same keystroke.
	 */
	function fold_after_search(wanted: HTMLElement | null) {
		const { fold, show } = what_to_open(shown_for_search, wanted);
		if (fold && fold.isConnected) { fold.style.display = 'none'; }
		if (show) {
			show.style.display = '';
			debug.log(`Search in "${name}": the words turned up inside a folded section, so that piece is shown while they are highlighted.`);
		}
		if (fold || show) { shown_for_search = wanted; }
	}

	/** Every keystroke starts again from the first place the words turn up. */
	function find_first() {
		light_hit(0);
	}

	/** The place before or after the one highlighted now. */
	function step_hit(by: number) {
		light_hit(hit_at + by);
	}
</script>

<!-- What this section shows: the field, and — with something typed — the count and the two
     triangles that walk the places those words turn up. The count reads first. -->
{#snippet search_row()}
	<!-- Plain text, not type "search": the browser's own clear cross is gone, since the line
	     above carries a clear of ours. -->
	<div class='view-search'>
		{#if $w_search_text !== ''}
			<div class='view-steps hits'>
				<span class='hit-count'>{hits_found === 0 ? 'none' : `${hit_at + 1} of ${hits_found}`}</span>
				<Steppers id='search.step' can_back can_forward onprev={() => step_hit(-1)} onnext={() => step_hit(1)} back_says='the place before' forward_says='the place after' />
			</div>
		{/if}
		<input
			type='text'
			class='search'
			bind:this={field}
			oninput={find_first}
			bind:value={$w_search_text}
			use:hit_target={{ id: 'search.field', tip: 'search this file' }}
			placeholder='search the contents of this file' />
	</div>
{/snippet}

<!-- Folded, it draws nothing at all: the stack leaves the space and the run of accent that says
     something is folded. -->
{#if $w_show_search}{@render search_row()}{/if}

<style>
	/* The search row, under the top row: the walking triangles, then the field. */
	/* One height whether or not anything is typed, so the words below never shift when the
	   step triangles and the count arrive beside the field. */
	/* The gap above and below is the section's. Its own height holds steady whether or not the
	   step marks are beside the field, so the words below never shift as they come and go. */
	.view-search {
		min-height     : var(--height);
		gap            : var(--gap);
		flex           : 0 0 auto;
		align-items    : center;
		display        : flex;
	}

	/* The triangles that walk the places the words turn up, and the count between them. The
	   triangles are drawn a touch taller than a control; held to the row's own height they
	   still show whole, and the row no longer grows the moment they arrive. */
	.view-steps.hits {
		height      : var(--height);
		flex        : 0 0 auto;
		align-items : center;
		display     : flex;
	}

	.hit-count {
		opacity     : var(--opacity-header);
		font-size   : var(--font-tiny);
		color       : var(--text);
		white-space : nowrap;
	}

	/* Drawn two pixels below where it stands, so it sits square under the line above. That is
	   drawing only — its place in the row is unchanged, and nothing around it moves. */
	.search {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		top           : var(--gap-faint);
		height        : var(--height);
		background    : var(--white);
		font-size     : var(--font);
		color         : var(--text);
		box-sizing    : border-box;
		position      : relative;
		width         : 100%;
	}

	/* What a field is for reads quieter than what is typed into it. */
	.search::placeholder {
		color : var(--lightgray);
	}

	/* With the cursor in it, the field's own edge thickens in the accent rather than the
	   browser drawing a ring of its own — which sat outside the pill and followed neither its
	   curve nor its width. The edge is drawn inside, so nothing moves. */
	.search:focus,
	.search:focus-visible {
		box-shadow   : inset 0 0 0 var(--thick) var(--accent);
		border-color : var(--accent);
		outline      : none;
	}
</style>
