<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { w_operation } from '../../ts/managers/Operations';
	import { T_Operation } from '../../ts/common/Enumerations';

	// The fixed top-left control cluster: the details-toggle icon plus the operation
	// segments beside it. `onAccent` colors the icon light for the accent-filled
	// details banner, otherwise black over the content. The click is passed in —
	// the show-details state is a single store the frame owns.
	let { onAccent = false, onclick }: { onAccent?: boolean; onclick: () => void } = $props();

	const hamburgerPath = svg_paths.hamburger(35);

	// The operations as [name, value] pairs: the label is the name (browse), the
	// stored and compared value is the enum's letter.
	const operations = Object.entries(T_Operation) as [string, T_Operation][];
</script>

<button class='hamburger-button' class:on-accent={onAccent} {onclick} aria-label='toggle details'>
	<svg class='hamburger-icon' viewBox='0 0 33 33' width='33' height='33'>
		<path d={hamburgerPath} />
	</svg>
</button>

<div class='mode-control'>
	{#each operations as [name, op]}
		<button
			class='segment'
			class:current={$w_operation === op}
			onclick={() => {
				const wasCurrent = $w_operation === op;
				w_operation.set(wasCurrent ? null : op);
				console.log(wasCurrent
					? `Operation: ${name} was on, clicked again — cleared, showing arrival.`
					: `Operation: switched to ${name}.`);
			}}>{name}</button>
	{/each}
</div>

<style>
	.hamburger-button {
		color           : black;
		background      : transparent;
		cursor          : pointer;
		padding         : 2px 6px;
		align-items     : center;
		justify-content : center;
		position        : fixed;
		border-radius   : 10px;
		display         : flex;
		border          : none;
		left            : 8px;
		top             : 8px;
		z-index         : 5;
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
	.mode-control {
		position      : fixed;
		top           : 17px;
		left          : 56px;
		z-index       : 5;
		display       : flex;
		background    : var(--bg);
		border        : 1px solid black;
		border-radius : 999px;
		overflow      : hidden;
		font-size     : 13px;
	}

	.segment {
		background : transparent;
		color      : var(--text);
		border     : none;
		cursor     : pointer;
		padding    : 2px 10px;
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
