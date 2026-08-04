<script lang='ts'>
	// The accent color picker. Choosing an accent drives Colors' subscribers, which
	// re-push the page color, the hover color and the text color onto the page.
	import { w_purposes, toggle_purpose } from '../../ts/managers/Filters';
	import Separator from '../support/Separator.svelte';
	import { show_status } from '../../ts/managers/Status';
	import { colors } from '../../ts/utilities/Colors';
	import { T_Purpose } from '../../ts/types/Guide';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { get } from 'svelte/store';

	const { w_accent_color } = colors;

	// The two purposes: how to work, and how a thing was built.
	const PURPOSES = Object.values(T_Purpose);

	function choose_purpose(which: T_Purpose) {
		const done = toggle_purpose(which);
		debug.log(done
			? `Showing: "${which}" was turned ${get(w_purposes).includes(which) ? 'on' : 'off'}.`
			: `Showing: "${which}" is the only one left on, so it stays.`);
		if (!done) { show_status(`${which} is the only one showing — at least one must stay on`); }
	}

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

<div class='divide'><Separator title={'show'}/></div>

<!-- Which purposes the list shows. Both can be on at once; the last one on cannot be turned
     off, since a list that can go blank for no visible reason is a trap. -->
<div class='color-row'>
	<div class='color-group'>
		<div class='purposes'>
			{#each PURPOSES as one}
				{@const asleep = one === T_Purpose.work}
				<button class='segment' class:current={$w_purposes.includes(one)} class:asleep
					use:tip={asleep ? 'work notes are not swept yet' : $w_purposes.includes(one) ? `stop showing ${one}` : `also show ${one}`}
					onclick={() => { if (!asleep) { choose_purpose(one); } }}>{one}</button>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Both rows sit in the middle of the details column. */
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
		font-size : var(--font-label);
		opacity   : var(--opacity-label);
	}

	/* The titled line between the color and the purposes. */
	.divide {
		margin : var(--gap) 0;
	}

	/* One pill with a segment per purpose; every one that is on fills with the accent. */
	.purposes {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		background    : var(--white);
		box-sizing    : border-box;
		align-self    : center;
		overflow      : hidden;
		display       : flex;
		flex-shrink   : 0;
	}

	.segment {
		padding     : var(--pad-control);
		background  : transparent;
		color       : var(--text);
		cursor      : pointer;
		white-space : nowrap;
		border      : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.segment.current {
		color      : var(--text-on-accent);
		background : var(--accent);
	}

	.segment:not(.current):not(.asleep):hover {
		background : var(--hover);
	}

	/* Nothing sweeps the work notes yet, so this one is shown but dead to the touch. */
	.segment.asleep {
		color  : var(--gray);
		cursor : default;
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
