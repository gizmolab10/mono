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
	}
</script>

<div class='color-row'>
	<div class='color-group'>
		<span class='label'>accent</span>
		<label class='picker'>
			<input class='accent' type='color' value={$w_accent_color} oninput={pick} />
		</label>
	</div>
</div>

<style>
	.color-row {
		align-items : center;
		display     : flex;
		gap         : var(--gap-preferences);
	}

	.color-group {
		align-items : center;
		display     : flex;
		gap         : var(--gap);
	}

	.label {
		font-size : var(--font-label);
		opacity   : var(--opacity-label);
	}

	/* The visible button is this circle — we own its color fully. */
	.picker {
		border-radius : var(--radius-percent);
		border        : var(--thickness-normal) solid var(--black);
		background    : var(--accent);
		box-sizing    : border-box;
		position      : relative;
		cursor        : pointer;
		overflow      : hidden;
		width         : var(--size-button);
		height        : var(--size-button);
	}

	.picker:hover {
		background : var(--hover);
	}

	/* The real color input lies invisibly on top: it catches the click to open
	   the native picker, but shows nothing — so there is no browser swatch to
	   fight, and the circle above is the only thing seen. */
	.accent {
		position : absolute;
		cursor   : pointer;
		width    : 100%;
		height   : 100%;
		border   : none;
		inset    : 0;
		padding  : 0;
		margin   : 0;
		opacity  : 0;
	}
</style>
