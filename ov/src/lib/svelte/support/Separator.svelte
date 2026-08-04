<script lang='ts'>
	import { k } from '../../ts/common/Constants';

	// A colored divider — a thin accent bar, horizontal or vertical — with little rounded
	// gussets (fillets) at its ends so it meets a rounded panel cleanly. Can instead be a
	// growing spacer (no bar, just takes up room). ⟵di, trimmed: color comes from --accent,
	// sizes from props (ji tokens as defaults), and the di layer/colors deps are gone.

	let {
		radius    = k.radius.corner.banner,
		thickness = k.separator.normal,
		reach     = 'var(--gap)',
		onclick   = undefined,
		vertical  = false,
		hovered   = false,
		spacer    = false,
		title     = null,
		z_layer,
	}: {
		vertical?  : boolean;          // runs top-to-bottom instead of left-to-right
		spacer?    : boolean;          // no bar — just a growing gap (vertical only)
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

	const r         = $derived(radius);
	const fillet_tr = $derived(`M ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 0 Z`);
	const fillet_tl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 1 0 ${r} L 0 0 Z`);
	const fillet_br = $derived(`M ${r} 0 A ${r} ${r} 0 0 1 0 ${-r} L 0 0 Z`);
	const fillet_bl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 0 0 ${-r} L 0 0 Z`);
</script>

<!-- The labels, each placed at the middle of its own share of the bar: a button when a click
     handler is given, else plain text. -->
{#snippet title_tags()}
	{#each words as word, i}
		{@const at = `${((i + 0.5) / words.length) * 100}%`}
		{#if onclick}
			<button type='button' class='title clickable' class:forced={hovered} style:left={at}
				onclick={(event) => onclick(event, i)}>{word}</button>
		{:else}
			<span class='title' style:left={at}>{word}</span>
		{/if}
	{/each}
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
		font-size   : var(--font-label);
		color       : var(--darkgray);
		padding     : 0 var(--gap);
		background  : var(--bg);
		position    : absolute;
		font-family : inherit;
		white-space : nowrap;
		border      : none;
	}

	/* When a click handler is given, the title is a button — it takes the cursor and lights on hover. */
	.title.clickable {
		border-radius : var(--radius-pill);
		cursor        : pointer;
	}

	.title.clickable:hover,
	.title.clickable.forced {
		border     : 0.5px solid var(--darkgray);
		background : var(--hover);
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
