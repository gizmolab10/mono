<script lang='ts'>
	export let color: string;
	export let left: number;
	export let top: number = 5;
</script>

<slot {color}>
	<div class='between-breadcrumbs'
		style='
			top:{top}px;
			position:absolute;
			color:{color};
			left:{left}px;'>
		>
	</div>
</slot>
