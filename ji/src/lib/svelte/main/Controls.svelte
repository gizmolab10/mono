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

	const hamburgerPath = svg_paths.hamburger(k.width.hamburger);

	// The operations as [name, value] pairs: the label is the name (browse), the
	// stored and compared value is the enum's letter.
	const operations = Object.entries(T_Operation) as [string, T_Operation][];
</script>

<button class='hamburger-button layer-controls' class:on-accent={onAccent} {onclick} aria-label='toggle details'>
	<svg class='hamburger-icon' viewBox='0 0 33 33' width='33' height='33'>
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
		background      : transparent;
		cursor          : pointer;
		padding         : 2px 6px;
		align-items     : center;
		justify-content : center;
		color           : black;
		position        : fixed;
		border-radius   : var(--radius-banner);
		display         : flex;
		border          : none;
		left            : 8px;
		top             : 8px;
	}

	.hamburger-button.on-accent {
		color : var(--text-on-accent);
	}

	.hamburger-icon {
		overflow : visible;
	}

	.hamburger-button .hamburger-icon path {
		fill         : currentColor;
		stroke       : black;
		stroke-width : 0.5px;
	}

	.hamburger-button:hover .hamburger-icon path {
		fill : var(--hover);
	}

	/* One pill with a segment per operation; the current segment fills --accent.
	   Fixed beside the hamburger, so the cluster reads the same in both states. */
	.operation {
		border        : 1px solid black;
		background    : var(--bg);
		overflow      : hidden;
		position      : fixed;
		border-radius : var(--radius-pill);
		height        : var(--h-pill);
		top           : 17px;
		left          : 56px;
		font-size     : 13px;
		display       : flex;
	}

	.segment {
		background : transparent;
		color      : var(--text);
		padding    : 2px 10px;
		cursor     : pointer;
		border     : none;
	}

	.segment:not(:last-child) {
		border-right : 1px solid black;
	}

	.segment.current {
		background : var(--accent);
	}

	.segment:hover {
		background : var(--hover);
	}
</style>
