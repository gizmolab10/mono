<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { what_to_open } from '../../ts/utilities/Searching';
	import { w_search_at } from '../../ts/managers/Operations';
	import Action, { T_Position } from '../../ts/types/Action';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import { w_words } from '../../ts/managers/Filters';
	import Steppers from '../support/Steppers.svelte';
	import { tip } from '../../ts/utilities/Tooltip';
	import Section from '../support/Section.svelte';
	import { debug } from '../../ts/common/Debug';
	import { get } from 'svelte/store';

	// Looking through the guide on screen. The words looked for here are the very ones typed into
	// the list's search field — one value, shown by both screens, so words typed in the list are
	// already in the field when a guide opens. Which place is highlighted is held alongside it.
	// This drawing owns neither; it only reads and writes them, so both carry across the list, the
	// next guide, and a refresh.

	let { name, page, hovered = false }: {
		name    : string;                  // what the file is called, for the log
		page    : HTMLElement | null;      // the drawn words, which is what is looked through
		hovered?: boolean;                 // force the word's edge on, because a surrounding area says so
	} = $props();

	// Whether the search row is on screen at all. Folded away, the words below take its gap,
	// and the word on the line above brings it back. Remembered across visits.
	const w_show_search = preferences.persistent<boolean>(T_Preference.show_search, true);

	// Shown, the word is just "search". Folded away with something typed, it says what is being
	// looked for, so a search left running is never invisible.
	let search_word = $derived($w_show_search || $w_words === '' ? 'search' : `search ➜ ${$w_words}`);

	// The word that folds this section away. It is ours now, not the line's: we build the button,
	// style it, and hand the made element to the line, which only finds it a place to stand.
	// The browser makes it one drawing after we ask, so this holds nothing on the first drawing
	// and the made button on the next — which is itself a change, so the line is told at once.
	let fold_word: HTMLElement | null = $state(null);
	const to_do = $derived(Object.assign(new Action(), { element: fold_word, position: T_Position.left }));

	/** Put the search row away, or bring it back. */
	function toggle_search() {
		w_show_search.set(!$w_show_search);
		debug.log(`Editing "${name}": the search row is now ${!$w_show_search ? 'folded away' : 'shown'}.`);
	}

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
		const wanted = $w_words.toLowerCase();
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
			debug.log(`Search in "${name}" for "${$w_words}": not there.`);
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
		debug.log(`Search in "${name}" for "${$w_words}": showing ${get(w_search_at) + 1} of ${places.length}.`);
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

<!-- The word that folds this section away, built here rather than by the line it stands on: the
     line is handed the made button and only finds it a place. It is written out of sight, since
     the moment the browser has made it, it is taken and put on the line instead. -->
<div class='out_of_sight'>
	<button type='button' class='fold-word' class:forced={hovered} bind:this={fold_word}
		onclick={toggle_search}>{search_word}</button>
</div>

<!-- Looking through the file on screen, as a section of its own: its line carries the word
     that folds it away, and the section holds the gap around it. -->
<Section
	actions={[to_do]}
	edge={T_Edge.thick}
	folded={!$w_show_search}>
	{#snippet holds()}
		<!-- Its type is "search", so the browser draws its own clear cross at the right end
		     once there is text. -->
		<div class='view-search'>
			<!-- With something typed, two triangles walk the places those words turn up, and the
			     count says which of them is highlighted. The count reads first. -->
			{#if $w_words !== ''}
				<div class='view-steps hits'>
					<span class='hit-count'>{hits_found === 0 ? 'none' : `${hit_at + 1} of ${hits_found}`}</span>
					<Steppers can_back can_forward onprev={() => step_hit(-1)} onnext={() => step_hit(1)} back_says='the place before' forward_says='the place after' />
				</div>
			{/if}
			<input
				type='search'
				class='search'
				oninput={find_first}
				bind:value={$w_words}
				use:tip={'search this file'}
				placeholder='search the contents of this file' />
		</div>
	{/snippet}
</Section>

<style>
	/* Where the fold word is written before the line takes it. It is taken out of here on the
	   very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* The word that folds this section away, standing on the line above. Its page-colored
	   background masks the line behind it. The edge is held see-through and counted inside the
	   word's own space, so the hover edge adds no width and the word never shifts. */
	.fold-word {
		border        : 0.5px solid transparent;
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--bg);
		box-sizing    : border-box;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	/* The edge appears under the cursor, or because the area around it says so. Told to light
	   from outside, it takes white — it reads as marked without claiming the cursor. */
	.fold-word:hover {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	.fold-word.forced {
		border-color : var(--darkgray);
		background   : var(--white);
	}

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

	.search {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		height        : var(--height);
		background    : var(--white);
		font-size     : var(--font);
		color         : var(--text);
		box-sizing    : border-box;
		width         : 100%;
	}

	/* With the cursor in it, the field's own edge thickens in the accent rather than the
	   browser drawing a ring of its own — which sat outside the pill and followed neither its
	   curve nor its width. The edge is drawn inside, so nothing moves. */
	.search:focus,
	.search:focus-visible {
		border-color : var(--accent);
		box-shadow   : inset 0 0 0 var(--thick) var(--accent);
		outline      : none;
	}
</style>
