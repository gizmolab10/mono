<script lang='ts'>
	import { T_Operation } from '../../ts/common/Enumerations';
	import { w_operation } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';

	// The fixed top-left control cluster: the details-toggle icon plus the operation
	// segments beside it. `onAccent` colors the icon light for the accent-filled
	// details banner, otherwise black over the content. The click is passed in —
	// the show-details state is a single store the frame owns.
	let { onAccent = false, onclick }: { onAccent?: boolean; onclick: () => void } = $props();
	const size = k.size.hamburger;
	const hamburgerPath = svg_paths.hamburger(size);

	// The operations as [name, value] pairs: the label is the name (browse), the
	// stored and compared value is the enum's letter.
	const operations = Object.entries(T_Operation) as [string, T_Operation][];
</script>

<button class='hamburger-button layer-controls' class:on-accent={onAccent} {onclick} aria-label='toggle details'>
	<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
		<path d={hamburgerPath} />
	</svg>
</button>

<div class='operation layer-controls'>
	{#each operations as [name, op]}
		<button
			class='segment'
			class:current={$w_operation === op}
			onclick={() => {
				const wasCurrent = $w_operation === op;
				w_operation.set(wasCurrent ? null : op);
			}}>{name}</button>
	{/each}
</div>

<style>
	.hamburger-button {
		border-radius   : var(--radius-banner);
		left            : var(--inset-cluster);
		top             : var(--inset-cluster);
		background      : transparent;
		cursor          : pointer;
		padding         : var(--pad-hamburger);
		align-items     : center;
		justify-content : center;
		color           : var(--black);
		position        : fixed;
		display         : flex;
		border          : none;
	}

	.hamburger-button.on-accent {
		color : var(--text-on-accent);
	}

	.hamburger-button .hamburger-icon path {
		fill         : currentColor;
		stroke       : var(--black);
		stroke-width : var(--thickness-faint);
	}

	.hamburger-button:hover .hamburger-icon path {
		fill : var(--hover);
	}

	/* One pill with a segment per operation; the current segment fills --accent.
	   Fixed beside the hamburger, so the cluster reads the same in both states. */
	.operation {
		left          : var(--inset-pill-left);
		top           : var(--inset-pill-top);
		border-radius : var(--radius-pill);
		font-size     : var(--font-base);
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		background    : var(--white);
		overflow      : hidden;
		position      : fixed;
		display       : flex;
	}

	.segment {
		background : transparent;
		color      : var(--text);
		padding    : var(--pad-control);
		cursor     : pointer;
		border     : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.segment.current {
		background : var(--accent);
	}

	.segment:hover {
		background : var(--hover);
	}
</style>
