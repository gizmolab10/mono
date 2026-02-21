<script lang='ts'>
	let { title }: { title: string } = $props();
</script>

<span class='title'>{title}</span>

<style>
	.title {
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}
</style>
