<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import MarkdownIt from 'markdown-it';
	import { get } from 'svelte/store';

	const show_hamburger = false;

	// The help overlay (modeled on di's user guide): a full-screen page over the app, its
	// content a set of markdown files under `src/manual/`. A hamburger-toggled sidebar
	// lists the pages; clicking one shows it; a close cross or the Escape key shuts it. The
	// open page and whether the sidebar shows are both remembered across reloads.

	let { onclose }: { onclose: () => void } = $props();

	// Which page is open, and whether the sidebar shows — both saved.
	const w_helpPage     = preferences.persistent<string>(T_Preference.helpPage, 'index');
	const w_help_sidebar = preferences.persistent<boolean>(T_Preference.helpSidebar, true);

	// Pull in every manual page at build (raw text, keyed by source path). Relative to this
	// file, `../../md/manual` is `src/lib/md/manual`.
	const files = import.meta.glob<string>('../../md/manual/**/*.md', {
		eager: true, query: '?raw', import: 'default',
	}) as Record<string, string>;

	type Page = { id: string; title: string; raw: string };

	const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

	// The id is the path under the manual folder without ".md"; the title is the first
	// heading (or the id if there's none). A hand-set order lists the known pages first;
	// anything not listed falls to the end alphabetically, so a new file still shows.
	const MANUAL_PREFIX = '../../md/manual/';
	const SIDEBAR_ORDER: string[] = ['index', "what's broken"];
	const all_pages: Page[] = Object.entries(files)
		.map(([path, raw]) => {
			const id = path.startsWith(MANUAL_PREFIX) ? path.slice(MANUAL_PREFIX.length).replace(/\.md$/, '') : path.replace(/\.md$/, '');
			const heading = raw.match(/^#\s+(.+)$/m);
			return { id, title: heading ? heading[1].trim() : id, raw };
		})
		.sort((a, b) => {
			const ai = SIDEBAR_ORDER.indexOf(a.id);
			const bi = SIDEBAR_ORDER.indexOf(b.id);
			if (ai !== -1 && bi !== -1) { return ai - bi; }
			if (ai !== -1) { return -1; }
			if (bi !== -1) { return 1; }
			return a.id.localeCompare(b.id);
		});

	debug.log(`Help: ${all_pages.length} page(s) found — [${all_pages.map((p) => p.id).join(', ')}].`);

	// If the saved page is gone (a file was renamed or removed), fall back to the first.
	if (!all_pages.some((p) => p.id === get(w_helpPage))) {
		w_helpPage.set(all_pages[0]?.id ?? 'index');
	}

	const active_page = $derived(all_pages.find((p) => p.id === $w_helpPage) ?? all_pages[0]);
	const rendered    = $derived(active_page ? md.render(active_page.raw) : '');

	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	function show_page(id: string) {
		w_helpPage.set(id);
		debug.log(`Help: showing the "${id}" page.`);
	}

	function on_key(event: KeyboardEvent) {
		if (event.key === 'Escape') { onclose(); }
	}

	// A link from one page to another switches the page in place; links that leave the
	// manual (a full web address, or one that climbs out with ../) fall through to the browser.
	function on_click(event: MouseEvent) {
		const anchor = (event.target as HTMLElement).closest('a');
		const href = anchor?.getAttribute('href');
		if (!href) { return; }
		// An "action:" link runs an app command instead of navigating. Caught before the
		// scheme check below, so it never leaks to the browser.
		if (href.startsWith('action:')) {
			event.preventDefault();
			if (href === 'action:files') {
				w_operation.set(T_Operation.files);
				onclose();
				debug.log('Help: an "action:files" link tried the list (which drops to the drop box when empty) and closed help.');
			} else if (href === 'action:chat') {
				w_operation.set(T_Operation.chat);
				onclose();
				debug.log('Help: an "action:chat" link switched to the chat and closed help.');
			} else {
				debug.log(`Help: an "${href}" link has no matching action — ignored.`);
			}
			return;
		}
		if (/^[a-z]+:|^\/\//i.test(href) || href.startsWith('/')) { return; }
		const base = new URL('http://x/' + encodeURI($w_helpPage));
		let resolved: URL;
		try { resolved = new URL(href, base); } catch { return; }
		if (resolved.host !== 'x') { return; }
		const candidate = decodeURIComponent(resolved.pathname.replace(/^\//, '').replace(/\.md$/, ''));
		if (all_pages.some((p) => p.id === candidate)) {
			event.preventDefault();
			show_page(candidate);
		}
	}
</script>

<svelte:document onkeydown={on_key} />

<div class='help' role='dialog' aria-modal='true' aria-label='help'>
	<div class='bar'>
		{#if show_hamburger}
			<button class='hamburger' onclick={() => w_help_sidebar.update((v) => !v)} aria-label='toggle the help sidebar' use:tip={'show or hide the page list'}>
				<svg viewBox='0 0 {k.size.hamburger} {k.size.hamburger}' width={k.size.hamburger} height={k.size.hamburger}>
					<path d={svg_paths.hamburger(k.size.hamburger)} />
				</svg>
			</button>
		{/if}
		<span class='spacer'></span>
		<span class='title'>Help for Intersection</span>
		<span class='spacer'></span>
		<button class='close' onclick={onclose} aria-label='close help' use:tip={'close help'}>
			<svg class='cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
				<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
			</svg>
		</button>
	</div>

	<div class='card'>
		<div class='row'>
			{#if $w_help_sidebar}
				<aside class='sidebar'>
					<ul>
						{#each all_pages as page}
							<li>
								<button class:active={page.id === $w_helpPage} onclick={() => show_page(page.id)}>{page.title}</button>
							</li>
						{/each}
					</ul>
				</aside>
			{/if}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class='page' role='document' onclick={on_click}>{@html rendered}</div>
		</div>
	</div>
</div>

<style>
	.help {
		padding        : var(--gap);           /* an even --gap accent frame, like the app */
		background     : var(--accent);
		box-sizing     : border-box;
		flex-direction : column;
		position       : fixed;
		overflow       : hidden;
		display        : flex;
		inset          : 0;
	}

	.bar {
		height      : var(--height-control);
		gap         : var(--gap);
		box-sizing  : border-box;
		align-items : center;
		display     : flex;
		flex-shrink : 0;
		width       : 100%;
	}

	.hamburger {
		background      : transparent;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		border          : none;
		padding         : 0;
	}

	/* The two growing spacers that flank the title, pushing it to sit centered in
	   the room left between the operations control and the help button. */
	.spacer {
		flex : 1;
	}

	/* The app name, floating between the spacers. */
	.title {
		color          : var(--text-on-accent);
		font-size      : var(--font-huge);
		white-space    : nowrap;
		pointer-events : none;
	}

	.hamburger path {
		stroke-width : var(--thickness-faint);
		stroke       : var(--black);
		fill         : var(--text-on-accent);   /* reads against the accent bar, like the controls-row hamburger */
	}

	.hamburger:hover path {
		fill : var(--hover);
	}

	/* The close cross sits at the far right of the bar. */
	.close {
		border          : var(--thickness-normal) solid var(--black);
		height          : var(--height-control);
		width           : var(--height-control);
		border-radius   : var(--radius-percent);
		background      : var(--white);
		box-sizing      : border-box;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
		margin-left     : auto;
	}

	.close:hover {
		background : var(--hover);
	}

	.cross {
		width  : var(--size-svg);
		height : var(--size-svg);
	}

	.cross path {
		stroke : var(--black);
	}

	/* The content sits on a page-colored card below the accent bar. */
	.card {
		margin                  : var(--gap) 0 0 0;
		border-top-left-radius  : var(--radius);
		border-top-right-radius : var(--radius);
		background              : var(--bg);
		flex-direction          : column;
		overflow                : hidden;
		display                 : flex;
		min-height              : 0;
		flex                    : 1;
	}

	.row {
		gap        : var(--gap-fat);
		display    : flex;
		min-height : 0;
		flex       : 1;
	}

	.sidebar {
		padding    : var(--gap) 0 0 var(--gap);
		overflow-y : auto;
		flex       : 0 0 200px;
	}

	.sidebar ul {
		list-style : none;
		margin     : 0;
		padding    : 0;
	}

	.sidebar li {
		margin-bottom : var(--gap-tight);
	}

	.sidebar button {
		border        : none;
		border-radius : var(--radius);
		font-size     : var(--font-label);
		background    : transparent;
		padding       : var(--pad-control);
		color         : var(--text);
		text-align    : left;
		cursor        : pointer;
		width         : 100%;
	}

	.sidebar button:hover {
		background : var(--hover);
	}

	.sidebar button.active {
		background : var(--accent);
		color      : var(--text-on-accent);
	}

	.page {
		padding     : var(--gap) var(--gap-fat);
		line-height : 1.55;
		overflow-y  : auto;
		flex        : 1;
	}

	.page :global(h1) {
		font-size  : var(--font-huge);
		margin-top : 0;
	}

	.page :global(h2) {
		margin-top : 1.5em;
	}

	.page :global(a) {
		color : var(--accent-dark);
	}

	.page :global(code) {
		border-radius : var(--radius);
		background    : var(--accent);
		font-size     : 0.9em;
		padding       : 0 4px;
	}
</style>
