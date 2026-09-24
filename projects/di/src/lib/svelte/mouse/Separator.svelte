<script lang='ts'>
	import Action, { T_Position } from '../../ts/types/Action';
	import { T_Layer } from '../../ts/types/Enumerations';
	import { colors } from '../../ts/utilities/Colors';
	import { hits } from '../../ts/events/Hits';
	import { k } from '../../ts/common/Constants';

	let {
		kind      = 'content' as 'content' | 'main',
		z_layer   = T_Layer.layout,
		vertical  = false,
		spacer    = false,
		actions   = null,
		thickness = null,
		overhang  = null,
	}: {
		vertical?  : boolean;
		spacer?    : boolean;
		z_layer?   : T_Layer;
		thickness? : number | null;    // how thick to draw it, where the caller says so; its kind decides otherwise
		overhang?  : number | null;    // how far past its holder it reaches at each end; its kind decides otherwise
		actions?   : Action[] | null;  // things a caller built, each to stand at its own end or middle
		kind?      : 'content' | 'main';
	} = $props();


	const { w_accent_color } = colors;
	const r = $derived(k.radius[kind]);
	const fill = $derived($w_accent_color);
	const extra_length = $derived(overhang ?? k.layout.extra[kind]);
	const line_thickness = $derived(thickness ?? k.thickness.separator[kind]);

	// Anything handed over to sit on the line, each with the end or middle it belongs at. A caller
	// builds its own control and gives us the made element; only the ones actually made are taken,
	// since an element arrives one drawing after the caller asks the browser for it.
	const placed = $derived((actions ?? []).filter((one) => one.element !== null));

	/**
	 * Put a given element inside its holder, and take it out again when the holder goes. The
	 * element belongs to whoever built it — it is only being lent a place to stand — so it is
	 * never made, changed or thrown away here.
	 *
	 * Where it was built is remembered, so it can be put back. Taken away without being put back
	 * it would be off the page for good, and the hits manager lets go of any target whose element
	 * has left — so a word on a line that folds would answer nothing ever again once it had been
	 * folded once.
	 *
	 * A thing arriving here was built out of sight, so wherever it told the manager it stood is
	 * where it stood then: nowhere. Every target is asked again once the browser has drawn it in
	 * its new place, and again when it leaves.
	 */
	function holds_element(holder: HTMLElement, element: HTMLElement) {
		const built_in = element.parentNode;
		holder.append(element);
		hits.defer_recalibrate();
		return {
			destroy() {
				if (element.parentNode === holder) {
					if (built_in) { built_in.appendChild(element); } else { holder.removeChild(element); }
				}
				hits.defer_recalibrate();
			},
		};
	}
	const fillet_tr = $derived(`M ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 0 Z`);
	const fillet_tl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 1 0 ${r} L 0 0 Z`);
	const fillet_br = $derived(`M ${r} 0 A ${r} ${r} 0 0 1 0 ${-r} L 0 0 Z`);
	const fillet_bl = $derived(`M ${-r} 0 A ${r} ${r} 0 0 0 0 ${-r} L 0 0 Z`);

</script>

<!-- Whatever the caller built, each standing where it asked to: hard against the left end,
     centered, or hard against the right. Its own background masks the line behind it. -->
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
		style:--overhang='0px'
		style:width={spacer ? undefined : `${line_thickness}px`}>
		<svg viewBox='{-r} 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:{-r}px; top:0; pointer-events:none'>
			<path d={fillet_tl} fill={fill} />
		</svg>
		<svg viewBox='0 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:100%; top:0; pointer-events:none'>
			<path d={fillet_tr} fill={fill} />
		</svg>
		<svg viewBox='{-r} {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:{-r}px; bottom:0; pointer-events:none'>
			<path d={fillet_bl} fill={fill} />
		</svg>
		<svg viewBox='0 {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:100%; bottom:0; pointer-events:none'>
			<path d={fillet_br} fill={fill} />
		</svg>
		{#if !spacer}{@render given_things()}{/if}
	</div>
{:else}
	<div
		style:z-index={z_layer}
		class='separator horizontal'
		style:height='{line_thickness}px'
		style:margin='0 -{extra_length}px'
		style:--overhang='{extra_length}px'
		style:width='calc(100% + {extra_length * 2}px)'>
		<svg viewBox='0 {-r} {r} {r}' width={r} height={r}
			style='position:absolute; left:0; top:{-r}px; pointer-events:none'>
			<path d={fillet_br} fill={fill} />
		</svg>
		<svg viewBox='0 0 {r} {r}' width={r} height={r}
			style='position:absolute; left:0; bottom:{-r}px; pointer-events:none'>
			<path d={fillet_tr} fill={fill} />
		</svg>
		<svg viewBox='{-r} {-r} {r} {r}' width={r} height={r}
			style='position:absolute; right:0; top:{-r}px; pointer-events:none'>
			<path d={fillet_bl} fill={fill} />
		</svg>
		<svg viewBox='{-r} 0 {r} {r}' width={r} height={r}
			style='position:absolute; right:0; bottom:{-r}px; pointer-events:none'>
			<path d={fillet_tl} fill={fill} />
		</svg>
		{@render given_things()}
	</div>
{/if}

<style>
	.separator {
		flex-shrink : 0;
		overflow    : visible;
		position    : relative;
		background  : var(--accent);
	}

	/* Something the caller built, standing on the line at the end or middle it asked for. The
	   page-colored background masks the line behind it, so it reads as breaking the divider. It
	   carries no look of its own: how it is drawn belongs to whoever built it.

	   The mask is a pill, the same shape as whatever stands in it — a square one leaves the line's
	   cut ends showing past the curve at top and bottom, or stops short of it in the middle. */
	.placed {
		transform     : translateY(-50%);
		border-radius : var(--r-common);
		background    : var(--bg);
		position      : absolute;
		align-items   : center;
		display       : flex;
		top           : 50%;
	}

	/* The two ends are measured from the line's own edges, and the line reaches past whatever holds
	   it by its own overhang at each end — so that overhang comes back off here, or a thing at an
	   end stands outside the box and is cut off by it. */
	.placed.left   { left  : calc(var(--l-gap-large) + var(--overhang)); }
	.placed.center { left  : 50%; transform : translate(-50%, -50%); }
	.placed.right  { right : calc(var(--l-gap) + var(--overhang)); }

	.vertical {
		align-self : stretch;
	}

	.vertical.spacer {
		min-width : 0;
		flex      : 1 1 0px;
	}

	.vertical.spacer:first-child {
		margin-left  : calc(-1 * var(--l-padding));
		padding-left : var(--l-padding);
	}

	.vertical.spacer:last-child {
		margin-right  : calc(-1 * var(--l-padding));
		padding-right : var(--l-padding);
	}
</style>
