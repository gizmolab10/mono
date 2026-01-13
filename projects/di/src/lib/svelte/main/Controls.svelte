<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	const { w_text_color, w_background_color } = colors;

	let {
		title = 'Design Intuition'
	} : {
		title? : string;
	} = $props();
</script>

<div
	class            = 'controls'
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	<h1>{title}</h1>
</div>

<style>
	.controls {
		width       : 100%;
		height      : 100%;
		display     : flex;
		padding     : 0 1rem;
		align-items : center;
		box-sizing  : border-box;
	}

	.controls h1 {
		margin      : 0;
		font-size   : 1.25rem;
		font-weight : 300;
	}
</style>
