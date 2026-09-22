<script lang='ts'>
	import { w_operation, T_Operation, close_view, open_view, open_button, name_of, step_view } from '../../ts/managers/Operations';
	import { w_viewed, w_can_back, w_can_forward, w_file_back, w_file_forward, w_file_site } from '../../ts/managers/Operations';
	import { obsidian_link, file_path_of, read_file, VAULT } from '../../ts/utilities/Saving';
	import { T_Bundle, key_of } from '../../ts/types/File';
	import { customizations } from '../../ts/common/Customizations';
	import { files } from '../../ts/managers/Files';
	import { hit_target } from '../../ts/common/Core';
	import { svg_paths, back_direction } from '../../ts/common/Core';
	import { Steppers } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';

	// The controls row's right end, handed to panel, which draws the hamburger at the row's left
	// and the host's name in its middle. Browsing, the host's open buttons come first, next to the
	// hamburger, each opening one file in the editor; the dispatcher at the right starts over and
	// the build number beyond it opens the notes. Editing, the row is a section of its own — the
	// steppers, the count, the folders, the file's name, and the four buttons — with the way back to
	// the list first, between the hamburger and the section, since 15 September 2026.
	let { buildNumber, onBuildOpen, onRestart, restarting }:
		{ buildNumber: number; onBuildOpen: () => void; onRestart: () => void; restarting: boolean } = $props();

	// The way back to the list while a file is open, between the hamburger and the section, drawn as the report's
	// close button: a round white button holding the cross, the same path the delete question's
	// keep button draws, since 15 September 2026.

	// The file being read, and what it is called. Nothing while browsing.
	const guide   = $derived($w_viewed?.file ?? null);
	const name    = $derived(guide?.name ?? '');
	const editing = $derived($w_operation === T_Operation.edit && guide !== null);

	// Where the file sits as well as what it is called: every folder above it, from the top down.
	// A file in a project starts with that project; one belonging to no project starts with the
	// repo's own name instead. A file in the memory system starts with its project's folder
	// there — the memory folder itself is left off, since every one of them sits in it.
	const sits_at = $derived.by(() => {
		if (!guide) { return ''; }
		const folders = guide.path.split('/').slice(0, -1);
		const top = guide.bundle === T_Bundle.mono ? ['mono'] : guide.bundle === T_Bundle.memory ? [] : [guide.bundle];
		return [...top, ...folders].join(' / ');
	});

	// The file's name is a field that reads as plain words until the cursor is over it. Typing in
	// it changes nothing until the field is left or Return is pressed; either gives the file
	// itself the name typed.
	let typed_name = $state('');

	// Whenever another file comes on screen, the field starts from that file's own name.
	$effect(() => { typed_name = name; });

	// The field is as wide as what is typed in it, so every key moves everything beside it in the
	// row. Each one says so — measured once the drawing is done, when the new width is known.
	$effect(() => {
		typed_name;
		hits.defer_recalibrate();
	});

	// Throwing this file away is asked about first: the trash button at the right of the row
	// gives way to a cross, and the question sits there until it is answered.
	let asking_to_delete = $state(false);
	const crossPath = svg_paths.x_cross(k.size.normal, k.size.normal / 6);
	// The resume-browsing mark: the steppers' back mark, their lines as they are in Steppers.svelte.
	const SIZE = k.size.normal * 1.1;
	const back_path   = svg_paths.fat_polygon(SIZE, back_direction(false));
	const back_bounds = svg_paths.fat_polygon_bounds(SIZE, back_direction(false));
	const binPath   = svg_paths.trashcan(k.size.normal);

	// Stepping to another file takes the question with it — it belonged to the one being left.
	$effect(() => { guide?.address; asking_to_delete = false; });

	// Where a file is sent when it is handed on.
	const SENT_TO = 'sand@gizmolab.com';

	/**
	 * Hand this file to Obsidian. The repo is itself a vault, so where the file sits counting
	 * from the top of the repo is also where it sits in the vault.
	 */
	function handle_obsidian() {
		if (!guide) { return; }
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": handing it to Obsidian at ${where}.`);
		window.location.href = obsidian_link(VAULT, where);
	}

	/**
	 * Open a new message with this file already in it: the file's name for a subject, its whole
	 * content for the body. The content is read from the file now — the editor holds it, this
	 * row does not. Nothing is written, moved or thrown away — the message is the reader's to
	 * send or drop.
	 */
	function handle_send() {
		if (!guide) { return; }
		const where = file_path_of(guide.bundle, guide.path);
		read_file(where).then((answer) => {
			if (answer.text === null) {
				debug.log(`Editing "${name}": could not read ${where} to send it — ${answer.why}.`);
				return;
			}
			const body = answer.text;
			const to = `mailto:${SENT_TO}?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
			debug.log(`Editing "${name}": handing it on to ${SENT_TO} — ${body.length} character(s) in the message.`);
			window.location.href = to;
		});
	}

	/**
	 * Make a new file in the same folder as this one and open it. It arrives named "unnamed",
	 * labeled as something to refer to and marked as the one being worked on, so the very next
	 * thing to do is give it a name — which the field in this row is already for.
	 */
	function handle_create() {
		if (!guide) { return; }
		debug.log(`Editing "${name}": making a new file beside it.`);
		files.create_beside(guide).then((made) => { if (made) { open_view(key_of(made)); } });
	}

	/** Throw this file away. Only if the file itself goes does the view go back to the list. */
	function handle_delete() {
		if (!guide) { return; }
		asking_to_delete = false;
		debug.log(`Editing "${name}": throwing it away.`);
		files.delete_one(guide).then((gone) => { if (gone) { close_view(); } });
	}

	/**
	 * Give the file itself a different name: the file, every link naming it, and the index
	 * beside it are put right together. A name unchanged, or emptied, does nothing.
	 */
	function handle_rename() {
		if (!guide) { return; }
		const said = typed_name.trim();
		if (said === '' || said === name) {
			typed_name = name;
			return;
		}
		debug.log(`Editing "${name}": renaming it to "${said}".`);
		// The view follows the file to its new place on its own; a rename that was refused puts
		// the old name back in the field.
		files.rename(guide, said).then((now_at) => { if (now_at === '') { typed_name = name; } });
	}
</script>

<div class='controls-row layer-controls' class:editing={editing && !!guide}>
	{#if editing && guide}
		<!-- The way back, between the hamburger and the file's section, a gap off each, since
		     15 September 2026. -->
		<button class='back-button' aria-label='resume browsing'
			use:hit_target={{ id: 'controls.back', onpress: close_view, tip: 'resume browsing' }}>
			<!-- The steppers' back mark, drawn as Steppers.svelte draws it, since 22 September 2026; a
			     circle before. The cross it always had lies over the mark, centered. -->
			<svg class='back-mark' overflow='visible' width={back_bounds.width} height={back_bounds.height}
				viewBox='{back_bounds.minX} {back_bounds.minY} {back_bounds.width} {back_bounds.height}'><path d={back_path} /></svg>
			<svg class='back-cross' viewBox='0 0 {k.size.normal} {k.size.normal}'>
				<path d={crossPath} fill='none' stroke-width={k.thickness.micro} stroke-linecap='round' />
			</svg>
		</button>
		<!-- The file's section. Its bare space answers nothing. -->
		<div class='file-section'>
			<Steppers id='editor.step' can_back={$w_can_back} can_forward={$w_can_forward}
				onprev={(repeated) => step_view(-1, repeated)} onnext={(repeated) => step_view(1, repeated)}
				back_says={$w_file_back ?? 'previous file'} forward_says={$w_file_forward ?? 'next file'} />
			<!-- Which of the files the filters leave is being read, and how many there are, after the
			     steppers. Nothing while reading off the list, on a run of files reached by links. -->
			{#if $w_file_site}
				<span class='file-count'>{$w_file_site.at} of {$w_file_site.of}</span>
			{/if}
			<!-- The folders above the file follow the count at the left. -->
			<span class='view-ancestry'>{sits_at}</span>
			<!-- An empty run on either side, so the name sits at the middle of whatever the folders
			     leave over rather than at the middle of the whole row. -->
			<span class='view-spacer'></span>
			<!-- The name is a field that reads as plain words until the cursor is over it. Leaving
			     it, or pressing Return, gives the file itself whatever was typed. While the
			     question about throwing the file away is up, the name steps aside — the question
			     already says which file it means. -->
			{#if !asking_to_delete}
			<input
				class='view-name'
				size={Math.max(1, typed_name.length)}
				bind:value={typed_name}
				use:hit_target={{ id: 'editor.field.name', tip: 'change the file\'s name' }}
				onclick={(e) => (e.currentTarget as HTMLInputElement).focus()}
				onblur={handle_rename}
				onkeydown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter') { (e.currentTarget as HTMLInputElement).blur(); }
					if (e.key === 'Escape') { typed_name = name; (e.currentTarget as HTMLInputElement).blur(); }
				}} />
			{/if}
			<span class='view-spacer'></span>
			<!-- Asking in words rather than in a box of its own: the trash button asks, and the
			     question that takes its place is the thing that answers. -->
			{#if asking_to_delete}
				<button class='asking-yes'
					use:hit_target={{ id: 'editor.delete.yes', onpress: handle_delete, tip: 'throw it away for good' }}>delete "{name}"</button>
				<button class='row-button' aria-label='keep it'
					use:hit_target={{ id: 'editor.delete.no', onpress: () => { asking_to_delete = false; }, tip: 'keep this file' }}>
					<svg class='row-mark' viewBox='0 0 {k.size.normal} {k.size.normal}'>
						<path d={crossPath} fill='none' stroke-width={k.thickness.micro} stroke-linecap='round' />
					</svg>
				</button>
			{:else}
				<!-- The four sit together at the end of the row: make one beside this file, open it
				     in Obsidian, hand it on, or throw it away. The making comes first and the
				     throwing away last, so the one that cannot be undone sits furthest from the
				     one taken most often. -->
				<span class='row-pair'>
					<button class='row-button' aria-label='new'
						use:hit_target={{ id: 'editor.new', onpress: handle_create, tip: 'make a new file in this folder' }}>+</button>
					<button class='row-button lifted' aria-label='obsidian'
						use:hit_target={{ id: 'editor.obsidian', onpress: handle_obsidian, tip: 'open this file in Obsidian' }}>o</button>
					<button class='row-button' aria-label='send'
						use:hit_target={{ id: 'editor.send', onpress: handle_send, tip: 'compose an email containing this file' }}>⤴</button>
					<button class='row-button' aria-label='delete'
						use:hit_target={{ id: 'editor.delete', onpress: () => { asking_to_delete = true; }, tip: 'throw this file away' }}>
						<svg class='row-mark' viewBox='0 0 {k.size.normal} {k.size.normal}'>
							<path d={binPath} fill='none' stroke-width={k.thickness.micro} stroke-linecap='round' stroke-linejoin='round' />
						</svg>
					</button>
				</span>
			{/if}
		</div>

	{:else}
		<!-- The host's open buttons, first, next to the hamburger since 15 September 2026, as one
		     segmented control since 17 September 2026: one segment per button, each opening one file
		     in the editor, the file named by its key in the configuration. A segment fills under the
		     cursor and answers a press; none is ever current, since opening a file picks nothing. The
		     press says which button, so the steppers walk the open buttons while the file is open. -->
		{#if customizations.open_buttons.length > 0}
			<div class='segments'>
				{#each customizations.open_buttons as open, at (open.key)}
					<button class='segment'
						use:hit_target={{ id: `controls.open.${open.title}`, onpress: () => open_button(at), tip: `open ${name_of(open.key) ?? open.key}` }}>
						{open.title}
					</button>
				{/each}
			</div>
		{/if}
		<span class='spacer'></span>
		<!-- While it is starting over it answers nothing, so it hands the manager no press and no
		     words — the same as being disabled, said the one way a target can say it. -->
		<button class='build-button' disabled={restarting}
			use:hit_target={{ id: 'controls.dispatcher', onpress: restarting ? undefined : onRestart,
				tip: restarting ? null : 'start the dispatcher over, so changed code is the code answering' }}>
			{restarting ? 'restarting...' : 'dispatcher'}
		</button>
		<button class='build-button'
			use:hit_target={{ id: 'controls.build', onpress: onBuildOpen, tip: 'show build notes' }}>
			build {buildNumber}
		</button>
	{/if}
</div>

<style>
	.controls-row {
		/* The right end of panel's row, taking whatever the hamburger leaves: items centered, no
		   vertical gap — the row is just as tall as its controls. */
		background  : var(--accent);
		gap         : var(--gap);
		box-sizing  : border-box;
		position    : relative;
		align-items : center;
		display     : flex;
		min-width   : 0;
		flex        : 1 1 auto;
	}

	/* The row pulls left by a big gap, so its first button sits closer to the hamburger, since
	   15 September 2026: the open buttons while browsing, the way back while a file is open,
	   the two left edges the same. */
	.controls-row {
		margin-left : calc(var(--gap-big) * -1);
	}

	/* The section holds no padding at its left, so the steppers begin a gap after the way back,
	   the row's own gap, since 15 September 2026. */
	.controls-row.editing .file-section {
		padding-left : 0;
	}

	/* Between the hamburger and the file's section: the steppers' back mark, its styles as in
	   Steppers.svelte — white inside with an accent outline, filling to the hover color under the
	   cursor — with the cross laid over it. */
	.back-button {
		background      : transparent;
		position        : relative;
		flex            : 0 0 auto;
		cursor          : pointer;
		justify-content : center;
		align-items     : center;
		display         : flex;
		border          : none;
		padding         : 0;
	}

	.back-button .back-mark path {
		stroke-width : var(--thick-micro);
		stroke       : var(--black);
		fill         : var(--white);
	}

	.back-button:global([data-hit]) .back-mark path {
		fill : var(--hover);
	}

	/* The cross sits over the mark, centered on it, out of the flow so the mark alone sizes the button. */
	.back-cross {
		transform : translate(-40%, -50%);
		width     : var(--size-tiny);
		height    : var(--size-tiny);
		position  : absolute;
		display   : block;
		left      : 50%;
		top       : 50%;
	}

	.back-cross path {
		stroke : var(--black);
	}

	/* Takes up whatever is left, so the hamburger stays at the left and the two
	   named buttons stay together at the right. */
	/* The open buttons' segmented control, drawn as the rules' and the kinds row's: one box, the
	   segments divided by lines, a segment filling under the cursor. No segment is ever current. */
	.segments {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height);
		background    : var(--white);
		box-sizing    : border-box;
		overflow      : hidden;
		display       : flex;
		flex-shrink   : 0;
	}

	.segment {
		padding     : var(--pad-control);
		font-size   : var(--font-tiny);
		background  : transparent;
		font-family : inherit;
		white-space : nowrap;
		color       : var(--text);
		cursor      : pointer;
		border      : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thick) solid var(--black);
	}

	.segment:global([data-hit]) {
		background : var(--hover);
	}

	.spacer {
		flex : 1;
	}

	.build-button {
		border        : var(--thick) solid var(--black);
		height        : var(--height);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font);
		background    : var(--white);
		color         : var(--gray);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.build-button:global([data-hit]) {
		background : var(--hover);
	}

	/* While the dispatcher is starting over there is nothing to press, so it stays white
	   under the pointer and the pointer stays an arrow. */
	.build-button:disabled,
	.build-button:disabled:global([data-hit]) {
		background : var(--white);
		cursor     : default;
	}

	/* The file's section: on the accent since 15 September 2026, its words in the accent's own
	   text color, its corners rounded as the content box below it, as tall as the row the
	   hamburger sets. */
	.file-section {
		border-radius : var(--radius);
		background    : var(--accent);
		padding       : 0 var(--gap);
		gap           : var(--gap);
		align-self    : stretch;
		align-items   : center;
		display       : flex;
		flex          : 1 1 auto;
		min-width     : 0;
	}

	/* The step marks are drawn a touch taller than a control. Held to a control's height they
	   still show whole — they are allowed to spill. */
	.file-section :global(.steppers) {
		height : var(--height);
	}

	/* On the accent, core's accent stroke would vanish, so the triangles are edged in black here,
	   the faint thickness, since 15 September 2026. */
	.file-section :global(.steppers .step path) {
		stroke-width : var(--thick-micro);
		stroke       : var(--black);
	}

	/* The empty run either side of the name. */
	.view-spacer {
		flex : 1 1 auto;
	}

	/* Which file of the run is on screen, reading like the folders beside it. As wide as what it
	   says, so it sits at the section's left edge; the step marks move as the count's digits do. */
	.file-count {
		opacity     : var(--opacity-header);
		color       : var(--text-on-accent);
		font-size   : var(--font-tiny);
		flex        : 0 0 auto;
		white-space : nowrap;
	}

	/* The folders above the file, just right of the steppers. */
	.view-ancestry {
		opacity      : var(--opacity-header);
		font-size    : var(--font-tiny);
		margin-left  : var(--gap-tiny);
		color        : var(--text-on-accent);
		position     : relative;
		flex         : 0 1 auto;
		overflow     : hidden;
		white-space  : nowrap;
		min-width    : 0;
	}

	/* The four at the end of the row sit one gap apart. */
	.row-pair {
		gap         : var(--gap);
		flex        : 0 0 auto;
		align-items : center;
		display     : flex;
	}

	/* A round button at the end of the row: white inside a hairline edge, filling under the
	   cursor — the same look every other small button in the app wears. */
	.row-button {
		border          : var(--thick-small) solid var(--black);
		border-radius   : var(--radius-percent);
		background      : var(--white);
		height          : var(--size);
		width           : var(--size);
		font-size       : var(--font);
		color           : var(--text);
		box-sizing      : border-box;
		flex            : 0 0 auto;
		cursor          : pointer;
		font-family     : inherit;
		justify-content : center;
		align-items     : center;
		display         : flex;
		padding         : 0;
		line-height     : 1;
	}

	.row-button:global([data-hit]) {
		background : var(--hover);
	}

	/* A letter sits lower in its own line than a drawn mark does, so the letter is nudged up
	   within its circle rather than the whole button being moved. */
	.row-button.lifted {
		padding-bottom : var(--gap-small);
	}

	.row-mark {
		width   : var(--size-small);
		height  : var(--size-small);
		stroke  : var(--black);
		display : block;
		fill    : none;
	}

	/* The question itself is the button that answers it, sitting where the row's other words
	   sit and reading as an ordinary control. */
	.asking-yes {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 0 auto;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.asking-yes:global([data-hit]) {
		background : var(--hover);
	}

	/* The file's own name, in the middle of what the folders leave over. It is a field, but
	   reads as plain words: no edge, no fill, and only as wide as the name itself. The edge is
	   held see-through rather than absent, so nothing shifts when it appears. */
	.view-name {
		border        : var(--thick-faint) solid transparent;
		border-radius : var(--radius-pill);
		padding       : 0 var(--gap-tiny);
		font-size     : var(--font-fat);
		background    : transparent;
		color         : var(--text-on-accent);
		box-sizing    : border-box;
		flex          : 0 1 auto;
		font-family   : inherit;
		text-align    : center;
		white-space   : nowrap;
		cursor        : text;
		outline       : none;
		min-width     : 0;
	}

	/* Under the cursor it shows what it is; with the cursor in it, it reads as a field being
	   typed in. */
	.view-name:hover {
		border-color : var(--black);
		background   : var(--hover);
	}

	.view-name:focus {
		border-color : var(--black);
		background   : var(--white);
	}
</style>
