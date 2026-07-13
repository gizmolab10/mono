<script lang='ts'>
	import { w_operation } from '../../ts/managers/Operations';
	import { T_Operation } from '../../ts/common/Enumerations';
	import buildsRaw from '../../md/builds.md?raw';
	import Add from '../operations/Add.svelte';
	import Browse from '../operations/Browse.svelte';

	// Shared with the layout frame so it can hide the regions while the popup shows.
	let { showBuildNotes = $bindable(false) }: { showBuildNotes?: boolean } = $props();

	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => parseInt(l.split('|')[1].trim())));
</script>

<div class='content-body'>
	{#if $w_operation === T_Operation.add}
		<Add />
	{:else if $w_operation === T_Operation.browse}
		<Browse />
	{:else}
		<div class='centered'>
			<div>Intersection</div>
		</div>

		<div class='corner-stack'>
			<button
				class='build-opener'
				onclick={() => { showBuildNotes = true;  (`Build notes: opener clicked, current build is ${buildNumber}.`); }}>
				Build {buildNumber}
			</button>

			<a
				class='author-credit'
				href='https://designintuition.app'
				target='_blank'
				rel='noopener' >
				built by: jonathan sand
			</a>
		</div>
	{/if}
</div>

<style>
	.content-body {
		position : relative;
		height   : 100%;
		width    : 100%;
	}

	.centered {
		font-size       : var(--font-hero);
		color           : var(--text);
		justify-content : center;
		flex-direction  : column;
		align-items     : center;
		height          : 100%;
		display         : flex;
	}

	.build-opener {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--gray);
		cursor        : pointer;
	}

	.build-opener:hover {
		background: var(--hover);
	}

	.corner-stack {
		bottom          : var(--inset-credit-bottom);
		left            : var(--inset-credit-left);
		gap             : var(--gap-tight);
		align-items     : flex-start;
		position        : absolute;
		flex-direction  : column;
		display         : flex;
	}

	.author-credit {
		font-size       : var(--font-credit);
		color           : var(--text);
		text-decoration : underline;
		cursor          : pointer;
	}

	.author-credit:hover {
		color           : var(--hover);
	}
</style>
