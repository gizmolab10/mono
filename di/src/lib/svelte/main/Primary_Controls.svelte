<script lang='ts'>
	import { T_Decorations } from '../../ts/types/Enumerations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { history } from '../../ts/managers/History';
	import { stores } from '../../ts/managers/Stores';
	import { scenes } from '../../ts/managers/Scenes';
	import { k } from '../../ts/common/Constants';
	import { engine } from '../../ts/render';
	import Steppers from '../mouse/Steppers.svelte';
	import Slider from '../mouse/Slider.svelte';

	let { onshowuserguide = () => {} }: { onshowuserguide?: () => void } = $props();

	const { w_view_mode, w_decorations, w_solid, w_show_details, w_forward_face, w_rotation_snap, w_allow_editing, w_tick, w_orientation, w_dimension_count } = stores;
	const face_labels = ['bottom', 'top', 'left', 'right', 'back', 'front'];

	let controls_width   = $state(Infinity);
	let wrap_phone       = $derived(controls_width < k.width.wrap_phone);
	let wrap_mobile      = $derived(controls_width < k.width.wrap_mobile);

	// Log only when a layout switch actually flips, with the numbers behind it.
	let last_wrap_log = '';
	$effect(() => {
		const line = `phone ${wrap_phone} compact ${wrap_mobile}`;
		if (line === last_wrap_log) return;
		last_wrap_log = line;
		// console.log(`controls layout: measured ${Math.round(controls_width)} layout pixels — phone-stack ${wrap_phone}, compact ${wrap_mobile} (limits: phone ${k.width.wrap_phone}, compact ${k.width.wrap_mobile}).`);
	});
	let show_names       = $derived(($w_decorations & T_Decorations.names) !== 0);
	let show_angles      = $derived(($w_decorations & T_Decorations.angles) !== 0);
	let root_fits        = $derived.by(() => { $w_tick; return engine.root_fits(); });
	let is_straightened  = $derived.by(() => { $w_orientation; $w_tick; return engine.is_straightened(); });
	let can_undo         = $derived.by(() => { $w_tick; return history.can_undo; });
	let can_redo         = $derived.by(() => { $w_tick; return history.can_redo; });

	async function save() { await scenes.add_to_library(); }

	function on_undo_redo(left: boolean) {
		if (left) engine.undo();
		else      engine.redo();
	}

</script>

{#snippet hamburger_button()}
	<button class='hamburger' class:active={$w_show_details}
		use:hit_target={{ id: 'details', onpress: () => stores.toggle_details() }} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 {k.height.button.common} {k.height.button.common}' width={k.height.button.common + 20} height={k.height.button.common}>
			<path d={svg_paths.hamburger(k.height.button.common + 2)}/>
		</svg>
	</button>
{/snippet}

{#snippet help_button()}
	<button class='toolbar-button help-button' aria-label='Open user guide'
		use:hit_target={{ id: 'help', onpress: onshowuserguide }}>?</button>
{/snippet}

{#snippet save_edit_buttons()}
	<button class='toolbar-button' use:hit_target={{ id: 'save', onpress: save }}>save</button>
	<button class='toolbar-button' use:hit_target={{ id: 'allow-editing', onpress: () => stores.toggle_allow_editing() }}>{$w_allow_editing ? 'edit' : '🔒 edit'} ⟳</button>
{/snippet}

{#snippet right_corner_buttons()}
	{@render hamburger_button()}
	<span class='undo-redo'>
		<Steppers horizontal size={42} gap={6} disable_A={!can_undo} disable_B={!can_redo} hit_closure={on_undo_redo} />
	</span>{/snippet}

{#snippet decoration_buttons()}
	<div class='segmented'>
		<button class='seg' class:active={show_names} use:hit_target={{ id: 'names', onpress: () => stores.toggle_names() }}>names</button>
		<button class='seg' class:active={show_angles} use:hit_target={{ id: 'angulars', onpress: () => stores.toggle_angulars() }}>angles</button>
	</div>
	<span class='dim-count-slider' title='how many dimensionals show'>
		<Slider min={0.4} max={100} logarithmic tick_interval={10} width={140}
			value={$w_dimension_count}
			thumb_label={(v) => String(Math.round(v))}
			onchange={(v) => w_dimension_count.set(v)} />
	</span>
{/snippet}

{#snippet loose_mode_buttons()}
	<button class='toolbar-button' use:hit_target={{ id: 'view-mode', onpress: () => engine.toggle_view_mode() }}>{$w_view_mode.toUpperCase()} ⟳</button>
	<button class='toolbar-button' use:hit_target={{ id: 'solid', onpress: () => stores.toggle_solid() }}>{$w_solid ? 'solid' : 'wireframe'} ⟳</button>
	{#if $w_allow_editing && !root_fits}
		<button class='toolbar-button fit-button' use:hit_target={{ id: 'fit', onpress: () => engine.fit_to_children() }}>fit</button>
	{/if}
{/snippet}

{#snippet face_buttons()}
	<div class='segmented'>
		{#each face_labels as label, i}
			<button class='seg' class:forward={$w_forward_face === i} use:hit_target={{ id: `face-${i}`, onpress: () => engine.orient_to_face(i) }}>{label}</button>
		{/each}
	</div>
{/snippet}

{#snippet orientation_cluster()}
	{@render face_buttons()}
	<button class='toolbar-button' disabled={is_straightened} use:hit_target={{ id: 'straighten', onpress: () => engine.straighten() }}>straighten</button>
	<button class='toolbar-button snap-button' class:snap-off={!$w_rotation_snap} use:hit_target={{ id: 'rotation-snap', onpress: () => engine.toggle_rotation_snap() }}>🧲</button>
 {/snippet}

<div
	class:wrap_mobile
	class            = 'controls'
	style:color      = 'var(--text)'
	bind:clientWidth = {controls_width}>
	{#if wrap_phone}
		<div class='right-col'>
			<div class='right-row'>
				{@render right_corner_buttons()}
				{@render decoration_buttons()}
				<span class='spacer'></span>
				{@render help_button()}
			</div>
			<div class='right-row'>
				{@render face_buttons()}
				<button class='toolbar-button' disabled={is_straightened} use:hit_target={{ id: 'straighten', onpress: () => engine.straighten() }}>straighten</button>
				<button class='toolbar-button snap-button' class:snap-off={!$w_rotation_snap} use:hit_target={{ id: 'rotation-snap', onpress: () => engine.toggle_rotation_snap() }}>🧲</button>
				<span class='spacer'></span>
			</div>
		</div>
	{:else if wrap_mobile}
		<div class='right-col'>
			<div class='right-row'>
				{@render right_corner_buttons()}
				{@render decoration_buttons()}
				<span class='spacer'></span>
				{@render loose_mode_buttons()}
				{@render help_button()}
			</div>
			<div class='right-row'>
				{@render orientation_cluster()}
				<span class='spacer'></span>
				{@render save_edit_buttons()}
			</div>
		</div>
	{:else}
		<div class='desktop-row'>
			{@render right_corner_buttons()}
			{@render decoration_buttons()}
			<span class='spacer'></span>
			{@render orientation_cluster()}
			<span class='spacer'></span>
			{@render save_edit_buttons()}
			<span class='spacer'></span>
			{@render loose_mode_buttons()}
			{@render help_button()}
		</div>
	{/if}
</div>

<style>

	.dim-count-slider {
		position     : relative;
		top          : 2.5px;
		left         : -4px;
		/* Pull the next group 8px closer. When the row has room the spacer grows
		   to refill, so wide layouts are unchanged; only the collapsed floor
		   tightens — that gap was ~25px, now ~17px. */
		margin-right : -8px;
	}

	.controls {
		background      : var(--accent);
		box-sizing      : border-box;
		justify-content : flex-end;
		overflow        : visible;
		align-items     : center;
		width           : 100%;
		display         : flex;
	}

	.controls:not(.wrap_mobile) {
		height : var(--h-controls);
	}

	.right-col {
		flex-direction : column;
		display        : flex;
		min-width      : 0;
		flex           : 1;
	}

	.right-row {
		height          : var(--h-controls);
		gap             : var(--l-gap-tiny);
		background      : var(--accent);
		overflow        : visible;
		justify-content : center;
		align-items     : center;
		display         : flex;
	}

	.spacer {
		flex      : 1 1 0px;
		margin    : 0 -6px;
		min-width : 0;
	}

	.desktop-row {
		gap         : var(--l-gap-tiny);
		flex        : 1 1 auto;
		align-items : center;
		display     : flex;
		min-width   : 0;
		left        : 0;
	}

	.hamburger {
		height          : var(--h-button-common);
		width           : var(--h-button-common);
		z-index         : var(--z-action);
		background      : transparent;
		position        : relative;
		cursor          : pointer;
		color           : inherit;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border          : none;
		top             : -1px;
		margin-right    : 6px;
		margin-left     : 2px;
		padding         : 0;
	}

	.hamburger-icon path {
		fill   : currentColor;
		stroke : currentColor;
	}

	.hamburger:global([data-hit]) .hamburger-icon path {
		fill : var(--white);
	}

	.toolbar-button {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		font-size     : var(--font-common);
		z-index       : var(--z-frontmost);
		border-radius : var(--r-common);
		background    : var(--white);
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
	}

	.undo-redo {
		display  : inline-block;
		position : relative;
		top      : 1.5px;
	}

	.fit-button {
		justify-content : center;
		align-items     : center;
		display         : inline-flex;
		border-radius   : 50%;
		width           : var(--h-button-common);
		padding         : 0;
	}

	.help-button {
		font-size : var(--font-large);
		padding   : 1px 10px 0 9px;
		right     : -10px;
	}

	.toolbar-button:disabled {
		cursor  : default;
		opacity : 0.35;
	}

	.toolbar-button:global([data-hit]) {
		color      : var(--c-default);
		background : var(--hover);
	}

	.snap-button {
		width         : var(--h-button-common);
		height        : var(--h-button-common);
		font-size     : var(--font-large);
		position      : relative;
		border-radius : 50%;
		padding       : 0;
	}

	.snap-off::after {
		transform  : translate(-50%, -50%) rotate(-45deg);
		width      : var(--h-button-common);
		background : var(--c-default);
		position   : absolute;
		height     : 1.5px;
		top        : 50%;
		left       : 50%;
		content    : '';
	}

	.segmented {
		border        : var(--th-border) solid currentColor;
		height        : var(--h-button-common);
		border-radius : var(--r-common);
		z-index       : var(--z-action);
		box-sizing    : border-box;
		overflow      : hidden;
		display       : flex;
	}

	.seg {
		padding     : 0 var(--l-padding) 1px var(--l-padding);
		border-right: var(--th-border) solid currentColor;
		color       : rgba(0, 0, 0, 0.35);
		font-size   : var(--font-common);
		background  : var(--white);
		box-sizing  : border-box;
		cursor      : pointer;
		border      : none;
		height      : 100%;
	}

	.seg:last-child {
		border-right : none;
	}

	.seg.forward {
		color      : var(--c-default);
		background : var(--selected);
	}

	.seg.active {
		color      : var(--c-default);
		background : var(--selected);
	}

	.seg:global([data-hit]) {
		color      : var(--c-default);
		background : var(--hover);
	}

</style>

