<script lang="ts">
	import { FatTriangle, Direction } from '../common/GlobalImports';

	interface Props {
		size?: number;
		width?: any;
		height?: any;
		direction?: any;
	}

	let {
		size = 18,
		width = size,
		height = size,
		direction = Direction.left
	}: Props = $props();
	const fatTriangle = new FatTriangle(size, direction);
	const path = fatTriangle.path;

	// function handleClick() {
	//	 alert('Button clicked!');
	// }
	
	// on:click={handleClick}
	// .button-triangle:hover {
	//	 fill: red;
	// }

	// .button-triangle:active {
	//	 fill: orange;
	// }

</script>

<svg {width} {height} viewBox="0 0 {width} {height}">
	<path class="button-triangle" d={path} />
</svg>

<style>
	svg {
		display: block;
	}

	.button-triangle {
		fill: white;
		stroke: blue;
		stroke-width: 0.5;
		transition: fill 0.2s;
	}

</style>