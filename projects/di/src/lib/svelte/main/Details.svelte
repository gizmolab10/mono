<script lang='ts'>
	import { colors } from '../../ts/draw/Colors';
	const { w_text_color, w_background_color } = colors;
</script>

<div
	class            = 'details'
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	<h2>Details</h2>
	<p>Properties panel placeholder</p>
</div>

<style>
	.details {
		width      : 100%;
		height     : 100%;
		padding    : 1rem;
		box-sizing : border-box;
	}

	.details h2 {
		margin      : 0 0 1rem;
		font-size   : 1rem;
		font-weight : 500;
	}

	.details p {
		margin    : 0;
		opacity   : 0.6;
		font-size : 0.875rem;
	}
</style>
