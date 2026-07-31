<script lang='ts'>
	// The accent color picker. Choosing an accent drives Colors' subscribers, which
	// re-push the page color, the hover color and the text color onto the page.
	import { colors } from '../../ts/utilities/Colors';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';

	const { w_accent_color } = colors;

	// True while the native color picker is open, so its hover hint is hushed until it closes. There's
	// no "picker open" event, so track it: it opens on the swatch's click and closes on change or blur.
	let picking = $state(false);
	function open_picker()  { picking = true; }
	function close_picker() { picking = false; }

	// The picked color is brightened when it is too dark to read against — anything
	// dimmer than the floor below is lifted to it, hue kept.
	const DARKEST_ALLOWED = 0.2;

	function pick(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const clamped = colors.clamp_luminance(raw, DARKEST_ALLOWED);
		const brightness = colors.luminance_ofColor(raw);
		debug.log(`Accent picked: ${raw}, brightness ${brightness.toFixed(3)} against a floor of ${DARKEST_ALLOWED} — ${clamped === raw ? 'bright enough, kept as is' : `too dark, lifted to ${clamped}`}.`);
		w_accent_color.set(clamped);
	}
</script>

<div class='color-row'>
	<div class='color-group'>
		<span class='label'>accent</span>
		<label class='picker' class:picking use:tip={picking ? false : 'pick the accent color'}>
			<input class='accent' type='color' value={$w_accent_color} oninput={pick} onclick={open_picker} onchange={close_picker} onblur={close_picker} />
		</label>
	</div>
</div>

<style>
	.color-row {
		align-items : center;
		display     : flex;
		gap         : var(--gap-fat);
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
		width         : var(--height-control);
		height        : var(--height-control);
	}

	/* No hover light while the picker is open. */
	.picker:not(.picking):hover {
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
