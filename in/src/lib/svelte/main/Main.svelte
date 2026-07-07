<script lang='ts'>
	import BuildNotes from './BuildNotes.svelte';
	import buildsRaw from '../../md/builds.md?raw';

	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => parseInt(l.split('|')[1].trim())));
	let showBuildNotes = $state(false);
</script>

<div class="centered">
	<div>Intersection</div>
	<div>Hey, bro!</div>
</div>

<button
	class="build-opener"
	onclick={() => { showBuildNotes = true; console.log(`Build notes: opener clicked, current build is ${buildNumber}.`); }}>
	Build {buildNumber}
</button>

{#if showBuildNotes}
	<div
		class="build-backdrop"
		role="button"
		tabindex="-1"
		onclick={() => showBuildNotes = false}
		onkeyup={() => {}}>
		<BuildNotes onclose={() => showBuildNotes = false} />
	</div>
{/if}

<style>
	.centered {
		justify-content: center;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		font-size: 5em;
		display: flex;
	}

	.build-opener {
		border: 1px solid black;
		border-radius: 999px;
		padding: 2px 10px;
		background: none;
		position: fixed;
		font-size: 13px;
		cursor: pointer;
		color: #888;
		bottom: 12px;
		left: 16px;
	}

	.build-backdrop {
		background: color-mix(in srgb, #000 40%, transparent);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		z-index: 10;
		inset: 0;
	}
</style>
