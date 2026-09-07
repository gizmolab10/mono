<script lang='ts'>
	export let text = 'If you can read this, your TextBox needs its text set.';
</script>

<div class="container">
	<div class="text-box">
		{@html text}
	</div>
</div>

<style>
	b {
		font-weight: normal;
		color: blue;
	}
	.container {
		justify-content: center;
		align-items: center;
		display: flex;
		height: 100h;
	}

	.text-box {
		border: 1px solid #333;
		border-radius: 7px;
		text-align: center;
		color: '#e4f6c9';
		padding: 5px;
		width: 97%;
	}
</style>
