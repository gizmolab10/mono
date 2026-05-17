<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { stores } from '../../ts/managers/Stores';
	import Status_Strip from './Status_Strip.svelte';
	import Details from '../details/Details.svelte';
	import { k } from '../../ts/common/Constants';
	import BuildNotes from './BuildNotes.svelte';
	import Slider from '../mouse/Slider.svelte';
	import UserGuide from './UserGuide.svelte';
	import { e } from '../../ts/events/Events';
	import { engine } from '../../ts/render';
	import Controls from './Controls.svelte';
	import Confirm from './Confirm.svelte';
	import Graph from './Graph.svelte';
	import { onMount } from 'svelte';

	const { w_show_details } = stores;
	const { w_grid_opacity, w_scale } = stores;

	// Initialize event system
	onMount(() => {
		e.setup();
	});

	// Reactive state for window dimensions
	let width  = $state(Math.max(k.width.window_min, window.innerWidth));
	let height = $state(window.innerHeight);

	// Layout constants
	const gap    = k.thickness.separator.main;
	const radius = k.radius.main;

	let controlsHeight = $state(k.height.controls);
	let details_pad    = $state(0);
	let wrap_phone     = $derived(width < k.width.wrap_phone);
	let detailsWidth   = $derived(
		wrap_phone
			? width - gap * 2
			: k.width.details - gap * 2 + details_pad
	);
	let showBuildNotes = $state(false);
	let showUserGuide  = $state(false);

	let { onshowbuildnotes = () => {} }: { onshowbuildnotes?: () => void } = $props();

	// Computed dimensions
	let mainHeight = $derived(height - controlsHeight * 3 - gap * 4);
	let graphWidth = $derived(width - ($w_show_details ? detailsWidth + gap : 0) - gap * 2);

	function handleResize() {
		width  = Math.max(k.width.window_min, window.innerWidth);
		height = window.innerHeight;
	}

	function handle_zoom_step(pointsUp: boolean) {
		if (pointsUp) engine.scale_up();
		else engine.scale_down();
	}

	function handle_zoom_slide(value: number) {
		w_scale.set(value);
	}

</script>

<svelte:window
	onresize = {handleResize}
/>

<div
	class                  = 'panel'
	style:padding          = '{gap}px'
	style:--l-gap          = '{gap}px'
	style:width            = '{width}px'
	style:height           = '{height}px'
	style:--radius         = '{radius}px'
	style:background-color = 'var(--accent)'
	>
	{#if showBuildNotes}
		<!-- Build notes: single empty region fills entire space -->
		<div
			style:background="color-mix(in srgb, var(--bg) 95%, black)"
			onclick={() => showBuildNotes = false}
			class='region build-notes-region'
			onkeyup={() => {}}
			role="button"
			tabindex="-1">
			<BuildNotes onclose={() => showBuildNotes = false} />
		</div>
	{:else if showUserGuide}
		<!-- User guide: full-screen overlay with sidebar list and content panel -->
		<div class='region user-guide-region'>
			<UserGuide onclose={() => showUserGuide = false} />
		</div>
	{:else}
		<!-- Controls region -->
		<div
			bind:clientHeight={controlsHeight}
			class = 'region controls'>
			<Controls onshowuserguide={() => showUserGuide = true} />
		</div>

		<!-- Main content area -->
		<div
			class         = 'main'
			style:height  = '{mainHeight}px'
			style:margin-top = '{gap}px'>
			{#if $w_show_details}
				<!-- Details region -->
				<div
					class        = 'region details'
					style:height = '{mainHeight}px'
					style:width  = '{detailsWidth}px'>
					<Details onpadchange={(v) => details_pad = v} />
				</div>
			{/if}

			<!-- Graph region -->
			<div
				class        = 'region graph'
				style:width  = '{graphWidth}px'
				style:height = '{mainHeight}px'>
				<Graph />
			</div>
		</div>
		<div class='band top-band'>
			<Slider min={0.01} max={10000} value={$w_scale} logarithmic fill onchange={handle_zoom_slide} onstep={handle_zoom_step} />
		</div>
		<div class='band bottom-band'>
			<button class='build-button' use:hit_target={{ id: 'build', onpress: onshowbuildnotes }}>build {k.build_number}</button>
			<Status_Strip />
			<div class='guides-control'>
				<Slider min={0} max={1} value={$w_grid_opacity} width={120} show_steppers={false} onchange={(v) => w_grid_opacity.set(v)} />
				<span class='guides-label'>guides</span>
			</div>
		</div>
	{/if}
</div>

<Confirm />

<style>
	.panel {
		min-width   : var(--window-min-width);
		font-family : system-ui, sans-serif;
		box-sizing  : border-box;
		position    : fixed;
		top         : 0;
		left        : 0;
	}

	.main {
		gap      : var(--l-gap);
		overflow : hidden;
		display  : flex;
	}

	.region {
		z-index       : var(--z-layout);
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.controls {
		width : 100%;
	}

	.graph {
		flex : 1;
	}

	.details {
		flex-shrink : 0;
	}

	.build-notes-region {
		box-sizing      : border-box;
		justify-content : center;
		align-items     : center;
		display         : flex;
		width           : 100%;
		height          : 100%;
	}

	.user-guide-region {
		box-sizing      : border-box;
		position        : relative;
		width           : 100%;
		height          : 100%;
		border-radius   : calc(var(--h-controls) / 2);
	}

	.band {
		height          : (var(--h-controls));
		background      : var(--accent);
		padding         : 0 var(--l-gap);
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
		flex-direction : row;
		align-items    : center;
		display        : flex;
		gap            : 6px;
	}

	.guides-label {
		letter-spacing : var(--l-letter-spacing);
		color          : var(--c-track);
		font-size      : var(--font-small);
		line-height    : 1;
	}

	.build-button {
		border        : var(--th-border) solid rgba(0, 0, 0, 0.25);
		padding       : 0 var(--l-padding) 1px var(--l-padding);
		background    : rgba(255, 255, 255, 0.85);
		height        : var(--h-button-common);
		border-radius : var(--r-common);
		font-size     : var(--font-common);
		color         : rgba(0, 0, 0, 0.5);
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
