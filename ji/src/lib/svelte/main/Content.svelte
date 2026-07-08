<script lang='ts'>
	import buildsRaw from '../../md/builds.md?raw';

	// Shared with the layout frame so it can hide the regions while the popup shows.
	let { showBuildNotes = $bindable(false) }: { showBuildNotes?: boolean } = $props();

	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter(l => /^\|\s*\d+/.test(l))
		.map(l => parseInt(l.split('|')[1].trim())));
</script>

<div class='content-body'>
	<div class='centered'>
		<div>Intersection</div>
		<div>Hey, bro!</div>
	</div>

	<button
		class='build-opener'
		onclick={() => { showBuildNotes = true; console.log(`Build notes: opener clicked, current build is ${buildNumber}.`); }}>
		Build {buildNumber}
	</button>
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
		display         : flex;
	}

	.build-opener {
		border: 1px solid black;
		border-radius: 999px;
		padding: 2px 10px;
		background: white;
		position: absolute;
		font-size: 13px;
		cursor: pointer;
		color: #888;
		bottom: 12px;
		left: 16px;
	}

	.build-opener:hover {
		background: var(--hover);
	}
</style>
