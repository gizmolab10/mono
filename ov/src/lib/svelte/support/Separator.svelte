<script lang='ts'>
	import Action, { T_Position } from '../../ts/types/Action';
	import { hits } from '../../ts/events/Hits';
	import { k } from '../../ts/common/Constants';

	// A colored divider — a thin accent bar, horizontal or vertical — with little rounded
	// gussets (fillets) at its ends so it meets a rounded panel cleanly. Can instead be a
	// growing spacer (no bar, just takes up room). ⟵di, trimmed: color comes from --accent,
	// sizes from props (ji tokens as defaults), and the di layer/colors deps are gone.

	let {
		radius    = k.radius.corner.tiny,
		thickness = k.thickness.normal,
		z_layer   = k.layer.controls,
		reach     = 'var(--gap)',
		vertical  = false,
		spacer    = false,
		actions   = null,
	}: {
		reach?     : string;           // how far each end extends so it meets the accent frame's inner edge; the app --gap by default
		z_layer?   : number;           // which stacking layer the line sits on — above whatever it bounds, but never in front of a word drawn on it from outside
		thickness? : number;           // the bar's width/height in px
		radius?    : number;           // the fillet radius in px
		vertical?  : boolean;          // runs top-to-bottom instead of left-to-right
		spacer?    : boolean;          // no bar — just a growing gap (vertical only)
		actions?   : Action[] | null;  // things a caller built, each to stand at its own end or middle
	} = $props();

	// Anything handed over to sit on the line, each with the end or middle it belongs at. A caller
	// builds its own control and gives us the made element; only the ones actually made are taken,
	// since an element arrives one drawing after the caller asks the browser for it.
	const placed = $derived((actions ?? []).filter((one) => one.element !== null));

	/**
	 * Put a given element inside its holder, and take it out again when the holder goes. The
	 * element belongs to whoever built it — it is only being lent a place to stand — so it is
	 * never made, changed or thrown away here.
	 *
	 * A thing arriving here was built out of sight, so wherever it told the hits manager it stood
	 * is where it stood then: nowhere. Every target is asked again once the browser has drawn it
	 * in its new place, and again when it leaves.
	 */
	function holds_element(holder: HTMLElement, element: HTMLElement) {
		holder.append(element);
		hits.defer_recalibrate();
		return {
			destroy() {
				if (element.parentNode === holder) { holder.removeChild(element); }
				hits.defer_recalibrate();
			},
		};
	}

	const r         = $derived(radius);
	const fillet_tr = $derived(`M ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 0 Z`);
	const fillet_tl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 1 0 ${r} L 0 0 Z`);
	const fillet_br = $derived(`M ${r} 0 A ${r} ${r} 0 0 1 0 ${-r} L 0 0 Z`);
	const fillet_bl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 0 0 ${-r} L 0 0 Z`);
</script>

<!-- Whatever the caller built, each standing where it asked to: hard against the left end,
     centered, or hard against the right. Its own background masks the line behind it, the same
     way a word on the line does. -->
{#snippet given_things()}
	{#each placed as one, i (i)}
		<span class='placed' class:left={one.position === T_Position.left}
			class:center={one.position === T_Position.center}
			class:right={one.position === T_Position.right}
			use:holds_element={one.element as HTMLElement}></span>
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
		{#if !spacer}{@render given_things()}{/if}
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
		{@render given_things()}
	</div>
{/if}

<style>
	.separator {
		background  : var(--accent);
		position    : relative;
		overflow    : visible;
		flex-shrink : 0;
	}

	/* The gussets are filled with the same accent as the line. */
	.separator path {
		fill : var(--accent);
	}

	/* Something the caller built, standing on the line at the end or middle it asked for. The
	   page-colored background masks the line behind it, so it reads as breaking the divider —
	   the same as a word does. It carries no look of its own: how it is drawn belongs to
	   whoever built it. The left inset matches a word's, so a word and a given thing at the
	   same end line up. */
	/* The mask is a pill, the same shape as whatever stands in it — a square one leaves the line's
	   cut ends showing past the curve at top and bottom, or stops short of it in the middle. */
	.placed {
		transform     : translateY(-50%);
		border-radius : var(--radius-pill);
		background    : var(--section-bg, var(--bg));
		position      : absolute;
		align-items   : center;
		display       : flex;
		top           : 50%;
	}

	.placed.left   { left      : var(--gap-fat); }
	.placed.center { left      : 50%; transform : translate(-50%, -50%); }
	.placed.right  { right     : var(--gap); }

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
