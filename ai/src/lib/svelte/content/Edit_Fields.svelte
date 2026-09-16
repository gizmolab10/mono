<script lang='ts'>
	import { files, show_status, file_path_of, save_file, type File, type Labels } from '../../ts/common/Kb';
	import { title_from_name } from '../../ts/utilities/Labels';
	import { debug, hit_target } from '../../ts/common/Core';

	// What a guide says about itself in words, ai's since step 10 of the plan: its title, its date,
	// one line saying what it is for, the occasions to read it on, who wrote it and where it came
	// from — six fields on four rows, the information rows, handed to kb as the edit filter section
	// and drawn above the kinds row. Each field is written to the db on blur, never to the file:
	// the four fields on the file's row and the sources as rows of their own, through kb's files
	// manager, which then tells the list. A refusal is said on the status line. The title's two
	// tools sit in the title row: the title copied to and from the top heading, and to and from
	// the file's own name. They are marked rides-the-line, which kb reads as: put this on the
	// section's line, centered, the height of the information clickable, white.
	let { guide, text, set_text }: {
		guide    : File;                        // the record of the file being read
		text     : string;                      // the whole file, which the title's tools read and change
		set_text : (words: string) => void;     // hands changed words back to the frame
	} = $props();

	let form_title       = $state('');
	let form_date        = $state('');
	let form_description = $state('');
	let form_use_when    = $state('');   // one occasion to a line, since a file may name several
	let form_authors     = $state('');   // who wrote it, names separated by commas
	let form_from        = $state('');   // where it came from, a url or a person

	// One row tall until the text needs a second, then exactly as tall as it needs — a wrapped
	// long line included, which a count of returns would miss. The field itself is asked: told
	// to be no taller than nothing, it reports how much it cannot fit, and is given exactly
	// that. Runs on every change of the value, since that is the only thing that changes it.
	let use_when_field = $state<HTMLTextAreaElement | null>(null);
	$effect(() => {
		form_use_when;
		const field = use_when_field;
		if (!field) { return; }
		field.style.height = 'auto';
		field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
	});

	// Whenever another guide comes on screen, the fields start from what that guide says.
	$effect(() => {
		form_title       = guide.title;
		form_date        = guide.date;
		form_description = guide.description;
		form_use_when    = (guide.use_when ?? []).join('\n');
		// Its sources are the db's alone: one row per author, each saying where it came from.
		const sources    = files.sources_of(guide);
		form_authors     = sources.map((one) => one.author).filter((one) => one !== '').join(', ');
		form_from        = sources[0]?.came_from ?? '';
	});

	/**
	 * Write the fields to the db, if any changed: the title, description, use_when and date as
	 * the four fields on the file's row, the authors and where it came from as its sources. The
	 * kind and the tags are kb's form's. Nothing is written to the file. A refusal leaves the
	 * record as it was, and is said on the status line.
	 */
	async function save_fields() {
		const use_when = form_use_when.split('\n').map((one) => one.trim()).filter((one) => one.length > 0);
		const labels: Labels = { kind: guide.kind, title: form_title, description: form_description, use_when, date: form_date, labeled: true };
		const same_fields = guide.title === form_title && guide.description === form_description
			&& (guide.use_when ?? []).join('\n') === use_when.join('\n') && guide.date === form_date;
		const authors = form_authors.split(',').map((one) => one.trim()).filter((one) => one.length > 0);
		const came_from = form_from.trim();
		const sources = files.sources_of(guide);
		const same_sources = authors.join('\n') === sources.map((one) => one.author).filter((one) => one !== '').join('\n')
			&& came_from === (sources[0]?.came_from ?? '');
		if (guide.labeled && same_fields && same_sources) { return; }
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${guide.name}": the fields changed — writing them to the db for ${where}.`);
		const fields = await files.write_fields(guide, labels);
		if (!fields.ok) {
			show_status(`not saved — ${fields.why}`);
			debug.log(`Editing "${guide.name}": the title, description, use_when and date were NOT written to the db — ${fields.why}.`);
			return;
		}
		if (!same_sources) {
			const wrote = await files.write_sources(guide, authors, came_from);
			if (!wrote.ok) {
				show_status(`not saved — ${wrote.why}`);
				debug.log(`Editing "${guide.name}": the authors and where it came from were NOT written to the db — ${wrote.why}.`);
				return;
			}
		}
		// The list shows the title, so it is told at once rather than waiting for every file to be
		// read again, the tags as the guide wears them. A fault here would leave the db written and
		// the app still holding the old fields, so it is said out loud.
		try {
			files.relabel(guide, labels, files.hierarchy.tag_names_of(guide.id));
		} catch (trouble) {
			show_status('written, but the list was not told');
			debug.log(`Editing "${guide.name}": the db was written, but telling the list failed — ${String(trouble)}. The app still holds the old fields.`);
			return;
		}
		debug.log(`Editing "${guide.name}": fields written — title "${labels.title}", date "${labels.date}", ${use_when.length} occasion(s).`);
	}

	/** Copy between the title and the file's top heading, exactly — onto it (making one if
	 * there is none), or from it into the title. */
	function H1_copy(to: boolean = true) {
		if (text === '') { show_status("the file's words are not on screen"); return; }
		const lines = text.split('\n');
		let at = 0;
		if (lines[0] === '---') {
			const close = lines.indexOf('---', 1);
			if (close > 0) { at = close + 1; }
		}
		if (!to) {   // from the heading: it becomes the title
			for (let i = at; i < lines.length; i++) {
				if (lines[i].startsWith('# ')) {
					const heading = lines[i].slice(2).trim();
					if (heading !== '' && heading !== form_title) {
						form_title = heading;
						save_fields();
						debug.log(`Editing "${guide.name}": the top heading was copied into the title.`);
					} else {
						show_status('the title already says what the top heading says');
					}
					return;
				}
			}
			show_status('no top heading to copy from');
			return;
		}
		if (form_title.trim() === '') { show_status('the title is empty'); return; }
		let replaced = false;
		for (let i = at; i < lines.length; i++) {
			if (lines[i].startsWith('# ')) { lines[i] = `# ${form_title}`; replaced = true; break; }
		}
		if (!replaced) { lines.splice(at, 0, `# ${form_title}`, ''); }
		const whole = lines.join('\n');
		if (whole === text) { show_status('the top heading already says what the title says'); return; }
		const was   = text;
		const where = file_path_of(guide.bundle, guide.path);
		set_text(whole);
		save_file(where, whole, was).then((answer) => {
			if (!answer.ok) {
				set_text(was);
				show_status(`not saved — ${answer.why}`);
				return;
			}
			debug.log(`Editing "${guide.name}": the title was ${replaced ? 'copied onto the top heading' : 'made the top heading'}.`);
		});
	}

	/** Copy between the title and the file's own name — onto it (a rename, links and all),
	 * or from it into the title, capitalized. */
	function filename_copy(to: boolean = true) {
		if (to) {   // onto the name: the file takes the title as its name
			if (form_title.trim() === '') { return; }
			files.rename(guide, form_title.toLowerCase());
			return;
		}
		const titled = title_from_name(guide.name);
		if (form_title === titled) { return; }
		form_title = titled;
		save_fields();
	}
</script>

<!-- The four rows. They sit closer together than sections do, since they are rows of one thing
     rather than things of their own. Each field is a control the manager knows about; the bare
     space among them answers nothing. -->
<div class='information-rows'>
	<div class='filter-row'>
		<span class='filter-word'>title</span>
		<input class='filter-field' bind:value={form_title} onblur={save_fields}
			use:hit_target={{ id: 'editor.field.title', tip: 'what this guide is called' }} />
		<span class='filter-word'>date</span>
		<input class='filter-field date' bind:value={form_date} onblur={save_fields}
			use:hit_target={{ id: 'editor.field.date', tip: 'when it was last worked on' }} />
		<span class='title-tools rides-the-line'>
			<button class='title-button'
				use:hit_target={{ id: 'editor.title.from-h1', onpress: () => H1_copy(false), tip: "copy exactly this title from the file's top heading" }}>H1 <span class='arrow'>➜</span></button>
			<button class='title-button'
				use:hit_target={{ id: 'editor.title.to-name', onpress: () => filename_copy(true), tip: "copy the title onto the file's own name, capitalized" }}><span class='arrow'>➜</span> filename</button>
			<button class='title-button'
				use:hit_target={{ id: 'editor.title.from-name', onpress: () => filename_copy(false), tip: "copy the title from the file's own name, capitalized" }}>filename <span class='arrow'>➜</span></button>
			<button class='title-button'
				use:hit_target={{ id: 'editor.title.to-h1', onpress: () => H1_copy(true), tip: "copy exactly this title onto the file's top heading" }}><span class='arrow'>➜</span> H1</button>
		</span>
	</div>
	<div class='filter-row'>
		<span class='filter-word'>brief</span>
		<input class='filter-field' bind:value={form_description} onblur={save_fields}
			use:hit_target={{ id: 'editor.field.brief', tip: 'one sentence saying what it is for' }} />
	</div>
	<!-- A guide may name several occasions it should be read on, so this field holds more
	     than one line — one occasion to a line, blank lines dropped on the way to the db. -->
	<div class='filter-row top'>
		<span class='filter-word'>use when</span>
		<textarea class='filter-field tall' rows='1' bind:this={use_when_field} bind:value={form_use_when} onblur={save_fields}
			use:hit_target={{ id: 'editor.field.use-when', tip: 'the occasions to read this guide on, one to a line' }}></textarea>
	</div>
	<!-- Who wrote it and where it came from. A markdown file carries neither, so both are
	     typed here, and both live in the db alone: one row per author, each saying where
	     the file came from. -->
	<div class='filter-row'>
		<span class='filter-word'>authors</span>
		<input class='filter-field' bind:value={form_authors} onblur={save_fields}
			use:hit_target={{ id: 'editor.field.authors', tip: 'who wrote it, names separated by commas' }} />
		<span class='filter-word'>from</span>
		<input class='filter-field' bind:value={form_from} onblur={save_fields}
			use:hit_target={{ id: 'editor.field.from', tip: 'where it came from, a url or a person' }} />
	</div>
</div>

<style>
	/* Rows of one thing, so they sit closer together than sections do. */
	.information-rows {
		padding-top    : var(--gap-small);
		gap            : var(--gap-tiny);
		flex-direction : column;
		display        : flex;
	}

	.filter-row {
		gap         : var(--gap-tiny);
		align-items : center;
		display     : flex;
	}

	/* The row whose field is taller than a line: its word stands beside that field's first line
	   rather than halfway down it. */
	.filter-row.top {
		align-items : flex-start;
	}

	.filter-row.top .filter-word {
		line-height : var(--height);
	}

	.filter-word {
		white-space : nowrap;
		opacity    : var(--opacity-header);
		font-size  : var(--font-tiny);
		color      : var(--text);
		flex       : 0 0 auto;
		text-align : right;
		width      : 45px;
	}

	/* Every information element's edge is the faint thickness since 15 September 2026, the
	   fields and the title tools alike. */
	.filter-field {
		border        : var(--thick-faint) solid var(--black);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 1 1 auto;
		font-family   : inherit;
		min-width     : 0;
	}

	/* The one field that holds more than a line. It grows from the top like every other field —
	   the height is its own, since a line count means nothing against a pill's padding. */
	.filter-field.tall {
		border-radius : var(--radius-small);
		white-space   : pre-wrap;
		line-height   : 1.3;
		padding       : var(--gap-tiny) var(--gap);
		resize        : none;
		height        : auto;
	}

	.filter-field.date {
		flex  : 0 0 auto;
		width : 110px;
	}

	/* The title's two tools, four presses, written in the title row and taken by kb onto the
	   section's line, centered on it. */
	.title-tools {
		display     : flex;
		flex        : 0 0 auto;
		gap         : var(--gap-small);
		align-items : center;
	}

	/* Each the size of the information clickable beside them on the line: the same text, the same
	   edge, the same padding, and white. The arrow is the plain one, which the system font has; the
	   fat one came from a fallback font a pixel taller. */
	.title-button {
		border        : var(--thick-faint) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		background    : var(--white);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		box-sizing    : border-box;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.title-button:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	/* The arrow adds no height to the line: a glyph a fallback font draws taller than the letters
	   would otherwise make the tool taller than the information clickable beside it. */
	.arrow {
		line-height : 0;
	}
</style>
