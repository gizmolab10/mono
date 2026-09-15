<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { w_command_down, w_operation, w_option_down, w_viewed, T_Operation } from '../../ts/managers/Operations';
	import { files } from '../../ts/managers/Files';
	import { files_on_disk, restart_dispatcher } from '../../ts/utilities/Saving';
	import { colors } from '../../ts/common/Core';
	import { Point } from '../../ts/common/Core';
	import { S_Mouse } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { w_app, S_App } from '../../ts/types/App';
	import { c } from '../../ts/common/Core';
	import { customizations } from '../../ts/common/Customizations';
	import { debug } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import { hide_status, show_status_as_report, take_the_offer, w_offer, w_show_status, w_status } from '../../ts/managers/Status';
	import { BuildNotes } from '../../ts/common/Core';
	import { Panel } from '../../ts/common/Panel';
	import { type File } from '../../ts/types/File';
	import type { Snippet } from 'svelte';
	import Operation from './Operation.svelte';
	import Controls from './Controls.svelte';
	import Details from './Details.svelte';

	// kb's page, which a host's App.svelte draws. It draws panel and hands panel kb's own four: the
	// controls row's right end, the details column, the operation view and the status line. What the
	// host hands kb comes two ways: the facts in Customizations.ts, filled before this mounts, and
	// these four snippets, each optional and each rendered in one place — a filter among browse's,
	// after tag; the edit filter section, given the file, its words and a call that sets them, above
	// the kinds row; a
	// section in the details column, below the rules; and the operation view, given the file, the
	// width and height the frame gives it, the words and a call that sets them, a call that takes the
	// html, and calls for drawn, redrawn and a note, in Edit_Markdown's place inside the editor frame. Where a host hands none, kb draws nothing
	// there once the piece has moved out; until then kb draws the piece as it did in ov.
	let { browse_filter, edit_filter, details_section, operation_view }: {
		browse_filter?   : Snippet;
		edit_filter?     : Snippet<[File, string, (words: string) => void]>;
		details_section? : Snippet;
		operation_view?  : Snippet<[File, number, number, string, (words: string) => void, (page: HTMLElement | null) => void, () => void, () => void, (message: string) => void]>;
	} = $props();

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

	// The latest build number, read from the build notes table the host hands over. No table, no number.
	const builds = customizations.builds.split('\n')
		.filter((line) => /^\|\s*\d+/.test(line))
		.map((line) => parseInt(line.split('|')[1].trim()));
	const buildNumber = builds.length > 0 ? Math.max(...builds) : 0;

	let showBuildNotes = $state(false);

	// The dispatcher is the only thing that reads and writes the files, so changing its code means
	// starting it over. The button's own face is the whole report — nothing goes to the status
	// line, which is for what the files are doing.
	let restarting = $state(false);

	async function restart() {
		restarting = true;
		const answer = await restart_dispatcher();
		restarting = false;
		debug.log(`Dispatcher: asked to start over — ${answer.ok ? 'it is answering again.' : `it did not come back: ${answer.why}.`}`);
	}

	// Whether details shows at all is the hamburger's doing, panel's hamburger now, and it is
	// remembered across visits. Panel works out the two regions' widths from the window itself.
	const w_show_details = preferences.persistent<boolean>(T_Preference.show_details, true);

	function toggle_details() {
		const next = !$w_show_details;
		w_show_details.set(next);
		debug.log(`Hamburger clicked: details are now ${next ? 'showing' : 'hidden'}.`);
	}

	// While a file is open, the controls row holds the file's own section across it, so the host's
	// name yields: panel is handed none.
	const editing = $derived($w_operation === T_Operation.edit && $w_viewed !== null);
</script>

<!-- The cursor is fed to the manager here and nowhere else: it asks which targets hold that point
     and hands the press to the one of highest precedence. A control that has moved over to it
     watches nothing itself. -->
<svelte:window
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
		<BuildNotes table={customizations.builds} onclose={() => showBuildNotes = false} />
	</div>
{/if}

<!-- kb's own four, handed to panel: the controls row's right end, less the hamburger panel draws;
     the details column, given its width; the operation view, given its width and height; and the
     status line's words and offer, along the bottom, only while there is something to say that
     fits there — too much to say is read as a report in the content box instead. -->
{#snippet controls()}
	<Controls {buildNumber} {restarting} onRestart={restart} onBuildOpen={() => { showBuildNotes = true; debug.log(`Build notes: opened, showing build ${buildNumber}.`); }} />
{/snippet}
{#snippet details(width: number)}
	<Details {width} section={details_section} />
{/snippet}
{#snippet operation(width: number, height: number)}
	<Operation {width} {height} {browse_filter} {edit_filter} {operation_view} />
{/snippet}

<Panel name={editing ? '' : customizations.name} details_shown={$w_show_details} ontoggle={toggle_details}
	{controls} {details} {operation}
	status={$w_show_status && $w_operation !== T_Operation.report ? $w_status : ''}
	offer={$w_offer} ontake={take_the_offer} onhide={hide_status} onreport={show_status_as_report} />

{/if}

<style>
	/* While the files are being read: nothing but these words, centered both ways. */
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

	/* The page's own rules, the typeface and the body, are panel's. This one is kb's: a field being
	   typed in can be picked from, where the page as a whole cannot. */
	:global(input:focus, textarea:focus) {
		user-select : text;
	}
</style>
