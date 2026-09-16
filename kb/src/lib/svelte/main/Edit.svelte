<script lang='ts'>
	import { report_gaps_below_lines, report_line_spacing } from '../../ts/common/Core';
	import { key_of, type File } from '../../ts/types/File';
	import Edit_More from '../filter/Edit_More.svelte';
	import { T_Hit_Target } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import type { Snippet } from 'svelte';

	// Show one file. This is the frame: the things stacked in it — looking through the file, what
	// it is labeled, the file's own words, and the back links. Each of those owns its own workings;
	// what they share is here — the whole file's text, and the line at the bottom that speaks up
	// briefly. Which file it is, and what can be done to it, is said in the row across the top,
	// which Controls draws. The words are the host's since step 11 of the plan, handed in as the
	// operation view snippet and drawn where Edit_Markdown was.
	//
	// Which of the files is on screen, and the run they were stepped through, is the list's;
	// here we only draw the file and call back.
	//
	// The host's four snippets for the frame: its edit filter section, given the file, its words
	// and a call that sets them, which the label form renders above the kinds row; its search row,
	// given the file's name, which the label form renders first; its operation view, given the
	// file, the room the frame has, the words and a call that sets them, and a call for a note,
	// rendered below the label form where the words were; and its back links, given the file's key
	// and its name, rendered at the foot, below the note line. The search and the drawer are wired
	// to each other by the host since step 13 of the plan, so the frame holds neither.
	let { name, address, tags, guide, onclose, onprev = () => {}, onnext = () => {}, width = 0, height = 0, edit_filter, search_row, operation_view, back_links }:
		{ name: string; address: string; tags: string[]; guide: File; onclose: () => void; onprev?: (repeated?: boolean) => void; onnext?: (repeated?: boolean) => void;
		  width?: number; height?: number; edit_filter?: Snippet<[File, string, (words: string) => void]>; search_row?: Snippet<[string]>; operation_view?: Snippet<[File, number, number, string, (words: string) => void, (message: string) => void]>; back_links?: Snippet<[string, string]> } = $props();

	// The whole file, held only while it is on screen. Two of the three below write to it: the
	// labels at the top, and a piece of the words being changed. One place holds it, so neither
	// can be working from a stale copy.
	let text_of_file = $state('');

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

</script>

<div class='viewer'>
	<Edit_More {name} {guide} {tags} {onclose} onshow={say} {edit_filter} {search_row}
		bind:text={text_of_file} bind:folded={filters_folded} />
	{@render operation_view?.(guide, width, height, text_of_file, (words) => { text_of_file = words; }, say)}
	<!-- What a link that leads nowhere has to say. It clears itself after a few seconds.
	     Registered while it is showing, as a section, so the manager knows the cursor is on it and
	     nothing underneath answers instead. -->
	{#if note !== ''}
		<div class='view-note-line'
			use:hit_target={{ id: 'editor.note', type: T_Hit_Target.section }}>{note}</div>
	{/if}
	<!-- Which files point at this one, the host's back links since step 14 of the plan, at the very
	     bottom, above the status line when that is showing; nothing where no host hands them. -->
	{@render back_links?.(key_of(guide), name)}
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
