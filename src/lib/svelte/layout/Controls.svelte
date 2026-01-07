<script lang="ts">
	let {
		title = 'Design Intuition'
	}: {
		title?: string;
	} = $props();
</script>

<div class="controls">
	<h1>{title}</h1>
</div>

<style>
	.controls {
		display: flex;
		align-items: center;
		padding: 0 1rem;
		height: 100%;
	}

	.controls h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 300;
	}
</style>
