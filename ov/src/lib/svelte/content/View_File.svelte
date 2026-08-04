<script lang='ts'>
	import { lines_between, page_of, still_reads, with_lines_replaced } from '../../ts/utilities/Markdown_Blocks';
	import { ALL_TAGS, T_Bundle, T_Kind, in_order, key_of, type Guide } from '../../ts/types/Guide';
	import { follow_link, w_command_down, w_editing, w_search_for } from '../../ts/managers/Operations';
	import { get } from 'svelte/store';
	import { VAULT, file_path_of, obsidian_link, save_guide } from '../../ts/utilities/Saving';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { with_labels_replaced } from '../../ts/utilities/Labels';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import Separator from '../support/Separator.svelte';
	import { guides } from '../../ts/managers/Guides';
	import { tip } from '../../ts/utilities/Tooltip';
	import { Direction } from '../../ts/types/Angle';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import MarkdownIt from 'markdown-it';

	// Show one guide's words. Ported from ji's document viewer, trimmed to the one kind
	// overview holds: every guide is words, so the picture, page, clip and sound branches
	// are gone. Its text is read here, held only while it is on screen, and let go on close
	// — nothing about a guide's contents is kept.
	//
	// Two triangles step to the guide before or after in the on-screen list, wrapping at
	// both ends; the arrow keys do the same. The stepping itself lives with the list, which
	// knows the run and the place in it; here we only draw the controls and call back.
	let { name, address, kind, tags, guide, onclose, can_back = false, can_forward = false, onprev = () => {}, onnext = () => {} }:
		{ name: string; address: string; kind: string; tags: string[]; guide: Guide; onclose: () => void; can_back?: boolean; can_forward?: boolean; onprev?: () => void; onnext?: () => void } = $props();

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	// The title says where the guide sits as well as what it is called: every folder above it,
	// from the top down. A guide in a project starts with that project; one belonging to no
	// project starts with the repo's own name instead.
	const sits_at = $derived.by(() => {
		const folders = guide.path.split('/').slice(0, -1);
		const top = guide.bundle === T_Bundle.mono ? ['mono'] : [guide.bundle];
		return [...top, ...folders, name].join(' / ');
	});

	// The guides are written in markdown, so they are turned into a real page before being
	// shown. Any markup written into a guide is left as plain characters rather than acted
	// on, so a guide can never reach into the app.
	const reader = new MarkdownIt({ html: false, linkify: true, typographer: true });

	// Only text that says outright it is a web address becomes one. Left to itself the
	// reader guesses, and a guide full of file names loses: "CLAUDE.md" reads to it as a
	// site in Moldova, whose ending is the same two letters markdown files use. Now a bare
	// name stays a name, and "http://..." or "https://..." still becomes a link.
	reader.linkify.set({ fuzzyLink: false });

	// Turning a guide's text into the page on screen — labels off the top, every piece
	// stamped with the lines it came from, headings named, links marked — all lives in one
	// place, so drawing again after a change is the same call on the changed text.

	// The step triangles: the same fat mark as ji's, pointing left and right.
	const STEP_TRIANGLE = k.size.cross * 1.1;
	const prev_path     = svg_paths.fat_polygon(STEP_TRIANGLE, Direction.left);
	const next_path     = svg_paths.fat_polygon(STEP_TRIANGLE, Direction.right);
	const prev_bounds   = svg_paths.fat_polygon_bounds(STEP_TRIANGLE, Direction.left);
	const next_bounds   = svg_paths.fat_polygon_bounds(STEP_TRIANGLE, Direction.right);

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

	// Holding the mouse down on a step keeps stepping: one step at once, a pause, then a
	// steady patter until the mouse is let go. The arrow keys already repeat on their own.
	const HOLD_PAUSE = 400;
	const HOLD_TICK  = 120;
	let hold_wait: ReturnType<typeof setTimeout>  | null = null;
	let hold_tick: ReturnType<typeof setInterval> | null = null;
	function start_hold(fn: () => void) {
		stop_hold();                // never two runs at once
		fn();                       // the first step, right away
		hold_wait = setTimeout(() => { hold_tick = setInterval(fn, HOLD_TICK); }, HOLD_PAUSE);
	}
	function stop_hold() {
		if (hold_wait !== null) { clearTimeout(hold_wait); hold_wait = null; }
		if (hold_tick !== null) { clearInterval(hold_tick); hold_tick = null; }
	}
	$effect(() => stop_hold);       // let go if the viewer closes mid-hold

	// --- the links inside a guide ---------------------------------------------

	let page = $state<HTMLElement | null>(null);
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
	 * A click anywhere on the words. With editing on, a click opens the piece it landed on
	 * and nothing closes the guide. Otherwise, landing on a link decides what to do by what
	 * it names, and landing anywhere else goes back to the list, as it always has.
	 */
	function on_page_click(event: MouseEvent) {
		// Holding the option key turns the words into something to pick up rather than
		// something to click: dragging selects them, and nothing here answers.
		if ($w_command_down) { return; }
		if ($editing) { on_edit_click(event); return; }
		const anchor = (event.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null;
		if (!anchor) { onclose(); return; }
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

	// --- editing one piece of the guide ---------------------------------------

	// Every outermost piece of the page carries the lines it came from. With editing on, a
	// click opens that piece in a plain box holding the file's own words for those lines —
	// hashes, dashes and all — rather than anything worked back out of what's on screen.
	//
	// Nothing is written yet: leaving the box says to the log what it would have saved.
	// Kept outside this view, so the list can open a guide already editing — holding the
	// command key while clicking a file does that.
	const editing = w_editing;
	let text_of_file = '';                          // the whole file, held only while on screen
	let box: HTMLTextAreaElement | null = null;     // the open box, if there is one
	let stood_in_for: HTMLElement | null = null;    // the piece it is standing in front of
	let opened_with = '';                           // what the box held when it opened

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
		box.value     = opened_with;
		box.addEventListener('input', fit_box);
		box.addEventListener('blur', () => close_box(true));
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
		const typed = box.value;
		const from  = Number(stood_in_for.dataset.from);
		const to    = Number(stood_in_for.dataset.to);
		box.remove();
		stood_in_for.style.display = '';
		box = null;
		stood_in_for = null;
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
		requestAnimationFrame(() => { if (page) { page.scrollTop = was_at; } });
		debug.log(`Editing "${name}": drew the guide again from its changed words — back at ${Math.round(was_at)} down the page.`);
	}

	/** A click on the words while editing is on. */
	function on_edit_click(event: MouseEvent) {
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

	/** Open the field, or shut it again with nothing changed. */
	function handle_show_rename() {
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

	/**
	 * Turn editing on or off. Turning it off puts away any box still open. With the command
	 * key held, the file goes to Obsidian instead and nothing here changes.
	 */
	function toggle_editing(event: MouseEvent) {
		if (event.metaKey) {
			const where = file_path_of(guide.bundle, guide.path);
			window.open(obsidian_link(VAULT, where), '_self');
			debug.log(`Edit clicked with the command key: handing "${where}" to Obsidian, in the "${VAULT}" vault. This app stays where it is.`);
			return;
		}
		const now = !$editing;
		editing.set(now);
		if (!now) { close_box(true); }
		debug.log(`Editing "${name}" is now ${now ? 'on — a click opens the piece it lands on' : 'off — clicks follow links again'}.`);
	}

	// --- looking through the guide on screen ----------------------------------

	let looking_for = $state('');
	let marked: HTMLElement | null = null;      // the run of words lit right now, if any

	/** Put the lit words back the way they were. */
	function unmark() {
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
	let hit_at     = $state(0);

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
		const wanted = looking_for.toLowerCase();
		if (wanted === '') { hits_found = 0; hit_at = 0; debug.log(`Search in "${name}": the field is empty, so nothing to look for.`); return; }

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
			hit_at = 0;
			// Nothing lit is answer enough while the words are still being typed, so this
			// stays quiet on screen and says it only to the log.
			debug.log(`Search in "${name}" for "${looking_for}": not there.`);
			return;
		}
		hit_at = ((which % places.length) + places.length) % places.length;    // wraps at both ends
		const { run, at } = places[hit_at];
		const rest = run.splitText(at);
		rest.splitText(wanted.length);
		const lit = document.createElement('mark');
		lit.className = 'hit';
		lit.textContent = rest.data;
		rest.parentNode?.replaceChild(lit, rest);
		marked = lit;
		lit.scrollIntoView({ block: 'center' });
		debug.log(`Search in "${name}" for "${looking_for}": showing ${hit_at + 1} of ${places.length}.`);
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
	let words  = $state<string | null>(null);
	let loaded = $state(false);
	let failed = $state('');
	$effect(() => {
		const where = address;
		// The words already on screen stay there until the next one's are ready. Blanking them
		// first put an empty box on screen for an instant, which read as a flash.
		failed      = '';
		note        = '';
		looking_for = '';        // a search belongs to the guide it was typed in
		marked      = null;
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
					looking_for = wanted;
					requestAnimationFrame(find_first);
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
	<div class='view-head'>
		<!-- Getting out, and turning editing on: the two together at the far left, before
		     the triangles. -->
		<button class='view-close' aria-label='close' use:tip={'back to the list'} onclick={onclose}>
			<svg class='view-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
				<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
			</svg>
		</button>
		<!-- Only worth showing the step triangles when there is more than one guide on
		     screen to step between. -->
		{#if can_back || can_forward}
			<div class='view-steps'>
				{#if can_back}
					<button class='step' aria-label='previous guide' use:tip={'previous guide'}
						onmousedown={(e) => { e.stopPropagation(); start_hold(onprev); }}
						onmouseup={stop_hold} onmouseleave={stop_hold}
						onclick={(e) => { e.stopPropagation(); if (e.detail === 0) { onprev(); } }}>
						<svg overflow='visible' width={prev_bounds.width} height={prev_bounds.height} viewBox='{prev_bounds.minX} {prev_bounds.minY} {prev_bounds.width} {prev_bounds.height}'><path d={prev_path} /></svg>
					</button>
				{/if}
				{#if can_forward}
					<button class='step' aria-label='next guide' use:tip={'next guide'}
						onmousedown={(e) => { e.stopPropagation(); start_hold(onnext); }}
						onmouseup={stop_hold} onmouseleave={stop_hold}
						onclick={(e) => { e.stopPropagation(); if (e.detail === 0) { onnext(); } }}>
						<svg overflow='visible' width={next_bounds.width} height={next_bounds.height} viewBox='{next_bounds.minX} {next_bounds.minY} {next_bounds.width} {next_bounds.height}'><path d={next_path} /></svg>
					</button>
				{/if}
			</div>
		{:else}
			<span></span>
		{/if}
		<!-- With this on, a click on the words opens that piece for editing instead of
		     going back to the list. -->
		<button class='view-edit' class:on={$editing} onclick={toggle_editing}
			use:tip={$w_command_down ? 'edit this guide in obsidian' : $editing ? 'stop editing' : 'edit this guide'}>edit</button>
		<!-- The five labels have their own form; this folds it away without leaving editing. -->
		{#if $editing}
			<button class='view-edit' class:on={$w_show_labels}
				use:tip={`${$w_show_labels ? 'hide' : 'edit'} the labels`}
				onclick={() => { w_show_labels.set(!$w_show_labels); debug.log(`Editing "${name}": the label form is now ${!$w_show_labels ? 'hidden' : 'shown'}.`); }}>labels</button>
			<!-- Giving the file itself a different name. While the field is open, this is the
			     way back out with nothing changed. -->
			<button
				class='view-edit'
				class:on={renaming}
				onclick={handle_show_rename}
				use:tip={renaming ? 'leave the name as it was' : 'give this guide a different name'}>
				{renaming ? 'cancel' : 'rename'}
			</button>
		{/if}
		<!-- Nothing between the buttons and the pair at the right, so those two keep their
		     own ends of the row. -->
		<span class='view-spacer'></span>
		<!-- What kind of guidance this is, and what it's about: the pair at the far right. -->
		<span class='view-kind'>{kind}</span>
		<span class='view-bar'>|</span>
		<span class='view-tags'>{tags.join(', ')}</span>
	</div>
	<!-- Where it sits and what it is called, on a row of its own — or, while renaming, the
	     name being typed. -->
	<div class='view-title'>
		{#if renaming}
			<input
				use:take_the_cursor
				class='rename-field'
				bind:value={typed_name}
				onkeydown={(e) => { if (e.key === 'Enter') { handle_rename(); } }} />
		{:else}
			<span class='view-name'>{sits_at}</span>
		{/if}
	</div>
	<!-- Looking through the guide on screen. Its type is "search", so the browser draws its
	     own clear cross at the right end once there is text. -->
	<div class='view-search'>
		<!-- With something typed, two triangles walk the places those words turn up, and the
		     count says which of them is lit. -->
		{#if looking_for !== ''}
			<div class='view-steps hits'>
				<button class='step' aria-label='place before' use:tip={'the place before'} onclick={() => step_hit(-1)}>
					<svg overflow='visible' width={prev_bounds.width} height={prev_bounds.height} viewBox='{prev_bounds.minX} {prev_bounds.minY} {prev_bounds.width} {prev_bounds.height}'><path d={prev_path} /></svg>
				</button>
				<span class='hit-count'>{hits_found === 0 ? 'none' : `${hit_at + 1} of ${hits_found}`}</span>
				<button class='step' aria-label='place after' use:tip={'the place after'} onclick={() => step_hit(1)}>
					<svg overflow='visible' width={next_bounds.width} height={next_bounds.height} viewBox='{next_bounds.minX} {next_bounds.minY} {next_bounds.width} {next_bounds.height}'><path d={next_path} /></svg>
				</button>
			</div>
		{/if}
		<input
			class='search'
			type='search'
			placeholder='search'
			bind:value={looking_for}
			oninput={find_first} />
	</div>
	<Separator thickness={k.separator.huge}/>
	<!-- The five labels, shown only while editing. They never appear among the words, so
	     this is the only way at them. -->
	{#if $editing && $w_show_labels}
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
			<div class='label-sep'><Separator thickness={k.separator.normal} title={'tags'}/></div>
			<div class='label-row wrapping'>
				{#each ALL_TAGS as tag (tag)}
					<button class='label-pick' class:on={form_tags.includes(tag)} onclick={() => toggle_tag(tag)}>{tag}</button>
				{/each}
			</div>
		</div>
		<Separator thickness={k.separator.normal}/>
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
			class:selecting={$w_command_down}
			use:tip={$w_command_down ? 'drag to pick up these words' : $editing ? 'click a paragraph to edit it' : 'go back'}
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
	.view-head {
		align-items    : start;
		padding-bottom : calc(var(--gap) - 6px);
		position       : relative;
		display        : flex;
		gap            : var(--gap);
		min-height     : var(--height-control);
	}

	/* The empty run that holds the buttons at the left apart from the kind and tags at the
	   right, now that nothing sits between them. */
	.view-spacer {
		flex : 1 1 auto;
	}

	/* A row of its own for where the guide sits, held in the middle of the whole width. */
	.view-title {
		justify-content : center;
		align-items     : center;
		padding-bottom  : calc(var(--gap) - 2px);
		display         : flex;
		min-height      : var(--height-control);
	}

	/* The kind and the tags sit 3px higher than the triangles and the close button, so the
	   words line up with the middle of those rather than their tops. */
	.view-name {
		font-size   : var(--font-label);
		color       : var(--text);
		white-space : nowrap;
		text-align  : center;
		min-width   : 0;
	}

	/* While renaming, the field stands where the guide's place normally reads, taking the
	   width of that row. */
	.rename-field {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		margin-right  : var(--gap);
		flex          : 1 1 auto;
		font-family   : inherit;
		min-width     : 0;
	}

	/* The kind, at the far right just before the tags. */
	.view-kind {
		font-size : var(--font-label);
		color     : var(--text);
		opacity   : var(--opacity-header);
		position  : relative;
		top       : 3px;
		flex      : 0 0 auto;
	}

	/* The tags, hugging the far right. A long list wraps rather than shoving anything. */
	/* The upright stroke keeping the kind apart from the tags. */
	.view-bar {
		font-size : var(--font-label);
		color     : var(--text);
		opacity   : var(--opacity-header);
		position  : relative;
		top       : 3px;
		flex      : 0 0 auto;
	}

	.view-tags {
		font-size  : var(--font-label);
		color      : var(--text);
		opacity    : var(--opacity-header);
		text-align : right;
		position   : relative;
		top        : 3px;
		flex       : 0 1 auto;
	}

	/* The two step triangles, pinned together at the top far left. */
	.view-steps {
		justify-self : start;
		gap          : var(--gap);
		align-items  : center;
		display      : flex;
	}

	/* A step triangle: white inside with an accent outline, filling to the hover color
	   under the cursor — the same look as the folder triangles. */
	.step {
		background      : transparent;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border          : none;
		padding         : 0;
	}

	.step path {
		fill         : var(--white);
		stroke       : var(--accent);
		stroke-width : 1;
	}

	.step:hover path {
		fill : var(--hover);
	}

	/* The five labels while editing: a line each for the kind, the name and date, what it
	   says, and the tags. The pickers read like the filters' own, so the closed lists look
	   the same wherever they turn up. */
	.label-form {
		flex-direction : column;
		margin         : var(--gap) 0;
		display        : flex;
		gap            : var(--gap-tight);
	}

	.label-row {
		align-items : center;
		display     : flex;
		gap         : var(--gap-tight);
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
		font-size  : var(--font-label);
		color      : var(--text);
		opacity    : var(--opacity-header);
		text-align : right;
		flex       : 0 0 auto;
		width      : 45px;
	}

	.label-field {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		font-family   : inherit;
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		min-width     : 0;
		flex          : 1 1 auto;
	}

	.label-field.date {
		flex  : 0 0 auto;
		width : 110px;
	}

	.label-pick {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		white-space   : nowrap;
		cursor        : pointer;
		flex          : 0 0 auto;
	}

	.label-pick:hover {
		background : var(--hover);
	}

	.label-pick.on {
		background : var(--accent);
	}

	/* The edit toggle, beside the close button. It reads like the other small controls, and
	   fills with the accent while it is on so there is never a doubt which way it sits. */
	.view-edit {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		white-space   : nowrap;
		cursor        : pointer;
		flex          : 0 0 auto;
	}

	.view-edit:hover {
		background : var(--hover);
	}

	.view-edit.on {
		background : var(--accent);
	}

	/* The box standing in for one piece of the guide. It is put on the page by hand rather
	   than drawn from here, so it is named as reaching outside this component. */
	:global(.edit-box) {
		border        : var(--thickness-normal) solid var(--accent);
		border-radius : var(--radius-small);
		font-family   : inherit;
		font-size     : inherit;
		line-height   : inherit;
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		padding       : var(--gap-tight);
		white-space   : pre-wrap;
		overflow      : hidden;
		resize        : none;
		display       : block;
		width         : 100%;
	}

	.view-close {
		border          : var(--thickness-normal) solid var(--black);
		border-radius   : var(--radius-percent);
		height          : var(--height-control);
		width           : var(--height-control);
		box-sizing      : border-box;
		background      : var(--white);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		flex            : 0 0 auto;
		padding         : 0;
	}

	.view-close:hover {
		background : var(--hover);
	}

	.view-cross {
		width   : var(--size-svg);
		height  : var(--size-svg);
		display : block;
	}

	.view-cross path {
		stroke : var(--black);
	}

	.view-page {
		margin-top : var(--gap);      /* the words and the bar beside them both start here */
		font-size  : var(--font-base);
		color      : var(--text);
		word-break : break-word;
		overflow-y : auto;
		cursor     : pointer;
		flex       : 1;
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
	.view-page :global(h4) {
		margin-bottom : var(--gap-tight);
		margin-top    : var(--gap-fat);
		line-height   : 1.25;
	}

	.view-page :global(h1) { font-size : var(--font-large); }
	.view-page :global(h2) { font-size : var(--font-banner); }
	.view-page :global(h3),
	.view-page :global(h4) { font-size : var(--font-base); }

	.view-page :global(p),
	.view-page :global(ul),
	.view-page :global(ol) {
		margin      : var(--gap-tight) 0;
		line-height : 1.5;
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

	/* The sideways bar under a wide code block is drawn the same way as the list's own bar
	   beside the rows: the same thickness, an accent thumb, and no track behind it. */
	.view-page :global(pre::-webkit-scrollbar) {
		height : 20px;
		width  : 20px;
	}

	.view-page :global(pre::-webkit-scrollbar-thumb) {
		background    : var(--accent);
		border-radius : var(--radius-pill);
	}

	.view-page :global(pre::-webkit-scrollbar-track) {
		background : transparent;
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
		border     : none;
		border-top : var(--thickness-faint) solid var(--accent);
		margin     : var(--gap-fat) 0;
	}

	/* The search row, under the top row: the walking triangles, then the field. */
	.view-search {
		padding-bottom : calc(var(--gap) + 4px);
		align-items    : center;
		flex           : 0 0 auto;
		display        : flex;
		gap            : var(--gap);
	}

	/* The triangles that walk the places the words turn up, and the count between them. */
	.view-steps.hits {
		flex : 0 0 auto;
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
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		width         : 100%;
	}

	/* The one place found, lit in the accent. */
	.view-page :global(mark.hit) {
		background    : var(--accent);
		color         : var(--text-on-accent);
		border-radius : var(--radius-banner);
		padding       : 0 2px;
	}

	/* The line a dead link leaves behind, along the bottom of the reading area. */
	.view-note-line {
		border-top : var(--thickness-faint) solid var(--accent);
		padding-top: var(--gap-tight);
		opacity    : var(--opacity-label);
		font-size  : var(--font-label);
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
