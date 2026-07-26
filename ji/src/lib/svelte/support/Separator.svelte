<script lang='ts'>
	import { k } from '../../ts/common/Constants';

	// A colored divider — a thin accent bar, horizontal or vertical — with little rounded
	// gussets (fillets) at its ends so it meets a rounded panel cleanly. Can instead be a
	// growing spacer (no bar, just takes up room). ⟵di, trimmed: color comes from --accent,
	// sizes from props (ji tokens as defaults), and the di layer/colors deps are gone.

	let {
		radius    = k.radius.corner.banner,
		thickness = k.thickness.normal,
		reach     = 'var(--gap)',
		onclick   = undefined,
		vertical  = false,
		spacer    = false,
		title     = null,
		z_layer,
	}: {
		vertical?  : boolean;          // runs top-to-bottom instead of left-to-right
		spacer?    : boolean;          // no bar — just a growing gap (vertical only)
		thickness? : number;           // the bar's width/height in px
		radius?    : number;           // the fillet radius in px
		reach?     : string;           // how far each end extends so it meets the accent frame's inner edge; the app --gap by default
		title?     : string | null;    // when set, a label sits centered on the bar, its --bg mask breaking the line
		onclick?   : (() => void) | undefined;   // when set, the title is a button that runs this
		z_layer?   : number;           // optional stacking layer
	} = $props();

	const r         = $derived(radius);
	const fillet_tr = $derived(`M ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 0 Z`);
	const fillet_tl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 1 0 ${r} L 0 0 Z`);
	const fillet_br = $derived(`M ${r} 0 A ${r} ${r} 0 0 1 0 ${-r} L 0 0 Z`);
	const fillet_bl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 0 0 ${-r} L 0 0 Z`);
</script>

<!-- The centered label: a button when a click handler is given, else plain text. -->
{#snippet title_tag()}
	{#if onclick}
		<button type='button' class='title clickable' {onclick}>{title}</button>
	{:else}
		<span class='title'>{title}</span>
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
		{#if title !== null && !spacer}{@render title_tag()}{/if}
	</div>
{:else}
	<div
		style:z-index={z_layer}
		class='separator horizontal'
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
		{#if title !== null}{@render title_tag()}{/if}
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

	/* A label sitting centered on the bar; its page-colored background masks the line so the
	   title reads as text breaking the divider. */
	.title {
		transform   : translate(-50%, -50%);
		font-size   : var(--font-label);
		padding     : 0 var(--gap);
		color       : var(--text);
		background  : var(--bg);
		position    : absolute;
		font-family : inherit;
		white-space : nowrap;
		border      : none;
		top         : 50%;
		left        : 50%;
	}

	/* When it's a button, it looks the same but takes the cursor and lights on hover. */
	.title.clickable {
		border-radius : var(--radius-pill);
		cursor        : pointer;
	}

	.title.clickable:hover {
		border     : 0.5px solid black;
		background : var(--hover);
	}

	.vertical {
		align-self : stretch;
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
