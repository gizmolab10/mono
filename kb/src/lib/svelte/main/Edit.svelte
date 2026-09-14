<script lang='ts'>
	import { w_search_at, w_search_for } from '../../ts/managers/Operations';
	import { report_gaps_below_lines, report_line_spacing } from '../../ts/common/Core';
	import { key_of, type File } from '../../ts/types/File';
	import Edit_Markdown from '../content/Edit_Markdown.svelte';
	import Back_Links from '../content/Back_Links.svelte';
	import { w_search_text } from '../../ts/managers/Filters';
	import Edit_More from '../filter/Edit_More.svelte';
	import { T_Hit_Target } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import Search from '../filter/Search.svelte';
	import { hits } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import { get } from 'svelte/store';
	import type { Snippet } from 'svelte';

	// Show one file. This is the frame: the three things stacked in it — looking through the
	// file, what it is labeled, and the file's own words. Each of those owns its own workings;
	// what they share is here — the whole file's text, and the line at the bottom that speaks up
	// briefly. Which file it is, and what can be done to it, is said in the row across the top,
	// which Controls draws.
	//
	// Which of the files is on screen, and the run they were stepped through, is the list's;
	// here we only draw the file and call back.
	//
	// The host's two snippets for the frame: its edit filter section, given the file, its words and
	// a call that sets them, which the label form renders above the kinds row, and its operation view, given the
	// file and the room the frame has, rendered below the label form.
	let { name, address, tags, guide, onclose, onprev = () => {}, onnext = () => {}, width = 0, height = 0, edit_filter, operation_view }:
		{ name: string; address: string; tags: string[]; guide: File; onclose: () => void; onprev?: (repeated?: boolean) => void; onnext?: (repeated?: boolean) => void;
		  width?: number; height?: number; edit_filter?: Snippet<[File, string, (words: string) => void]>; operation_view?: Snippet<[File, number, number]> } = $props();

	// The whole file, held only while it is on screen. Two of the three below write to it: the
	// labels at the top, and a piece of the words being changed. One place holds it, so neither
	// can be working from a stale copy.
	let text_of_file = $state('');

	// The drawn words, so a search can look inside them.
	let page = $state<HTMLElement | null>(null);

	// The search is held so the frame can reach it: a file just drawn, or drawn again, has to be
	// told to look through the new words rather than the ones it highlighted before.
	let find: ReturnType<typeof Search> | null = $state(null);

	// Whether the label form is put away. Folded, it stands flat, so the words below draw no line
	// of their own — the form's own line is already standing there.
	let filters_folded = $state(false);

	// What the stack of lines is holding, said to the log once the browser has drawn them. It is
	// read again whenever a fold changes or another file opens, since those are what move them.
	$effect(() => {
		filters_folded; address;
		const soon = setTimeout(() => { report_line_spacing('the editor'); report_gaps_below_lines('the editor'); }, k.timeout.slide);
		return () => clearTimeout(soon);
	});

	/** Escape closes the file; the left and right keys step to the one before or after. */
	function on_key(event: KeyboardEvent) {
		if (event.key === 'Escape') { onclose(); return; }
		const back = event.key === 'ArrowLeft';
		if (!back && event.key !== 'ArrowRight') { return; }
		event.preventDefault();
		// The key held down repeats on its own; a file that raised something stops that walk,
		// exactly as holding a step mark does.
		if (back) { onprev(event.repeat); } else { onnext(event.repeat); }
	}

	$effect(() => {
		window.addEventListener('keydown', on_key);
		return () => window.removeEventListener('keydown', on_key);
	});

	// What a dead link, or a refused write, has to say — briefly, on a line along the bottom.
	let note = $state('');
	let note_wait: ReturnType<typeof setTimeout> | null = null;

	function say(words_to_show: string) {
		note = words_to_show;
		if (note_wait !== null) { clearTimeout(note_wait); }
		note_wait = setTimeout(() => { note = ''; }, 4000);
	}

	// The line takes its height from the words in it, and everything above it is that much
	// shorter. Arriving, leaving, and running to a second line each move the words above, so
	// each says so — measured once the drawing is done, when the new height is known.
	$effect(() => {
		note;
		hits.defer_recalibrate();
	});

	/**
	 * A file has just been read and drawn. Anything highlighted belonged to the drawing before
	 * it, and the words in the field are looked for again in this one — so coming back from the
	 * list, or from a refresh, lands where the search left off. A file with fewer places than
	 * that wraps back into range on its own.
	 */
	function drawn() {
		find?.forget();
		// A dead link picked out of a report asks for its own words to be highlighted here.
		const wanted = get(w_search_for);
		if (wanted !== '') {
			w_search_for.set('');
			w_search_text.set(wanted);
			requestAnimationFrame(() => find?.light_hit(0));
			return;
		}
		if (get(w_search_text) !== '') {
			const was_at = get(w_search_at);
			requestAnimationFrame(() => find?.light_hit(was_at));
		}
	}

</script>

<div class='viewer'>
	<Edit_More {name} {guide} {tags} {page} {onclose} onshow={say} {edit_filter}
		bind:find bind:text={text_of_file} bind:folded={filters_folded} />
	{@render operation_view?.(guide, width, height)}
	<Edit_Markdown {name} {address} {guide} onshow={say}
		bind:text={text_of_file} bind:page
		ondrawn={drawn} onredrawn={() => find?.forget()} />
	<!-- What a link that leads nowhere has to say. It clears itself after a few seconds.
	     Registered while it is showing, as a section, so the manager knows the cursor is on it and
	     nothing underneath answers instead. -->
	{#if note !== ''}
		<div class='view-note-line'
			use:hit_target={{ id: 'editor.note', type: T_Hit_Target.section }}>{note}</div>
	{/if}
	<!-- Which files point at this one, at the very bottom, above the status line when that is
	     showing. A section of its own, drawn only where something points here. -->
	<Back_Links key={key_of(guide)} {name} />
</div>

<style>
	.viewer {
		position       : relative;   /* the anchor for the pinned close button */
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* The line a dead link leaves behind, along the bottom of the reading area. */
	/* Both stand in the same white area as the words themselves — everything under the heavy
	   line is one field, whether it holds the file, a complaint, or a passing message. */
	/* The words can be picked up and copied. The page as a whole is not selectable, so this says
	   so for itself — what went wrong is said here, and a fault worth reading is worth pasting. */
	.view-note-line {
		border-top  : var(--thick-faint) solid var(--accent);
		opacity     : var(--opacity-label);
		font-size   : var(--font-tiny);
		padding-top : var(--gap-tiny);
		background  : var(--white);
		color       : var(--text);
		user-select : text;
		cursor      : text;
		flex        : 0 0 auto;
		text-align  : center;
	}
</style>
