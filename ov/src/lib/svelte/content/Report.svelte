<script lang='ts'>
	import { w_status, w_findings, hide_status, type Finding } from '../../ts/managers/Status';
	import { open_view, w_search_for } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Words too many for the one line along the bottom are read here instead, in the whole
	// content box, with room to scroll. The cross at the top left takes them away.
	const crossPath = svg_paths.x_cross(k.size.normal, k.size.normal / 6);

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
		<button class='report-close' aria-label='dismiss'
			use:hit_target={{ id: 'report.close', onpress: hide_status, tip: 'dismiss this report' }}>
			<svg class='report-cross' viewBox='0 0 {k.size.normal} {k.size.normal}'>
				<path d={crossPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' />
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
						<!-- Named by the guide it points at, since a report holds many of these at once. -->
					<button class='finding'
						use:hit_target={{ id: `report.finding.${found.key}`, onpress: () => handleDeadLink(found),
							tip: 'open this guide and light the link' }}>{found.words}</button>
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
		font-size : var(--font-tiny);
		color     : var(--text);
		opacity   : var(--opacity-header);
		position  : relative;
		top       : 1px;
	}

	.report-close {
		border          : var(--thick) solid var(--black);
		border-radius   : var(--radius-percent);
		height          : var(--height);
		width           : var(--height);
		box-sizing      : border-box;
		background      : var(--white);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
		flex            : 0 0 auto;
	}

	.report-close:global([data-hit]) {
		background : var(--hover);
	}

	.report-cross {
		width   : var(--size-small);
		height  : var(--size-small);
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
		gap            : var(--gap-tiny);
	}

	.finding {
		border-radius : var(--radius-tiny);
		padding       : var(--gap-tiny) var(--gap);
		font-size     : var(--font-tiny);
		font-family   : inherit;
		background    : transparent;
		color         : var(--text);
		text-align    : left;
		white-space   : normal;
		border        : none;
		cursor        : pointer;
		width         : 100%;
	}

	.finding:global([data-hit]) {
		background : var(--hover);
	}

	/* One that points nowhere is not a button at all, so nothing stamps it; the rule stays
	   only to say plainly that it takes no fill. */
	.finding.plain {
		background : transparent;
		cursor     : default;
	}

	/* The words themselves, wrapping and scrolling as far as they need. */
	.report-words {
		font-size   : var(--font);
		color       : var(--text);
		white-space : pre-wrap;
		word-break  : break-word;
		overflow-y  : auto;
		flex        : 1;
	}
</style>
