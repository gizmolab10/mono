<script lang='ts'>
	import { lines_between, page_of, still_reads, with_lines_replaced } from '../../ts/utilities/Markdown_Blocks';
	import { follow_link, w_command_down, w_file_place, w_search_at, w_search_for } from '../../ts/managers/Operations';
	import { ALL_TAGS, T_Bundle, T_Kind, in_order, key_of, type Guide } from '../../ts/types/Guide';
	import { foldable_headings, hidden_pieces, top_headings } from '../../ts/utilities/Sections';
	import { landed_on_a_control, names_up_to } from '../../ts/utilities/Leaving';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { HEAVY, SLANTED, STRUCK, partner_of, surround, toggle_emphasis } from '../../ts/utilities/Emphasis';
	import { free_thumb, type Free_Thumb } from '../../ts/utilities/Thumb';
	import { VAULT, file_path_of, obsidian_link, save_guide } from '../../ts/utilities/Saving';
	import { with_labels_replaced } from '../../ts/utilities/Labels';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { TAG_AREAS } from '../../ts/types/Tag_Areas';
	import { shut_all_areas, w_words } from '../../ts/managers/Filters';
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

	// Turning a guide's text into the page on screen — filters off the top, every piece
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

	// The thumb is never shorter than a fifth of its lane. Where the browser would have put it,
	// left alone, is drawn as a thin strip over the real one, so both can be seen at once.
	let free = $state<Free_Thumb>({ top: 0, length: 0, shows: false });

	/** Look again at how tall the words are, and at both thumbs. */
	function measure_page() {
		const box = page;
		if (!box) { page_has_bar = false; free = { top: 0, length: 0, shows: false }; return; }
		page_has_bar = box.scrollHeight > box.clientHeight + 1;
		free = free_thumb(box.clientHeight, box.scrollHeight, box.scrollTop, box.offsetTop);
	}

	$effect(() => {
		const box = page;
		if (!box) { measure_page(); return; }
		measure_page();
		const watcher = new ResizeObserver(measure_page);
		watcher.observe(box);
		box.addEventListener('scroll', measure_page);
		return () => { watcher.disconnect(); box.removeEventListener('scroll', measure_page); };
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
	const TITLE_DROP = k.gap.small * 2;             // how far the title's box is drawn below where it stands
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

	/**
	 * Make what is picked in the open box heavy or slanted, or plain again. The words and the
	 * picking are worked out away from the screen; this only puts the answer back and leaves the
	 * same run of words picked, so pressing again undoes it.
	 */
	function emphasize(mark: string) {
		if (!box) { return; }
		const the_box = box;
		const done = toggle_emphasis(the_box.value, the_box.selectionStart, the_box.selectionEnd, mark);
		the_box.value = done.text;
		the_box.setSelectionRange(done.from, done.to);
		fit_box();
		const says = mark === HEAVY ? 'heavy' : mark === SLANTED ? 'slanted' : 'struck through';
		debug.log(`Editing "${name}": ${says} was pressed on ${done.to - done.from} character(s).`);
	}

	/** Grow the box to hold everything typed into it. */
	function fit_box() {
		if (!box) { return; }
		// The title's box stands in a slot of its own, reaching down to the line across the page.
		// It never grows, so the words after it never move.
		if (box.classList.contains('title')) { return; }
		box.style.height = 'auto';
		box.style.height = `${box.scrollHeight}px`;
	}

	/** The first piece after this one that is actually on screen, skipping any put away by a fold. */
	function next_one_showing(block: HTMLElement): HTMLElement | null {
		let one = block.nextElementSibling as HTMLElement | null;
		while (one && one.offsetParent === null) {
			one = one.nextElementSibling as HTMLElement | null;
		}
		return one;
	}

	/**
	 * Put the piece after the open box back where it was standing. The box is never quite the
	 * height of the piece it stands in for — different spacing above, a hair of room held inside
	 * it, whole-pixel rounding — and rather than trying to account for each of those, the room
	 * below the box is simply set to whatever closes the gap. Measured twice, since the first
	 * correction can itself shift things by a fraction.
	 */
	function hold_what_follows(after: HTMLElement | null, was_at: number) {
		if (!box || !after) { return; }
		const the_box = box;
		for (let go = 0; go < 2; go += 1) {
			const drift = after.getBoundingClientRect().top - was_at;
			if (Math.abs(drift) < 0.01) { break; }
			const room = parseFloat(getComputedStyle(the_box).marginBottom) || 0;
			the_box.style.marginBottom = `${room - drift}px`;
			debug.log(`Editing "${name}": the piece below sat ${drift.toFixed(2)}px off, so the room under the box went from ${room.toFixed(2)}px to ${(room - drift).toFixed(2)}px.`);
		}
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
		// A chunk of code reads in the even-width letters it is written in, and lines are left
		// exactly where they fall — so the box holding one is dressed to match.
		if (block.tagName === 'PRE') { box.classList.add('code'); }
		// A heading stands further clear of what comes before it than a paragraph does. The box
		// takes that same standing-clear, so opening a heading doesn't jerk it upward.
		if (/^H[1-6]$/.test(block.tagName)) { box.classList.add('heading'); }
		// The title's box is drawn a few pixels lower so it sits square with the line across the
		// page, and the words below come down with it.
		const drop = block.tagName === 'H1' ? TITLE_DROP : 0;
		if (drop > 0) { box.classList.add('title'); box.style.top = `${drop}px`; }
		box.addEventListener('input', fit_box);
		box.addEventListener('blur', () => {
			if (pressed_the_bar) { pressed_the_bar = false; box?.focus(); return; }
			close_box(true);
		});
		box.addEventListener('keydown', (e: KeyboardEvent) => {
			e.stopPropagation();                     // the guide's own keys stay out of the box
			if (e.key === 'Escape') { close_box(false); return; }
			// Typing one of the marks that comes in a pair, with words picked, puts it before
			// them and its partner after — rather than throwing the picked words away.
			if (!e.metaKey && !e.ctrlKey && !e.altKey && partner_of(e.key) !== '') {
				const the_box = box;
				if (the_box && the_box.selectionStart !== the_box.selectionEnd) {
					const done = surround(the_box.value, the_box.selectionStart, the_box.selectionEnd, e.key);
					if (done) {
						e.preventDefault();
						the_box.value = done.text;
						the_box.setSelectionRange(done.from, done.to);
						fit_box();
						debug.log(`Editing "${name}": put ${e.key}${partner_of(e.key)} around ${done.to - done.from} character(s).`);
						return;
					}
				}
			}
			// Command with b, i or a hyphen puts marks around what is picked, or takes them off.
			if (!(e.metaKey || e.ctrlKey) || e.altKey) { return; }
			const mark = e.key === 'b' ? HEAVY : e.key === 'i' ? SLANTED : e.key === '-' ? STRUCK : '';
			if (mark === '') { return; }
			e.preventDefault();
			emphasize(mark);
		});
		// Where the piece after this one starts, noted before anything changes, so the box can be
		// held to it afterwards. Under a folded heading the pieces that follow are put away, and a
		// piece that is not on screen has no place to be held to — so the first one still showing
		// is the one to watch.
		const after = next_one_showing(block);
		const was_at = after ? after.getBoundingClientRect().top : 0;
		block.parentNode?.insertBefore(box, block);
		block.style.display = 'none';
		fit_box();
		hold_what_follows(after, was_at);
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

	// --- the five filters at the top -------------------------------------------

	// The filters are never on the page — they are taken off before the words are drawn —
	// so editing them has its own small form, shown only while editing is on. Nothing here
	// is typed as free text where it matters: the kind and the tags are picked from the
	// only lists the app accepts.
	let form_kind        = $state('');
	let form_title       = $state('');
	let form_description = $state('');
	let form_date        = $state('');
	let form_tags        = $state<string[]>([]);
	const KINDS = Object.values(T_Kind);

	// Whether the filter form is on screen while editing. Remembered across visits, since it
	// is a way of working rather than something about one guide.
	const w_show_filters = preferences.persistent<boolean>(T_Preference.show_filters, true);

	// Whether the search row is on screen at all. Folded away, the words below take its room,
	// and the word on the line above brings it back. Remembered the same way.
	const w_show_search = preferences.persistent<boolean>(T_Preference.show_search, true);

	// Shown, the word is just "search". Folded away with something typed, it says what is being
	// looked for, so a search left running is never invisible.
	let search_word = $derived($w_show_search || $w_words === '' ? 'search' : `search ➜ ${$w_words}`);

	// The tag areas take four rows of their own, so the word above them folds them away — and
	// says what the guide wears while they are gone, as the filters' own lines do.
	let show_form_tags = $state(true);
	let form_tags_word = $derived(show_form_tags ? 'tags'
		: `tags ➜ ${form_tags.length === 0 ? 'none' : [...form_tags].sort(in_order).join(', ')}`);

	// The word on the line above the form folds the whole form away. With the form on screen it
	// is just the one word; folded, it says what the file is filtered, since that is the only
	// place left to read it.
	let filter_rows_word = $derived($w_show_filters ? '✂ filters'
		: `✂ filters ➜ ${[form_kind, ...[...form_tags].sort(in_order)]
			.filter((one) => one !== '').join(', ') || 'none'}`);

	// Whenever another guide comes on screen, the form starts from what that guide says.
	$effect(() => {
		form_kind        = guide.kind;
		form_title       = guide.title;
		form_description = guide.description;
		form_date        = guide.date;
		form_tags        = [...tags];
	});

	/** Write the five filters back, if any of them changed. */
	function save_filters() {
		if (text_of_file === '') { return; }
		const filters = { kind: form_kind, title: form_title, description: form_description, date: form_date, labeled: true };
		const whole  = with_labels_replaced(text_of_file, filters, form_tags);
		if (whole === text_of_file) { return; }
		const was   = text_of_file;
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": the filters changed — writing them to ${where}.`);
		text_of_file = whole;                 // the words below are untouched, so no redraw
		save_guide(where, whole, was).then((answer) => {
			if (!answer.ok) {
				text_of_file = was;
				say(`not saved — ${answer.why}`);
				debug.log(`Editing "${name}": the filters were NOT written to ${where} — ${answer.why}.`);
				return;
			}
			// The list shows the title and the tags, so it is told at once rather than
			// waiting for every file to be read again.
			guides.relabel(guide, filters, form_tags);
			debug.log(`Editing "${name}": filters written — kind "${filters.kind}", ${form_tags.length} tag(s).`);
		});
	}

	// The file's name in the top row is a field that reads as plain words until the cursor is
	// over it. Typing in it changes nothing until the field is left or Return is pressed; either
	// gives the file itself the name typed.
	let typed_name = $state('');

	// Whenever another guide comes on screen, the field starts from that guide's own name.
	$effect(() => { typed_name = name; });

	// Throwing this guide away is asked about first: the trash mark at the right of the row
	// gives way to a cross, and the question stands over the words until it is answered.
	let asking_to_delete = $state(false);
	const crossPath = svg_paths.x_cross(k.size.normal, k.size.normal / 6);
	const binPath   = svg_paths.trashcan(k.size.normal);

	// Stepping to another guide takes the question with it — it belonged to the one being left.
	$effect(() => { address; asking_to_delete = false; });

	// Where a guide is sent when it is handed on.
	const SENT_TO = 'sand@gizmolab.com';

	/**
	 * Hand this guide to Obsidian. The repo is itself a vault, so where the file sits counting
	 * from the top of the repo is also where it sits in the vault.
	 */
	function handle_obsidian() {
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": handing it to Obsidian at ${where}.`);
		window.location.href = obsidian_link(VAULT, where);
	}

	/**
	 * Open a new message with this guide already in it: the file's name for a subject, its whole
	 * words for the body. Nothing is written, moved or thrown away — the message is the reader's
	 * to send or drop.
	 */
	function handle_send() {
		const body = text_of_file;
		const to = `mailto:${SENT_TO}?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
		debug.log(`Editing "${name}": handing it on to ${SENT_TO} — ${body.length} character(s) of words in the message.`);
		window.location.href = to;
	}

	/** Throw this guide away. Only if the file itself goes does the view go back to the list. */
	function handle_delete() {
		asking_to_delete = false;
		debug.log(`Editing "${name}": throwing it away.`);
		guides.delete_one(guide).then((gone) => { if (gone) { onclose(); } });
	}

	/**
	 * Give the file itself a different name: the file, every link naming it, and the index
	 * beside it are put right together. A name unchanged, or emptied, does nothing.
	 */
	function handle_rename() {
		const said = typed_name.trim();
		if (said === '' || said === name) {
			typed_name = name;
			return;
		}
		debug.log(`Editing "${name}": renaming it to "${said}".`);
		// The view follows the guide to its new place on its own; a rename that was refused puts
		// the old name back in the field.
		guides.rename(guide, said).then((now_at) => { if (now_at === '') { typed_name = name; } });
	}

	/** Put a tag on this guide or take it off, and write it. */
	function toggle_tag(tag: string) {
		form_tags = form_tags.includes(tag) ? form_tags.filter((t) => t !== tag) : [...form_tags, tag].sort(in_order);
		save_filters();
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
	const FOLD_MARK = k.size.small * 1.05;
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
		// Folding changes how tall the words are but not the box holding them, so nothing else
		// would tell the bar and its marker to look again.
		measure_page();
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
	<div class='view-head'>
		<!-- Which of the files the filters leave is being read, and how many there are. Nothing
		     while reading off the list, on a run of guides reached by links. -->
		{#if $w_file_place}
			<span class='file-count'>{$w_file_place.at} of {$w_file_place.of}</span>
		{/if}
		<Steppers {can_back} {can_forward} {onprev} {onnext}
			back_says='previous file' forward_says='next file' />
		<!-- The folders above the file follow the steppers at the left. -->
		<span class='view-ancestry'>{sits_at}</span>
		<!-- An empty run on either side, so the name sits at the middle of whatever the folders
		     leave over rather than at the middle of the whole row. -->
		<span class='view-spacer'></span>
		<!-- The name is a field that reads as plain words until the cursor is over it. Leaving
		     it, or pressing Return, gives the file itself whatever was typed. While the
		     question about throwing the guide away is up, the name steps aside — the question
		     already says which file it means. -->
		{#if !asking_to_delete}
		<input
			class='view-name'
			size={Math.max(1, typed_name.length)}
			bind:value={typed_name}
			use:tip={'change the file\'s name'}
			onclick={(e) => (e.currentTarget as HTMLInputElement).focus()}
			onblur={handle_rename}
			onkeydown={(e) => {
				e.stopPropagation();
				if (e.key === 'Enter') { (e.currentTarget as HTMLInputElement).blur(); }
				if (e.key === 'Escape') { typed_name = name; (e.currentTarget as HTMLInputElement).blur(); }
			}} />
		{/if}
		<span class='view-spacer'></span>
		<!-- Asking in words rather than in a box of its own: the trash mark asks, and the
		     question that takes its place is the thing that answers. -->
		{#if asking_to_delete}
			<button class='asking-yes' use:tip={'throw it away for good'}
				onclick={(e) => { e.stopPropagation(); handle_delete(); }}>delete "{name}"</button>
			<button class='row-button' aria-label='keep it' use:tip={'keep this guide'}
				onclick={(e) => { e.stopPropagation(); asking_to_delete = false; }}>
				<svg class='row-mark' viewBox='0 0 {k.size.normal} {k.size.normal}'>
					<path d={crossPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' />
				</svg>
			</button>
		{:else}
			<!-- The two stand together at the end of the row: hand this guide on, or throw it
			     away. Handing it on comes first, since it is the one taken more often. -->
			<span class='row-pair'>
				<button class='row-button lifted' aria-label='obsidian' use:tip={'open this guide in Obsidian'}
					onclick={(e) => { e.stopPropagation(); handle_obsidian(); }}>o</button>
				<button class='row-button' aria-label='send' use:tip={'send this guide in a message'}
					onclick={(e) => { e.stopPropagation(); handle_send(); }}>⤴</button>
				<button class='row-button' aria-label='delete' use:tip={'throw this guide away'}
					onclick={(e) => { e.stopPropagation(); asking_to_delete = true; }}>
					<svg class='row-mark' viewBox='0 0 {k.size.normal} {k.size.normal}'>
						<path d={binPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' stroke-linejoin='round' />
					</svg>
				</button>
			</span>
		{/if}
	</div>
	<!-- The line above the search, carrying its own word. Pressing the word folds the search
	     away, and the words below take its room; pressing it again brings it back. -->
	<Separator at_left thickness={k.thickness.huge} title={search_word}
		onclick={() => { w_show_search.set(!$w_show_search); debug.log(`Editing "${name}": the search row is now ${!$w_show_search ? 'folded away' : 'shown'}.`); }}/>
	<!-- Looking through the file on screen. Its type is "search", so the browser draws its
	     own clear cross at the right end once there is text. -->
	{#if $w_show_search}
	<div class='view-search'>
		<!-- With something typed, two triangles walk the places those words turn up, and the
		     count says which of them is lit. -->
		{#if $w_words !== ''}
			<!-- The count reads first, then the two marks that walk from one place to the next. -->
			<div class='view-steps hits'>
				<span class='hit-count'>{hits_found === 0 ? 'none' : `${hit_at + 1} of ${hits_found}`}</span>
				<Steppers can_back can_forward onprev={() => step_hit(-1)} onnext={() => step_hit(1)} back_says='the place before' forward_says='the place after' />
			</div>
		{/if}
		<input
			type='search'
			class='search'
			placeholder='search'
			oninput={find_first}
			bind:value={$w_words}
			use:tip={'search this file'} />
	</div>
	{:else}
		<!-- With the search folded away its line would sit right on top of the next one, so a gap
		     stands in for the row that went. -->
		<div class='sep-gap'></div>
	{/if}
	</div>
	<!-- While the filters are open the heavy line moves below them, so the form reads as part of
	     the top rather than as words of the file. Its word folds away only what sits between it
	     and the next line — the kind, title, date and description — leaving the tags below. -->
	<Separator
		at_left
		title={filter_rows_word}
		thickness={k.gap.normal}
		onclick={() => { w_show_filters.set(!$w_show_filters); debug.log(`Editing "${name}": the filter form is now ${!$w_show_filters ? 'hidden' : 'shown'}.`); }}/>
	<!-- The five filters, shown only while editing. They never appear among the words, so
	     this is the only way at them. -->
	{#if $w_show_filters}
		<div class='filter-form'>
			<div class='filter-row'>
				<span class='filter-word'>kind</span>
				{#each KINDS as one (one)}
					<button class='filter-pick' class:on={form_kind === one} onclick={() => { form_kind = one; save_filters(); }}>{one}</button>
				{/each}
			</div>
			<div class='filter-row'>
				<span class='filter-word'>title</span>
				<input class='filter-field' bind:value={form_title} onblur={save_filters} />
				<span class='filter-word'>date</span>
				<input class='filter-field date' bind:value={form_date} onblur={save_filters} />
			</div>
			<div class='filter-row'>
				<span class='filter-word'>says</span>
				<input class='filter-field' bind:value={form_description} onblur={save_filters} />
			</div>
			<div class='filter-sep'>
				<Separator at_left thickness={k.thickness.normal} title={form_tags_word}
					onclick={() => { show_form_tags = !show_form_tags; debug.log(`Editing "${name}": the tag areas are now ${show_form_tags ? 'shown' : 'folded away'}.`); }}/>
			</div>
			<!-- The same six areas the filters use. Every tag is within reach here, since this
			     is where a file's own tags are set rather than where files are narrowed. -->
			{#if show_form_tags}
				<!-- A press on the empty space among the areas shuts them all, the same as in
				     the list. A press on an area itself is that area's own. -->
				<div class='filter-row wrapping' role='presentation'
					onclick={(event) => { if (event.target === event.currentTarget) { shut_all_areas(); } }}>
					{#each TAG_AREAS as area (area.name)}
						<Big_Pill {area} in_reach={ALL_TAGS} chosen={form_tags} ontoggle={toggle_tag} />
					{/each}
				</div>
			{/if}
		</div>
		<Separator thickness={k.thickness.huge}/>
	{/if}
	<!-- Nothing is said while the words are being read: the wait is too short to see, and a
	     line that flashes and goes reads as a fault. -->
	{#if !loaded}
		<div class='view-page'></div>
	{:else if failed !== ''}
		<div class='view-note'>file is unreadable — cannot view it</div>
	{:else}
		<!-- Where the browser would have put the thumb with no floor under it, drawn over the
		     real one so both can be seen at once. Nothing to catch — it is only a marker. -->
		{#if free.shows}
			<div class='free-thumb' style:top='{free.top}px' style:height='{free.length}px'></div>
		{/if}
		<div class='view-body'>
			<!-- The line under the title. It is a fixture of the page rather than an edge of the
			     heading, so it stays put whether the title is shown, folded, or open for changing. -->
			<div class='title-sep'>
				<Separator thickness={k.thickness.normal}/>
			</div>
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
				onclick={on_page_click}
				class:has-bar={page_has_bar}
				class:selecting={$w_command_down}
				onmousedown={watch_for_bar_press}
				use:tip={$w_command_down ? 'drag to select' : 'click a paragraph to edit it'}>
				{@html words}
			</div>
		</div>
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
		padding        : var(--gap-small) var(--gap) 0;
		flex           : 0 0 auto;
		cursor         : pointer;
		flex-direction : column;
		display        : flex;
	}

	.view-top.lit {
		background : var(--hover);
	}

	.view-head {
		padding-bottom : var(--gap-small);
		height         : var(--height);
		box-sizing     : content-box;
		gap            : var(--gap);
		position       : relative;
		align-items    : center;
		display        : flex;
	}

	/* The step marks are drawn a touch taller than a control. Held to the row's own height
	   they still show whole — they are allowed to spill — and the row keeps one height
	   whether they are there or not. */
	.view-head :global(.steppers) {
		height : var(--height);
	}

	/* The empty run that holds the buttons at the left apart from the kind and tags at the
	   right, now that nothing sits between them. */
	.view-spacer {
		flex : 1 1 auto;
	}

	/* The folders above the file, just right of the steppers at the left of the button row. */
	/* Which file of the run is on screen, reading like the folders beside it. */
	.file-count {
		opacity     : var(--opacity-header);
		font-size   : var(--font-tiny);
		color       : var(--text);
		flex        : 0 0 auto;
		white-space : nowrap;
	}

	.view-ancestry {
		opacity      : var(--opacity-header);
		font-size    : var(--font-tiny);
		margin-left  : var(--gap-tiny);
		color        : var(--text);
		position     : relative;
		flex         : 0 1 auto;
		overflow     : hidden;
		white-space  : nowrap;
		min-width    : 0;
	}

	/* A round button at the end of the row: white inside a hairline edge, filling under the
	   cursor — the same look every other small button in the app wears. */
	/* The three at the end of the row stand one gap apart. */
	.row-pair {
		gap         : var(--gap);
		flex        : 0 0 auto;
		align-items : center;
		display     : flex;
	}

	.row-button {
		border          : var(--thick-small) solid var(--black);
		border-radius   : var(--radius-percent);
		background      : var(--white);
		height          : var(--size);
		width           : var(--size);
		font-size       : var(--font);
		color           : var(--text);
		box-sizing      : border-box;
		flex            : 0 0 auto;
		cursor          : pointer;
		font-family     : inherit;
		justify-content : center;
		align-items     : center;
		display         : flex;
		padding         : 0;
		line-height     : 1;
	}

	.row-button:hover {
		background : var(--hover);
	}

	/* A letter sits lower in its own line than a drawn mark does, so the letter is nudged up
	   within its circle rather than the whole button being moved. */
	.row-button.lifted {
		padding-bottom : var(--gap-small);
	}

	.row-mark {
		width   : var(--size-small);
		height  : var(--size-small);
		stroke  : var(--black);
		display : block;
		fill    : none;
	}

	/* The question itself is the button that answers it, standing where the row's other words
	   stand and reading as an ordinary control. */
	.asking-yes {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 0 auto;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.asking-yes:hover {
		background : var(--hover);
	}

	/* The file's own name, in the middle of what the folders leave over. It is a field, but
	   reads as plain words: no edge, no fill, and only as wide as the name itself. The edge is
	   held see-through rather than absent, so nothing shifts when it appears. */
	.view-name {
		border        : var(--thick-faint) solid transparent;
		border-radius : var(--radius-pill);
		padding       : 0 var(--gap-tiny);
		font-size     : var(--font-fat);
		background    : transparent;
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 1 auto;
		font-family   : inherit;
		text-align    : center;
		white-space   : nowrap;
		cursor        : text;
		outline       : none;
		min-width     : 0;
		/* Sits a touch above where the row would put it, so it lines up with the words
		   beside it rather than with the buttons. */
		position      : relative;
		top           : -2px;
	}

	/* Under the cursor it shows what it is; with the cursor in it, it reads as a field being
	   typed in. */
	.view-name:hover {
		border-color : var(--black);
		background   : var(--hover);
	}

	.view-name:focus {
		border-color : var(--black);
		background   : var(--white);
	}


	/* The steppers, pinned together at the top far left. */
	.view-steps {
		gap          : var(--gap);
		align-items  : center;
		justify-self : start;
		display      : flex;
	}

	/* The five filters while editing: a line each for the kind, the name and date, what it
	   says, and the tags. The pickers read like the filters' own, so the closed lists look
	   the same wherever they turn up. */
	.filter-form {
		gap            : var(--gap-tiny);
		margin         : var(--gap) 0;
		flex-direction : column;
		display        : flex;
	}

	.filter-row {
		gap         : var(--gap-tiny);
		align-items : center;
		display     : flex;
	}

	/* The sep before the tags stands clear of the row above it and the pickers below. */
	.filter-sep {
		margin : var(--gap-small) 0;
	}

	.filter-row.wrapping {
		justify-content : center;
		flex-wrap       : wrap;
	}

	.filter-word {
		opacity    : var(--opacity-header);
		font-size  : var(--font-tiny);
		color      : var(--text);
		flex       : 0 0 auto;
		text-align : right;
		width      : 45px;
	}

	.filter-field {
		border        : var(--thick) solid var(--black);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 1 1 auto;
		font-family   : inherit;
		min-width     : 0;
	}

	.filter-field.date {
		flex  : 0 0 auto;
		width : 110px;
	}

	.filter-pick {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 0 auto;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.filter-pick:hover {
		background : var(--hover);
	}

	.filter-pick.on {
		background : var(--accent);
	}

	/* The box standing in for one piece of the file. It is put on the page by hand rather
	   than drawn from here, so it is named as reaching outside this component. */
	:global(.edit-box) {
		/* A ring of dashes in the accent, marking off the piece open for changing. It is drawn
		   outside the box rather than as an edge of it, so it takes no room and the words stay
		   exactly where they were. */
		outline         : var(--thick-fat) dashed var(--accent);
		/* The same size, leading, spacing and step-in a paragraph reads at, so opening a piece
		   for editing doesn't reflow the words around it. */
		/* It reaches a gap further left than the words do, and holds that same gap inside itself,
		   so the ring of dashes stands clear of the first letter without moving it. */
		/* The room below is short by the hair the box holds inside itself, so the box reaches that
		   much lower while the piece after it stays where it was. It has to be a pull rather than a
		   smaller push: the piece below pushes back with a gap of its own, and the larger wins. */
		margin          : var(--gap) 0 calc(var(--gap-faint) * -1) calc(var(--gap) * -1);
		/* Stated on all four sides. Left to itself a typing field carries a pixel of its own
		   above and below, which makes it taller than the piece it stands in for. */
		padding         : 0 0 var(--gap-faint) var(--gap);
		width           : calc(100% + var(--gap));
		border-radius   : var(--radius-small);
		background      : var(--white);
		font-size       : var(--font);
		color           : var(--text);
		box-sizing      : border-box;
		white-space     : pre-wrap;
		font-family     : inherit;
		overflow        : hidden;
		display         : block;
		border          : none;
		resize          : none;
		text-indent     : 10px;
		line-height     : 1.5;
	}

	/* A heading is a row: its mark, then its words. The row itself holds the mark level with the
	   words, so nothing has to say how far down the mark goes. */
	.view-page :global(h1),
	.view-page :global(h2),
	.view-page :global(h3),
	.view-page :global(h4),
	.view-page :global(h5),
	.view-page :global(h6) {
		align-items : center;
		display     : flex;
	}

	/* The mark stands in the lane the words are held off by. It is exactly as wide as that lane and
	   gives all of that width back, so the words beside it start where they always did. It is put
	   on the page by hand rather than drawn from here, so it is named as reaching outside this
	   component. */
	:global(.fold-mark) {
		margin-left     : calc(var(--gap-big) * -1);
		width           : var(--gap-big);
		margin-right    : var(--gap);
		background      : transparent;
		flex            : 0 0 auto;
		cursor          : pointer;
		justify-content : center;
		align-items     : center;
		display         : flex;
		border          : none;
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

	/* A piece that begins with a dash is a list, and a list starts at the edge. It reaches the
	   same gap further left as any other piece, so its own step-in loses that much. */
	:global(.edit-box.flush) {
		margin-left   : calc(var(--gap-fat) - 0);
	}

	/* A heading holds more room above it than a paragraph does, and starts at the edge rather than
	   stepping in, so the box standing in for one does both. */
	:global(.edit-box.heading) {
		margin-top      : var(--gap-fat);
		text-indent     : 0;
	}

	/* A subheading's box is drawn a pixel above where it stands, so its words line up with the
	   heading they replace. The title has its own nudge, the other way. */
	:global(.edit-box.heading:not(.title)) {
		position : relative;
		top      : -1px;
	}

	/* The box holding the title takes the title's own slot, exactly — same height, same place — so
	   the words after it begin where they always do. It is drawn a little lower than it stands, so
	   it sits square with the line across the page; that is drawing only, and moves nothing. */
	:global(.edit-box.title) {
		/* The slot's leftover room is split evenly above and below, the way the title itself sits in
		   the middle of that slot. The two halves plus the box come to the whole slot. */
		margin      : calc((var(--gap-huge) - var(--height)) / 2) 0;
		margin-left : calc(var(--gap) * -1);
		height      : var(--height);
		position    : relative;
	}

	/* A chunk of code reads the same open or shut: even-width letters on the off-white block,
	   no step-in, and every line left exactly where it falls. */
	:global(.edit-box.code) {
		font-family   : ui-monospace, SFMono-Regular, Menlo, monospace;
		padding       : var(--gap) var(--gap) var(--gap-big);
		border-radius : var(--radius-tiny);
		background    : var(--offwhite);
		overflow-x    : auto;
		white-space   : pre;
		text-indent   : 0;
	}

	/* Stands in for the folded-away search row, so the two lines do not meet. */
	.sep-gap {
		height : var(--gap);
		flex   : 0 0 auto;
	}

	/* Holds the words and the line that lies over them. */
	.view-body {
		position       : relative;
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* The line sits a fixed way down from the top of the words and runs the full width, so its own
	   reach carries it out to the box's edges the way every other separator does. It takes no room,
	   so nothing the title does moves it. */
	.title-sep {
		z-index  : var(--z-controls);
		top      : var(--gap-huge);
		position : absolute;
		left     : 0;
		right    : 0;
	}

	.view-page {
		/* The room it holds is padding rather than margin, so its own color fills the whole
		   area below the heavy line instead of leaving a border of the page around it. The
		   left inset has to be inside the box in any case: the marks beside the headings sit
		   in it, and anything outside a box that scrolls is clipped away. */
		padding      : 0 var(--gap-fat);
		top          : var(--gap-fat);
		font-size    : var(--font);
		color        : var(--text);
		word-break   : break-word;
		cursor       : pointer;
		overflow-y   : auto;
		flex         : 1;
	}

	/* With a bar beside the words the right inset narrows, so the bar sits nearer the box's
	   edge and the words still stand clear of it. */
	.view-page.has-bar {
		padding-right  : var(--gap);
	}

	/* The marker showing where the browser alone would have put the thumb: half the lane's
	   width, in the dark accent, sitting on top of the real thumb and answering to nothing. */
	.free-thumb {
		width          : calc(var(--width-bar) / 2);
		right          : calc(var(--width-bar) / 4);
		background     : var(--accent-dark);
		position       : absolute;
		border-radius  : 999px;
		pointer-events : none;
		z-index        : 1;
	}

	/* The bar beside the words, and the one under a wide code block. Every scrolling box has
	   to name itself like this — the app-wide form of the rule matches nothing at all. */
	.view-page::-webkit-scrollbar {
		height     : var(--width-bar);
		width      : var(--width-bar);
		background : transparent;
	}

	/* The browser sets the thumb's length from how much of the file fits on screen. A long
	   file would shrink it to a speck, so it never goes below a fifth of the lane. */
	.view-page::-webkit-scrollbar-thumb {
		background    : var(--accent);
		border-radius : 999px;
		min-height    : 20%;
		min-width     : 20%;
	}

	.view-page::-webkit-scrollbar-track {
		background : transparent;
	}

	.view-page :global(pre::-webkit-scrollbar) {
		height     : var(--width-bar);
		width      : var(--width-bar);
		background : transparent;
	}

	.view-page :global(pre::-webkit-scrollbar-thumb) {
		background    : var(--accent);
		border-radius : 999px;
		min-height    : 20%;
		min-width     : 20%;
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
		margin-bottom : var(--gap-tiny);
		margin-top    : var(--gap);
		line-height   : 1.25;
	}

	.view-page :global(h1) { font-size : var(--font-fat); }
	.view-page :global(h2) { font-size : var(--font-big); }
	.view-page :global(h3),
	.view-page :global(h4),
	.view-page :global(h5),
	.view-page :global(h6) { font-size : var(--font); }

	/* The six heading colors Obsidian ships with in its light theme, so a guide reads here the
	   way it reads there. */
	.view-page :global(h1) { color : #4a9ad4; }

	/* The title stands in a slot of its own, reaching exactly as far down as the line that lies
	   across the page. Whatever the title does — shown, folded, long or short — everything after it
	   starts at the same place. */
	.view-page :global(h1) {
		height     : var(--gap-huge);
		box-sizing : border-box;
		margin     : 0;
		padding    : 0;
	}

	/* The first piece after the title brings no room of its own, so the whole distance from the
	   line to the words is the one gap the slot leaves below it. */
	.view-page :global(h1 + *) {
		margin-top : var(--gap);
	}

	.view-page :global(h2) { color : #48b57e; }
	.view-page :global(h3) { color : #c4a747; }
	.view-page :global(h4) { color : #c98a5e; }
	.view-page :global(h5) { color : #bf6a6a; }
	.view-page :global(h6) { color : #a97ec4; }

	.view-page :global(p),
	.view-page :global(ul),
	.view-page :global(ol) {
		margin      : var(--gap-tiny) 0;
		line-height : 1.5;
	}

	/* Every paragraph steps in a little, the way a printed page does, and stands clear of the
	   one before it. */
	.view-page :global(p) {
		margin      : var(--gap) 0;
		text-indent : 10px;
	}

	.view-page :global(li) {
		margin-bottom : var(--gap-tiny);
	}

	.view-page :global(a) {
		color : var(--accent-dark);
	}

	.view-page :global(code) {
		border-radius : var(--radius-tiny);
		font-size     : var(--font-tiny);
		background    : var(--offwhite);
		padding       : 0 4px;
	}

	.view-page :global(pre) {
		border-radius : var(--radius-tiny);
		background    : var(--offwhite);
		padding       : var(--gap);
		overflow-x    : auto;
	}

	.view-page :global(pre code) {
		background : none;
		padding    : 0;
	}

	.view-page :global(blockquote) {
		border-left : var(--thick-fat) solid var(--accent);
		opacity     : var(--opacity-header);
		padding-left: var(--gap);
		margin-left : 0;
	}

	.view-page :global(table) {
		border-collapse : collapse;
		font-size       : var(--font-tiny);
		margin          : var(--gap) 0;
	}

	.view-page :global(th),
	.view-page :global(td) {
		border  : var(--thick-faint) solid var(--accent);
		padding : var(--gap-tiny) var(--gap);
		text-align : left;
	}

	/* A table's first column is usually a number or a short word; it keeps to one line and
	   takes only the room it needs, so the words beside it get the rest. */
	.view-page :global(th:first-child) {
		white-space : nowrap;
		width       : 1%;
	}

	.view-page :global(td:first-child) {
		white-space : nowrap;
		width       : 1%;
	}

	.view-page :global(hr) {
		border-top : var(--thick-faint) solid var(--accent);
		margin     : var(--gap-fat) 0;
		border     : none;
	}

	/* The search row, under the top row: the walking triangles, then the field. */
	/* One height whether or not anything is typed, so the words below never shift when the
	   step triangles and the count arrive beside the field. */
	.view-search {
		padding-bottom : calc(var(--gap));
		min-height     : var(--height);
		margin-top     : var(--gap);
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

	/* The one place found, lit in the accent. */
	/* A square block around the words themselves, nothing wider — so what is lit is exactly
	   what was looked for. */
	.view-page :global(mark.hit) {
		color         : var(--text-on-accent);
		background    : var(--accent);
		position      : relative;
		border-radius : 0;
		padding       : 0;
	}

	/* A hairline pill drawn around that block, a full gap clear of it on every side, so the
	   lit words catch the eye on a crowded page. Nothing inside it, so the words still read;
	   it takes no room, so nothing around it moves. */
	.view-page :global(mark.hit::before) {
		border         : 2px solid var(--accent);
		inset          : calc(var(--gap) * -1);
		border-radius  : var(--radius-pill);
		background     : transparent;
		position       : absolute;
		pointer-events : none;
		content        : '';
	}

	/* The line a dead link leaves behind, along the bottom of the reading area. */
	/* Both stand in the same white area as the words themselves — everything under the heavy
	   line is one field, whether it holds the file, a complaint, or a passing message. */
	.view-note-line {
		border-top : var(--thick-faint) solid var(--accent);
		opacity    : var(--opacity-label);
		font-size  : var(--font-tiny);
		padding-top: var(--gap-tiny);
		background : var(--white);
		color      : var(--text);
		flex       : 0 0 auto;
		text-align : center;
	}

	.view-note {
		opacity         : var(--opacity-label);
		font-size       : var(--font);
		background      : var(--white);
		color           : var(--text);
		align-items     : center;
		justify-content : center;
		display         : flex;
		flex            : 1;
	}

</style>
