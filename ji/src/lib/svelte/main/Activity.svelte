<script lang='ts'>
	import { w_operation } from '../../ts/managers/Operations';
	import { T_Operation } from '../../ts/common/Enumerations';
	import buildsRaw from '../../md/builds.md?raw';
	import Add from '../operations/Add.svelte';

	// Shared with the layout frame so it can hide the regions while the popup shows.
	let { showBuildNotes = $bindable(false) }: { showBuildNotes?: boolean } = $props();

	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => parseInt(l.split('|')[1].trim())));
</script>

<div class='content-body'>
	{#if $w_operation === T_Operation.add}
		<Add />
	{:else}
		<div class='centered'>
			<div>Intersection</div>
			<div>Hey, bro!</div>
		</div>

		<div class='corner-stack'>
			<button
				class='build-opener'
				onclick={() => { showBuildNotes = true;  (`Build notes: opener clicked, current build is ${buildNumber}.`); }}>
				Build {buildNumber}
			</button>

			<a
				class='author-credit'
				href='https://jonathansand.me'
				target='_blank'
				rel='noopener' >
				author: jonathan sand
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
		justify-content : center;
		flex-direction  : column;
		align-items     : center;
		height          : 100%;
		font-size       : var(--font-hero);
		color           : var(--text);
		display         : flex;
	}

	.build-opener {
		border: var(--thickness-normal) solid black;
		border-radius: var(--radius-pill);
		padding: 2px 10px;
		background: white;
		font-size: var(--font-base);
		cursor: pointer;
		color: #888;
	}

	.build-opener:hover {
		background: var(--hover);
	}

	.corner-stack {
		align-items     : flex-start;
		position        : absolute;
		flex-direction  : column;
		bottom          : var(--inset-credit-bottom);
		left            : var(--inset-credit-left);
		display         : flex;
		gap             : var(--gap-tight);
	}

	.author-credit {
		color           : var(--accent);
		text-decoration : underline;
		cursor          : pointer;
		font-size       : var(--font-credit);
	}

	.author-credit:hover {
		color           : var(--hover);
	}
</style>
