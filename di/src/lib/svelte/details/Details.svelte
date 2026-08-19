<script lang='ts'>
	import { scenes, stores, parts, selection } from '../../ts/managers';
	import type Smart_Object from '../../ts/runtime/Smart_Object';
	import { preferences } from '../../ts/managers/Preferences';
	import Action, { T_Position } from '../../ts/types/Action';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Details } from '../../ts/types/Enumerations';
	import D_Preferences from './D_Preferences.svelte';
	import Separator from '../mouse/Separator.svelte';
	import D_Selection from './D_Selection.svelte';
	import { k } from '../../ts/common/Constants';
	import { hits } from '../../ts/events/Hits';
	import D_Library from './D_Library.svelte';
	import Stack from '../mouse/Stack.svelte';
	import { engine } from '../../ts/render';
	import D_Givens from './D_Givens.svelte';
	import D_Parts from './D_Parts.svelte';
	import { onMount, tick } from 'svelte';

	const { w_tick, w_all_sos, w_allow_editing, w_t_details } = stores;
	// The upright cross the three add buttons draw. It is x_cross — two diagonals — turned a
	// quarter turn where it is drawn, so one path serves both marks.
	const CROSS = k.height.font.reset;
	const cross_path = svg_paths.x_cross(CROSS, CROSS / 6);

	const SEPARATOR = k.thickness.separator.details;
	const th_sep = k.thickness.separator.main;
	const { w_selection_name } = selection;
	const { w_naming_error } = parts;

	interface Props {
		onpadchange?: (pad: number) => void;
	}

	let selection_title: string = $derived( $w_selection_name ?? 'nothing selected' );

	// Whether a section shows what it holds. One flag word holds all five, a bit to each.
	function is_open(detail: T_Details): boolean {
		return ($w_t_details & detail) !== 0;
	}
	async function toggle(detail: T_Details) {
		w_t_details.update((v) => v ^ detail);
		await hits.defer_recalibrate();
	}
	
	// Everything that actions a separator, built here rather than by the separator it stands on: each
	// section's word at the middle, and its buttons hard against the two ends — the same three
	// places they stood at inside the banner.
	//
	// The browser makes an element one drawing after we ask, so each of these holds nothing on the
	// first drawing and the made element on the next — which is itself a change, so the stack is
	// told and every rectangle is measured again.
	let preferences_word = $state<HTMLElement | null>(null);
	let library_word     = $state<HTMLElement | null>(null);
	let parts_word       = $state<HTMLElement | null>(null);
	let selection_word   = $state<HTMLElement | null>(null);
	let givens_word      = $state<HTMLElement | null>(null);

	let preferences_left = $state<HTMLElement | null>(null);
	let library_left     = $state<HTMLElement | null>(null);
	let parts_left       = $state<HTMLElement | null>(null);

	let library_right    = $state<HTMLElement | null>(null);
	let parts_right      = $state<HTMLElement | null>(null);
	let selection_right  = $state<HTMLElement | null>(null);
	let givens_right     = $state<HTMLElement | null>(null);

	/** What one separator carries: whatever of the three is there, each at its own place. */
	function actions(left: HTMLElement | null, word: HTMLElement | null, right: HTMLElement | null): Action[] {
		const at = (element: HTMLElement | null, position: T_Position) =>
			Object.assign(new Action(), { element, position });
		return [
			at(left,  T_Position.left),
			at(word,  T_Position.center),
			at(right, T_Position.right),
		];
	}
	let scroll_box: HTMLDivElement | undefined = $state();
	let inner_box: HTMLDivElement | undefined = $state();
	let givens_add: (() => void) | undefined = $state();
	let { onpadchange }: Props = $props();
	let scrollbar_w = $state(0);

	// Count of leaf parts in the scene. A repeater counts as a single leaf and
	// nothing inside it counts — the master, its descendants, and the spawned
	// clones are all hidden from the count. Outside of repeaters, the usual
	// leaf rule applies: a part counts when nothing is parented under it.
	let parts_leaf_count = $derived.by(() => {
		$w_tick;
		const sos = $w_all_sos;
		const is_inside_repeater = (s: Smart_Object): boolean => {
			let p = s.scene?.parent?.so;
			while (p) {
				if (p.repeater?.is_repeating) return true;
				p = p.scene?.parent?.so;
			}
			return false;
		};
		const visible = sos.filter(s => !is_inside_repeater(s));
		return visible.filter(s => s.repeater?.is_repeating || !visible.some(c => c.scene?.parent?.so === s)).length;
	});

	// Banner title: the root smart object's name, with the leaf-part count in
	// parentheses — e.g. "kitchen wall (3)".
	let parts_title: string = $derived.by(() => {
		$w_tick;
		const root_name = scenes.root_so?.name ?? 'parts';
		return `${root_name} (${parts_leaf_count})`;
	});

	function factory_reset() {
		preferences.reset();
		location.reload();
	}

	function add_child_and_show_parts() {
		if (!stores.allow_editing) return;
		stores.w_t_details.update(v => v | T_Details.parts);
		engine.add_child_so();
	}

	async function add_given_and_show_givens() {
		if (!stores.allow_editing) return;
		stores.w_t_details.update(v => v | T_Details.givens);
		await tick();
		givens_add?.();
	}

	function recheck_overflow() {
		if (!scroll_box) return;
		const overflowing = scroll_box.scrollHeight > scroll_box.clientHeight + 1;
		const sw = overflowing ? scroll_box.offsetWidth - scroll_box.clientWidth : 0;
		if (sw !== scrollbar_w) {
			scrollbar_w = sw;
			onpadchange?.(sw > 0 ? sw + th_sep : 0);
		}
	}

	onMount( async () => {
		await hits.defer_recalibrate();
	});

	$effect(() => {
		if (!scroll_box || !inner_box) return;
		const ro = new ResizeObserver(() => recheck_overflow());
		ro.observe(scroll_box);
		ro.observe(inner_box);
		recheck_overflow();
		return () => ro.disconnect();
	});

</script>

<!-- Everything the separators carry, written out of sight: the moment the browser has made one,
     the stack takes it and puts it on a separator instead. Each section's word folds that section
     away; each button does its own thing, as it did inside the banner. -->
<div class='out_of_sight'>
	<button class='action-button' bind:this={preferences_left}
		use:hit_target={{ id: 'reset-prefs', onpress: factory_reset }}>factory reset</button>
	<span class='word' bind:this={preferences_word}
		use:hit_target={{ id: 'hideable-preferences', onpress: () => toggle(T_Details.preferences) }}>preferences</span>

	<button class='action-button' bind:this={library_left}
		use:hit_target={{ id: 'reset-library', onpress: () => scenes.reset_library() }}>reinstall</button>
	<span class='word' bind:this={library_word}
		use:hit_target={{ id: 'hideable-library', onpress: () => toggle(T_Details.library) }}>library</span>
	<button class='banner-add' aria-label='new scene' bind:this={library_right}
		use:hit_target={{ id: 'new-scene', onpress: () => engine.load_scene(scenes.new_scene()) }}>
		<svg class='cross' viewBox='0 0 {CROSS} {CROSS}'>
			<path d={cross_path} fill='none' stroke='currentColor'
				stroke-width={CROSS / 6} stroke-linecap='round' />
		</svg></button>

	<button class='action-button' bind:this={parts_left}
		use:hit_target={{ id: 'save', onpress: () => scenes.add_to_library() }}>save</button>
	<span class='word' bind:this={parts_word}
		use:hit_target={{ id: 'hideable-parts', onpress: () => toggle(T_Details.parts) }}>{parts_title}</span>
	<button class='action-button' bind:this={parts_right}
		use:hit_target={{ id: 'allow-editing', onpress: () => stores.toggle_allow_editing() }}>{$w_allow_editing ? 'edit' : '🔒 edit'} ⟳</button>

	<span class='word' bind:this={selection_word}
		use:hit_target={{ id: 'hideable-selection', onpress: () => toggle(T_Details.selection) }}>{selection_title}</span>
	<button class='banner-add' aria-label='add child' bind:this={selection_right} disabled={!$w_allow_editing}
		use:hit_target={{ id: 'add-child', onpress: add_child_and_show_parts }}>
		<svg class='cross' viewBox='0 0 {CROSS} {CROSS}'>
			<path d={cross_path} fill='none' stroke='currentColor'
				stroke-width={CROSS / 6} stroke-linecap='round' />
		</svg></button>

	<span class='word' bind:this={givens_word}
		use:hit_target={{ id: 'hideable-givens', onpress: () => toggle(T_Details.givens) }}>constants</span>
	<button class='banner-add' aria-label='add constant' bind:this={givens_right} disabled={!$w_allow_editing}
		use:hit_target={{ id: 'add-given', onpress: add_given_and_show_givens }}>
		<svg class='cross' viewBox='0 0 {CROSS} {CROSS}'>
			<path d={cross_path} fill='none' stroke='currentColor'
				stroke-width={CROSS / 6} stroke-linecap='round' />
		</svg></button>
</div>

<!-- What each section shows, each held a gap clear of the two separators around it. -->
{#snippet shows_preferences()}<div class='holds'><D_Preferences /></div>{/snippet}
{#snippet shows_library()}<div class='holds'><D_Library /></div>{/snippet}
{#snippet shows_parts()}<div class='holds parts'><D_Parts /></div>{/snippet}
{#snippet shows_selection()}<div class='holds'><D_Selection /></div>{/snippet}
{#snippet shows_givens()}<div class='holds'><D_Givens bind:add={givens_add} /></div>{/snippet}

<div class='details-shell'>

<div
	class            = 'details'
	bind:this        = {scroll_box}
	style:color      = 'var(--text)'
	onscroll         = {() => hits.recalibrate()}>

	<div bind:this={inner_box} class='banner-zone' style:padding-right='{scrollbar_w > 0 ? th_sep + "px" : "0"}'>
		<!-- No overhang: a separator here stands inside the column, so its ends and the flares drawn
		     on them are not cut off by the edge that clips this column. -->
		<Stack gap={k.gap.small} foot='below' overhang={0}
			leads={actions(preferences_left, preferences_word, null)} sections={[
			{ subsection: shows_preferences, thickness: SEPARATOR, folded: !is_open(T_Details.preferences) },
			{ subsection: shows_library, actions: actions(library_left, library_word, library_right), thickness: SEPARATOR, folded: !is_open(T_Details.library) },
			{ subsection: shows_parts,   actions: actions(parts_left,   parts_word,   parts_right),   thickness: SEPARATOR,   folded: !is_open(T_Details.parts) },
			...($w_selection_name ? [
				{ subsection: shows_selection, actions: actions(null, selection_word, selection_right), thickness: SEPARATOR, folded: !is_open(T_Details.selection) },
				{ subsection: shows_givens,    actions: actions(null, givens_word,    givens_right),    thickness: SEPARATOR,    folded: !is_open(T_Details.givens) },
			] : []),
		]} />
		<!-- What closes the last section off from the foot of the column, drawn here whether that
		     section is open or folded — so a fold down there always has a line to end against. -->
		<div class='foot'>
			<Separator thickness={k.thickness.separator.main} overhang={0} />
		</div>

		{#if $w_naming_error}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class='naming-backdrop' onmousedown={(e) => { e.preventDefault(); parts.dismiss_naming(); }}></div>
			<div class='naming-overlay'>
				<div class='naming-message'>{@html $w_naming_error.replace(/'([^']+)'/g, "&#39;<span class='naming-quoted'>$1</span>&#39;")}</div>
				<div class='naming-suggestions'>
					<button class='naming-suggestion' onmousedown={(e) => { e.preventDefault(); parts.dismiss_naming(); }}>delete it</button>
				</div>
			</div>
		{/if}

	</div>
</div>

{#if scrollbar_w > 0}
	<div class='separator-overlay' style:right='{scrollbar_w}px'>
		<Separator vertical kind='main' />
	</div>
{/if}

</div>

<style>

	/* The page color behind the whole stack, so a separator drawn in the accent reads as a line
	   against it. Standing on the accent, an accent line and the gap around it were one band and
	   the line could not be told from the space beside it. The accent now shows only where a
	   section is folded, which is the one place it means something. */
	.banner-zone {
		background     : var(--bg);
		position       : relative;
		flex-direction : column;
		display        : flex;
	}

	/* Where the five pills are written before the stack takes them. Each is taken out of here on
	   the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A gap above and below whatever a section shows, so its content stands clear of the two
	   separators around it, and the page color behind all of it. One rule for all five. */
	.holds {
		border-radius : var(--r-content);
		padding       : var(--l-gap);
		background    : var(--bg);
	}

	/* The parts section holds a run of rows, so it wants a second gap above and below them. */
	.holds.parts {
		padding-bottom : calc(var(--l-gap) * 2);
		padding-top    : calc(var(--l-gap) * 2);
	}

	/* One section's word, standing at the middle of the separator above that section, and folding
	   that section when pressed. Its page-colored background masks the line behind it, so it reads
	   as breaking the line — the same way the banner's title read. */
	.word {
		border         : var(--th-border) solid black;
		letter-spacing : var(--l-letter-spacing);
		font-size      : var(--font-reset);
		border-radius  : var(--r-common);
		padding        : 0 var(--l-padding);
		background     : var(--white);
		text-transform : lowercase;
		cursor         : pointer;
		align-items    : center;
		white-space    : nowrap;
		display        : flex;
		font-weight    : 300;
	}

	.word:global([data-hit]) {
		background : var(--hover);
	}

	/* The line closing the last section off from the foot of the column. Everything in a stack is
	   measured middle to middle, and the stack leaves its bottom edge exactly where this line's
	   middle belongs — a line drawn below starts there instead, so it is pulled up half its own
	   thickness. */
	.foot {
		margin-top : calc(var(--th-sep) / -2);
		flex       : 0 0 auto;
	}

	.banner-add:disabled {
		opacity : 0.4;
		cursor  : default;
	}

	.banner-add:hover:not(:disabled),
	.banner-add:active:not(:disabled) {
		color      : var(--c-default);
		background : var(--hover);
	}

	.details {
		background : var(--accent);
		box-sizing : border-box;
		position   : relative;
		overflow-x : hidden;
		overflow-y : auto;
		height     : 100%;
		width      : 100%;
		padding    : 0;
	}

	.details-shell {
		position : relative;
		height   : 100%;
		width    : 100%;
	}

	.separator-overlay {
		position       : absolute;
		align-items    : stretch;
		pointer-events : none;
		display        : flex;
		bottom         : -1px;
		top            : 0;
	}

	.separator-overlay :global(.separator.vertical) {
		height     : 100%;
	}

	.details::-webkit-scrollbar {
		background : var(--accent);
		width      : 15px;
	}

	.details::-webkit-scrollbar-track,
	.details::-webkit-scrollbar-track-piece,
	.details::-webkit-scrollbar-corner {
		background : var(--accent);
	}

	.details::-webkit-scrollbar-button {
		height     : var(--th-sep);
		background : var(--accent);
		display    : block;
	}

	.details::-webkit-scrollbar-thumb {
		border        : 0.1px solid var(--c-default);
		background    : var(--c-thumb);
		border-radius : 9999px;
	}

	/* No height of its own: it takes the same line box its word does, so the three things riding a
	   separator all stand the same height. */
	.action-button {
		border        : var(--th-border) solid black;
		font-size     : var(--font-tiny);
		z-index       : var(--z-action);
		border-radius : var(--r-common);
		box-sizing    : border-box;
		background    : var(--white);
		cursor        : pointer;
		color         : inherit;
		white-space   : nowrap;
		padding       : 0 var(--l-padding);
		font-weight   : 300;
	}

	.action-button:global([data-hit]) {
		color      : var(--c-default);
		background : var(--hover);
	}

	/* A circle: both sides the same, said in its own font's em so it stays the size of the word
	   beside it. Asking for a ratio alone leaves both sides free, and the browser then takes each
	   from the "+" inside — which is taller than it is wide. */
	.banner-add {
		border          : var(--th-border) solid black;
		color           : rgba(0, 0, 0, 0.5);
		font-size       : var(--font-reset);
		z-index         : var(--z-action);
		background      : var(--white);
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		height          : 1.2em;
		width           : 1.2em;
		display         : flex;
		border-radius   : 50%;
		font-weight     : 300;
		line-height     : 1;
		padding         : 0;
	}

	/* The two diagonals turned upright, so the same path draws an X elsewhere and a plus here.
	   It takes its color from the button, which is what fades it while the button is disabled. */
	.cross {
		transform : rotate(45deg);
		display   : block;
	}

	.naming-backdrop {
		position : fixed;
		z-index  : 999;
		inset    : 0;
	}

	.naming-overlay {
		font-size     : var(--font-small);
		border        : 2px solid darkred;
		background    : var(--white);
		box-sizing    : border-box;
		position      : relative;
		padding       : 6px 8px;
		text-align    : center;
		width         : 100%;
		z-index       : 1000;
		margin-top    : 8px;
		margin-bottom : 8px;
		border-radius : 8px;
	}

	.naming-message :global(.naming-quoted) {
		color : darkred;
	}

	.naming-suggestions {
		justify-content : center;
		display         : flex;
		margin-top      : 8px;
	}

	.naming-suggestion {
		border        : var(--th-border) solid currentColor;
		font-size     : var(--font-tiny);
		border-radius : var(--r-table);;
		cursor        : pointer;
		color         : inherit;
		padding       : 2px var(--l-padding);
		background    : white;
		line-height   : 1;
	}

	.naming-suggestion:hover {
		outline    : 2px solid var(--accent);
		background : var(--selected);
	}

</style>
