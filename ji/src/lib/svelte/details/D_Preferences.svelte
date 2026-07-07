<script lang='ts'>
	// Trimmed port of di's D_Preferences: just the accent color picker, wired to
	// the ported Colors. Choosing an accent drives Colors' subscribers, which
	// re-push --bg / --accent / --hover onto the page.
	import { colors } from '../../ts/utilities/Colors';

	const { w_accent_color } = colors;

	function pick(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const clamped = colors.clamp_luminance(raw, 0.2);
		w_accent_color.set(clamped);
		console.log(`Accent picker: chose ${raw}, clamped to ${clamped}.`);
	}
</script>

<div class='color-row'>
	<div class='color-group'>
		<span class='label'>accent</span>
		<input type='color' value={$w_accent_color} oninput={pick} />
	</div>
</div>

<style>
	.color-row {
		align-items : center;
		display     : flex;
		gap         : 16px;
	}

	.color-group {
		align-items : center;
		display     : flex;
		gap         : 8px;
	}

	.label {
		font-size : 12px;
		opacity   : 0.8;
	}

	.color-group input[type='color'] {
		border             : 1px solid currentColor;
		width              : 28px;
		height             : 28px;
		cursor             : pointer;
		appearance         : none;
		-webkit-appearance : none;
		background         : none;
		border-radius      : 50%;
		padding            : 0;
	}

	.color-group input[type='color']::-webkit-color-swatch-wrapper {
		padding : 0;
	}

	.color-group input[type='color']::-webkit-color-swatch {
		border        : none;
		border-radius : 50%;
	}

	.color-group input[type='color']::-moz-color-swatch {
		border        : none;
		border-radius : 50%;
	}
</style>
