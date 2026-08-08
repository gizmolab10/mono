<script lang='ts'>
	import { w_status, hide_status, show_status_as_report } from '../../ts/managers/Status';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// One line of words along the bottom of the window: what just happened, or what went
	// wrong. It stays until the cross at its top right corner takes it away.
	const crossPath = svg_paths.x_cross(k.size.normal, k.size.normal / 6);

	// Some things have too much to say for the bottom of a window. How much is too much can
	// only be known once the words are drawn and wrapped, so it is measured rather than
	// guessed: past three lines they are handed to the report, which has the whole box.
	const MOST_LINES = 3;
	let words_element = $state<HTMLElement | null>(null);

	$effect(() => {
		$w_status;                            // measure again whenever the words change
		const el = words_element;
		if (!el) { return; }
		requestAnimationFrame(() => {
			if (!el) { return; }
			const one_line = parseFloat(getComputedStyle(el).lineHeight) || k.height.normal;
			const lines = Math.round(el.scrollHeight / one_line);
			if (lines > MOST_LINES) {
				debug.log(`Status line: the words run to ${lines} lines, more than the ${MOST_LINES} that fit — handing them to the report.`);
				show_status_as_report();
			}
		});
	});
</script>

<div class='status'>
	<span class='status-words' bind:this={words_element}>{$w_status}</span>
	<button class='status-close' aria-label='dismiss' use:tip={'dismiss this'} onclick={hide_status}>
		<svg class='status-cross' viewBox='0 0 {k.size.normal} {k.size.normal}'>
			<path d={crossPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' />
		</svg>
	</button>
</div>

<style>
	/* The whole width, the words centered in it, the cross pinned to the top left corner so
	   it stays put however many lines the words run to. The room it needs is held back on
	   both sides, so the words stay centered on the line rather than the space left over. */
	.status {
		background    : var(--bg);
		border-radius : var(--radius-tiny);
		padding       : var(--gap-tiny) calc(var(--size-small) + var(--gap) * 2);
		/* Tall enough that the cross, sitting a gap down from the top, keeps a gap below it. */
		min-height    : calc(var(--height) + var(--gap) * 2);
		box-sizing    : border-box;
		align-items   : center;
		position      : relative;
		display       : flex;
		width         : 100%;
	}

	.status-words {
		font-size  : var(--font-tiny);
		color      : var(--text);
		text-align : center;
		flex       : 1 1 auto;
		min-width  : 0;
	}

	.status-close {
		border          : 0.5px solid var(--black);
		border-radius   : var(--radius-percent);
		height          : var(--height);
		width           : var(--height);
		box-sizing      : border-box;
		background      : transparent;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		position        : absolute;
		display         : flex;
		padding         : 0;
		left            : var(--gap);
		top             : var(--gap);
	}

	.status-close:hover {
		background : var(--hover);
	}

	.status-cross {
		width   : var(--size-small);
		height  : var(--size-small);
		display : block;
	}

	.status-cross path {
		stroke : var(--black);
	}
</style>
