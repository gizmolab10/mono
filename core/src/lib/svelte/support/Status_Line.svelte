<script lang='ts'>
	import { svg_paths } from '../../ts/utilities';
	import { hit_target } from '../../ts/events';
	import { debug } from '../../ts/common';
	import { k } from '../../ts/common';

	// One line of words along the bottom of the window: what just happened, or what went
	// wrong. It stays until the cross at its top right corner takes it away. The words, the
	// offer and what each press does all come from the host — core keeps no state of its own.
	let { status, offer = null, ontake, onhide, onreport }: {
		status   : string;                        // the words along the bottom
		offer    : { says: string } | null;       // a press the words are offering, if any
		ontake   : () => void;                    // take the offer
		onhide   : () => void;                    // dismiss the line
		onreport : () => void;                    // the words outgrew the line — hand them to the report
	} = $props();

	const crossPath = svg_paths.x_cross(k.size.normal, k.size.normal / 6);

	// Some things have too much to say for the bottom of a window. How much is too much can
	// only be known once the words are drawn and wrapped, so it is measured rather than
	// guessed: past three lines they are handed to the report, which has the whole box.
	const MOST_LINES = 3;
	let words_element = $state<HTMLElement | null>(null);

	// While an offer is up, Return takes it — the same as pressing the button. A press that lands
	// in a field or in the box editing a piece belongs to whatever is being typed, so it is left
	// alone; only a press with nothing being typed answers here.
	function on_key(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !offer) { return; }
		const at = document.activeElement as HTMLElement | null;
		const typing = at !== null && (at.isContentEditable
			|| ['input', 'textarea', 'select'].includes(at.tagName.toLowerCase()));
		if (typing) { return; }
		event.preventDefault();
		debug.log(`Status line: Return taken as "${offer.says}".`);
		ontake();
	}

	$effect(() => {
		window.addEventListener('keydown', on_key);
		return () => window.removeEventListener('keydown', on_key);
	});

	$effect(() => {
		status;                            // measure again whenever the words change
		const el = words_element;
		if (!el) { return; }
		requestAnimationFrame(() => {
			if (!el) { return; }
			const one_line = parseFloat(getComputedStyle(el).lineHeight) || k.height.normal;
			const lines = Math.round(el.scrollHeight / one_line);
			if (lines > MOST_LINES) {
				debug.log(`Status line: the words run to ${lines} lines, more than the ${MOST_LINES} that fit — handing them to the report.`);
				onreport();
			}
		});
	});
</script>

<div class='status'>
	<span class='status-words' bind:this={words_element}>{status}</span>
	<!-- Something the app will do only if asked. Dismissing the line is the answer "no". -->
	{#if offer}
		<button class='status-offer'
			use:hit_target={{ id: 'status.offer', onpress: ontake, tip: 'do this' }}>{offer.says}</button>
	{/if}
	<button class='status-close' aria-label='dismiss'
		use:hit_target={{ id: 'status.close', onpress: onhide,
			tip: offer ? 'leave it as it is' : 'dismiss this' }}>
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

	/* What the app will do if asked, standing after the words. It reads at the words' own size,
	   so the line is one thing rather than a sentence with a control stuck on it. */
	.status-offer {
		border        : 0.5px solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-tiny);
		padding       : 0 var(--gap);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		font-family   : inherit;
		white-space   : nowrap;
		margin-left   : var(--gap);
		cursor        : pointer;
		flex          : 0 0 auto;
	}

	.status-offer:global([data-hit]) {
		background : var(--hover);
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

	.status-close:global([data-hit]) {
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
