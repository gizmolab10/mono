<script lang='ts'>
	import { report_gaps_below_lines, report_line_spacing } from '../../ts/common/Core';
	import { w_file_back, w_file_forward, w_file_site, w_search_at, w_search_for, open_view } from '../../ts/managers/Operations';
	import { obsidian_link, file_path_of, VAULT } from '../../ts/utilities/Saving';
	import { T_Bundle, key_of, type File } from '../../ts/types/File';
	import Markdown_Editor from '../content/Markdown_Editor.svelte';
	import Editor_Filters from '../filter/Editor_Filters.svelte';
	import { T_Hit_Target } from '../../ts/common/Core';
	import { svg_paths } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import { WAY_OUT } from '../../ts/common/Core';
	import { w_search_text } from '../../ts/managers/Filters';
	import { Steppers } from '../../ts/common/Core';
	import { files } from '../../ts/managers/Files';
	import { debug } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import Search from '../filter/Search.svelte';
	import { hits } from '../../ts/common/Core';
	import { get } from 'svelte/store';

	// Show one file. This is the frame: the top row that says which file it is and what can be
	// done to it, then the three things stacked under it — looking through the file, what it is
	// labeled, and the file's own words. Each of those owns its own workings; what they share
	// is here — the whole file's text, and the line at the bottom that speaks up briefly.
	//
	// Which of the files is on screen, and the run they were stepped through, is the list's;
	// here we only draw the controls and call back.
	let { name, address, tags, guide, onclose, can_back = false, can_forward = false, onprev = () => {}, onnext = () => {} }:
		{ name: string; address: string; tags: string[]; guide: File; onclose: () => void; can_back?: boolean; can_forward?: boolean; onprev?: (repeated?: boolean) => void; onnext?: (repeated?: boolean) => void } = $props();

	// The whole file, held only while it is on screen. Two of the three below write to it: the
	// labels at the top, and a piece of the words being changed. One place holds it, so neither
	// can be working from a stale copy.
	let text_of_file = $state('');

	// The drawn words, so a search can look inside them.
	let page = $state<HTMLElement | null>(null);

	// The search is held so the frame can reach it: a file just drawn, or drawn again, has to be
	// told to look through the new words rather than the ones it highlighted before.
	let find: ReturnType<typeof Search> | null = $state(null);

	// A press on the empty part of either top row goes back to the list; the things in those
	// rows that answer for themselves are left alone. The Escape key does the same.
	// The way back to the list is every bare piece of the two top rows and of the label rows, and
	// the whole of it lights at once. Both are targets of the middle kind, so anything in them
	// that answers for itself takes the cursor first; whichever of the two the manager names,
	// both light — one name for the pair, asked here.
	const w_s_hover = hits.w_s_hover;
	let way_out_lit = $derived(($w_s_hover?.id ?? '').includes(WAY_OUT));

	// Whether the label form is put away. Folded, it stands flat, so the words below draw no line
	// of their own — the form's own line is already standing there.
	let filters_folded = $state(false);

	// What the stack of lines is holding, said to the log once the browser has drawn them. It is
	// read again whenever a fold changes or another file opens, since those are what move them.
	$effect(() => {
		filters_folded; address;
		const soon = setTimeout(() => { report_line_spacing('the editor'); report_gaps_below_lines('the editor'); }, k.timeout.slide);
		return () => clearTimeout(soon);
	});


	// The title says where the file sits as well as what it is called: every folder above it,
	// from the top down. A file in a project starts with that project; one belonging to no
	// project starts with the repo's own name instead.
	const sits_at = $derived.by(() => {
		const folders = guide.path.split('/').slice(0, -1);
		const top = guide.bundle === T_Bundle.mono ? ['mono'] : [guide.bundle];
		return [...top, ...folders].join(' / ');
	});

	/** Escape closes the file; the left and right keys step to the one before or after. */
	function on_key(event: KeyboardEvent) {
		if (event.key === 'Escape') { onclose(); return; }
		const back = event.key === 'ArrowLeft';
		if (!back && event.key !== 'ArrowRight') { return; }
		event.preventDefault();
		// The key held down repeats on its own; a file that raised something stops that walk,
		// exactly as holding a step mark does.
		if (back) { onprev(event.repeat); } else { onnext(event.repeat); }
	}

	$effect(() => {
		window.addEventListener('keydown', on_key);
		return () => window.removeEventListener('keydown', on_key);
	});

	// What a dead link, or a refused write, has to say — briefly, on a line along the bottom.
	let note = $state('');
	let note_wait: ReturnType<typeof setTimeout> | null = null;

	function say(words_to_show: string) {
		note = words_to_show;
		if (note_wait !== null) { clearTimeout(note_wait); }
		note_wait = setTimeout(() => { note = ''; }, 4000);
	}

	// The line takes its height from the words in it, and everything above it is that much
	// shorter. Arriving, leaving, and running to a second line each move the words above, so
	// each says so — measured once the drawing is done, when the new height is known.
	$effect(() => {
		note;
		hits.defer_recalibrate();
	});

	/**
	 * A file has just been read and drawn. Anything highlighted belonged to the drawing before
	 * it, and the words in the field are looked for again in this one — so coming back from the
	 * list, or from a refresh, lands where the search left off. A file with fewer places than
	 * that wraps back into range on its own.
	 */
	function drawn() {
		find?.forget();
		// A dead link picked out of a report asks for its own words to be highlighted here.
		const wanted = get(w_search_for);
		if (wanted !== '') {
			w_search_for.set('');
			w_search_text.set(wanted);
			requestAnimationFrame(() => find?.light_hit(0));
			return;
		}
		if (get(w_search_text) !== '') {
			const was_at = get(w_search_at);
			requestAnimationFrame(() => find?.light_hit(was_at));
		}
	}

	// The file's name in the top row is a field that reads as plain words until the cursor is
	// over it. Typing in it changes nothing until the field is left or Return is pressed; either
	// gives the file itself the name typed.
	let typed_name = $state('');

	// Whenever another file comes on screen, the field starts from that file's own name.
	$effect(() => { typed_name = name; });

	// The field is as wide as what is typed in it, so every key moves everything standing beside
	// it in the row. Each one says so — measured once the drawing is done, when the new width is
	// known.
	$effect(() => {
		typed_name;
		hits.defer_recalibrate();
	});

	// Throwing this file away is asked about first: the trash mark at the right of the row
	// gives way to a cross, and the question stands over the words until it is answered.
	let asking_to_delete = $state(false);
	const crossPath = svg_paths.x_cross(k.size.normal, k.size.normal / 6);
	const binPath   = svg_paths.trashcan(k.size.normal);

	// Stepping to another file takes the question with it — it belonged to the one being left.
	$effect(() => { address; asking_to_delete = false; });

	// Where a file is sent when it is handed on.
	const SENT_TO = 'sand@gizmolab.com';

	/**
	 * Hand this file to Obsidian. The repo is itself a vault, so where the file sits counting
	 * from the top of the repo is also where it sits in the vault.
	 */
	function handle_obsidian() {
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": handing it to Obsidian at ${where}.`);
		window.location.href = obsidian_link(VAULT, where);
	}

	/**
	 * Open a new message with this file already in it: the file's name for a subject, its whole
	 * words for the body. Nothing is written, moved or thrown away — the message is the reader's
	 * to send or drop.
	 */
	function handle_send() {
		const body = text_of_file;
		const to = `mailto:${SENT_TO}?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
		debug.log(`Editing "${name}": handing it on to ${SENT_TO} — ${body.length} character(s) of words in the message.`);
		window.location.href = to;
	}

	/**
	 * Make a new file in the same folder as this one and open it. It arrives named "unnamed",
	 * labeled as something to refer to and marked as the one being worked on, so the very next
	 * thing to do is give it a name — which the field at the top of the row is already for.
	 */
	function handle_create() {
		debug.log(`Editing "${name}": making a new file beside it.`);
		files.create_beside(guide).then((made) => { if (made) { open_view(key_of(made)); } });
	}

	/** Throw this file away. Only if the file itself goes does the view go back to the list. */
	function handle_delete() {
		asking_to_delete = false;
		debug.log(`Editing "${name}": throwing it away.`);
		files.delete_one(guide).then((gone) => { if (gone) { onclose(); } });
	}

	/**
	 * Give the file itself a different name: the file, every link naming it, and the index
	 * beside it are put right together. A name unchanged, or emptied, does nothing.
	 */
	function handle_rename() {
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

<!-- The editor's controls — the steppers, the count, the folders, the name, and the four
     buttons — as one block the form places at the top of its own stack. Everything it needs
     lives here; the form only finds it a place and a clickable to fold it away. -->
{#snippet controls_rows()}
	<div class='view-top' role='button' tabindex='-1' onkeyup={() => {}}
		class:lit={way_out_lit}
		use:hit_target={{ id: `${WAY_OUT}.top`, type: T_Hit_Target.section,
			onpress: onclose, tip: 'resume browse' }}>
		<div class='view-head'>
			<!-- Which of the files the filters leave is being read, and how many there are. Nothing
				while reading off the list, on a run of files reached by links. -->
			{#if $w_file_site}
				<span class='file-count'>{$w_file_site.at} of {$w_file_site.of}</span>
			{/if}
			<Steppers id='editor.step' {can_back} {can_forward} {onprev} {onnext}
				back_says={$w_file_back ?? 'previous file'} forward_says={$w_file_forward ?? 'next file'} />
			<!-- The folders above the file follow the steppers at the left. -->
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
			<!-- Asking in words rather than in a box of its own: the trash mark asks, and the
				question that takes its place is the thing that answers. -->
			{#if asking_to_delete}
				<!-- The row behind these goes back to the list on a press, so each stopped the press
				     reaching it. The manager hands a press to one target only, so nothing is stopped
				     by hand any more. -->
				<button class='asking-yes'
					use:hit_target={{ id: 'editor.delete.yes', onpress: handle_delete, tip: 'throw it away for good' }}>delete "{name}"</button>
				<button class='row-button' aria-label='keep it'
					use:hit_target={{ id: 'editor.delete.no', onpress: () => { asking_to_delete = false; }, tip: 'keep this file' }}>
					<svg class='row-mark' viewBox='0 0 {k.size.normal} {k.size.normal}'>
						<path d={crossPath} fill='none' stroke-width={k.size.normal / 12} stroke-linecap='round' />
					</svg>
				</button>
			{:else}
				<!-- The four stand together at the end of the row: make one beside this file, open
					it in Obsidian, hand it on, or throw it away. The making comes first and the
					throwing away last, so the one that cannot be undone stands furthest from the
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
	</div>
{/snippet}

<div class='viewer'>
	<Editor_Filters {name} {guide} {tags} {page} {onclose} onshow={say} controls={controls_rows}
		bind:find bind:text={text_of_file} bind:folded={filters_folded} />
	<Markdown_Editor {name} {address} {guide} onshow={say}
		bind:text={text_of_file} bind:page
		ondrawn={drawn} onredrawn={() => find?.forget()} />
	<!-- What a link that leads nowhere has to say. It clears itself after a few seconds.
	     Registered while it is showing, as a section, so the manager knows the cursor is on it and
	     nothing underneath answers instead. -->
	{#if note !== ''}
		<div class='view-note-line'
			use:hit_target={{ id: 'editor.note', type: T_Hit_Target.section }}>{note}</div>
	{/if}
</div>

<style>
	.viewer {
		position       : relative;   /* the anchor for the pinned close button */
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
	}

	/* The triangles and the kind hug the far left; the tags and the pinned close hug the
	   far right. The name is placed at the middle of the whole row rather than centered
	   in whatever space its neighbors leave over, so a long tag list moves nothing. */
	/* The two rows above the heavy line, taken as one block. Its empty parts are the way back
	   to the list, and the whole of it lights while the cursor is on any of them. */
	/* It reaches out to the three edges of the box it sits in — the space the box holds
	   around its contents is part of this area, so the lit color has to cover it too. */
	/* It reaches over the half-gaps the stack leaves around it, the same as every other row in
	   the form — the old negative top margin was for its old home at the region's very top,
	   and inside the stack it pulled the hover area up into the line above. */
	.view-top {
		margin         : calc(var(--over, 0px) * -1) calc(var(--gap) * -1) calc(var(--under, 0px) * -1);
		padding        : var(--over, var(--gap-small)) var(--gap) var(--under, 0px);
		flex           : 0 0 auto;
		cursor         : pointer;
		flex-direction : column;
		display        : flex;
	}

	.view-top.lit {
		background : var(--hover);
	}

	.view-head {
		padding-bottom : var(--gap-small);
		height         : var(--height);
		box-sizing     : content-box;
		gap            : var(--gap);
		position       : relative;
		align-items    : center;
		display        : flex;
	}

	/* The step marks are drawn a touch taller than a control. Held to the row's own height
	   they still show whole — they are allowed to spill — and the row keeps one height
	   whether they are there or not. */
	.view-head :global(.steppers) {
		height : var(--height);
	}

	/* The empty run that holds the buttons at the left apart from the kind and tags at the
	   right, now that nothing sits between them. */
	.view-spacer {
		flex : 1 1 auto;
	}

	/* The folders above the file, just right of the steppers at the left of the button row. */
	/* Which file of the run is on screen, reading like the folders beside it. */
	/* One width whatever it says, with its words held to its right end — so they finish against
	   the step marks, and the marks stand in one place however many digits the count runs to. */
	.file-count {
		opacity     : var(--opacity-header);
		font-size   : var(--font-tiny);
		color       : var(--text);
		width       : var(--width-tiny);
		text-align  : right;
		flex        : 0 0 auto;
		white-space : nowrap;
	}

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

	/* A round button at the end of the row: white inside a hairline edge, filling under the
	   cursor — the same look every other small button in the app wears. */
	/* The four at the end of the row stand one gap apart. */
	.row-pair {
		gap         : var(--gap);
		flex        : 0 0 auto;
		align-items : center;
		display     : flex;
	}

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

	/* The question itself is the button that answers it, standing where the row's other words
	   stand and reading as an ordinary control. */
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
		/* Sits a touch above where the row would put it, so it lines up with the words
		   beside it rather than with the buttons. */
		position      : relative;
		top           : -2px;
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

	/* The line a dead link leaves behind, along the bottom of the reading area. */
	/* Both stand in the same white area as the words themselves — everything under the heavy
	   line is one field, whether it holds the file, a complaint, or a passing message. */
	/* The words can be picked up and copied. The page as a whole is not selectable, so this says
	   so for itself — what went wrong is said here, and a fault worth reading is worth pasting. */
	.view-note-line {
		border-top  : var(--thick-faint) solid var(--accent);
		opacity     : var(--opacity-label);
		font-size   : var(--font-tiny);
		padding-top : var(--gap-tiny);
		background  : var(--white);
		color       : var(--text);
		user-select : text;
		cursor      : text;
		flex        : 0 0 auto;
		text-align  : center;
	}
</style>
