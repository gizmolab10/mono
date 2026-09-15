<script lang='ts'>
	import { w_operation, T_Operation, close_view, open_view, step_view } from '../../ts/managers/Operations';
	import { w_viewed, w_can_back, w_can_forward, w_file_back, w_file_forward, w_file_site } from '../../ts/managers/Operations';
	import { obsidian_link, file_path_of, read_file, VAULT } from '../../ts/utilities/Saving';
	import { T_Bundle, key_of } from '../../ts/types/File';
	import { customizations } from '../../ts/common/Customizations';
	import { files } from '../../ts/managers/Files';
	import { hit_target } from '../../ts/common/Core';
	import { svg_paths } from '../../ts/common/Core';
	import { Direction } from '../../ts/common/Core';
	import { Steppers } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';

	// The controls row's right end, handed to panel, which draws the hamburger at the row's left
	// and the host's name in its middle. Browsing, the host's open buttons come first, each opening
	// one file in the editor, then the dispatcher at the right starts over, and the
	// build number beyond it opens the notes. Editing, the way back to the list follows the
	// hamburger, and the rest of the row is a section of its own — the steppers, the count, the
	// folders, the file's name, and the four buttons — and the name yields to it.
	let { buildNumber, onBuildOpen, onRestart, restarting }:
		{ buildNumber: number; onBuildOpen: () => void; onRestart: () => void; restarting: boolean } = $props();

	// The way back to the list while a file is open, drawn as the fat triangle the steppers
	// use, pointing left — the direction the list lies in. Two pixels smaller than the steppers',
	// and held to the hamburger's height, so the hamburger sets the row's.
	const BACK = k.size.fat - 2;
	const backPath = svg_paths.fat_polygon(BACK, Direction.left);

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

<div class='controls-row layer-controls'>
	{#if editing && guide}
		<button class='back-button' aria-label='resume browsing'
			use:hit_target={{ id: 'controls.back', onpress: close_view, tip: 'resume browsing' }}>
			<svg class='back-icon' viewBox='0 0 {BACK} {BACK}' width={BACK} height={BACK}>
				<path d={backPath} />
			</svg>
		</button>
		<!-- The heavy line between the way back and the file's section: the accent's own width,
		     with no hairline. -->
		<div class='upright-line'></div>
		<!-- The file's section. Its bare space answers nothing: the way back is the button beside it. -->
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
						<path d={crossPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' />
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
							<path d={binPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' stroke-linejoin='round' />
						</svg>
					</button>
				</span>
			{/if}
		</div>
	{:else}
		<!-- The host's open buttons, at the left next to the hamburger: each opens one file in the
		     editor, the file named by its key in the configuration. -->
		{#each customizations.open_buttons as open (open.key)}
			<button class='build-button'
				use:hit_target={{ id: `controls.open.${open.title}`, onpress: () => { debug.log(`Open button "${open.title}" pressed: opening ${open.key}.`); open_view(open.key); }, tip: `open ${open.title}` }}>
				{open.title}
			</button>
		{/each}
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

	/* One gap off the hamburger, drawn the way the list draws its pointers — an outline, not a
	   fill. Held to the hamburger's height, its triangle allowed to spill, so it never sets the
	   row's height. */
	.back-button {
		margin-left : calc(var(--gap-big) * -1);
		height      : var(--size-big);
		background  : transparent;
		overflow    : visible;
		cursor      : pointer;
		align-items : center;
		display     : flex;
		border      : none;
		padding     : 0;
	}

	.back-icon path {
		stroke       : var(--black);
		fill         : var(--white);
		stroke-width : 0.7px;
	}

	/* Under the cursor the triangle's own body takes the hover color — the stamp comes from the
	   manager, like every other control's. */
	.back-button:global([data-hit]) .back-icon path {
		fill : var(--hover);
	}

	/* Takes up whatever is left, so the hamburger stays at the left and the two
	   named buttons stay together at the right. */
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

	/* The heavy line: as wide as the stack's heavy lines are thick, the row's height, the accent
	   showing through, no hairline. It sits flush against the section, as a heavy line sits on a
	   section's top edge, and a tiny gap off the back button rather than the row's own gap. */
	.upright-line {
		margin-right : calc(var(--gap) * -1);
		margin-left  : calc(var(--gap-tiny) - var(--gap));
		width        : var(--thick-huge);
		align-self   : stretch;
		flex         : 0 0 auto;
	}

	/* The file's section: on the page color, its corners rounded as the content box below it,
	   as tall as the row the hamburger sets. */
	.file-section {
		border-radius : var(--radius);
		background    : var(--bg);
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

	/* The empty run either side of the name. */
	.view-spacer {
		flex : 1 1 auto;
	}

	/* Which file of the run is on screen, reading like the folders beside it. As wide as what it
	   says, so it sits at the section's left edge; the step marks move as the count's digits do. */
	.file-count {
		opacity     : var(--opacity-header);
		font-size   : var(--font-tiny);
		color       : var(--text);
		flex        : 0 0 auto;
		white-space : nowrap;
	}

	/* The folders above the file, just right of the steppers. */
	.view-ancestry {
		opacity      : var(--opacity-header);
		font-size    : var(--font-tiny);
		margin-left  : var(--gap-tiny);
		color        : var(--text);
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
		color         : var(--text);
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
