<script lang='ts'>
	import { Action, c, colors, hit_target, hits, k, Point, S_Mouse, Separator, Stack, T_Position } from '../ts/common/Core';
	import { Edit, Gallery, photosInFolder, technical } from '../ts/common/Gallery';
	import { preferences, T_Preference } from '../ts/managers/Preferences';
	import { customizations } from '../ts/common/Customizations';
	import { Panel } from '../ts/common/Panel';
	import D_Preferences from './D_Preferences.svelte';

	// The host of panel's page. It does what every host owes — feeds the cursor to the hits
	// manager, pushes the colors onto the page, holds whether the details column is shown — and
	// hands Panel what goes in each region: the edit button at the right end of the controls row,
	// the preferences in the details column, the gallery in the operation view.

	const { w_background_color, w_accent_color, w_hover_color, w_text_color } = colors;

	// Whenever any of the four theme colors changes, push all four onto the page so every
	// component can read them as plain style names. Main.ts read the remembered two in.
	$effect(() => {
		c.configure_reactive_colors($w_background_color, $w_accent_color, $w_hover_color, $w_text_color);
	});

	// Whether details shows at all is the hamburger's doing. Remembered between visits, shown
	// on the first.
	const w_show_details = preferences.persistent<boolean>(T_Preference.show_details, true);

	// The details column is one stack of one section, the preferences — the two color pickers
	// taken from ov — under a word on the line above it that folds it away and brings it back.
	// Whether it is open is remembered between visits, open on the first.
	const w_preferences_open = preferences.persistent<boolean>(T_Preference.preferences_open, true);

	// The word that folds the section away, built here rather than by the separator it sits on.
	// The browser makes a button one drawing after we ask, so this holds nothing on the first
	// drawing and the made button on the next — which is itself a change, so the stack is told.
	let preferences_word = $state<HTMLElement | null>(null);
	const preferences_action = $derived(Object.assign(new Action(), { element: preferences_word, position: T_Position.left }));

	// The operation view holds gallery's own component, showing the pictures of mj's one
	// folder. A picture and its caption fill the view together, ratio kept, out to its edges,
	// and sit at the middle of it. While editing is on, the drop box and the table start at the
	// top instead. The space they fill is the view's own size, handed down by Panel in the same
	// frame as the window's.
	const FOLDER = 'mj';
</script>

<!-- The cursor is fed to the manager here and nowhere else: it asks which targets hold that point
     and hands the press to the one of highest precedence. A control that has moved over to it
     watches nothing itself. -->
<svelte:window
	onmousemove={(event) => hits.handle_mouse_movement_at(new Point(event.clientX, event.clientY))}
	onmousedown={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.down(event, null))}
	onmouseup={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.up(event, null))} />

<!-- The word, written out of sight: the moment the browser has made it, the stack takes it and
     puts it on the separator instead. -->
<div class='out_of_sight'>
	<button type='button' class='clickable' bind:this={preferences_word}
		use:hit_target={{ id: 'details.fold.preferences',
			onpress: () => w_preferences_open.set(!$w_preferences_open) }}>preferences</button>
</div>

{#snippet shows_preferences()}<D_Preferences />{/snippet}

{#snippet controls()}
	{#if technical.on}
		<Edit />
	{/if}
{/snippet}

{#snippet details()}
	<!-- Everything from the first separator down to the last sits on the page color. The column
	     is one stack. Nothing above it draws a boundary, so it draws its own separator over the
	     first section, carrying that section's word. -->
	<div class='holds-stack'>
		<Stack gap={k.gap.big} foot='below' leads={[preferences_action]} sections={[
			{ subsection: shows_preferences, folded: !$w_preferences_open },
		]} />
		<!-- What closes the section off from the foot of the column, drawn here whether the section
		     is open or folded — so a fold always has a line to end against. -->
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	</div>
{/snippet}

{#snippet operation(width: number, height: number)}
	<div class='fits' class:centered={!technical.editing}>
		<Gallery folder={FOLDER} photos={photosInFolder(FOLDER)} fit={{ width, height }} />
	</div>
{/snippet}

<Panel name={customizations.name} details_shown={$w_show_details} ontoggle={() => w_show_details.set(!$w_show_details)}
	{controls} {details} {operation} />

<style>
	/* Where the clickable is written before the stack takes it. It is taken out of here on the
	   very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, sitting on the separator above it. Its page-colored
	   background masks the separator behind it. */
	.clickable {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--bg);
		box-sizing    : border-box;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.clickable:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	/* The closing separator, pulled up half its own thickness. Every distance in a stack is measured
	   middle to middle, and the stack leaves its bottom edge exactly where this line's middle
	   belongs — but a line drawn below it starts there instead, which is half a thickness too low. */
	.foot {
		margin-top : calc(var(--thick-huge) / -2);
		flex       : 0 0 auto;
	}

	/* The separators and what they hold. It reaches out to the column's edges and holds that width
	   back as its own step-in, so the page color runs the full width while what it holds sits
	   where it did. It takes only the height it needs. */
	.holds-stack {
		margin         : 0 calc(var(--gap) * -1);
		padding        : 0 var(--gap);
		background     : var(--bg);
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
		gap            : 0;
	}

	/* The space a picture and its caption may fill: the whole operation view, reached by giving
	   back the view's own gap. Whatever overflows it for a frame, while the window is dragged, is
	   clipped rather than drawn outside. */
	.fits {
		margin         : calc(0px - var(--gap));
		flex-direction : column;
		overflow       : hidden;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	.fits.centered {
		justify-content : center;
	}
</style>
