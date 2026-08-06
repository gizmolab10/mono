<script lang='ts'>
	import { w_status, w_findings, hide_status, type Finding } from '../../ts/managers/Status';
	import { open_view, w_search_for } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Words too many for the one line along the bottom are read here instead, in the whole
	// content box, with room to scroll. The cross at the top left takes them away.
	const crossPath = svg_paths.x_cross(k.size.control, k.size.control / 6);

	/**
	 * A dead link picked out of the report: its guide opens with the link's own words lit
	 * where they sit, so the fix can be typed on the spot.
	 */
	function handleDeadLink(found: Finding) {
		if (!found.key || !found.link) { return; }
		w_search_for.set(found.link);
		open_view(found.key);
		debug.log(`Report: opening "${found.key}", with "${found.link}" lit.`);
	}
</script>

<div class='report'>
	<div class='report-head'>
		<button class='report-close' aria-label='dismiss' use:tip={'dismiss this report'} onclick={hide_status}>
			<svg class='report-cross' viewBox='0 0 {k.size.control} {k.size.control}'>
				<path d={crossPath} fill='none' stroke-width={k.size.control / 12} stroke-linecap='round' />
			</svg>
		</button>
		<span class='report-title'>report</span>
	</div>
	<div class='report-words'>
		{$w_status}
		{#if $w_findings.length > 0}
			<div class='findings'>
				{#each $w_findings as found, n (n)}
					{#if found.key && found.link}
						<button class='finding' use:tip={'open this guide and light the link'} onclick={() => handleDeadLink(found)}>{found.words}</button>
					{:else}
						<div class='finding plain'>{found.words}</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.report {
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* The cross at the far left, the word beside it. */
	.report-head {
		padding-bottom : var(--gap);
		align-items    : center;
		display        : flex;
		gap            : var(--gap);
		flex           : 0 0 auto;
	}

	.report-title {
		font-size : var(--font-label);
		color     : var(--text);
		opacity   : var(--opacity-header);
		position  : relative;
		top       : 1px;
	}

	.report-close {
		border          : var(--thickness-normal) solid var(--black);
		border-radius   : var(--radius-percent);
		height          : var(--height-control);
		width           : var(--height-control);
		box-sizing      : border-box;
		background      : var(--white);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
		flex            : 0 0 auto;
	}

	.report-close:hover {
		background : var(--hover);
	}

	.report-cross {
		width   : var(--size-svg);
		height  : var(--size-svg);
		display : block;
	}

	.report-cross path {
		stroke : var(--black);
	}

	/* One row per thing found. A row that names a guide answers to a click; one that doesn't
	   simply reads. */
	.findings {
		flex-direction : column;
		padding-top    : var(--gap);
		display        : flex;
		gap            : var(--gap-tight);
	}

	.finding {
		border-radius : var(--radius-banner);
		padding       : var(--gap-tight) var(--gap);
		font-size     : var(--font-label);
		font-family   : inherit;
		background    : transparent;
		color         : var(--text);
		text-align    : left;
		white-space   : normal;
		border        : none;
		cursor        : pointer;
		width         : 100%;
	}

	.finding:hover {
		background : var(--hover);
	}

	.finding.plain {
		cursor : default;
	}

	.finding.plain:hover {
		background : transparent;
	}

	/* The words themselves, wrapping and scrolling as far as they need. */
	.report-words {
		font-size   : var(--font-base);
		color       : var(--text);
		white-space : pre-wrap;
		word-break  : break-word;
		overflow-y  : auto;
		flex        : 1;
	}
</style>
