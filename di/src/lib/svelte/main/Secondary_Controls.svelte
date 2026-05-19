<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { stores } from '../../ts/managers/Stores';
	import Status_Strip from './Status_Strip.svelte';
	import { k } from '../../ts/common/Constants';
	import Slider from '../mouse/Slider.svelte';
	import { engine } from '../../ts/render';

	let { onshowbuildnotes = () => {} }: { onshowbuildnotes?: () => void } = $props();

	const { w_grid_opacity, w_scale } = stores;

	function handle_zoom_step(smaller: boolean) {
		if (smaller) {
			engine.scale_down();
		} else {
			engine.scale_up();
		}
	}

	function handle_zoom_slide(value: number) {
		w_scale.set(value);
	}
</script>

<div class='band top-band'>
	<Slider min={0.01} max={10000} value={$w_scale} logarithmic fill onchange={handle_zoom_slide} onstep={handle_zoom_step} />
</div>
<div class='band bottom-band'>
	<button class='build-button' use:hit_target={{ id: 'build', onpress: onshowbuildnotes }}>build {k.build_number}</button>
	<Status_Strip />
	<div class='guides-control'>
		<span class='guides-label'>guides</span> 
		<Slider min={0} max={1} value={$w_grid_opacity} width={120} show_steppers={false} onchange={(v) => w_grid_opacity.set(v)} />
	</div>
</div>

<style>
	.band {
		height          : (var(--h-controls));
		padding         : 0 var(--l-gap);
		background      : var(--accent);
		box-sizing      : border-box;
		align-items     : center;
		display         : flex;
		flex-shrink     : 0;
	}

	.top-band {
		margin-top      : var(--l-gap);
		justify-content : center;
	}

	.bottom-band {
		justify-content : space-between;
	}

	.guides-control {
		align-items    : center;
		display        : flex;
		flex-direction : row;
		gap            : 6px;
	}

	.guides-label {
		letter-spacing : var(--l-letter-spacing);
		font-size      : var(--font-common);
		color          : var(--c-track);
		margin-top     : -5px;
		line-height    : 1;
	}

	.build-button {
		border        : var(--th-border) solid rgba(0, 0, 0, 0.25);
		padding       : 0 var(--l-padding) 1px var(--l-padding);
		background    : rgba(255, 255, 255, 0.85);
		height        : var(--h-button-common);
		color         : rgba(0, 0, 0, 0.5);
		font-size     : var(--font-common);
		border-radius : var(--r-common);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.build-button:hover,
	.build-button:global([data-hit]) {
		border     : var(--th-border) solid rgba(0, 0, 0, 0.4);
		color      : var(--c-default);
		background : var(--hover);
	}
</style>
