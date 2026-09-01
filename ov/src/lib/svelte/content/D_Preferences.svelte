<script lang='ts'>
	// The two colors that are chosen: the accent, and the page behind everything. Each drives
	// Colors' subscribers, which re-work the hover color, the text color and the rest.
	import { colors } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';

	const { w_accent_color, w_background_color } = colors;

	// True while the native picker is open, so its hover hint is hushed until it closes. There's
	// no "picker open" event, so track it: it opens on the swatch's click and closes on change or
	// blur. One name per picker, since either can be the one open.
	let picking = $state('');
	function open_picker(which: string)  { picking = which; }
	function close_picker() { picking = ''; }

	// A picked color is brightened when it is too dark to read against — anything
	// dimmer than the floor below is lifted to it, hue kept.
	const DARKEST_ALLOWED = 0.2;

	function pick(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const clamped = colors.clamp_luminance(raw, DARKEST_ALLOWED);
		const brightness = colors.luminance_ofColor(raw);
		debug.log(`Accent picked: ${raw}, brightness ${brightness.toFixed(3)} against a floor of ${DARKEST_ALLOWED} — ${clamped === raw ? 'bright enough, kept as is' : `too dark, lifted to ${clamped}`}.`);
		w_accent_color.set(clamped);
	}

	// The page color takes whatever is picked, with no floor: it is what everything else is read
	// against, and the text flips to white on a dark one, so a dark page is a real choice.
	function pick_background(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		debug.log(`Page color picked: ${raw}, brightness ${colors.luminance_ofColor(raw).toFixed(3)} — the text follows it.`);
		w_background_color.set(raw);
	}
</script>

<div class='color-row'>
	<div class='color-group'>
		<span class='label'>accent</span>
		<!-- The field itself is out of sight; this is what is seen and pointed at, so this is what
		     the manager is told about. The press opens the browser's own picker, which only a real
		     press on the field can do — so that stays where it is. -->
		<label class='picker accent-face' class:picking={picking === 'accent'}
			use:hit_target={{ id: 'details.color.accent',
				tip: picking === '' ? 'pick the accent color' : null }}>
			<input class='hidden-input' type='color' value={$w_accent_color} oninput={pick}
				onclick={() => open_picker('accent')} onchange={close_picker} onblur={close_picker} />
		</label>
	</div>
	<div class='color-group'>
		<span class='label'>page</span>
		<label class='picker page-face' class:picking={picking === 'page'}
			use:hit_target={{ id: 'details.color.page',
				tip: picking === '' ? 'pick the color behind everything' : null }}>
			<input class='hidden-input' type='color' value={$w_background_color} oninput={pick_background}
				onclick={() => open_picker('page')} onchange={close_picker} onblur={close_picker} />
		</label>
	</div>
</div>

<style>
	/* The row sits in the middle of the details column. */
	.color-row {
		justify-content : center;
		align-items     : center;
		display         : flex;
		gap             : var(--gap-fat);
	}

	.color-group {
		align-items : center;
		display     : flex;
		gap         : var(--gap);
	}

	.label {
		font-size : var(-font-control);
		opacity   : var(--opacity-label);
	}

	/* The visible button is this circle — we own its color fully. Each one wears the color it
	   picks, so the two read as what they are. */
	.picker {
		border-radius : var(--radius-percent);
		border        : var(--thick) solid var(--black);
		box-sizing    : border-box;
		position      : relative;
		cursor        : pointer;
		overflow      : hidden;
		width         : var(--height);
		height        : var(--height);
	}

	.accent-face { background : var(--accent); }
	.page-face   { background : var(--bg); }

	/* No hover light while a picker is open. */
	.picker:not(.picking):hover {
		background : var(--hover);
	}

	/* The real color input lies invisibly on top: it catches the click to open
	   the native picker, but shows nothing — so there is no browser swatch to
	   fight, and the circle above is the only thing seen. */
	.hidden-input {
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
