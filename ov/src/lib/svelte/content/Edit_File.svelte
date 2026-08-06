<script lang='ts'>
	import { lines_between, page_of, still_reads, with_lines_replaced } from '../../ts/utilities/Markdown_Blocks';
	import { foldable_headings, hidden_pieces, top_headings } from '../../ts/utilities/Sections';
	import { ALL_TAGS, T_Bundle, T_Kind, in_order, key_of, type Guide } from '../../ts/types/Guide';
	import { follow_link, w_command_down, w_search_at, w_search_for } from '../../ts/managers/Operations';
	import { landed_on_a_control, names_up_to } from '../../ts/utilities/Leaving';
	import { w_words } from '../../ts/managers/Filters';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { file_path_of, save_guide } from '../../ts/utilities/Saving';
	import { with_labels_replaced } from '../../ts/utilities/Labels';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { TAG_AREAS } from '../../ts/types/Tag_Areas';
	import Separator from '../support/Separator.svelte';
	import Steppers from '../support/Steppers.svelte';
	import Big_Pill from '../support/Big_Pill.svelte';
	import { guides } from '../../ts/managers/Guides';
	import { Direction } from '../../ts/types/Angle';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import MarkdownIt from 'markdown-it';
	import { get } from 'svelte/store';

	// Show one guide's words. Ported from ji's document viewer, trimmed to the one kind
	// overview holds: every guide is words, so the picture, page, clip and sound branches
	// are gone. Its text is read here, held only while it is on screen, and let go on close
	// — nothing about a guide's contents is kept.
	//
	// Two triangles step to the guide before or after in the on-screen list, wrapping at
	// both ends; the arrow keys do the same. The stepping itself lives with the list, which
	// knows the run and the place in it; here we only draw the controls and call back.
	let { name, address, tags, guide, onclose, can_back = false, can_forward = false, onprev = () => {}, onnext = () => {} }:
		{ name: string; address: string; tags: string[]; guide: Guide; onclose: () => void; can_back?: boolean; can_forward?: boolean; onprev?: () => void; onnext?: () => void } = $props();

	// A press on the empty part of either top row goes back to the list; the things in those
	// rows that answer for themselves are left alone. The Escape key does the same.
	// The whole block above the heavy line lights as the cursor crosses any empty part of it,
	// so what a press would do is visible before it is made. It is followed by hand, since a
	// block lighting on its own would light while the cursor sat on one of its controls too.
	let top_lit = $state(false);

	/** Is the cursor on empty space right now, rather than on something that answers? */
	function over_empty(event: MouseEvent): boolean {
		const row = event.currentTarget as HTMLElement;
		return !landed_on_a_control(names_up_to(event.target as HTMLElement | null, row));
	}

	function leave_if_empty(event: MouseEvent) {
		if (!over_empty(event)) { return; }
		debug.log(`Editing "${name}": pressed the empty part of a top row — back to the list.`);
		onclose();
	}

	// The title says where the guide sits as well as what it is called: every folder above it,
	// from the top down. A guide in a project starts with that project; one belonging to no
	// project starts with the repo's own name instead.
	const sits_at = $derived.by(() => {
		const folders = guide.path.split('/').slice(0, -1);
		const top = guide.bundle === T_Bundle.mono ? ['mono'] : [guide.bundle];
		return [...top, ...folders].join(' / ');
	});

	// The guides are written in markdown, so they are turned into a real page before being
	// shown. Any markup written into a guide is left as plain characters rather than acted
	// on, so a guide can never reach into the app.
	// Punctuation is left exactly as the file writes it — no curling quotes, no turning two
	// dashes into one long one. What is read is what is edited, so a piece never looks one way
	// on the page and another in the box.
	const reader = new MarkdownIt({ html: false, linkify: true, typographer: false });

	// Only text that says outright it is a web address becomes one. Left to itself the
	// reader guesses, and a guide full of file names loses: "CLAUDE.md" reads to it as a
	// site in Moldova, whose ending is the same two letters markdown files use. Now a bare
	// name stays a name, and "http://..." or "https://..." still becomes a link.
	reader.linkify.set({ fuzzyLink: false });

	// Turning a guide's text into the page on screen — labels off the top, every piece
	// stamped with the lines it came from, headings named, links marked — all lives in one
	// place, so drawing again after a change is the same call on the changed text.

	// Escape closes; the arrow keys step. A key landing in a field is left alone.
	function on_key(event: KeyboardEvent) {
		const key = event.key;
		if (key === 'Escape') { onclose(); return; }
		if (key !== 'ArrowLeft' && key !== 'ArrowUp' && key !== 'ArrowRight' && key !== 'ArrowDown') { return; }
		const tag = (event.target as HTMLElement | null)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { return; }
		const back = key === 'ArrowLeft' || key === 'ArrowUp';
		if (back ? !can_back : !can_forward) { return; }
		event.preventDefault();
		if (back) { onprev(); } else { onnext(); }
	}

	$effect(() => {
		window.addEventListener('keydown', on_key);
		return () => window.removeEventListener('keydown', on_key);
	});

	// --- the links inside a guide ---------------------------------------------

	let page = $state<HTMLElement | null>(null);

	// Whether the words are taller than the room they have — the one thing a stylesheet cannot
	// ask. Only then does the right margin come off, so the bar can sit against the box's edge;
	// with everything on screen the words keep their margin on both sides.
	let page_has_bar = $state(false);

	$effect(() => {
		const box = page;
		if (!box) { page_has_bar = false; return; }
		const measure = () => { page_has_bar = box.scrollHeight > box.clientHeight + 1; };
		measure();
		const watcher = new ResizeObserver(measure);
		watcher.observe(box);
		return () => watcher.disconnect();
	});
	let note = $state('');                     // what a dead link has to say, briefly
	let note_wait: ReturnType<typeof setTimeout> | null = null;
	let wanted_heading = $state('');           // a heading to move to once the words are drawn

	function say(words_to_show: string) {
		note = words_to_show;
		if (note_wait !== null) { clearTimeout(note_wait); }
		note_wait = setTimeout(() => { note = ''; }, 4000);
	}

	/** Move down the page to one heading, if the words hold it. */
	function move_to_heading(named: string) {
		if (!page || named === '') { return; }
		const found = page.querySelector(`[id="${CSS.escape(named)}"]`);
		if (!found) {
			debug.log(`Heading "${named}" is not in "${name}" — staying where we are.`);
			say(`this guide has no heading called "${named}"`);
			return;
		}
		found.scrollIntoView({ block: 'start' });
		debug.log(`Moved down "${name}" to the heading "${named}".`);
	}

	/**
	 * A click anywhere on the words. Landing on a link follows it, by what the link names;
	 * landing anywhere else opens that piece for changing. The way back to the list is the
	 * close cross, so nothing typed can be lost by a stray click.
	 */
	function on_page_click(event: MouseEvent) {
		// Holding the option key turns the words into something to pick up rather than
		// something to click: dragging selects them, and nothing here answers.
		if ($w_command_down) { return; }
		const anchor = (event.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null;
		if (!anchor) { open_the_piece(event); return; }
		event.preventDefault();
		event.stopPropagation();
		const link = anchor.getAttribute('href') ?? '';
		if (link === '') { return; }
		if (link.startsWith('#')) { move_to_heading(decodeURIComponent(link.slice(1))); return; }
		if (/^[a-z][a-z0-9+.-]*:/i.test(link)) {
			window.open(link, '_blank', 'noopener');
			debug.log(`Link out of "${name}" to the web: ${link} — opened in a new tab, this guide stays.`);
			return;
		}
		const found = guides.hierarchy.explore(guide, link);
		if (found.guide) {
			wanted_heading = found.heading;
			follow_link(key_of(found.guide));
			return;
		}
		if (found.why === 'a heading inside this same guide') { move_to_heading(found.heading); return; }
		say(`"${link}" is ${found.why}`);
	}

	// --- changing one piece of the file ---------------------------------------

	// Every outermost piece of the page carries the lines it came from, and a click opens that
	// piece in a plain box holding the file's own words for those lines — hashes, dashes and
	// all — rather than anything worked back out of what's on screen. Leaving the box writes
	// just those lines back.
	let text_of_file = '';                          // the whole file, held only while on screen
	let box: HTMLTextAreaElement | null = null;     // the open box, if there is one
	let stood_in_for: HTMLElement | null = null;    // the piece it is standing in front of
	let opened_with = '';                           // what the box held when it opened
	let trailing = '';                              // the blank line(s) at its end, kept out of sight

	/**
	 * Pressing the bar beside the words takes the cursor off the box, which would otherwise
	 * close it — so scrolling while editing would throw you out of the piece. A press that
	 * lands in the bar's lane is noted, and the box simply takes the cursor back.
	 */
	let pressed_the_bar = false;

	function watch_for_bar_press(event: MouseEvent) {
		if (!page) { return; }
		const edge = page.getBoundingClientRect().left + page.clientWidth;
		pressed_the_bar = event.clientX > edge;
	}

	/** Grow the box to hold everything typed into it. */
	function fit_box() {
		if (!box) { return; }
		box.style.height = 'auto';
		box.style.height = `${box.scrollHeight}px`;
	}

	/** Open one piece of the page for editing, in place. */
	function open_box(block: HTMLElement) {
		close_box(true);
		const from = Number(block.dataset.from);
		const to   = Number(block.dataset.to);
		if (!Number.isFinite(from) || !Number.isFinite(to)) { return; }
		opened_with  = lines_between(text_of_file, from, to);
		stood_in_for = block;
		box = document.createElement('textarea');
		box.className = 'edit-box';
		box.rows      = 1;                         // a field starts two lines tall; the fit works from one
		// A piece's lines often end with the blank one that separates it from the next, which
		// would show as an empty last line in the box. It is kept aside and put back on saving,
		// so the file's own lines are unchanged either way.
		trailing = opened_with.slice(opened_with.replace(/\n+$/, '').length);
		box.value = opened_with.slice(0, opened_with.length - trailing.length);
		// A paragraph steps in; a bulleted list does not. The box matches whichever it holds,
		// so opening a piece never shifts its first line.
		if (opened_with.trimStart().startsWith('-')) { box.classList.add('flush'); }
		box.addEventListener('input', fit_box);
		box.addEventListener('blur', () => {
			if (pressed_the_bar) { pressed_the_bar = false; box?.focus(); return; }
			close_box(true);
		});
		box.addEventListener('keydown', (e: KeyboardEvent) => {
			e.stopPropagation();                     // the guide's own keys stay out of the box
			if (e.key === 'Escape') { close_box(false); }
		});
		block.parentNode?.insertBefore(box, block);
		block.style.display = 'none';
		fit_box();
		box.focus();
		debug.log(`Editing "${name}": opened lines ${from} through ${to - 1} — ${opened_with.length} character(s) of the file's own words.`);
	}

	/** Put the piece back. Leaving the box keeps what was typed; Escape throws it away. */
	function close_box(keep: boolean) {
		if (!box || !stood_in_for) { return; }
		const the_box  = box;
		const the_piece = stood_in_for;
		const typed = the_box.value + trailing;    // the blank line that was kept aside goes back
		const from  = Number(the_piece.dataset.from);
		const to    = Number(the_piece.dataset.to);
		// Let go of both before touching the page: whatever happens next, this cannot be
		// entered twice for the same box.
		box = null;
		stood_in_for = null;
		// Stepping to another file, or leaving the view, draws or drops the whole page while
		// the box is still open — and leaving the box is what closes it. By then the page may
		// already be gone or half taken apart, so putting things back is allowed to fail.
		try {
			the_box.remove();
			the_piece.style.display = '';
		} catch (trouble) {
			debug.log(`Editing "${name}": the page was already gone when the box closed — ${String(trouble)}`);
		}
		if (!keep)                  { debug.log(`Editing "${name}": dropped the change to lines ${from} through ${to - 1}.`); return; }
		if (typed === opened_with)  { debug.log(`Editing "${name}": lines ${from} through ${to - 1} closed unchanged.`); return; }
		// The lines have to still say what they said when the box opened, or the numbers are
		// stale and putting words back would land them somewhere else in the file.
		if (!still_reads(text_of_file, from, to, opened_with)) {
			say('the guide changed underneath — nothing saved');
			debug.log(`Editing "${name}": refused to save lines ${from} through ${to - 1} — they no longer read as they did when the box opened.`);
			return;
		}
		const whole = with_lines_replaced(text_of_file, from, to, typed);
		const was   = text_of_file;
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": lines ${from} through ${to - 1} changed — ${opened_with.length} character(s) becoming ${typed.length}, the whole file going from ${was.length} to ${whole.length}. Writing it to ${where}.`);
		// Drawn again at once, so the words on screen are the words being written. If the
		// write is refused, the old text goes back up and the page says why.
		redraw(whole);
		save_guide(where, whole, was).then((answer) => {
			if (answer.ok) { debug.log(`Editing "${name}": ${where} written.`); return; }
			say(`not saved — ${answer.why}`);
			debug.log(`Editing "${name}": ${where} was NOT written — ${answer.why}. Putting the words back the way the file has them.`);
			redraw(was);
		});
	}

	/**
	 * Draw the guide again from its changed text. The whole page is built afresh rather than
	 * the one piece patched, so every piece below the change gets the lines it now sits on —
	 * a change that adds or removes lines moves everything under it. The place on screen is
	 * put back, so the words don't jump under the cursor.
	 */
	function redraw(whole: string) {
		const was_at = page?.scrollTop ?? 0;
		text_of_file = whole;
		words = page_of(reader, whole);
		unmark();                                  // anything lit belongs to the old drawing
		requestAnimationFrame(() => { if (page) { page.scrollTop = was_at; } refresh_marks(); });
		debug.log(`Editing "${name}": drew the guide again from its changed words — back at ${Math.round(was_at)} down the page.`);
	}

	/** Open the piece a click landed on, in place. */
	function open_the_piece(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		const block = (event.target as HTMLElement | null)?.closest?.('[data-from]') as HTMLElement | null;
		if (!block) { return; }
		if (block === stood_in_for) { return; }      // already open
		open_box(block);
	}

	// --- the five labels at the top -------------------------------------------

	// The labels are never on the page — they are taken off before the words are drawn —
	// so editing them has its own small form, shown only while editing is on. Nothing here
	// is typed as free text where it matters: the kind and the tags are picked from the
	// only lists the app accepts.
	let form_kind        = $state('');
	let form_title       = $state('');
	let form_description = $state('');
	let form_date        = $state('');
	let form_tags        = $state<string[]>([]);
	const KINDS = Object.values(T_Kind);

	// Whether the label form is on screen while editing. Remembered across visits, since it
	// is a way of working rather than something about one guide.
	const w_show_labels = preferences.persistent<boolean>(T_Preference.show_labels, true);

	// The tag areas take four rows of their own, so the word above them folds them away — and
	// says what the guide wears while they are gone, as the filters' own lines do.
	let show_form_tags = $state(true);
	let form_tags_word = $derived(show_form_tags ? 'tags'
		: `tags ➜ ${form_tags.length === 0 ? 'none' : [...form_tags].sort(in_order).join(', ')}`);

	// The word on the line above the form folds the whole form away. It says what the file is
	// labeled either way — open or shut — so the line always reads the same.
	let label_rows_word = $derived(`filters ➜ ${[form_kind, ...[...form_tags].sort(in_order)]
		.filter((one) => one !== '').join(', ') || 'none'}`);

	// Whenever another guide comes on screen, the form starts from what that guide says.
	$effect(() => {
		form_kind        = guide.kind;
		form_title       = guide.title;
		form_description = guide.description;
		form_date        = guide.date;
		form_tags        = [...tags];
	});

	/** Write the five labels back, if any of them changed. */
	function save_labels() {
		if (text_of_file === '') { return; }
		const labels = { kind: form_kind, title: form_title, description: form_description, date: form_date, labeled: true };
		const whole  = with_labels_replaced(text_of_file, labels, form_tags);
		if (whole === text_of_file) { return; }
		const was   = text_of_file;
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": the labels changed — writing them to ${where}.`);
		text_of_file = whole;                 // the words below are untouched, so no redraw
		save_guide(where, whole, was).then((answer) => {
			if (!answer.ok) {
				text_of_file = was;
				say(`not saved — ${answer.why}`);
				debug.log(`Editing "${name}": the labels were NOT written to ${where} — ${answer.why}.`);
				return;
			}
			// The list shows the title and the tags, so it is told at once rather than
			// waiting for every file to be read again.
			guides.relabel(guide, labels, form_tags);
			debug.log(`Editing "${name}": labels written — kind "${labels.kind}", ${form_tags.length} tag(s).`);
		});
	}

	// Renaming happens in the top row itself: the place where the guide sits gives way to a
	// field holding its name, and the button that opened it becomes the way out.
	let renaming = $state(false);
	let typed_name = $state('');

	/**
	 * Open the field, or shut it again with nothing changed. Nothing calls this at the moment —
	 * the button that did is gone — but the field and its saving are kept, waiting for whatever
	 * opens it next.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export function handle_show_rename() {
		renaming = !renaming;
		typed_name = renaming ? name : '';
		debug.log(`Editing "${name}": the rename field is now ${renaming ? 'open' : 'shut, with nothing changed'}.`);
	}

	/** The cursor goes to the end of the name, so a word can be added without aiming. */
	function take_the_cursor(field: HTMLInputElement) {
		field.focus();
		field.setSelectionRange(field.value.length, field.value.length);
	}

	/**
	 * Give the file itself a different name: the file, every link naming it, and the index
	 * beside it are put right together.
	 */
	function handle_rename() {
		const said = typed_name;
		renaming = false;
		typed_name = '';
		debug.log(`Editing "${name}": renaming it to "${said}".`);
		guides.rename(guide, said);
	}

	/** Put a tag on this guide or take it off, and write it. */
	function toggle_tag(tag: string) {
		form_tags = form_tags.includes(tag) ? form_tags.filter((t) => t !== tag) : [...form_tags, tag].sort(in_order);
		save_labels();
	}

	// --- looking through the guide on screen ----------------------------------

	// The words looked for here are the very ones typed into the list's search field — one
	// value, shown by both screens, so words typed in the list are already in the field when a
	// guide opens. Which place is lit is held alongside it. This drawing owns neither; it only
	// reads and writes them, so both carry across the list, the next guide, and a refresh.

	let marked: HTMLElement | null = null;      // the run of words lit right now, if any

	/** Put the lit words back the way they were, and fold away whatever was shown to reach them. */
	function unmark() {
		hide_after_search();
		if (!marked) { return; }
		const holder = marked.parentNode;
		if (holder) {
			holder.replaceChild(document.createTextNode(marked.textContent ?? ''), marked);
			holder.normalize();                 // rejoin the split text, so the next search sees whole words
		}
		marked = null;
	}

	// How many places the words turn up, and which of them is lit right now (counting from
	// zero). The triangles beside the field walk that run, wrapping at both ends.
	let hits_found = $state(0);
	let hit_at     = $derived($w_search_at);

	/**
	 * Light one place these words turn up in the guide, and move to it. The words are looked
	 * for a run at a time, ignoring capitals; anything lit before goes back to plain first,
	 * so only ever one place is lit. Which place is asked for by number, wrapping around.
	 */
	function light_hit(which: number) {
		if (!page) { return; }
		unmark();
		// Taken exactly as typed — a space is a character to look for like any other, so
		// "the end" finds those two words together rather than just "the".
		const wanted = $w_words.toLowerCase();
		if (wanted === '') { hits_found = 0; w_search_at.set(0); debug.log(`Search in "${name}": the field is empty, so nothing to look for.`); return; }

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
			// Nothing lit is answer enough while the words are still being typed, so this
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
		show_for_search(lit);
		lit.scrollIntoView({ block: 'center' });
		debug.log(`Search in "${name}" for "${$w_words}": showing ${get(w_search_at) + 1} of ${places.length}.`);
	}

	// A match can sit inside a folded section, where it would be lit but out of sight. That one
	// piece is shown while it holds the lit words, whatever the folds say; moving to the next
	// match puts it back and shows the new one instead. The folds themselves are not changed.
	let shown_for_search: HTMLElement | null = null;

	function show_for_search(lit: HTMLElement) {
		hide_after_search();
		if (!page) { return; }
		let piece: HTMLElement | null = lit;
		while (piece && piece.parentElement !== page) { piece = piece.parentElement; }
		if (!piece || piece.style.display !== 'none') { return; }
		piece.style.display = '';
		shown_for_search = piece;
		debug.log(`Search in "${name}": the words turned up inside a folded section, so that piece is shown while it is lit.`);
	}

	function hide_after_search() {
		if (!shown_for_search) { return; }
		if (shown_for_search.isConnected) { shown_for_search.style.display = 'none'; }
		shown_for_search = null;
	}

	/** Every keystroke starts again from the first place the words turn up. */
	function find_first() {
		light_hit(0);
	}

	/** The place before or after the one lit now. */
	function step_hit(by: number) {
		light_hit(hit_at + by);
	}

	// Read this guide's words, and read again when another guide is stepped to. Held only
	// while it is on screen.
	// --- folding a section of the file ----------------------------------------

	// Every heading below the top one carries a small mark in the left margin, turned down
	// while its section shows and sideways while it is folded. A heading owns everything after
	// it up to the next heading of its own level or higher — that run is what a fold hides.
	//
	// Those folds belong to the file being read: another file opens with its sections shown.
	// The top heading is the exception — whether a file's title has its own words folded away
	// is one setting for the whole app, so every file opens the way the last one was left, and
	// it is remembered between visits.
	const FOLD_MARK = k.size.svg * 1.05;
	const w_fold_titles = preferences.persistent<boolean>(T_Preference.fold_titles, false);
	let folded_at = $state<number[]>([]);
	let folds_for = '';                             // which file the folds above belong to
	// Has the reader folded anything in this file by hand yet? Until then the file simply
	// follows the shared title fold: with it on, every section is folded away. The first press
	// on a section's own pointer hands the file its own folds, starting from where they sit.
	let touched   = false;

	/** The level of each piece of the drawn page: 1 for a top heading, 0 for anything else. */
	function levels_of(box: HTMLElement): number[] {
		return [...box.children].map((piece) => {
			const found = /^H([1-6])$/.exec(piece.tagName);
			return found ? Number(found[1]) : 0;
		});
	}

	/** Draw the marks, and put every piece in or out of sight to match what is folded. */
	function apply_folds() {
		if (!page) { debug.log('Folding: nothing to mark — the words are not on screen yet.'); return; }
		const pieces = [...page.children] as HTMLElement[];
		const levels = levels_of(page);
		// Whether the title's own words are folded is not held per file: it is read straight off
		// the setting every file shares, so stepping to another one finds it the same way. Each
		// section below the title keeps its own fold, which is why one can be opened on its own
		// even while the title stays folded.
		const tops = top_headings(levels);
		const titles_shut = $w_fold_titles;
		const all_of_them = titles_shut
			? [...new Set([...(touched ? folded_at : foldable_headings(levels)), ...tops])]
			: folded_at.filter((at) => !tops.includes(at));
		debug.log(`Folding "${name}": ${pieces.length} piece(s) on the page, ${foldable_headings(levels).length} heading(s) below the top one, ${all_of_them.length} folded, titles ${titles_shut ? 'folded' : 'shown'}.`);
		const out_of_sight = hidden_pieces(levels, all_of_them);
		pieces.forEach((piece, at) => {
			// The box standing in for an open piece is not part of the file's own run.
			if (piece.classList.contains('edit-box')) { return; }
			piece.style.display = out_of_sight.has(at) ? 'none' : '';
			piece.classList.toggle('folded-away', all_of_them.includes(at));
		});
		let made = 0;
		try {
			// The top heading's mark folds or unfolds every section at once, and reads as open
			// while any one of them is still open.
			// The mark reads the title's own fold — the one thing it hides — rather than the
			// sections below, which each keep their own mark.
			const every_one = foldable_headings(levels);
			const shut = titles_shut;
			for (const at of tops) {
				const heading = pieces[at];
				if (!heading || heading.querySelector('.fold-mark')) { continue; }
				heading.prepend(one_mark(!shut,
					shut ? 'unfold every section' : 'fold every section',
					() => fold_everything(every_one, !shut)));
				made += 1;
			}
			for (const at of every_one) {
				const heading = pieces[at];
				if (!heading || heading.querySelector('.fold-mark')) { continue; }
				const open = !all_of_them.includes(at);
				heading.prepend(one_mark(open, open ? 'fold this section' : 'unfold this section',
					() => toggle_fold(at)));
				made += 1;
			}
		} catch (trouble) {
			debug.log(`Folding "${name}": stopped after ${made} mark(s) — ${String(trouble)}`);
			return;
		}
		debug.log(`Folding "${name}": ${made} mark(s) drawn.`);
	}

	/** One mark, ready to be put beside a heading. */
	function one_mark(open: boolean, says: string, press: () => void): HTMLButtonElement {
		const mark = document.createElement('button');
		mark.className = 'fold-mark';
		mark.type = 'button';
		mark.setAttribute('aria-label', says);
		mark.innerHTML = fold_mark_svg(open);
		mark.addEventListener('click', (event) => { event.stopPropagation(); press(); });
		return mark;
	}

	/**
	 * Fold every section away, or bring them all back. The top heading folds with them, so its
	 * own words — the ones before the first heading below it — go too, and the file reads as
	 * its title alone.
	 */
	function fold_everything(every_one: number[], away: boolean) {
		w_fold_titles.set(away);                   // every file opens the way this one is left
		touched   = true;
		folded_at = away ? [...every_one] : [];
		debug.log(`Reading "${name}": every section is now ${away ? 'folded away' : 'shown'}.`);
		refresh_marks();
	}

	/** The mark itself: the same soft pointer the folders use, turned down or sideways. */
	function fold_mark_svg(open: boolean): string {
		const way = open ? Direction.down : Direction.right;
		const path = svg_paths.soft_pointer(FOLD_MARK, way);
		const at = svg_paths.soft_pointer_bounds(FOLD_MARK, way);
		return `<svg overflow='visible' width='${at.width}' height='${at.height}' viewBox='${at.minX} ${at.minY} ${at.width} ${at.height}'><path d='${path}'/></svg>`;
	}

	function toggle_fold(at: number) {
		if (!touched) {
			// The first press in this file: it stops following the shared title fold and takes
			// over from exactly where its sections sit at this moment.
			touched = true;
			folded_at = ($w_fold_titles && page) ? foldable_headings(levels_of(page)) : [];
		}
		const away = !folded_at.includes(at);
		folded_at = away ? [...folded_at, at] : folded_at.filter((one) => one !== at);
		debug.log(`Reading "${name}": the section under piece ${at} is now ${away ? 'folded away' : 'shown'}.`);
		refresh_marks();
	}

	/** Take every mark off and draw them again, so each points the way its section now sits. */
	function refresh_marks() {
		if (!page) { return; }
		// A file just opened, so it goes back to following the shared title fold — folded the way
		// the last one was left — until the reader presses one of its own section pointers.
		if (folds_for !== address) {
			folds_for = address;
			folded_at = [];
			touched   = false;
		}
		page.querySelectorAll('.fold-mark').forEach((mark) => mark.remove());
		apply_folds();
	}

	// The marks are put on the drawn page by hand, so they are drawn again every time the words
	// change or another file opens — after the page itself is on screen, never before.
	$effect(() => {
		words;
		$w_fold_titles;                            // the shared title fold redraws the marks too
		if (page) { refresh_marks(); }
	});

	let words  = $state<string | null>(null);
	let loaded = $state(false);
	let failed = $state('');
	$effect(() => {
		const where = address;
		// The words already on screen stay there until the next one's are ready. Blanking them
		// first put an empty box on screen for an instant, which read as a flash.
		failed      = '';
		note        = '';
		marked      = null;      // the lit words belong to the drawing being left behind
		fetch(where)
			.then((answer) => {
				if (!answer.ok) { throw new Error(`the server answered ${answer.status}`); }
				return answer.text();
			})
			.then((text) => {
				text_of_file = text;                 // what an edit slices its own words out of
				words  = page_of(reader, text);
				loaded = true;
				debug.log(`Viewer: read ${text.length} character(s) for "${name}" and turned them into a ${words.length}-character page, every piece carrying the lines it came from.`);
				// A dead link picked out of a report asks for its own words to be lit here.
				const wanted = get(w_search_for);
				if (wanted !== '') {
					w_search_for.set('');
					w_words.set(wanted);
					requestAnimationFrame(find_first);
				} else if (get(w_words) !== '') {
					// Words left in the field from before are looked for again the moment this
					// guide is drawn, and the place that was lit is lit again — so coming back
					// from the list, or from a refresh, lands where the search left off. A guide
					// with fewer places than that wraps back into range on its own.
					const was_at = get(w_search_at);
					requestAnimationFrame(() => light_hit(was_at));
				}
				// A link can name a heading in the guide it opens; the words have to be drawn
				// before there is anything to move down to.
				if (wanted_heading !== '') {
					const named = wanted_heading;
					wanted_heading = '';
					requestAnimationFrame(() => move_to_heading(decodeURIComponent(named)));
				}
			})
			.catch((e) => {
				failed = e instanceof Error ? e.message : String(e);
				loaded = true;
				debug.log(`Viewer: could not read "${name}" from ${where} — ${failed}.`);
			});
		// Let it all go the moment this one is off screen, box included.
		return () => { close_box(false); words = null; text_of_file = ''; };
	});
</script>

<div class='viewer'>
	<!-- Everything above the heavy line is one block: its empty parts are the way back to the
	     list, and the whole of it lights while the cursor is on any of them. -->
	<div class='view-top' role='button' tabindex='-1' onkeyup={() => {}}
		class:lit={top_lit}
		onmousemove={(e) => { top_lit = over_empty(e); }}
		onmouseleave={() => { top_lit = false; }}
		use:tip={'back to the list'} onclick={leave_if_empty}>
	<!-- Looking through the file on screen. Its type is "search", so the browser draws its
	     own clear cross at the right end once there is text. -->
	<div class='view-search'>
		<!-- With something typed, two triangles walk the places those words turn up, and the
		     count says which of them is lit. -->
		{#if $w_words !== ''}
			<!-- The count sits between the two marks, so each is asked for on its own. -->
			<div class='view-steps hits'>
				<Steppers can_back onprev={() => step_hit(-1)} back_says='the place before' />
				<span class='hit-count'>{hits_found === 0 ? 'none' : `${hit_at + 1} of ${hits_found}`}</span>
				<Steppers can_forward onnext={() => step_hit(1)} forward_says='the place after' />
			</div>
		{/if}
		<input
			class='search'
			type='search'
			placeholder='search'
			use:tip={'look through this file'}
			bind:value={$w_words}
			oninput={find_first} />
	</div>
	<div class='view-head'>
		<Steppers {can_back} {can_forward} {onprev} {onnext}
			back_says='previous file' forward_says='next file' />
		<!-- The folders above the file follow the steppers at the left. -->
		<span class='view-ancestry'>{sits_at}</span>
		<!-- The file's name keeps the middle of the whole row, so nothing beside it moves the
		     name — or, while renaming, the name being typed. -->
		{#if renaming}
			<input
				use:take_the_cursor
				class='rename-field'
				bind:value={typed_name}
				onkeydown={(e) => { if (e.key === 'Enter') { handle_rename(); } }} />
		{:else}
			<span class='view-name'>{name}</span>
		{/if}
		<span class='view-spacer'></span>
	</div>
	</div>
	<!-- While the labels are open the heavy line moves below them, so the form reads as part of
	     the top rather than as words of the file. Its word folds away only what sits between it
	     and the next line — the kind, title, date and description — leaving the tags below. -->
	<Separator
		at_left
		thickness={k.gap.default}
		title={label_rows_word}
		onclick={() => { w_show_labels.set(!$w_show_labels); debug.log(`Editing "${name}": the label form is now ${!$w_show_labels ? 'hidden' : 'shown'}.`); }}/>
	<!-- The five labels, shown only while editing. They never appear among the words, so
	     this is the only way at them. -->
	{#if $w_show_labels}
		<div class='label-form'>
			<div class='label-row'>
				<span class='label-word'>kind</span>
				{#each KINDS as one (one)}
					<button class='label-pick' class:on={form_kind === one} onclick={() => { form_kind = one; save_labels(); }}>{one}</button>
				{/each}
			</div>
			<div class='label-row'>
				<span class='label-word'>title</span>
				<input class='label-field' bind:value={form_title} onblur={save_labels} />
				<span class='label-word'>date</span>
				<input class='label-field date' bind:value={form_date} onblur={save_labels} />
			</div>
			<div class='label-row'>
				<span class='label-word'>says</span>
				<input class='label-field' bind:value={form_description} onblur={save_labels} />
			</div>
			<div class='label-sep'>
				<Separator at_left thickness={k.separator.normal} title={form_tags_word}
					onclick={() => { show_form_tags = !show_form_tags; debug.log(`Editing "${name}": the tag areas are now ${show_form_tags ? 'shown' : 'folded away'}.`); }}/>
			</div>
			<!-- The same six areas the filters use. Every tag is within reach here, since this
			     is where a file's own tags are set rather than where files are narrowed. -->
			{#if show_form_tags}
				<div class='label-row wrapping'>
					{#each TAG_AREAS as area (area.name)}
						<Big_Pill {area} in_reach={ALL_TAGS} chosen={form_tags} ontoggle={toggle_tag} />
					{/each}
				</div>
			{/if}
		</div>
		<Separator thickness={k.separator.huge}/>
	{/if}
	<!-- Nothing is said while the words are being read: the wait is too short to see, and a
	     line that flashes and goes reads as a fault. -->
	{#if !loaded}
		<div class='view-page'></div>
	{:else if failed !== ''}
		<div class='view-note'>file is unreadable — cannot view it</div>
	{:else}
		<!-- A click on a link follows it; a click anywhere else on the words goes back to
		     the list, the same as the close button — so getting out never means aiming at
		     the small circle. Holding the command key suspends all of that, so the words can
		     be dragged over and picked up instead. -->
		<div
			role='button'
			tabindex='-1'
			bind:this={page}
			class='view-page'
			onkeyup={() => {}}
			class:has-bar={page_has_bar}
			class:selecting={$w_command_down}
			use:tip={$w_command_down ? 'drag to pick up these words' : 'click a paragraph to change it'}
			onmousedown={watch_for_bar_press}
			onclick={on_page_click}>{@html words}</div>
	{/if}
	<!-- What a link that leads nowhere has to say. It clears itself after a few seconds. -->
	{#if note !== ''}
		<div class='view-note-line'>{note}</div>
	{/if}
</div>

<style>
	.viewer {
		position       : relative;   /* the anchor for the pinned close button */
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* The triangles and the kind hug the far left; the tags and the pinned close hug the
	   far right. The name is placed at the middle of the whole row rather than centered
	   in whatever space its neighbors leave over, so a long tag list moves nothing. */
	/* The two rows above the heavy line, taken as one block. Its empty parts are the way back
	   to the list, and the whole of it lights while the cursor is on any of them. */
	/* It reaches out to the three edges of the box it sits in — the space the box holds
	   around its contents is part of this area, so the lit color has to cover it too. */
	.view-top {
		margin         : calc(var(--gap) * -1) calc(var(--gap) * -1) 0;
		padding        : var(--gap) var(--gap) 0;
		flex-direction : column;
		cursor         : pointer;
		display        : flex;
		flex           : 0 0 auto;
	}

	.view-top.lit {
		background : var(--hover);
	}

	.view-head {
		padding-bottom : var(--gap);
		min-height     : var(--height-control);
		gap            : var(--gap);
		position       : relative;
		align-items    : start;
		display        : flex;
	}

	/* The empty run that holds the buttons at the left apart from the kind and tags at the
	   right, now that nothing sits between them. */
	.view-spacer {
		flex : 1 1 auto;
	}

	/* The folders above the file, just right of the steppers at the left of the button row. */
	.view-ancestry {
		opacity      : var(--opacity-header);
		font-size    : var(--font-label);
		margin-left  : var(--gap-tight);
		color        : var(--text);
		position     : relative;
		flex         : 0 1 auto;
		white-space  : nowrap;
		overflow     : hidden;
		top          : 4px;
		min-width    : 0;
	}

	/* A row of its own for the file's name, held in the middle of the whole width. */
	/* The file's name is placed at the middle of the whole row rather than centered in what its
	   neighbors leave over, so nothing beside it can move the name. */
	.view-name {
		transform   : translateX(-50%);
		font-size   : var(--font-large);
		color       : var(--text);
		white-space : nowrap;
		position    : absolute;
		text-align  : center;
		min-width   : 0;
		left        : 50%;
		top         : 0;
	}

	/* While renaming, the field stands where the file's place normally reads, taking the
	   width of that row. */
	.rename-field {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(-font-control);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		margin-right  : var(--gap);
		flex          : 1 1 auto;
		font-family   : inherit;
		min-width     : 0;
	}


	/* The steppers, pinned together at the top far left. */
	.view-steps {
		gap          : var(--gap);
		align-items  : center;
		justify-self : start;
		display      : flex;
	}

	/* The five labels while editing: a line each for the kind, the name and date, what it
	   says, and the tags. The pickers read like the filters' own, so the closed lists look
	   the same wherever they turn up. */
	.label-form {
		gap            : var(--gap-tight);
		margin         : var(--gap) 0;
		flex-direction : column;
		display        : flex;
	}

	.label-row {
		gap         : var(--gap-tight);
		align-items : center;
		display     : flex;
	}

	/* The sep before the tags stands clear of the row above it and the pickers below. */
	.label-sep {
		margin : var(--gap-small) 0;
	}

	.label-row.wrapping {
		justify-content : center;
		flex-wrap       : wrap;
	}

	.label-word {
		opacity    : var(--opacity-header);
		font-size  : var(--font-label);
		color      : var(--text);
		flex       : 0 0 auto;
		text-align : right;
		width      : 45px;
	}

	.label-field {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 1 1 auto;
		font-family   : inherit;
		min-width     : 0;
	}

	.label-field.date {
		flex  : 0 0 auto;
		width : 110px;
	}

	.label-pick {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 0 auto;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.label-pick:hover {
		background : var(--hover);
	}

	.label-pick.on {
		background : var(--accent);
	}

	/* The box standing in for one piece of the file. It is put on the page by hand rather
	   than drawn from here, so it is named as reaching outside this component. */
	:global(.edit-box) {
		/* No edge at all, and no room taken for one, so opening and leaving a piece never moves
		   the words by a pixel. */
		border-radius   : var(--radius-small);
		/* The same size, leading, spacing and step-in a paragraph reads at, so opening a piece
		   for editing doesn't reflow the words around it. */
		font-size       : var(--font-base);
		margin          : var(--gap) 0;
		background      : var(--white);
		color           : var(--text);
		box-sizing      : border-box;
		white-space     : pre-wrap;
		font-family     : inherit;
		overflow        : hidden;
		display         : block;
		outline         : none;
		resize          : none;
		border          : none;
		width           : 100%;
		text-indent     : 10px;
		line-height     : 1.5;
		padding         : 0;
	}

	/* The mark beside a heading, sitting out in the left margin so the words never shift. It is
	   put on the page by hand rather than drawn from here, so it is named as reaching outside
	   this component. */
	.view-page :global(h1),
	.view-page :global(h2),
	.view-page :global(h3),
	.view-page :global(h4),
	.view-page :global(h5),
	.view-page :global(h6) {
		position : relative;
	}

	/* Centered in the lane the words are held off by, both ways. */
	:global(.fold-mark) {
		left            : calc(var(--gap-fat) / -1.7);
		transform       : translate(-50%, -40%);
		background      : transparent;
		position        : absolute;
		cursor          : pointer;
		justify-content : center;
		align-items     : center;
		display         : flex;
		border          : none;
		top             : 50%;
		padding         : 0;
	}

	/* The same look as the folder marks: white inside an accent outline, filling under the
	   cursor. */
	:global(.fold-mark path) {
		stroke       : var(--accent);
		fill         : var(--white);
		stroke-width : 1;
	}

	:global(.fold-mark:hover path) {
		fill : var(--hover);
	}

	/* A piece that begins with a dash is a list, and a list starts at the edge. */
	:global(.edit-box.flush) {
		margin-left     : var(--gap-huge);
	}


	.view-page {
		/* Held clear on all four sides — but the left inset is inside the box rather than
		   outside it, so the marks beside the headings have somewhere to sit. Anything outside
		   a box that scrolls is clipped away. */
		margin       : var(--gap) var(--gap-fat) var(--gap) 0;
		font-size    : var(--font-base);
		padding-left : var(--gap-fat);
		color        : var(--text);
		word-break   : break-word;
		cursor       : pointer;
		overflow-y   : auto;
		flex         : 1;
	}

	/* With a bar beside the words the right margin comes off, so the bar sits against the box's
	   edge rather than floating in from it — and a gap is held inside instead, so the words
	   never run up against the bar. */
	.view-page.has-bar {
		padding-right : var(--gap);
		margin-right  : 0;
	}

	/* The bar beside the words, and the one under a wide code block. Every scrolling box has
	   to name itself like this — the app-wide form of the rule matches nothing at all. */
	.view-page::-webkit-scrollbar {
		height : var(--width-bar);
		width  : var(--width-bar);
	}

	.view-page::-webkit-scrollbar-thumb {
		background    : var(--accent);
		border-radius : 999px;
	}

	.view-page::-webkit-scrollbar-track {
		background : transparent;
	}

	.view-page :global(pre::-webkit-scrollbar) {
		height : var(--width-bar);
		width  : var(--width-bar);
	}

	.view-page :global(pre::-webkit-scrollbar-thumb) {
		background    : var(--accent);
		border-radius : 999px;
	}

	.view-page :global(pre::-webkit-scrollbar-track) {
		background : transparent;
	}


	/* With the option key held, the words can be dragged over and picked up. The whole app
	   otherwise refuses that, so it is turned back on here and on everything inside. */
	.view-page.selecting,
	.view-page.selecting :global(*) {
		user-select : text;
		cursor      : text;
	}

	/* The first thing on the page keeps no room above it, so the words begin exactly where
	   the scrollbar beside them does. Everything after it keeps its own spacing. */
	.view-page :global(> :first-child) {
		margin-top : 0;
	}

	/* The guide's own headings, lists, code and tables. Styled here because the markup is
	   handed in whole rather than written out tag by tag, so each part has to be named. */
	.view-page :global(h1),
	.view-page :global(h2),
	.view-page :global(h3),
	.view-page :global(h4),
	.view-page :global(h5),
	.view-page :global(h6) {
		margin-bottom : var(--gap-tight);
		margin-top    : var(--gap-fat);
		line-height   : 1.25;
	}

	.view-page :global(h1) { font-size : var(--font-large); }
	.view-page :global(h2) { font-size : var(--font-banner); }
	.view-page :global(h3),
	.view-page :global(h4),
	.view-page :global(h5),
	.view-page :global(h6) { font-size : var(--font-base); }

	/* The six heading colors Obsidian ships with in its light theme, so a guide reads here the
	   way it reads there. */
	.view-page :global(h1) { color : #4a9ad4; }

	/* A line under the top heading, the way Obsidian draws one. */
	.view-page :global(h1) {
		border-bottom  : 0.5px solid var(--gray);
		padding-bottom : var(--gap-tight);
		margin-bottom  : var(--gap-fat);
	}

	/* With its own words folded away there is nothing below for the line to close off, so it
	   goes and the heading sits tight against what follows. */
	.view-page :global(h1.folded-away) {
		border-bottom  : none;
		padding-bottom : 0;
		margin-bottom  : var(--gap);
	}

	.view-page :global(h2) { color : #48b57e; }
	.view-page :global(h3) { color : #c4a747; }
	.view-page :global(h4) { color : #c98a5e; }
	.view-page :global(h5) { color : #bf6a6a; }
	.view-page :global(h6) { color : #a97ec4; }

	.view-page :global(p),
	.view-page :global(ul),
	.view-page :global(ol) {
		margin      : var(--gap-tight) 0;
		line-height : 1.5;
	}

	/* Every paragraph steps in a little, the way a printed page does, and stands clear of the
	   one before it. */
	.view-page :global(p) {
		margin      : var(--gap) 0;
		text-indent : 10px;
	}

	.view-page :global(li) {
		margin-bottom : var(--gap-tight);
	}

	.view-page :global(a) {
		color : var(--accent-dark);
	}

	.view-page :global(code) {
		border-radius : var(--radius-banner);
		background    : var(--offwhite);
		font-size     : var(--font-label);
		padding       : 0 4px;
	}

	.view-page :global(pre) {
		border-radius : var(--radius-banner);
		background    : var(--offwhite);
		padding       : var(--gap);
		overflow-x    : auto;
	}

	.view-page :global(pre code) {
		background : none;
		padding    : 0;
	}

	.view-page :global(blockquote) {
		border-left : var(--thickness-fat) solid var(--accent);
		padding-left: var(--gap);
		margin-left : 0;
		opacity     : var(--opacity-header);
	}

	.view-page :global(table) {
		border-collapse : collapse;
		font-size       : var(--font-label);
		margin          : var(--gap) 0;
	}

	.view-page :global(th),
	.view-page :global(td) {
		border  : var(--thickness-faint) solid var(--accent);
		padding : var(--gap-tight) var(--gap);
		text-align : left;
	}

	.view-page :global(hr) {
		border-top : var(--thickness-faint) solid var(--accent);
		margin     : var(--gap-fat) 0;
		border     : none;
	}

	/* The search row, under the top row: the walking triangles, then the field. */
	/* One height whether or not anything is typed, so the words below never shift when the
	   step triangles and the count arrive beside the field. */
	.view-search {
		min-height     : var(--height-control);
		padding-bottom : calc(var(--gap));
		gap            : var(--gap);
		flex           : 0 0 auto;
		align-items    : center;
		display        : flex;
	}

	/* The triangles that walk the places the words turn up, and the count between them. The
	   triangles are drawn a touch taller than a control; held to the row's own height they
	   still show whole, and the row no longer grows the moment they arrive. */
	.view-steps.hits {
		height      : var(--height-control);
		flex        : 0 0 auto;
		align-items : center;
		display     : flex;
	}

	.hit-count {
		font-size   : var(--font-label);
		color       : var(--text);
		opacity     : var(--opacity-header);
		text-align  : center;
		white-space : nowrap;
		min-width   : 60px;
	}

	.search {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		width         : 100%;
	}

	/* The one place found, lit in the accent. */
	/* A square block around the words themselves, nothing wider — so what is lit is exactly
	   what was looked for. */
	.view-page :global(mark.hit) {
		color         : var(--text-on-accent);
		background    : var(--accent);
		border-radius : 0;
		padding       : 0;
	}

	/* The line a dead link leaves behind, along the bottom of the reading area. */
	.view-note-line {
		border-top : var(--thickness-faint) solid var(--accent);
		opacity    : var(--opacity-label);
		font-size  : var(--font-label);
		padding-top: var(--gap-tight);
		color      : var(--text);
		text-align : center;
		flex       : 0 0 auto;
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
