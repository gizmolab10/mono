<script lang='ts'>
	import { body_of, flipped_task, lines_between, markup_prefix, page_of, still_reads, with_lines_replaced, without_words_above_heading } from '../../ts/utilities/Markdown_Blocks';
	import { has_labels, labels_for, today, with_labels_added } from '../../ts/utilities/Labels';
	import { foldable_headings, hidden_pieces, top_headings } from '../../ts/utilities/Sections';
	import { HEAVY, SLANTED, STRUCK, partner_of, surround, toggle_emphasis } from '../../ts/utilities/Emphasis';
	import { file_path_of, path_of_address, read_guide, save_file } from '../../ts/utilities/Saving';
	import { code_link_of, is_code_link } from '../../ts/utilities/Opening_Code';
	import { T_Hit_Target } from '../../ts/types/Hit_Targets';
	import { Point } from '../../ts/types/Coordinates';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/events/Hits';
	import { offer_status, show_status } from '../../ts/managers/Status';
	import { follow_link, halt_stepping, w_command_down } from '../../ts/managers/Operations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { free_thumb, type Free_Thumb } from '../../ts/utilities/Thumb';
	import { key_of, type File } from '../../ts/types/File';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import Separator from '../support/Separator.svelte';
	import { guides } from '../../ts/managers/Files';
	import { Direction } from '../../ts/types/Angle';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import MarkdownIt from 'markdown-it';

	// One guide's own words: read from disk, drawn as a page, folded by heading, and changed a
	// piece at a time. Everything that touches the drawn page lives here — the links inside it,
	// the box that stands in for a piece being changed, the fold marks, and the bar beside it.

	let {
		name, address, guide, text = $bindable(''), page = $bindable<HTMLElement | null>(null),
		onsay, ondrawn, onredrawn, draws_line = true,
	}: {
		name       : string;                  // what the file is called
		address    : string;                  // which file it is, so folds belong to one file at a time
		guide      : File;                   // the record of the file being read
		text       : string;                  // the whole file, held only while it is on screen
		page       : HTMLElement | null;      // the drawn words, so a search can look inside them
		draws_line?: boolean;                 // draw the line that closes off the top; false while whatever stands above already has one there
		onsay      : (words: string) => void; // something to tell the reader, briefly
		ondrawn    : () => void;              // a file has just been read and drawn
		onredrawn  : () => void;              // the page was built afresh from changed words
	} = $props();

	// The guides are written in markdown, so they are turned into a real page before being
	// shown. Any markup written into a guide is left as plain characters rather than acted
	// on, so a guide can never reach into the app.
	// Punctuation is left exactly as the file writes it — no curling quotes, no turning two
	// dashes into one long one. What is read is what is edited, so a piece never looks one way
	// on screen and another in the box.
	const reader = new MarkdownIt({ html: false, linkify: true, typographer: false });
	// Only real web addresses become links on their own. Left to itself the reader turns any
	// word with a dot in it into one, which made every file name in a guide a dead link.
	reader.linkify.set({ fuzzyLink: false });

	// --- the bar beside the words ---------------------------------------------

	// The thumb is never shorter than a fifth of its lane. Where the browser would have put it,
	// left alone, is drawn as a thin strip over the real one, so both can be seen at once.
	let free = $state<Free_Thumb>({ top: 0, length: 0, shows: false });

	// Where the words stood when the hits manager was last told. A scroll moves everything drawn in
	// them by the difference, and by exactly that — so the manager is handed the distance rather
	// than asked to read every rectangle again, which makes the browser settle its layout.
	let told_scrolled_to = 0;

	function words_scrolled() {
		if (!page) { return; }
		const now = page.scrollTop;
		hits.shift_inside(page, new Point(0, told_scrolled_to - now));
		told_scrolled_to = now;
	}

	/** Look again at how tall the words are, and at both thumbs. */
	function measure_page() {
		const box = page;
		if (!box) { free = { top: 0, length: 0, shows: false }; return; }
		// The lane starts below the line across the page, so the marker over it starts there too
		// and runs the shorter length — otherwise the two would not line up.
		const below_the_line = k.gap.huge + k.gap.normal;
		free = free_thumb(box.clientHeight - below_the_line, box.scrollHeight, box.scrollTop, box.offsetTop + below_the_line);
	}

	/**
	 * Say which piece of the page is wider than the gap it has, when the words can be pushed
	 * sideways. A table will not wrap a cell, and a long unbroken run of characters will not
	 * break — either can do it, and only measuring says which.
	 */
	function say_what_is_too_wide() {
		const box = page;
		if (!box || box.scrollWidth <= box.clientWidth + 1) { return; }
		const gap = box.clientWidth;
		// Where the words are free to run: the box less the inset it holds on both sides.
		const inside = box.getBoundingClientRect();
		const style  = getComputedStyle(box);
		const free   = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
		const guilty: string[] = [];
		// The piece that reaches furthest right is the one pushing the page, whether or not it is
		// itself too wide — a child inside it can carry it past the edge. So each is measured for
		// its own width and for how far its far edge lands.
		const walk = (one: HTMLElement, depth: number) => {
			const at = one.getBoundingClientRect();
			const over = Math.round(at.right - inside.right);
			if (over > 1 || one.scrollWidth > free + 1) {
				const opens = (one.textContent ?? '').trim().slice(0, 30);
				guilty.push(`${'  '.repeat(depth)}a ${one.tagName.toLowerCase()}${one.className ? ` (${one.className})` : ''} ${Math.round(at.width)} wide, needing ${one.scrollWidth}, ending ${over} past the edge — "${opens}"`);
				for (const child of Array.from(one.children) as HTMLElement[]) { walk(child, depth + 1); }
			}
		};
		for (const piece of Array.from(box.children) as HTMLElement[]) { walk(piece, 0); }
		debug.log(`Viewer: "${name}" is ${Math.round(box.scrollWidth)} wide with ${Math.round(gap)} of box and ${Math.round(free)} free inside its inset, so it can be pushed sideways.\n${guilty.length === 0 ? 'Nothing reaches past the edge — the width comes from the box itself.' : guilty.join('\n')}`);
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

	// --- the links inside a guide ---------------------------------------------

	let wanted_heading = $state('');           // a heading to move to once the words are drawn

	/** Move down the page to one heading, if the words hold it. */
	export function move_to_heading(named: string) {
		if (!page || named === '') { return; }
		const found = page.querySelector(`[id="${CSS.escape(named)}"]`);
		if (!found) {
			debug.log(`Heading "${named}" is not in "${name}" — staying where we are.`);
			onsay(`this guide has no heading called "${named}"`);
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
		if (flip_the_box(event)) { return; }
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
		// A file of code is not a guide, so nothing in the collection answers for it. It goes to
		// the editor on this machine instead, at the line the link names.
		if (is_code_link(link)) {
			const opens = code_link_of(path_of_address(guide.address), link);
			window.location.href = opens;
			debug.log(`Link out of "${name}" to code: ${link} — handed to VSCode as ${opens}.`);
			return;
		}
		const found = guides.hierarchy.explore(guide, link);
		if (found.file) {
			wanted_heading = found.heading;
			follow_link(key_of(found.file));
			return;
		}
		if (found.why === 'a heading inside this same guide') { move_to_heading(found.heading); return; }
		onsay(`"${link}" is ${found.why}`);
	}

	/**
	 * A press on a thing-to-be-done's box. The item carries the one line of the file it came from,
	 * so the brackets on that line are turned over and the whole file written back — the same
	 * road every other change takes, and nothing else on the line is touched.
	 *
	 * Says whether it was a box, so a press that was not one goes on to the link and the piece.
	 */
	function flip_the_box(event: MouseEvent): boolean {
		const drawn = (event.target as HTMLElement | null)?.closest?.('.task-box') as HTMLElement | null;
		if (!drawn) { return false; }
		const item = drawn.closest('li.task') as HTMLElement | null;
		if (!item || item.dataset.line === undefined) { return false; }
		event.preventDefault();
		event.stopPropagation();
		const at = Number(item.dataset.line);
		const line = lines_between(text, at, at + 1);
		const flipped = flipped_task(line);
		if (flipped === null) {
			onsay('the guide changed underneath — nothing saved');
			debug.log(`Editing "${name}": a box on line ${at} was pressed, but that line now reads "${line}", which holds no pair of brackets. Nothing written.`);
			return true;
		}
		const whole = with_lines_replaced(text, at, at + 1, flipped);
		const was   = text;
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": line ${at} turned over — "${line}" becoming "${flipped}". Writing it to ${where}.`);
		redraw(whole);
		save_file(where, whole, was).then((answer) => {
			if (answer.ok) { debug.log(`Editing "${name}": ${where} written.`); return; }
			onsay(`not saved — ${answer.why}`);
			debug.log(`Editing "${name}": ${where} was NOT written — ${answer.why}. Putting the words back the way the file has them.`);
			redraw(was);
		});
		return true;
	}

	// --- changing one piece of the file ---------------------------------------

	// Every outermost piece of the page carries the lines it came from, and a click opens that
	// piece in a plain box holding the file's own words for those lines — hashes, dashes and
	// all — rather than anything worked back out of what's on screen. Leaving the box writes
	// just those lines back.
	let box: HTMLTextAreaElement | null = null;     // the open box, if there is one
	let kept: HTMLElement | null = null;            // the piece's own words, held out of sight behind the box
	let held_list: HTMLElement | null = null;       // the list an open item holds, kept on screen beside the box
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
	 * height of the piece it stands in for — different spacing above, a hair of gap held inside
	 * it, whole-pixel rounding — and rather than trying to account for each of those, the gap
	 * below the box is simply set to whatever closes the gap. Measured twice, since the first
	 * correction can itself shift things by a fraction.
	 */
	function hold_what_follows(after: HTMLElement | null, was_at: number) {
		if (!box || !after) { return; }
		const the_box = box;
		for (let go = 0; go < 2; go += 1) {
			const drift = after.getBoundingClientRect().top - was_at;
			if (Math.abs(drift) < 0.01) { break; }
			const gap = parseFloat(getComputedStyle(the_box).marginBottom) || 0;
			the_box.style.marginBottom = `${gap - drift}px`;
			debug.log(`Editing "${name}": the piece below sat ${drift.toFixed(2)}px off, so the gap under the box went from ${gap.toFixed(2)}px to ${(gap - drift).toFixed(2)}px.`);
		}
	}

	/**
	 * Where one piece's own first letter stands, across the window. The first run of words inside
	 * it is found and its first letter measured on its own — asking the piece where it starts
	 * gives the box around the words, which is a different place whenever anything sits before
	 * them: a bullet, a checkbox, a step-in.
	 */
	function first_letter_at(block: HTMLElement): { left: number; top: number; tall: number } | null {
		const walk = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
		let words = walk.nextNode() as Text | null;
		while (words && words.data.trim() === '') { words = walk.nextNode() as Text | null; }
		if (!words) { return null; }
		const at = words.data.search(/\S/);
		const one = document.createRange();
		one.setStart(words, at);
		one.setEnd(words, at + 1);
		const found = one.getBoundingClientRect();
		return found.width === 0 && found.left === 0 ? null : { left: found.left, top: found.top, tall: found.height };
	}

	// One surface, kept aside, for measuring how wide a run of characters is drawn.
	const ruler = document.createElement('canvas');

	/**
	 * How wide a run of characters comes out in the open box's own lettering. A tab is counted as
	 * the tab stop the box uses, since a drawing surface gives one the width of a single space and
	 * a typing field does not.
	 */
	function width_in_box(the_box: HTMLTextAreaElement, run: string): number {
		if (run === '') { return 0; }
		const paint = ruler.getContext('2d');
		if (!paint) { return 0; }
		const style = getComputedStyle(the_box);
		const stops = Number.parseInt(style.tabSize, 10) || 8;
		paint.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
		return paint.measureText(run.replace(/\t/g, ' '.repeat(stops))).width;
	}

	/**
	 * Hold the box's first word to the place the piece's first word stood. Whatever the box would
	 * otherwise begin at, the space before its words is widened or narrowed to close the
	 * difference — its outer edges are left alone, so nothing around it moves.
	 *
	 * The markdown at the head of the line is drawn as nothing on the page and as characters in the
	 * box, so its width is taken off: the hashes and the brackets stand out to the left and the word
	 * after them stands where it always did.
	 */
	function start_the_words_at(wanted: number | null, prefix_wide: number) {
		const the_box = box;
		if (!the_box || wanted === null) { return; }
		const style  = getComputedStyle(the_box);
		const before = parseFloat(style.paddingLeft) || 0;
		const starts = the_box.getBoundingClientRect().left
			+ (parseFloat(style.borderLeftWidth) || 0) + before + (parseFloat(style.textIndent) || 0);
		const off = wanted - (starts + prefix_wide);
		if (Math.abs(off) < 0.5) { return; }
		const want = before + off;
		if (want >= 0) {
			the_box.style.paddingLeft = `${want}px`;
			debug.log(`Editing "${name}": the words stood at ${wanted.toFixed(2)} and the box began them at ${(starts + prefix_wide).toFixed(2)} with ${prefix_wide.toFixed(2)}px of markup ahead of them, so the space before them went from ${before.toFixed(2)} to ${want.toFixed(2)}.`);
			return;
		}
		// The space before the words has run out — the markup reaches further left than the box's
		// own inset. The box itself moves left by what is left over and widens by exactly that, so
		// its right edge stays where it was and the lane the row number stood in takes the markup.
		const wide = the_box.getBoundingClientRect().width;
		const gap  = parseFloat(style.marginLeft) || 0;
		the_box.style.paddingLeft = '0px';
		the_box.style.marginLeft  = `${gap + want}px`;
		the_box.style.width       = `${wide - want}px`;
		debug.log(`Editing "${name}": the words stood at ${wanted.toFixed(2)} with ${prefix_wide.toFixed(2)}px of markup ahead of them, which is ${(-want).toFixed(2)}px more than the ${before.toFixed(2)}px before them — so the box moved left from ${gap.toFixed(2)} to ${(gap + want).toFixed(2)} and widened from ${wide.toFixed(2)} to ${(wide - want).toFixed(2)}.`);
	}

	/**
	 * Hold the box's own words to the height the piece's words stood at. Each kind of box is drawn a
	 * little off its own place already — a heading a pixel up, the title a few pixels down — and what
	 * is left over after all of that is measured here and taken out, so no piece's words move.
	 *
	 * The box's first line begins at the top of what it holds, so where that line starts is its own
	 * top edge plus whatever it keeps above the words.
	 *
	 * A letter is measured as the letter alone, standing in the middle of the taller line that holds
	 * it, while the box's own top is the top of that line — so half the difference between the two
	 * is what the box would otherwise be drawn low by. Both carry the same lettering and the same
	 * leading, so that half is the same on either side, and where a letter fills its whole line it
	 * is nothing at all.
	 *
	 */
	function start_the_words_down_at(letter: { top: number; tall: number } | null) {
		const the_box = box;
		if (!the_box || letter === null) { return; }
		const style   = getComputedStyle(the_box);
		const leading = parseFloat(style.lineHeight) || 0;
		const half    = letter.tall > 0 && leading > letter.tall ? (leading - letter.tall) / 2 : 0;
		const wanted  = letter.top - half;
		const starts  = the_box.getBoundingClientRect().top
			+ (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.paddingTop) || 0);
		const off = wanted - starts;
		if (Math.abs(off) < 0.5) { return; }
		const at = parseFloat(style.top) || 0;
		the_box.style.top = `${at + off}px`;
		debug.log(`Editing "${name}": the letter stood ${letter.top.toFixed(2)} down and is ${letter.tall.toFixed(2)} tall in a line of ${leading.toFixed(2)}, so its line began ${wanted.toFixed(2)} down against the box's ${starts.toFixed(2)} — and the box went from ${at.toFixed(2)}px to ${(at + off).toFixed(2)}px off its place.`);
	}

	/** Open one piece of the page for editing, in place. */
	function open_box(block: HTMLElement) {
		close_box(true);
		const from = Number(block.dataset.from);
		const to   = Number(block.dataset.to);
		if (!Number.isFinite(from) || !Number.isFinite(to)) { return; }
		opened_with  = lines_between(text, from, to);
		stood_in_for = block;
		box = document.createElement('textarea');
		box.className = 'edit-box';
		box.rows      = 1;                         // a field starts two lines tall; the fit works from one
		// A piece's lines often end with the blank one that separates it from the next, which
		// would show as an empty last line in the box. It is kept aside and put back on saving,
		// so the file's own lines are unchanged either way.
		trailing = opened_with.slice(opened_with.replace(/\n+$/, '').length);
		box.value = opened_with.slice(0, opened_with.length - trailing.length);
		// A chunk of code reads in the even-width letters it is written in, and lines are left
		// exactly where they fall — so the box holding one is dressed to match.
		if (block.tagName === 'PRE') { box.classList.add('code'); }
		// A heading's ring stands one gap further left than any other, since the hashes it holds
		// reach out into the lane beside the words.
		if (/^H[1-6]$/.test(block.tagName)) { box.classList.add('heading'); }
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
		// A thing to be done can hold a list of its own, and that list is nothing to do with the one
		// line being changed — so it stays on screen. It is moved out to stand just after the item
		// while the item itself is out of sight, and put back when the box closes.
		held_list = block.tagName === 'LI'
			? block.querySelector(':scope > ul, :scope > ol') as HTMLElement | null
			: null;
		const after = held_list ?? next_one_showing(block);
		const was_at = after ? after.getBoundingClientRect().top : 0;
		// Where the piece's own first letter stands, read while it is still on screen. Everything
		// that steps a piece in — a list's own indent, the box beside a thing to be done, a
		// paragraph's first-line step — is already in that one number, so it is measured rather
		// than worked out from the pieces of it.
		const letter_at = first_letter_at(block);
		// Every row number is hung off its own piece, so a number that moved is a piece that moved.
		// Where each one stands is noted now and asked again once the box is open, and any that went
		// anywhere is said by its own number.
		const numbers_stood = new Map<HTMLElement, number>();
		for (const one of [...(page?.querySelectorAll('[data-number]') ?? [])] as HTMLElement[]) {
			numbers_stood.set(one, one.getBoundingClientRect().top);
		}
		// The box stands inside the piece, and the piece's own words are put out of sight behind it.
		// The piece itself never moves, so its row number — which is drawn by the piece and by the
		// rules that know what kind of piece it is — stays exactly where it stood. Standing the box
		// beside the piece instead meant working out where each kind of piece hangs its number, and
		// every kind hangs it somewhere slightly different.
		kept = document.createElement('span');
		kept.className = 'edit-kept';
		kept.append(...block.childNodes);
		block.append(kept, box);
		// A thing to be done can hold a list of its own, and that list is nothing to do with the one
		// line being changed — so it comes back out to stand below the box while the item's own words
		// stay out of sight. It goes back inside when the box closes.
		if (held_list) { block.append(held_list); }
		const prefix_wide = width_in_box(box, markup_prefix(box.value.split('\n')[0] ?? ''));
		fit_box();
		start_the_words_at(letter_at?.left ?? null, prefix_wide);
		hold_what_follows(after, was_at);
		// Last, since it moves the box without moving anything around it — the one above changes what
		// the page lays out, and this one reads the answer it settled on.
		start_the_words_down_at(letter_at);
		const moved: string[] = [];
		for (const [one, was] of numbers_stood) {
			const now = one.getBoundingClientRect().top;
			if (Math.abs(now - was) > 0.5) { moved.push(`${one.dataset.number} by ${(now - was).toFixed(2)}`); }
		}
		if (moved.length > 0) {
			debug.log(`Editing "${name}": opening the box moved ${moved.length} of the ${numbers_stood.size} row number(s) — ${moved.join(', ')}.`);
		}
		box.focus();
		register_the_links();                     // the links in this piece went behind the box with its words
		hits.recalibrate();                        // the piece's own words went and a box took their place
		debug.log(`Editing "${name}": opened lines ${from} through ${to - 1} — ${opened_with.length} character(s) of the file's own words, in a box standing inside the piece itself${held_list ? '. The list it holds stands below the box' : ''}.`);
	}

	/** Put the piece back. Leaving the box keeps what was typed; Escape throws it away. */
	export function close_box(keep: boolean) {
		if (!box || !stood_in_for) { return; }
		const the_box  = box;
		const the_piece = stood_in_for;
		const typed = the_box.value + trailing;    // the blank line that was kept aside goes back
		const from  = Number(the_piece.dataset.from);
		const to    = Number(the_piece.dataset.to);
		const the_kept = kept;
		const the_held = held_list;
		// Let go of all four before touching the page: whatever happens next, this cannot be
		// entered twice for the same box.
		box = null;
		kept = null;
		held_list = null;
		stood_in_for = null;
		// Stepping to another file, or leaving the view, draws or drops the whole page while
		// the box is still open — and leaving the box is what closes it. By then the page may
		// already be gone or half taken apart, so putting things back is allowed to fail.
		try {
			the_box.remove();
			if (the_kept) { the_piece.append(...the_kept.childNodes); the_kept.remove(); }
			if (the_held) { the_piece.append(the_held); }
		} catch (trouble) {
			debug.log(`Editing "${name}": the page was already gone when the box closed — ${String(trouble)}`);
		}
		register_the_links();                     // the piece's own links came back with its words
		hits.recalibrate();                        // the box went and the piece behind it came back
		if (!keep)                  { debug.log(`Editing "${name}": dropped the change to lines ${from} through ${to - 1}.`); return; }
		if (typed === opened_with)  { debug.log(`Editing "${name}": lines ${from} through ${to - 1} closed unchanged.`); return; }
		// The lines have to still say what they said when the box opened, or the numbers are
		// stale and putting words back would land them somewhere else in the file.
		if (!still_reads(text, from, to, opened_with)) {
			onsay('the guide changed underneath — nothing saved');
			debug.log(`Editing "${name}": refused to save lines ${from} through ${to - 1} — they no longer read as they did when the box opened.`);
			return;
		}
		const whole = with_lines_replaced(text, from, to, typed);
		const was   = text;
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": lines ${from} through ${to - 1} changed — ${opened_with.length} character(s) becoming ${typed.length}, the whole file going from ${was.length} to ${whole.length}. Writing it to ${where}.`);
		// Drawn again at once, so the words on screen are the words being written. If the
		// write is refused, the old text goes back up and the page says why.
		redraw(whole);
		save_file(where, whole, was).then((answer) => {
			if (answer.ok) { debug.log(`Editing "${name}": ${where} written.`); return; }
			onsay(`not saved — ${answer.why}`);
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
		text  = whole;
		words = page_of(reader, whole);
		onredrawn();                               // anything highlighted belongs to the old drawing
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

	// --- folding a section of the file ----------------------------------------

	// Every heading below the top one carries a small mark in the left margin, turned down
	// while its section shows and sideways while it is folded. A heading owns everything after
	// it up to the next heading of its own level or higher — that run is what a fold hides.
	//
	// Those folds belong to the file being read: another file opens with its sections shown.
	// The top heading is the exception — whether a file's title has its own words folded away
	// is one setting for the whole app, so every file opens the way the last one was left, and
	// it is remembered between visits.
	const FOLD_MARK = k.size.small;
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
		const out_of_sight = hidden_pieces(levels, all_of_them);
		pieces.forEach((piece, at) => {
			// A piece holding an open box is still the piece; nothing here treats it differently.
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
		// Folding changes how tall the words are but not the box holding them, so nothing else
		// would tell the bar and its marker to look again.
		measure_page();
		say_what_is_too_wide();
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

	/**
	 * The mark itself: the same soft pointer the folders use, turned down or sideways.
	 *
	 * The shape's measured size runs to fractions of a pixel, which leaves every mark's edges
	 * straddling a screen pixel — and a straddled edge is rounded one way or the other each time
	 * it is painted. The drawing is given whole pixels instead, with the extra space added to
	 * what it looks through so the shape keeps its size exactly.
	 */
	function fold_mark_svg(open: boolean): string {
		const way = open ? Direction.down : Direction.right;
		const path = svg_paths.soft_pointer(FOLD_MARK, way);
		const at = svg_paths.soft_pointer_bounds(FOLD_MARK, way);
		const wide = Math.ceil(at.width);
		const tall = Math.ceil(at.height);
		return `<svg overflow='visible' width='${wide}' height='${tall}' viewBox='${at.minX} ${at.minY} ${wide} ${tall}'><path d='${path}'/></svg>`;
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

	// --- folding what sits under one thing to be done -------------------------

	// A thing to be done can hold a list of its own. Each one that does gets the same soft pointer
	// a heading gets, turned down while what it holds shows and sideways while it is put away.
	// Which are folded is kept by the line each item begins on, and belongs to the file being
	// read — another file opens with everything showing.
	let tasks_folded = $state<number[]>([]);

	/** Draw a pointer beside every thing to be done that holds a list, and apply its fold. */
	function mark_the_tasks() {
		if (!page) { return; }
		const items = [...page.querySelectorAll('li.task')] as HTMLElement[];
		for (const item of items) {
			const held = item.querySelector(':scope > ul, :scope > ol') as HTMLElement | null;
			if (!held || item.dataset.line === undefined) { continue; }
			const at = Number(item.dataset.line);
			const away = tasks_folded.includes(at);
			held.style.display = away ? 'none' : '';
			const mark = one_mark(!away, away ? 'show what is under this' : 'put away what is under this',
				() => toggle_task_fold(at));
			mark.classList.add('task-fold');
			item.prepend(mark);
		}
	}

	function toggle_task_fold(at: number) {
		const away = !tasks_folded.includes(at);
		tasks_folded = away ? [...tasks_folded, at] : tasks_folded.filter((one) => one !== at);
		debug.log(`Reading "${name}": what sits under the thing to be done on line ${at} is now ${away ? 'put away' : 'showing'}.`);
		refresh_marks();
	}

	/**
	 * A row for every line of the file no piece covers — a blank line, or a rule the reader draws
	 * as nothing. Each carries its own number, so the column beside the words counts the file
	 * straight through with none missing, and each opens for changing like any other piece.
	 */
	function fill_the_gaps() {
		if (!page) { return; }
		page.querySelectorAll('.blank-line').forEach((row) => row.remove());
		const lines = text.split('\n').length;
		// The words start below the labels, so that is where the rows begin — but the number on one
		// counts the file itself from its very first line, the labels among them, the way Obsidian
		// counts. The two that put words back count the same file from zero.
		const skipped = body_of(text).skipped;
		const row_for = (line: number, before: Element | null) => {
			const row = document.createElement('div');
			row.className = 'blank-line';
			row.setAttribute('data-number', String(line + 1));
			row.setAttribute('data-from', String(line));
			row.setAttribute('data-to', String(line + 1));
			page!.insertBefore(row, before);
		};
		let at = skipped;
		const rows_up_to = (stop: number, before: Element | null) => {
			for (; at < stop; at++) { row_for(at, before); }
		};
		for (const piece of [...page.children] as HTMLElement[]) {
			const from = Number(piece.dataset.from);
			if (Number.isNaN(from)) { continue; }
			rows_up_to(from, piece);
			at = Number(piece.dataset.to);
		}
		rows_up_to(lines, null);
		// A list begins on the very row its first item begins on, so both name that row and both
		// would draw it, one number over the other. Whichever comes first on the page keeps it and
		// the other's is taken off — done here, where the whole page can be seen at once, since a
		// list nested inside an item carries no number of its own and its first item must keep one.
		const drawn = new Set<string>();
		for (const one of [...page.querySelectorAll('[data-number]')] as HTMLElement[]) {
			const says = one.dataset.number ?? '';
			if (drawn.has(says)) { one.removeAttribute('data-number'); continue; }
			drawn.add(says);
		}
		// TEMPORARY — how many numbers the page ended up wearing, and what the browser makes of the
		// two lengths every one of them is measured from.
		const style = getComputedStyle(page);
		debug.log(`Reading "${name}": ${drawn.size} row number(s) drawn, ${page.querySelectorAll('.blank-line').length} of them on rows nothing else covers. The page steps in "${style.paddingLeft}", the numbers end "${style.getPropertyValue('--inset-numbers')}" in, the pointer is "${style.getPropertyValue('--size-small')}" wide.`);
	}

	// --- the links, registered with the hits manager --------------------------

	// Every link in a file's own words is something to press, so each is registered with the
	// manager. Without that it names the words as a whole wherever a link stands, and a thing it
	// does not know about is a thing it can never say has moved. The press itself is left where it
	// is, on the words' own click — which link was pressed is worked out from the press.
	let link_targets: Array<{ destroy: () => void }> = [];

	function drop_the_link_targets() {
		for (const one of link_targets) { one.destroy(); }
		link_targets = [];
	}

	function register_the_links() {
		drop_the_link_targets();
		if (!page) { return; }
		// A link inside a piece that is open for changing is out of sight behind the box, and a
		// link inside a folded section is put away — neither is there to be pressed, so neither is
		// registered at all. Done again whenever the words change, fold, open or close.
		const anchors = ([...page.querySelectorAll('a[href]')] as HTMLAnchorElement[])
			.filter((anchor) => anchor.offsetParent !== null);
		anchors.forEach((anchor, at) => {
			link_targets.push(hit_target(anchor, {
				id: `page.link.${at}`,
				type: T_Hit_Target.control,
				tip: anchor.dataset.tip ?? null,
			}));
		});
		debug.log(`Reading "${name}": ${anchors.length} link(s) registered, each answering for its own place and its own words.`);
	}

	/** Take every mark off and draw them again, so each points the way its section now sits. */
	function refresh_marks() {
		if (!page) { return; }
		// A file just opened, so it goes back to following the shared title fold — folded the way
		// the last one was left — until the reader presses one of its own section pointers.
		if (folds_for !== address) {
			folds_for = address;
			folded_at = [];
			tasks_folded = [];
			touched   = false;
		}
		page.querySelectorAll('.fold-mark').forEach((mark) => mark.remove());
		fill_the_gaps();
		apply_folds();
		mark_the_tasks();
		register_the_links();
		// Every one of those three adds rows and marks to the page and puts pieces in and out of
		// sight, which moves everything below them. Nothing else says so, and the file's own words
		// are a target with more inside them than anywhere else in the app.
		hits.defer_recalibrate();
	}

	// The marks are put on the drawn page by hand, so they are drawn again every time the words
	// change or another file opens — after the page itself is on screen, never before.
	$effect(() => {
		words;
		$w_fold_titles;                            // the shared title fold redraws the marks too
		if (page) { refresh_marks(); }
		// The links go with the drawing they belong to: the next one registers its own, and
		// leaving the view leaves the manager holding none of them.
		return () => { drop_the_link_targets(); };
	});

	// --- reading the file -----------------------------------------------------

	/**
	 * Give a file its labels, if it has none, and write them. The whole file again either way —
	 * one that already carries labels comes back untouched. A refused write is said in the log
	 * and the file is shown as it is, since nothing is lost by that.
	 */
	async function label_it_if_bare(whole: string): Promise<string> {
		if (has_labels(whole)) { return whole; }
		const where = file_path_of(guide.bundle, guide.path);
		const with_block = with_labels_added(whole, `${name}.md`, today(), guide.path);
		const answer = await save_file(where, with_block, whole);
		if (!answer.ok) {
			debug.log(`Editing "${name}": it carries no labels and could not be given any — ${answer.why}. It is shown as it is.`);
			return whole;
		}
		debug.log(`Editing "${name}": opened for the first time with no labels, so a block was composed from its own words and written to ${where}. Its kind came from the folder it sits in, and it is marked stale for a person to look at.`);
		const made = labels_for(whole, `${name}.md`, today(), guide.path);
		guides.relabel(guide, made.labels, made.tags);
		return with_block;
	}

	/**
	 * A file's words start at its top heading. Anything between the labels and that heading is
	 * left over, so it is said along the bottom with a button that takes it out. Nothing is
	 * written unless that button is pressed — dismissing the line leaves the file alone.
	 */
	function offer_to_clear_above_heading(whole: string): void {
		const cleared = without_words_above_heading(whole);
		if (cleared === whole) { return; }
		const found = whole.length - cleared.length;
		debug.log(`Editing "${name}": ${found} character(s) sit between the labels and the top heading. Offering to take them out; nothing is written unless it is asked for.`);
		offer_status('found an extra character', 'remove it', () => { clear_above_heading(cleared, whole); });
		halt_stepping(`"${name}" holds ${found} character(s) above its top heading`);
	}

	/** Take out what sits above the heading. A refused write leaves the file exactly as it was. */
	async function clear_above_heading(cleared: string, whole: string): Promise<void> {
		const answer = await save_file(file_path_of(guide.bundle, guide.path), cleared, whole);
		if (!answer.ok) {
			show_status(`"${name}" was not changed — ${answer.why}`);
			debug.log(`Editing "${name}": the characters above its top heading could not be taken out — ${answer.why}. It is shown as it is.`);
			return;
		}
		text  = cleared;
		words = page_of(reader, cleared);
		debug.log(`Editing "${name}": took out the ${whole.length - cleared.length} character(s) that sat between the labels and the top heading.`);
	}

	let words  = $state<string | null>(null);
	let loaded = $state(false);
	let failed = $state('');
	// Where the file sits, as one piece of text. Typing in the search field works the whole list
	// out again, which arrives here as a fresh record of the very same file; the place it names is
	// the same text as before, so nothing below stirs. Reading and drawing the file again on every
	// letter is what blinked.
	let where = $derived(file_path_of(guide.bundle, guide.path));
	$effect(() => {
		// The dispatcher hands over the words, not the dev server: the dev server will not accept
		// a name holding a question mark, and answers with the app's own page instead of the file.
		// The words already on screen stay there until the next one's are ready. Blanking them
		// first put an empty box on screen for an instant, which read as a flash.
		failed = '';
		read_guide(where)
			.then((answer) => {
				if (answer.text === null) { throw new Error(answer.why); }
				return answer.text;
			})
			.then(async (whole) => {
				// This is the first time anyone has opened this file, so now is when it gets its
				// labels — composed from its own words, its kind read off the folder it sits in,
				// and marked stale so Jonathan corrects whatever came out wrong.
				whole  = await label_it_if_bare(whole);
				text   = whole;                      // what an edit slices its own words out of
				words  = page_of(reader, whole);
				loaded = true;
				debug.log(`Viewer: read ${whole.length} character(s) for "${name}" and turned them into a ${words.length}-character page, every piece carrying the lines it came from.`);
				offer_to_clear_above_heading(whole);
				ondrawn();
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
				halt_stepping(`"${name}" could not be read — ${failed}`);
			});
		// Let it all go the moment this one is off screen, box included.
		return () => { close_box(false); words = null; text = ''; };
	});
</script>

<!-- The heavy line that closes the top off from the file's own words. The words are a section
     of their own, and this is what bounds it — it is drawn here rather than by a Section since
     the words scroll, which a plain stack of sections does not do.

     With the label form folded away it stands flat, so its own line is already at this very
     spot and nothing is drawn here — two lines touching read as one thick one. -->
<!-- Nothing is said while the words are being read: the wait is too short to see, and a
     line that flashes and goes reads as a fault. -->
{#if !loaded}
	<div class='view-page'></div>
{:else if failed !== ''}
	<div class='view-note'>file is unreadable — cannot view it</div>
{:else}
	<div class='view-body'>
		<!-- Where the browser would have put the thumb with no floor under it, drawn over the
		     real one so both can be seen at once. Nothing to catch — it is only a marker. It
		     sits inside this box, the same one the words measure themselves against, so the
		     two are counting from the same place. -->
		{#if free.shows}
			<div class='free-thumb' style:top='{free.top}px' style:height='{free.length}px'></div>
		{/if}
		<!-- The line under the title. It is a fixture of the page rather than an edge of the
		     heading, so it stays put whether the title is shown, folded, or open for changing. -->
		<div class='title-sep'>
			<Separator thickness={k.thickness.normal}/>
		</div>
		<!-- A click on a link follows it; a click anywhere else on the words goes back to
		     the list, the same as the close button — so getting out never means aiming at
		     the small circle. Holding the command key suspends all of that, so the words can
		     be dragged over and picked up instead. -->
		<!-- The file's own words are a target of the third kind, standing behind everything drawn
		     in them: anything inside that answers for itself wins the cursor first. Its own press
		     is left where it is, since which piece was pressed is worked out from the press. -->
		<div
			role='button'
			tabindex='-1'
			bind:this={page}
			class='view-page'
			onkeyup={() => {}}
			onclick={on_page_click}
			onscroll={words_scrolled}
			class:selecting={$w_command_down}
			onmousedown={watch_for_bar_press}
			use:hit_target={{ id: 'page.words', type: T_Hit_Target.page,
				tip: $w_command_down ? 'drag to select' : 'click a paragraph to edit it' }}>
			{@html words}
		</div>
	</div>
{/if}

<style>
	/* The piece's own words while a box stands over them. They keep their place in the file and
	   their place in the page; they simply are not drawn, and the soft pointer among them goes
	   with them. */
	:global(.edit-kept) {
		display : none;
	}

	/* The box standing over one piece of the file. It is put on the page by hand rather
	   than drawn from here, so it is named as reaching outside this component.

	   It stands inside the piece it is changing, so the size, weight and leading are the piece's
	   own and nothing here names them — a heading's box reads as a heading, a paragraph's as a
	   paragraph. The piece also holds the gap above and below, so the box holds none. */
	:global(.edit-box) {
		/* A ring of dashes in the accent, marking off the piece open for changing. It is drawn
		   outside the box rather than as an edge of it, so it takes no gap and the words stay
		   exactly where they were. */
		outline         : var(--thick-fat) dashed var(--accent);
		/* It reaches a gap further left than the words do, and holds that same gap inside itself,
		   so the ring of dashes stands clear of the first letter without moving it. */
		margin          : 0 0 0 calc(var(--gap) * -1);
		/* Stated on all four sides. Left to itself a typing field carries a pixel of its own
		   above and below, which makes it taller than the words it stands over. */
		padding         : 0 0 var(--gap-faint) var(--gap);
		width           : calc(100% + var(--gap));
		border-radius   : var(--radius-small);
		background      : var(--white);
		color           : var(--text);
		box-sizing      : border-box;
		white-space     : pre-wrap;
		font-family     : inherit;
		font-size       : inherit;
		font-weight     : inherit;
		line-height     : inherit;
		overflow        : hidden;
		display         : block;
		border          : none;
		resize          : none;
		/* A paragraph steps its first line in and leaves the rest at the edge. The box takes that
		   same step, so a paragraph of several lines reads in the box exactly as it reads on the
		   page. */
		text-indent     : inherit;
		/* A heading is drawn as a row, so its box is one of that row's parts and takes whatever
		   width is left. */
		flex            : 1 1 auto;
		/* Every box is drawn a little off its own place, by however much its words stood off the
		   place the box would give them. */
		position        : relative;
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

	/* The mark stands in the lane the words are held off by: as wide as the shape drawn in it,
	   one gap past the row number on its left and one gap short of the words on its right. It
	   gives all of that width back, so the words beside it start where they always did. It is put
	   on the page by hand rather than drawn from here, so it is named as reaching outside this
	   component. */
	:global(.fold-mark) {
		margin-left     : calc(0px - var(--gap) - var(--size-small));
		width           : var(--size-small);
		margin-right    : var(--gap);
		background      : transparent;
		/* Each mark is painted on a surface of its own, so filling one under the cursor cannot
		   send the browser back over its neighbours' edges. */
		transform       : translateZ(0);
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

	/* A heading's ring reaches one gap further left than any other box's, and holds that same gap
	   inside itself — so the ring moves and the words do not. */
	:global(.edit-box.heading) {
		margin-left  : calc(var(--gap) * -2);
		padding-left : calc(var(--gap) * 2);
		width        : calc(100% + var(--gap) * 2);
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

	/* The line bounding a section, drawn here rather than by a Section. It holds nothing of its
	   own — the gap is the section's. */
	.section-bar {
		flex : 0 0 auto;
	}

	/* Holds the words and the line that lies over them.

	   How tall the title's slot stands, said once here and read by both the title and the line
	   that closes it off: the title's own one line of words, with the one gap held above and below
	   it. That gap is what a section holds under its own line — the whole gap less half the heavy
	   line, since a gap is measured from a line's middle. */
	.view-body {
		--title-slot   : calc(var(--font-fat) * 1.25 + var(--gap-tiny) * 2);
		position       : relative;
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* The line sits a fixed way down from the top of the words and runs the full width, so its own
	   reach carries it out to the box's edges the way every other separator does. It takes no gap,
	   so nothing the title does moves it. */
	.title-sep {
		z-index  : var(--z-controls);
		top      : var(--title-slot);
		position : absolute;
		left     : 0;
		right    : 0;
	}

	.view-page {
		/* The gap it holds is padding rather than margin, so its own color fills the whole
		   area below the heavy line instead of leaving a border of the page around it. The
		   left inset has to be inside the box in any case: the marks beside the headings sit
		   in it, and anything outside a box that scrolls is clipped away. The left inset is
		   built up rather than picked: the row numbers end at the one number that says so, then
		   a gap, then the pointer, then a gap — and there the words begin. */
		padding      : 0 var(--gap-fat) 0 calc(var(--inset-numbers) + var(--gap) * 2 + var(--size-small));
		top          : var(--gap-fat);
		font-size    : var(--font);
		color        : var(--text);
		word-break   : break-word;
		cursor       : pointer;
		overflow-y   : auto;
		flex         : 1;
	}

	/* The marker showing where the browser alone would have put the thumb: half the lane's
	   width, in the dark accent, sitting on top of the real thumb and answering to nothing. */
	.free-thumb {
		/* Two pixels lower than where it is placed, so it sits square with the real thumb — the
		   browser holds its own thumb a hair off the top of the lane. */
		width          : calc(var(--width-bar) / 2);
		right          : calc(var(--width-bar) / 4);
		background     : var(--accent-dark);
		margin-top     : var(--gap-tiny);
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

	/* The lane starts below the line across the page — the title's slot plus one gap — so the bar
	   belongs to the words rather than running up alongside the title. */
	.view-page::-webkit-scrollbar-track {
		margin-top : calc(var(--gap-huge) + var(--gap));
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

	/* The first thing on the page keeps no gap above it, so the words begin exactly where
	   the scrollbar beside them does. Everything after it keeps its own spacing. */
	.view-page :global(> :first-child) {
		margin-top : 0;
	}

	/* Every outermost piece stands the line it begins on out in the left margin. The piece has
	   to hold a place of its own for the number to be put against. */
	.view-page :global(> [data-number]) {
		position : relative;
	}

	/* A table wears no number of its own — its rows carry them — but it still has to hold a place,
	   since every one of those numbers is measured from the table's own left edge. */
	.view-page :global(> table) {
		position : relative;
	}

	/* A line of the file the reader draws as nothing — a blank line, a rule — still gets a row,
	   one line of the words tall and holding the same gap a paragraph holds, so its number stands
	   the same distance from its neighbours as every other number. */
	.view-page :global(> .blank-line),
	.view-page :global(> .rule) {
		height : var(--height-small);
		margin : var(--gap) 0;
	}

	/* Every number ends at the same place, whatever it is: one digit or three, its right edge
	   stands where every other one's does — back past the pointer and the two gaps around it. It
	   is hung off that edge and grows leftward, so a third digit widens it instead of wrapping
	   onto a second line.
	   An item inside a list carries one too. Nothing between it and its outermost piece holds a
	   place of its own, so its number is measured from that piece's left edge, the same edge every
	   other number is measured from — and a list stepped in does not step its numbers in. */
	.view-page :global([data-number])::before {
		margin-right : calc(var(--gap) * 2 + var(--size-small));
		font-size    : var(--font-faint);
		content      : attr(data-number);
		color        : var(--gray);
		position     : absolute;
		line-height  : inherit;
		white-space  : nowrap;
		right        : 100%;
	}

	/* A table's rows each carry their own number, drawn against the row's first cell and measured
	   from the table's left edge — the cell holds no place of its own, exactly like an item inside
	   a list. It goes on the cell because anything drawn against a row becomes a cell of its own,
	   which would push every real cell one column along.
	   It sits level with its words with no nudge at all — the cell's own gap above its words
	   already puts it there, and the hair that suits a paragraph puts it a hair too low. */
	.view-page :global(th[data-number])::before,
	.view-page :global(td[data-number])::before {
		margin-top : 0;
	}

	/* A paragraph's own words, and a list's, sit a hair lower than a heading's — so their numbers
	   go down by the same hair to stand level with them. A list itself is named as well as its
	   items, since a list keeps the row it shares with its first item and draws that one.
	   The nudge is a margin, never a top: an item's number is measured from its outermost piece,
	   so a top would stack every item's number at that one piece's top edge. */
	.view-page :global(p[data-number])::before,
	.view-page :global(ul[data-number])::before,
	.view-page :global(ol[data-number])::before,
	.view-page :global(li.task[data-number])::before {
		margin-top : var(--gap-small);
	}

	/* How deep a piece sits steps its words in by one gap a level, counting from a second-level
	   heading. It is padding rather than margin so the piece's own left edge stays put — the row
	   number is hung off that edge, and the numbers stand in one column whatever the depth.
	   The title has a slot of its own and is left out. */
	.view-page :global(> [data-depth="3"]) { padding-left : var(--gap); }
	.view-page :global(> [data-depth="4"]) { padding-left : calc(var(--gap) * 2); }
	.view-page :global(> [data-depth="5"]) { padding-left : calc(var(--gap) * 3); }
	.view-page :global(> [data-depth="6"]) { padding-left : calc(var(--gap) * 4); }
	.view-page :global(> [data-depth="7"]) { padding-left : calc(var(--gap) * 5); }

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
	/* The title stays at the top while the words run under it, so a long guide never loses its
	   name. Its fill reaches both edges of the words area — stepping out past the inset they
	   hold and putting that inset back inside itself — so nothing shows through beside it. */
	/* Named by its number as well as its tag, so it outweighs the rule that gives every piece a
	   place of its own — that rule would otherwise take the title's stickiness away. */
	/* It stands over the words that run under it and under every control, since it is the file's
	   own words: a word standing on the line above hangs down into this area, and the one that can
	   be pressed is the one that has to be whole. */
	.view-page :global(> h1[data-number]) {
		margin     : 0 calc(var(--gap-fat) * -1) 0 calc(0px - var(--inset-numbers) - var(--gap) * 2 - var(--size-small));
		padding    : var(--gap-tiny) var(--gap-big) 0 calc(var(--gap-big) + var(--size-small) + var(--inset-numbers));
		z-index    : var(--z-hideable);
		height     : var(--title-slot);
		box-sizing : border-box;
		background : var(--bg);
		position   : sticky;
		top        : 0;
	}

	/* The title's own left edge is the page's, so its number is pushed back the other way to land
	   where every other number's right edge stands. */
	.view-page :global(> h1[data-number])::before {
		margin-right : calc(0px - var(--inset-numbers));
	}

	/* The first piece after the title brings no gap of its own, so the whole distance from the
	   line to the words is set here. The line stands at the slot's lower edge, so its own
	   thickness is inside this distance as well as the gap that follows it. */
	.view-page :global(h1 + *) {
		margin-top : calc(var(--thick-huge) + var(--gap-tiny));
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

	/* How far a list steps its items in. Said here because the browser has a number of its own —
	   forty — and it is the one measurement on the page that would come from outside the ladder. */
	.view-page :global(ul),
	.view-page :global(ol) {
		padding-inline-start : var(--inset-list);
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

	/* A thing to be done wears a box where its bullet would be, so a list of them reads as a
	   column of boxes. Pressing one writes the other letter into the file. */
	.view-page :global(li.task) {
		list-style : none;
	}

	/* A finished thing has its words struck through and grayed. A strike reaches every descendant
	   and none of them can drop it — except one standing as a single inline lump, which is why the
	   list a finished thing holds is drawn as one: its own items then read as they are. */
	.view-page :global(li.task.done) {
		text-decoration : line-through;
		color           : var(--gray);
	}

	/* Standing on the text baseline would leave the line's own drop below it, which shows as a
	   pixel appearing and going as an item is finished and unfinished — so it is held to the top
	   of its line instead. */
	/* A list holds its own step-in. Stating a full width without saying the step-in comes out of
	   it puts the two together, and the list runs past the edge of what holds it. */
	.view-page :global(li.task.done > ul),
	.view-page :global(li.task.done > ol) {
		vertical-align  : top;
		text-decoration : none;
		display         : inline-block;
		box-sizing      : border-box;
		color           : var(--text);
		width           : 100%;
	}

	/* The pointer beside a thing that holds a list of its own hangs left of the box, in the flow
	   rather than out of it: it takes back exactly what it gives, so the box and the words after
	   it stand where they always did — and its item holds no place of its own, which is what lets
	   that item's number be measured from the outermost piece. */
	:global(.fold-mark.task-fold) {
		margin-left    : calc(0px - var(--size-small) - var(--gap));
		height         : var(--size-small);
		display        : inline-flex;
		margin-right   : var(--gap);
		vertical-align : middle;
		position       : static;
	}

	/* Still to do: the drawn square, in outline on the page's own white. The shape itself comes
	   from the one place every drawn shape comes from; only how it is inked is decided here. */
	.view-page :global(li.task .task-box) {
		margin         : 0 var(--gap-small) 0 calc(var(--gap) * -0.5);
		display        : inline-flex;
		position       : relative;
		cursor         : pointer;
		line-height    : 0;
		/* The box stands on the words' baseline, so its whole height sits above it while the
		   letters keep their tails below — the two pixels put its middle back on theirs. */
		top            : 2px;
	}

	.view-page :global(li.task .task-box .square) {
		stroke-width : var(--thick-big);
		stroke       : var(--lightgray);
		fill         : var(--white);
	}

	/* Done: a filled square inside a hairline. It keeps an outline of its own so the drawn shape
	   covers the same ground either way. */
	.view-page :global(li.task .task-box.done .square) {
		fill         : var(--faintgray);
		stroke       : var(--gray);
		stroke-width : 0.5;
	}

	/* The check is drawn into every box and shows only on a finished one: one green stroke with
	   nothing filled, its ends and its corner rounded. */
	.view-page :global(li.task .task-box .check) {
		display : none;
	}

	.view-page :global(li.task .task-box.done .check) {
		stroke-linejoin : round;
		stroke-linecap  : round;
		stroke-width    : var(--thick-big);
		stroke          : var(--green);
		display         : block;
		fill            : none;
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

	/* A cell keeps its words whole. The words around it break a long one rather than let it push
	   the page sideways, but a cell is narrow by nature and would break ordinary words. */
	.view-page :global(th),
	.view-page :global(td) {
		border        : var(--thick-faint) solid var(--accent);
		padding       : var(--gap-tiny) var(--gap);
		overflow-wrap : normal;
		word-break    : normal;
		text-align    : left;
	}

	/* A table's first column is usually a number or a short word; it keeps to one line and
	   takes only the gap it needs, so the words beside it get the rest. */
	.view-page :global(th:first-child) {
		white-space : nowrap;
		width       : 1%;
	}

	.view-page :global(td:first-child) {
		white-space : nowrap;
		width       : 1%;
	}

	/* A line of three dashes. It is an ordinary row so it can carry its number, taking exactly the
	   space any other row takes. The line is painted across the row's middle, where the number's
	   own letters sit — along its top edge it would ride above them, since a line of text keeps
	   half its leading above the letters. */
	.view-page :global(.rule)::after {
		border-top : var(--thick-faint) solid var(--accent);
		position   : absolute;
		content    : '';
		right      : 0;
		left       : 0;
		top        : 50%;
	}

	/* The one place found, highlighted in the accent. */
	/* A square block around the words themselves, nothing wider — so what is highlighted is
	   exactly what was looked for. */
	.view-page :global(mark.hit) {
		color         : var(--text-on-accent);
		background    : var(--accent);
		position      : relative;
		border-radius : 0;
		padding       : 0;
	}

	/* A hairline pill drawn around that block, a full gap clear of it on every side, so the
	   highlighted words catch the eye on a crowded page. Nothing inside it, so the words still
	   read; it takes no gap, so nothing around it moves. */
	.view-page :global(mark.hit::before) {
		border         : 2px solid var(--accent);
		inset          : calc(var(--gap) * -1);
		border-radius  : var(--radius-pill);
		background     : transparent;
		position       : absolute;
		pointer-events : none;
		content        : '';
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
