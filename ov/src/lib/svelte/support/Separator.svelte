<script lang='ts'>
	import { k } from '../../ts/common/Constants';

	// A colored divider — a thin accent bar, horizontal or vertical — with little rounded
	// gussets (fillets) at its ends so it meets a rounded panel cleanly. Can instead be a
	// growing spacer (no bar, just takes up room). ⟵di, trimmed: color comes from --accent,
	// sizes from props (ji tokens as defaults), and the di layer/colors deps are gone.

	let {
		radius    = k.radius.corner.tiny,
		thickness = k.thickness.normal,
		reach     = 'var(--gap)',
		onclick   = undefined,
		vertical  = false,
		hovered   = false,
		spacer    = false,
		at_left   = false,
		title     = null,
		z_layer,
	}: {
		vertical?  : boolean;          // runs top-to-bottom instead of left-to-right
		spacer?    : boolean;          // no bar — just a growing gap (vertical only)
		at_left?   : boolean;          // labels run from the left end rather than spreading along the bar
		hovered?   : boolean;          // force the title-button's hover look on, even when the cursor isn't on it (a surrounding area can light it)
		z_layer?   : number;           // optional stacking layer
		thickness? : number;           // the bar's width/height in px
		radius?    : number;           // the fillet radius in px
		reach?     : string;           // how far each end extends so it meets the accent frame's inner edge; the app --gap by default
		title?     : string | string[] | null;    // when set, a label sits on the bar, its --bg mask breaking the line; several labels spread evenly, each centered over its own share of the bar
		onclick?   : ((event: MouseEvent, which: number) => void) | undefined;   // when set, each label is a button that runs this — given the click so it can stop it bubbling, and which label was pressed
	} = $props();

	// One word or several. Several are spread evenly along the bar — with two, they land at
	// the quarter and three-quarter marks, which is the middle of each half of the row below.
	const words = $derived(title === null ? [] : Array.isArray(title) ? title : [title]);

	// A bar is a couple of pixels tall, so with one word to press the whole length of it takes
	// the cursor instead: a clear strip the height of an ordinary control, lying over the bar,
	// which lights the word and answers a click anywhere along it. With more than one word
	// there is no saying which was meant, so those keep their own separate presses.
	const whole_bar = $derived(onclick !== undefined && words.length === 1);

	const r         = $derived(radius);
	const fillet_tr = $derived(`M ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 0 Z`);
	const fillet_tl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 1 0 ${r} L 0 0 Z`);
	const fillet_br = $derived(`M ${r} 0 A ${r} ${r} 0 0 1 0 ${-r} L 0 0 Z`);
	const fillet_bl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 0 0 ${-r} L 0 0 Z`);
</script>

<!-- The labels: a button when a click handler is given, else plain text. Spread along the bar,
     each at the middle of its own share of it — or, held to the left, run together from one
     wide inset off the left end. -->
{#snippet title_tags()}
	{#if at_left}
		<span class='at-left'>
			{#each words as word, i}
				{#if onclick}
					<button type='button' class='title clickable' class:forced={hovered}
						onclick={(event) => onclick(event, i)}>{word}</button>
				{:else}
					<span class='title'>{word}</span>
				{/if}
			{/each}
		</span>
	{:else}
		{#each words as word, i}
			{@const at = `${((i + 0.5) / words.length) * 100}%`}
			{#if onclick}
				<button type='button' class='title clickable' class:forced={hovered} style:left={at}
					onclick={(event) => onclick(event, i)}>{word}</button>
			{:else}
				<span class='title' style:left={at}>{word}</span>
			{/if}
		{/each}
	{/if}
{/snippet}

{#if vertical}
	<div
		class='separator vertical'
		class:spacer
		style:z-index={z_layer}
		style:width={spacer ? undefined : `${thickness}px`}
		style:height={spacer ? undefined : `calc(100% + 2 * ${reach})`}
		style:margin={spacer ? undefined : `calc(-1 * ${reach}) 0`}>
		<svg viewBox='{-r} 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:{-r}px; top:0; pointer-events:none'>
			<path d={fillet_tl} />
		</svg>
		<svg viewBox='0 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:100%; top:0; pointer-events:none'>
			<path d={fillet_tr} />
		</svg>
		<svg viewBox='{-r} {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:{-r}px; bottom:0; pointer-events:none'>
			<path d={fillet_bl} />
		</svg>
		<svg viewBox='0 {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:100%; bottom:0; pointer-events:none'>
			<path d={fillet_br} />
		</svg>
		{#if !spacer}{@render title_tags()}{/if}
	</div>
{:else}
	<div
		class='separator horizontal'
		class:reachable={whole_bar}
		style:z-index={z_layer}
		style:height='{thickness}px'
		style:margin='0 calc(-1 * {reach})'
		style:width='calc(100% + 2 * {reach})'>
		<svg viewBox='0 {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:0; top:{-r}px; pointer-events:none'>
			<path d={fillet_br} />
		</svg>
		<svg viewBox='0 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:0; bottom:{-r}px; pointer-events:none'>
			<path d={fillet_tr} />
		</svg>
		<svg viewBox='{-r} {-r} {r} {r}' width={r} height={r}
			style='position:absolute; right:0; top:{-r}px; pointer-events:none'>
			<path d={fillet_bl} />
		</svg>
		<svg viewBox='{-r} 0 {r} {r}' width={r} height={r}
			style='position:absolute; right:0; bottom:{-r}px; pointer-events:none'>
			<path d={fillet_tl} />
		</svg>
		{#if whole_bar && onclick}
			<button type='button' class='reach' aria-label={words[0]} onclick={(event) => onclick(event, 0)}></button>
		{/if}
		{@render title_tags()}
	</div>
{/if}

<style>
	.separator {
		background  : var(--accent);
		position    : relative;
		overflow    : visible;
		flex-shrink : 0;
	}

	/* The fillets are filled with the same accent as the bar. */
	.separator path {
		fill : var(--accent);
	}

	/* A label sitting on the bar; its page-colored background masks the line so the title reads
	   as text breaking the divider. How far along the bar it sits is set above, since that
	   depends on how many labels there are. */
	.title {
		transform   : translate(-50%, -50%);
		font-size   : var(--font-faint);
		color       : var(--darkgray);
		padding     : 0 var(--gap);
		background  : var(--bg);
		position    : absolute;
		font-family : inherit;
		white-space : nowrap;
		border      : none;
	}

	/* Held to the ends: one word sits at the left inset, and a second takes the right at the
	   same inset. Nothing here is placed by a share of the width. */
	.at-left {
		transform       : translateY(-50%);
		left            : var(--gap-fat);
		justify-content : space-between;
		right           : var(--gap);
		position        : absolute;
		align-items     : center;
		display         : flex;
		top             : 50%;
	}

	/* The row holding them runs the whole length, so it would swallow every click that lands
	   between the words. It lets the cursor through; only the words themselves take it. */
	.at-left {
		pointer-events : none;
	}

	.at-left .title {
		pointer-events : auto;
		position       : static;
		transform      : none;
	}

	/* When a click handler is given, the title is a button — it takes the cursor and lights on
	   hover. The edge is held see-through and counted inside the word's own room, so the hover
	   edge adds no width and the word never shifts. */
	.title.clickable {
		border        : 0.5px solid transparent;
		border-radius : var(--radius-pill);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.title.clickable:hover,
	.title.clickable.forced,
	.reachable:hover .title.clickable {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	/* The clear strip that makes a two-pixel bar worth aiming at: as tall as any other control,
	   the full length of the bar, lying centered on it and showing nothing of itself. */
	.reach {
		transform  : translateY(-50%);
		height     : var(--height);
		background : transparent;
		position   : absolute;
		cursor     : pointer;
		border     : none;
		padding    : 0;
		width      : 100%;
		left       : 0;
		top        : 50%;
	}

	/* A clear strip of the page color running along both sides of the line, one --gap
	   thick, the same length as the line itself. It carries past the box's inner edge
	   with the line, so the line and its flares sit in their own clean channel instead
	   of touching whatever they run through. */
	.horizontal {
		border-top    : 0 solid var(--bg);
		border-bottom : 0 solid var(--bg);
	}

	.vertical {
		border-left   : 0 solid var(--bg);
		border-right  : 0 solid var(--bg);
		align-self    : stretch;
	}

	.vertical.spacer {
		flex      : 1 1 0px;
		min-width : 0;
	}

	.vertical.spacer:first-child {
		margin-left  : calc(-1 * var(--gap));
		padding-left : var(--gap);
	}

	.vertical.spacer:last-child {
		margin-right  : calc(-1 * var(--gap));
		padding-right : var(--gap);
	}
</style>
