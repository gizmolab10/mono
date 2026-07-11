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
				onclick={() => { showBuildNotes = true; console.log(`Build notes: opener clicked, current build is ${buildNumber}.`); }}>
				Build {buildNumber}
			</button>

			<a
				class='author-credit'
				href='https://jonathansand.me'
				target='_blank'
				rel='noopener'
				onclick={() => console.log('Author credit clicked — opening jonathansand.me.')}>
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
		font-size       : 8em;
		color           : var(--text);
		display         : flex;
	}

	.build-opener {
		border: 1px solid black;
		border-radius: 999px;
		padding: 2px 10px;
		background: white;
		font-size: 13px;
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
		bottom          : 12px;
		left            : 16px;
		display         : flex;
		gap             : 4px;
	}

	.author-credit {
		color           : var(--accent);
		text-decoration : underline;
		cursor          : pointer;
		font-size       : 8.6px;
	}

	.author-credit:hover {
		color           : var(--hover);
	}
</style>
