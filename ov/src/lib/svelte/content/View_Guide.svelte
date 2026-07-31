<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import MarkdownIt from 'markdown-it';
	import { tip } from '../../ts/utilities/Tooltip';
	import { Direction } from '../../ts/types/Angle';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Show one guide's words. Ported from ji's document viewer, trimmed to the one kind
	// overview holds: every guide is words, so the picture, page, clip and sound branches
	// are gone. Its text is read here, held only while it is on screen, and let go on close
	// — nothing about a guide's contents is kept.
	//
	// Two triangles step to the guide before or after in the on-screen list, wrapping at
	// both ends; the arrow keys do the same. The stepping itself lives with the list, which
	// knows the run and the place in it; here we only draw the controls and call back.
	let { name, address, onclose, can_step = false, onprev = () => {}, onnext = () => {} }:
		{ name: string; address: string; onclose: () => void; can_step?: boolean; onprev?: () => void; onnext?: () => void } = $props();

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	// The guides are written in markdown, so they are turned into a real page before being
	// shown. Any markup written into a guide is left as plain characters rather than acted
	// on, so a guide can never reach into the app.
	const reader = new MarkdownIt({ html: false, linkify: true, typographer: true });

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
		if (!can_step) { return; }
		event.preventDefault();
		if (key === 'ArrowLeft' || key === 'ArrowUp') { onprev(); }
		else                                          { onnext(); }
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
		if (!can_step) { return; }
		stop_hold();                // never two runs at once
		fn();                       // the first step, right away
		hold_wait = setTimeout(() => { hold_tick = setInterval(fn, HOLD_TICK); }, HOLD_PAUSE);
	}
	function stop_hold() {
		if (hold_wait !== null) { clearTimeout(hold_wait); hold_wait = null; }
		if (hold_tick !== null) { clearInterval(hold_tick); hold_tick = null; }
	}
	$effect(() => stop_hold);       // let go if the viewer closes mid-hold

	// Read this guide's words, and read again when another guide is stepped to. Held only
	// while it is on screen.
	let words  = $state<string | null>(null);
	let loaded = $state(false);
	let failed = $state('');
	$effect(() => {
		const where = address;
		words  = null;
		loaded = false;
		failed = '';
		fetch(where)
			.then((answer) => {
				if (!answer.ok) { throw new Error(`the server answered ${answer.status}`); }
				return answer.text();
			})
			.then((text) => {
				const body = without_labels(text);
				words  = reader.render(body);
				loaded = true;
				debug.log(`Viewer: read ${text.length} character(s) for "${name}", ${text.length - body.length} of them the labels at the top; turned the remaining ${body.length} into a ${words.length}-character page.`);
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
		{#if can_step}
			<div class='view-steps'>
				<button class='step' aria-label='previous guide' use:tip={'previous guide'}
					onmousedown={(e) => { e.stopPropagation(); start_hold(onprev); }}
					onmouseup={stop_hold} onmouseleave={stop_hold}
					onclick={(e) => { e.stopPropagation(); if (e.detail === 0) { onprev(); } }}>
					<svg overflow='visible' width={prev_bounds.width} height={prev_bounds.height} viewBox='{prev_bounds.minX} {prev_bounds.minY} {prev_bounds.width} {prev_bounds.height}'><path d={prev_path} /></svg>
				</button>
				<button class='step' aria-label='next guide' use:tip={'next guide'}
					onmousedown={(e) => { e.stopPropagation(); start_hold(onnext); }}
					onmouseup={stop_hold} onmouseleave={stop_hold}
					onclick={(e) => { e.stopPropagation(); if (e.detail === 0) { onnext(); } }}>
					<svg overflow='visible' width={next_bounds.width} height={next_bounds.height} viewBox='{next_bounds.minX} {next_bounds.minY} {next_bounds.width} {next_bounds.height}'><path d={next_path} /></svg>
				</button>
			</div>
		{:else}
			<span></span>
		{/if}
		<span class='view-name'>{name}</span>
		<button class='view-close' aria-label='close' use:tip={'back to the list'} onclick={onclose}>
			<svg class='view-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
				<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
			</svg>
		</button>
	</div>
	{#if !loaded}
		<div class='view-note'>reading…</div>
	{:else if failed !== ''}
		<div class='view-note'>could not read this guide — {failed}</div>
	{:else}
		<div class='view-page'>{@html words}</div>
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

	/* Three columns: triangles | title | balance. The two outer ones are equal, so the
	   title centers across the whole header. The pinned close sits over the right space;
	   the left is held back to match, so the centering stays true. */
	.view-head {
		display               : grid;
		grid-template-columns : 1fr auto 1fr;
		column-gap            : var(--gap);
		align-items           : start;
		padding               : 0 calc(var(--height-control) + var(--gap)) var(--gap) 0;
		position              : relative;
	}

	.view-name {
		font-size  : var(--font-label);
		color      : var(--text);
		text-align : center;
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
