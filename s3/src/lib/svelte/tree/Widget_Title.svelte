<script lang='ts'>
	let { title, left }: { title: string; left: number } = $props();
</script>

<span class='title' style:margin-left='{left}px'>{title}</span>

<style>
	.title {
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}
</style>
