<script lang='ts'>
	import { T_DocumentExtension, T_DocumentFamily, Document } from '../../ts/types/Document';
	import { databases, w_hierarchy } from '../../ts/database/Databases';
	import { w_operation } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { Direction } from '../../ts/types/Angle';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	// Show one document in the content area: its bytes read back and rendered by
	// type. The row's view button only lights for types a browser can show, so the
	// "can't show" branch is a guard, not the usual path.
	//
	// Two triangles step to the file before or after in the on-screen run, wrapping
	// at both ends; the left and right arrow keys do the same. Both are quiet when
	// there's only one showable file. The stepping itself lives with the list (it
	// knows the run and the position); here we only draw the controls and call back.
	let { document_id, onclose, can_step = false, onprev = () => {}, onnext = () => {} }:
		{ document_id: string; onclose: () => void; can_step?: boolean; onprev?: () => void; onnext?: () => void } = $props();

	// The step triangles: the same fat mark as the folder rows, pointing left and
	// right. 20 across.
	const STEP_TRIANGLE = k.size.cross * 1.1;
	const prev_path     = svg_paths.fat_polygon(STEP_TRIANGLE, Direction.left);
	const next_path     = svg_paths.fat_polygon(STEP_TRIANGLE, Direction.right);
	const prev_bounds   = svg_paths.fat_polygon_bounds(STEP_TRIANGLE, Direction.left);
	const next_bounds   = svg_paths.fat_polygon_bounds(STEP_TRIANGLE, Direction.right);

	// The left and right arrow keys step too, while the viewer is open. A media
	// player owns the arrows when it's the focus (to seek), so a key landing on the
	// player, an input, or the sandboxed page is left alone.
	function on_key(event: KeyboardEvent) {
		const key = event.key;
		// Escape closes the viewer, always — before the arrow-only and can-step guards
		// below, so it is caught even when there is nothing to step to.
		if (key === 'Escape') { w_operation.set(null); return; }
		if (key !== 'ArrowLeft' && key !== 'ArrowUp' && key !== 'ArrowRight' && key !== 'ArrowDown') { return; }
		const tag = (event.target as HTMLElement | null)?.tagName;
		if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'IFRAME') { return; }
		if (!can_step) { return; }
		event.preventDefault();
		if (key === 'ArrowLeft' || key === 'ArrowUp') { onprev(); }
		else                                          { onnext(); }
	}

	$effect(() => {
		window.addEventListener('keydown', on_key);
		return () => window.removeEventListener('keydown', on_key);
	});

	// Holding the mouse down on a step keeps stepping: one step at once, a pause,
	// then a steady patter until the mouse is let go or leaves the button. The
	// arrow keys already repeat on their own — the operating system holds them down.
	const HOLD_PAUSE = 400;         // wait before the patter starts
	const HOLD_TICK  = 120;         // one step per this many while held
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

	const doc      = $derived($w_hierarchy.document_byID(document_id));
	const showable = $derived(doc ? Document.is_viewable(doc.extension) : false);
	// Which family to draw as. A pdf and a web page are both text by family, but each is
	// drawn its own way, so those two are told by the file's ending.
	const family   = $derived(doc ? Document.family_of(doc.reported_type ?? '', doc.extension) : null);
	const is_pdf   = $derived(doc?.extension === T_DocumentExtension.pdf);
	const is_page  = $derived(doc?.extension === T_DocumentExtension.html);

	// When a document can't be shown, say which kind it is — so "can't show" is never a mystery.
	$effect(() => {
		if (doc && !showable) { debug.log(`Viewer: nothing to show "${doc.name}" — its kind is "${doc.extension}".`); }
	});

	// Read the bytes for the shown document, and re-read when the document changes.
	// A words document comes back as text; every other kind comes back as its raw
	// bytes, which are never copied into memory here.
	let content = $state<string | Blob | null>(null);
	let loaded  = $state(false);
	$effect(() => {
		const id = document_id;
		content = null;
		loaded  = false;
		databases.active.read_blob(id).then((bytes) => {
			content = bytes;
			loaded  = true;
			const measure = (bytes == null) ? 'nothing' : (typeof bytes === 'string') ? `${bytes.length} character(s) of text` : `${bytes.size} raw byte(s)`;
			debug.log(`Viewer: read ${measure} for document ${id}.`);
		});
	});

	// The words, when this document is held as words — otherwise nothing to show as text.
	const as_text = $derived(typeof content === 'string' ? content : null);

	// What a picture, page, or player points at. Raw bytes get a short-lived link,
	// handed back the moment another document is shown so nothing is left open.
	// Bytes stored the old way — as one long piece of text — are already a usable
	// link, so they are pointed at directly.
	let source = $state('');
	$effect(() => {
		const held = content;
		if (held == null)              { source = ''; return; }
		if (typeof held === 'string')  { source = held; return; }
		const link = URL.createObjectURL(held);
		source = link;
		debug.log(`Viewer: made a temporary link for ${held.size} raw byte(s), type "${held.type || 'unstated'}".`);
		return () => URL.revokeObjectURL(link);
	});

	// An svg is held as its own words; wrap them into a link an image tag can show.
	// Every other picture already has a link from above.
	const image_src = $derived.by(() => {
		if (doc == null) { return ''; }
		return (doc.extension === T_DocumentExtension.svg && as_text != null)
			? `data:image/svg+xml,${encodeURIComponent(as_text)}`
			: source;
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class='viewer' role='button' tabindex='0' use:tip={'back to the list'} onclick={() => onclose()}>
	<div class='view-head'>
		<!-- Only worth showing the step triangles when there's more than one showable file
		     on screen to step between; with fewer than two, hide the whole thing. -->
		{#if can_step}
			<div class='view-steps'>
				<button class='step' aria-label='previous file' use:tip={'previous file'}
					onmousedown={(e) => { e.stopPropagation(); start_hold(onprev); }}
					onmouseup={stop_hold} onmouseleave={stop_hold}
					onclick={(e) => { e.stopPropagation(); if (e.detail === 0) { onprev(); } }}>
					<svg overflow='visible' width={prev_bounds.width} height={prev_bounds.height} viewBox='{prev_bounds.minX} {prev_bounds.minY} {prev_bounds.width} {prev_bounds.height}'><path d={prev_path} /></svg>
				</button>
				<button class='step' aria-label='next file' use:tip={'next file'}
					onmousedown={(e) => { e.stopPropagation(); start_hold(onnext); }}
					onmouseup={stop_hold} onmouseleave={stop_hold}
					onclick={(e) => { e.stopPropagation(); if (e.detail === 0) { onnext(); } }}>
					<svg overflow='visible' width={next_bounds.width} height={next_bounds.height} viewBox='{next_bounds.minX} {next_bounds.minY} {next_bounds.width} {next_bounds.height}'><path d={next_path} /></svg>
				</button>
			</div>
		{:else}
			<span></span>
		{/if}
		<span class='view-name'>{doc?.name ?? ''}</span>
		<button class='view-close' aria-label='close' use:tip={'close'} onclick={onclose}>
			<svg class='view-cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
				<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
			</svg>
		</button>
	</div>
	{#if !loaded}
		<div class='view-note'>loading…</div>
	{:else if content == null}
		<div class='view-note'>this document's bytes are missing</div>
	{:else if !showable}
		<div class='view-note'>can't show this type here</div>
	{:else if family === T_DocumentFamily.image}
		<img class='view-image' src={image_src} alt={doc?.name} />
	{:else if is_pdf}
		<iframe class='view-frame' src={source} title={doc?.name}></iframe>
	{:else if is_page}
		<!-- Sandboxed and script-free, so the file's own markup and scripts can't
		     reach the app; it just renders as a page. -->
		<iframe class='view-frame' sandbox='' srcdoc={as_text ?? ''} title={doc?.name}></iframe>
	{:else if family === T_DocumentFamily.video}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video class='view-player' src={source} controls></video>
	{:else if family === T_DocumentFamily.audio}
		<audio class='view-player' src={source} controls></audio>
	{:else if family === T_DocumentFamily.text}
		<pre class='view-text'>{as_text}</pre>
	{:else}
		<div class='view-note'>can't show this type here</div>
	{/if}
</div>

<style>
	.viewer {
		padding        : var(--gap);
		position       : relative;   /* anchor for the pinned close button */
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* Three columns: triangles | title | balance. The two outer columns are equal, so
	   the title's middle column centers across the whole header. The pinned close sits
	   over the right space; the left is padded to match so the centering stays true. */
	.view-head {
		display               : grid;
		grid-template-columns : 1fr auto 1fr;
		column-gap            : var(--gap);
		align-items           : start;   /* triangles hold at the top; a wrapped title grows downward */
		padding               : 0 calc(var(--height-control) + var(--gap)) var(--gap) 0;   /* clear the pinned close on the right; triangles hug the far left */
		position              : relative;
	}

	.view-name {
		font-size  : var(--font-label);
		color      : var(--text);
		text-align : center;
	}

	/* The two step triangles, pinned together at the top-far-left. */
	.view-steps {
		justify-self : start;
		gap         : var(--gap);
		align-items : center;
		display     : flex;
	}

	/* A step triangle: page-colored inside with an accent outline, filling to the
	   hover color under the cursor — the same look as the folder triangles. */
	.step {
		border          : none;
		background      : transparent;
		padding         : 0;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
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
		padding         : 0;
		align-items     : center;
		justify-content : center;
		position        : absolute;   /* pinned to the viewer's top-right, never moves */
		top             : 0;
		right           : 0;
		display         : flex;
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

	.view-image {
		object-fit : contain;
		max-height : 100%;
		max-width  : 100%;
		align-self : center;
	}

	.view-frame {
		border : none;
		width  : 100%;
		flex   : 1;
	}

	/* A clip fills the space it's given without stretching out of shape; a sound
	   player is a single strip, so it sits at the top at full width. */
	.view-player {
		max-height : 100%;
		max-width  : 100%;
		align-self : center;
		width      : 100%;
	}

	.view-text {
		font-size   : var(--font-label);
		color       : var(--text);
		white-space : pre-wrap;
		word-break  : break-word;
		overflow-y  : auto;
		margin      : 0;
		flex        : 1;
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
