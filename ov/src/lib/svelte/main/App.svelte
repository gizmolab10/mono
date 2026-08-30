<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { w_tip, start_tips } from '../../ts/utilities/Tooltip';
	import { w_command_down, w_operation, w_option_down, T_Operation } from '../../ts/managers/Operations';
	import { files } from '../../ts/managers/Files';
	import { files_on_disk, restart_dispatcher } from '../../ts/utilities/Saving';
	import { colors } from '../../ts/utilities/Colors';
	import { Point } from '../../ts/types/Coordinates';
	import S_Mouse from '../../ts/events/S_Mouse';
	import { hits } from '../../ts/events/Hits';
	import { w_app, S_App } from '../../ts/types/App';
	import { c } from '../../ts/common/Configuration';
	import ToolTip from '../support/ToolTip.svelte';
	import buildsRaw from '../../md/builds.md?raw';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import { w_show_status } from '../../ts/managers/Status';
	import Status_Line from '../content/Status_Line.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Operation from './Operation.svelte';
	import Controls from './Controls.svelte';
	import Details from './Details.svelte';

	const { w_background_color, w_accent_color, w_hover_color, w_text_color } = colors;
	const w_no_server = files.w_no_server;

	// The dispatcher is asked once, as the page arrives. Restarted after that, it has no way to
	// say so — which left the screen holding "start it, then reload" until someone did. So while
	// that message is up, it is asked again every second or two, and the page starts itself over
	// the moment it answers.
	$effect(() => {
		if (!$w_no_server) { return; }
		const asking = setInterval(async () => {
			const on_disk = await files_on_disk();
			if (on_disk.paths.length === 0) { return; }
			debug.log(`Guides: the dispatcher is answering again — ${on_disk.paths.length} file(s) on disk, so the page starts itself over.`);
			window.location.reload();
		}, k.timeout.asking);
		return () => clearInterval(asking);
	});

	// Whenever any of the four theme colors changes, push all four onto the page so
	// every component can read them as plain style names.
	$effect(() => {
		c.configure_reactive_colors(
			$w_background_color,
			$w_accent_color,
			$w_hover_color,
			$w_text_color
		);
	});

	// The one hover-hint watcher for the whole app: an element carrying its own words
	// (marked with the hint action) shows them, drawn by the hint at the bottom of this file.
	$effect(() => start_tips());

	// Whether the command key is held, watched in one place. Holding it changes what a click
	// on a guide does, so anything that says what a click would do can read it.
	$effect(() => {
		const said = (event: KeyboardEvent) => { w_command_down.set(event.metaKey); w_option_down.set(event.altKey); };
		const let_go = () => { w_command_down.set(false); w_option_down.set(false); };
		window.addEventListener('keydown', said);
		window.addEventListener('keyup', said);
		window.addEventListener('blur', let_go);      // the key can be let go while away
		return () => {
			window.removeEventListener('keydown', said);
			window.removeEventListener('keyup', said);
			window.removeEventListener('blur', let_go);
			let_go();
		};
	});

	// One number for the margin at the window's four edges and for the space between
	// the two regions, so the drawing and the arithmetic can never disagree.
	const gap = k.gap.normal;

	let width  = $state(Math.max(k.width.normal, window.innerWidth));
	let height = $state(window.innerHeight);

	function handleResize() {
		width  = Math.max(k.width.normal, window.innerWidth);
		height = window.innerHeight;
		// Everything on screen has moved, and every rectangle the hits manager holds was measured
		// once. They are asked again after the browser has drawn at the new size.
		hits.defer_recalibrate();
	}

	// The latest build number, read from the build-notes table.
	const buildNumber = Math.max(...buildsRaw.split('\n')
		.filter((line) => /^\|\s*\d+/.test(line))
		.map((line) => parseInt(line.split('|')[1].trim())));

	let showBuildNotes = $state(false);

	// The dispatcher is the only thing that reads and writes the files, so changing its code means
	// starting it over. The button's own face is the whole report — nothing goes to the status
	// line, which is for what the guides are doing.
	let restarting = $state(false);

	async function restart() {
		restarting = true;
		const answer = await restart_dispatcher();
		restarting = false;
		debug.log(`Dispatcher: asked to start over — ${answer.ok ? 'it is answering again.' : `it did not come back: ${answer.why}.`}`);
	}

	// Whether details shows at all is the hamburger's doing, and it is remembered across visits.
	const w_show_details = preferences.persistent<boolean>(T_Preference.show_details, true);

	// Is there room for both the details column (its fixed width) and the content region
	// beside it (its own smallest useful width), with the two outer margins and the one
	// between? Measured from the real window width, so it tracks resize and browser zoom.
	let room_for_both = $derived(width - gap * 3 >= k.width.small + k.width.big);
	// Too narrow for both: the content region is dropped and details fill the width.
	let details_only = $derived($w_show_details && !room_for_both);
	let details_width = $derived(details_only ? width - gap * 2 : k.width.small - gap * 2);
	// With details hidden, content has the whole width to itself.
	let content_width = $derived($w_show_details ? width - details_width - gap * 3 : width - gap * 2);

	function toggle_details() {
		const next = !$w_show_details;
		w_show_details.set(next);
		debug.log(`Hamburger clicked: details are now ${next ? 'showing' : 'hidden'}.`);
	}

	// Say it only when the showing-both / details-only / details-hidden picture changes,
	// with the numbers behind it.
	let said_last = '';
	$effect(() => {
		const line = `showing details: ${$w_show_details}, both fit: ${room_for_both}`;
		if (line === said_last) { return; }
		said_last = line;
		const needed = k.width.small + k.width.big + gap * 3;
		debug.log(`Layout: the window is ${width} wide and ${Math.round(needed)} is needed for both (details column ${k.width.small} + content ${k.width.big} + three gaps of ${Math.round(gap)}) — ${!$w_show_details
			? `details are hidden, so content has the whole ${Math.round(content_width)}.`
			: details_only
				? `too narrow, so the content region is hidden and details fill ${Math.round(details_width)}.`
				: `showing both, details ${Math.round(details_width)} wide and content ${Math.round(content_width)} wide.`}`);
	});
</script>

<!-- The cursor is fed to the manager here and nowhere else: it asks which targets hold that point
     and hands the press to the one of highest precedence. A control that has moved over to it
     watches nothing itself. -->
<svelte:window
	onresize={handleResize}
	onmousemove={(event) => hits.handle_mouse_movement_at(new Point(event.clientX, event.clientY))}
	onmousedown={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.down(event, null))}
	onmouseup={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.up(event, null))} />

{#if $w_no_server}
	<!-- Nothing is said while the dispatcher is down: it is asked again every second and a half,
	     and the page starts itself over the moment it answers. Naming the fault would only ask
	     for something that is already being done. -->
	<div class='launch'>setting up the overview browser...</div>
{:else if $w_app === S_App.launch}
	<div class='launch'>setting up the overview browser...</div>
{:else}

{#if showBuildNotes}
	<div
		class='build-backdrop'
		role='button'
		tabindex='-1'
		onkeyup={() => {}}
		onclick={() => showBuildNotes = false}>
		<BuildNotes onclose={() => showBuildNotes = false} />
	</div>
{/if}

<div class='frame' style:width='{width}px' style:height='{height}px'>
	<Controls onclick={toggle_details} detailsShown={$w_show_details} {buildNumber} {restarting} onRestart={restart} onBuildOpen={() => { showBuildNotes = true; debug.log(`Build notes: opened, showing build ${buildNumber}.`); }} />
	<div class='boxes'>
		{#if $w_show_details}
			<Details width={details_width} />
		{/if}
		{#if !details_only}
			<Operation width={content_width} />
		{/if}
	</div>
	<!-- Along the bottom, as wide as the window, and only while there is something to say
	     that fits there — too much to say is read as a report in the content box instead. -->
	{#if $w_show_status && $w_operation !== T_Operation.report}
		<Status_Line />
	{/if}
</div>

<!-- The one hover hint for the whole app; each element opts in by carrying its own words. -->
<ToolTip message={$w_tip.message} mouseX={$w_tip.x} mouseY={$w_tip.y} appearance={$w_tip.appearance} />

{/if}

<style>
	/* While the guides are being read: nothing but these words, centered both ways. */
	.launch {
		font-size       : var(--em);
		color           : var(--text);
		padding         : var(--gap);
		box-sizing      : border-box;
		justify-content : center;
		align-items     : center;
		position        : fixed;
		text-align      : center;
		display         : flex;
		inset           : 0;
	}

	.frame {
		background     : var(--accent);
		padding        : var(--gap);
		gap            : var(--gap);
		flex-direction : column;
		box-sizing     : border-box;
		position       : fixed;
		display        : flex;
		overflow       : hidden;
		top            : 0;
		left           : 0;
	}

	/* The build notes sit over everything, on the accent, and a click anywhere shuts them. */
	.build-backdrop {
		background      : var(--accent);
		z-index         : calc(var(--z-frontmost) + 2);
		justify-content : center;
		align-items     : center;
		position        : fixed;
		display         : flex;
		inset           : 0;
	}

	/* The two side-by-side boxes, below the controls row. */
	.boxes {
		gap        : var(--gap);
		overflow   : visible;    /* the editor's top clickable pokes above the regions; the frame still clips at the window */
		display    : flex;
		min-height : 0;
		flex       : 1;
	}

	:global(:root) {
		/* The typeface. Not a step on any ladder, so it keeps a name of its own —
		   --font is the middle size, and the two must not share a word. */
		--family: system-ui, sans-serif;
	}

	:global(body) {
		font-weight : var(--fw);
		font-family : var(--family);
		color       : var(--text);
		user-select : none;
		margin      : 0;
	}

	:global(button, input, select, textarea) {
		font-weight : var(--fw);
		font-family : var(--family);
	}

	:global(input:focus, textarea:focus) {
		user-select : text;
	}
</style>
