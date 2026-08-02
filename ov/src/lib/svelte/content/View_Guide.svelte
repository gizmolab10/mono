<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import MarkdownIt from 'markdown-it';
	import { tip } from '../../ts/utilities/Tooltip';
	import { Direction } from '../../ts/types/Angle';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import { follow_link } from '../../ts/managers/Operations';
	import { guides } from '../../ts/managers/Guides';
	import { key_of, type Guide } from '../../ts/types/Guide';
	import Separator from '../support/Separator.svelte';

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

	// The guides are written in markdown, so they are turned into a real page before being
	// shown. Any markup written into a guide is left as plain characters rather than acted
	// on, so a guide can never reach into the app.
	const reader = new MarkdownIt({ html: false, linkify: true, typographer: true });

	// Only text that says outright it is a web address becomes one. Left to itself the
	// reader guesses, and a guide full of file names loses: "CLAUDE.md" reads to it as a
	// site in Moldova, whose ending is the same two letters markdown files use. Now a bare
	// name stays a name, and "http://..." or "https://..." still becomes a link.
	reader.linkify.set({ fuzzyLink: false });

	// The reader leaves headings unnamed, so a link ending in "#naming" would have nothing
	// to land on. Each heading is given a name made from its own words — lowercased, with
	// anything that isn't a letter or a number becoming a dash — which is how the writing
	// tools make them, so the links already in the guides line up.
	function name_the_headings(html: string): string {
		return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (whole, level, inside) => {
			const words = inside.replace(/<[^>]*>/g, '');
			const named = words.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
			return named === '' ? whole : `<h${level} id="${named}">${inside}</h${level}>`;
		});
	}

	// Every link carries its own hover words, so pointing at one says "follow this link"
	// rather than the whole page's "back to the list" — the hint watcher always takes the
	// nearest words under the cursor.
	function mark_the_links(html: string): string {
		return html.replace(/<a\s/g, '<a data-tip="follow this link" ');
	}

	// The five labels at the top of every guide are already what the list's columns show,
	// so they are taken off before reading — otherwise they would show as a stray line of
	// "kind: rule" text above the words.
	function without_labels(text: string): string {
		const lines = text.split('\n');
		if (lines[0]?.trim() !== '---') { return text; }
		const ends_at = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
		return ends_at > 0 ? lines.slice(ends_at + 1).join('\n') : text;
	}

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
	 * A click anywhere on the words. Landing on a link decides what to do by what it names;
	 * landing anywhere else goes back to the list, as it always has.
	 */
	function on_page_click(event: MouseEvent) {
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

	/**
	 * Light the first place these words turn up in the guide, and move to it. The words
	 * are looked for a run at a time, ignoring capitals; anything lit before goes back to
	 * plain first, so only ever one place is lit.
	 */
	function find_first() {
		if (!page) { return; }
		unmark();
		// Taken exactly as typed — a space is a character to look for like any other, so
		// "the end" finds those two words together rather than just "the".
		const wanted = looking_for.toLowerCase();
		if (wanted === '') { debug.log(`Search in "${name}": the field is empty, so nothing to look for.`); return; }
		const runs = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
		let looked = 0;
		while (runs.nextNode()) {
			const run = runs.currentNode as Text;
			looked += 1;
			const at = run.data.toLowerCase().indexOf(wanted);
			if (at < 0) { continue; }
			const rest = run.splitText(at);
			rest.splitText(wanted.length);
			const lit = document.createElement('mark');
			lit.className = 'hit';
			lit.textContent = rest.data;
			rest.parentNode?.replaceChild(lit, rest);
			marked = lit;
			lit.scrollIntoView({ block: 'center' });
			debug.log(`Search in "${name}" for "${looking_for}": found it in run of words number ${looked}, ${at} character(s) in — lit it and moved there.`);
			return;
		}
		// Nothing lit is answer enough while the words are still being typed, so this stays
		// quiet on screen and says it only to the log.
		debug.log(`Search in "${name}" for "${looking_for}": not there, after looking through ${looked} run(s) of words.`);
	}

	// Read this guide's words, and read again when another guide is stepped to. Held only
	// while it is on screen.
	let words  = $state<string | null>(null);
	let loaded = $state(false);
	let failed = $state('');
	$effect(() => {
		const where = address;
		words       = null;
		loaded      = false;
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
				const body = without_labels(text);
				words  = mark_the_links(name_the_headings(reader.render(body)));
				loaded = true;
				debug.log(`Viewer: read ${text.length} character(s) for "${name}", ${text.length - body.length} of them the labels at the top; turned the remaining ${body.length} into a ${words.length}-character page.`);
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
		return () => { words = null; };   // let the words go the moment this one is off screen
	});
</script>

<div class='viewer'>
	<div class='view-head'>
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
		<!-- What kind of guidance this is, at the far left beside the triangles. -->
		<span class='view-kind'>{kind}</span>
		<!-- The name holds the middle of the whole row, so the two labels can be any
		     length without moving it. -->
		<span class='view-name'>{name}</span>
		<!-- What it's about, at the far right beside the close button. -->
		<span class='view-tags'>{tags.join(', ')}</span>
		<button class='view-close' aria-label='close' use:tip={'back to the list'} onclick={onclose}>
			<svg class='view-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
				<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
			</svg>
		</button>
	</div>
	<!-- Looking through the guide on screen. Its type is "search", so the browser draws its
	     own clear cross at the right end once there is text. -->
	<div class='view-search'>
		<input
			class='search'
			type='search'
			placeholder='search'
			bind:value={looking_for}
			oninput={find_first} />
	</div>
	<Separator thickness={k.separator.huge}/>
	{#if !loaded}
		<div class='view-note'>reading…</div>
	{:else if failed !== ''}
		<div class='view-note'>file is unreadable — cannot view it</div>
	{:else}
		<!-- A click on a link follows it; a click anywhere else on the words goes back to
		     the list, the same as the close button — so getting out never means aiming at
		     the small circle. -->
		<div
			role='button'
			tabindex='-1'
			bind:this={page}
			class='view-page'
			onkeyup={() => {}}
			use:tip={'go back'}
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
		align-items : start;
		padding     : 0 calc(var(--height-control) + var(--gap)) var(--gap) 0;
		position    : relative;
		display     : flex;
		gap         : var(--gap);
		min-height  : var(--height-control);
	}

	/* All three sit 3px higher than the triangles and the close button, so the words line
	   up with the middle of those rather than their tops. The name takes whatever room the
	   kind and the tags leave and centers itself in that. */
	.view-name {
		font-size   : var(--font-label);
		color       : var(--text);
		white-space : nowrap;
		text-align  : center;
		position    : relative;
		flex        : 1 1 auto;
		min-width   : 0;
		top         : 3px;
	}

	/* The kind, at the far left after the triangles. */
	.view-kind {
		font-size : var(--font-label);
		color     : var(--text);
		opacity   : var(--opacity-header);
		position  : relative;
		top       : 3px;
		flex      : 0 0 auto;
	}

	/* The tags, hugging the far right. A long list wraps rather than shoving anything. */
	.view-tags {
		font-size  : var(--font-label);
		color      : var(--text);
		opacity    : var(--opacity-header);
		text-align : right;
		margin-left: auto;
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
		position        : absolute;   /* pinned to the top right, never moves */
		display         : flex;
		padding         : 0;
		right           : 0;
		top             : 0;
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
		font-size  : var(--font-base);
		color      : var(--text);
		word-break : break-word;
		overflow-y : auto;
		cursor     : pointer;
		flex       : 1;
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

	/* The search row, under the top row: one field across the whole width. */
	.view-search {
		padding-bottom : var(--gap);
		flex           : 0 0 auto;
		display        : flex;
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
