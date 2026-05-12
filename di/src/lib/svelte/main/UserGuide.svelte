<script lang='ts'>
	import MarkdownIt from 'markdown-it';
	import Separator from '../mouse/Separator.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { stores } from '../../ts/managers/Stores';
	import { k } from '../../ts/common/Constants';
	import { get } from 'svelte/store';

	let { onclose } : { onclose: () => void } = $props();

	const { w_show_help_sidebar, w_help_page_id } = stores;

	// Eagerly import every markdown page in the user guide and every image. The
	// keys are the source paths; the values are the file content (raw text for
	// markdown, URL strings for images).
	const pages = import.meta.glob<string>('../../../manual/**/*.md', {
		eager: true, query: '?raw', import: 'default'
	}) as Record<string, string>;

	const images = import.meta.glob<string>('../../../manual/images/**/*.{png,jpg,jpeg,svg}', {
		eager: true, query: '?url', import: 'default'
	}) as Record<string, string>;

	type Page = { id: string; title: string; raw: string };

	const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

	// Build the page list. The id is the path under the manual folder, without
	// the .md extension (e.g. "index", "reference-guide/selection"). The title
	// is the first-line heading (stripping the leading "# ").
	//
	// Sidebar order is hand-set via SIDEBAR_ORDER below: pages whose id appears
	// in that list sort by their position in it; any page not in the list sorts
	// at the end alphabetically (so a newly-added file is still discoverable
	// until it gets placed in the order).
	const MANUAL_PREFIX = '../../../manual/';
	const SIDEBAR_ORDER: string[] = [
		'index',
		'reference-guide/units',
		'reference-guide/library',
		'reference-guide/save and load',
		'reference-guide/undo and redo',
		'reference-guide/selection',
		'reference-guide/formulas',
		'reference-guide/parts list',
		'reference-guide/repeaters',
	];
	const all_pages: Page[] = Object.entries(pages)
		.map(([path, raw]) => {
			const id = path.startsWith(MANUAL_PREFIX)
				? path.slice(MANUAL_PREFIX.length).replace(/\.md$/, '')
				: path.replace(/\.md$/, '');
			const heading_match = raw.match(/^#\s+(.+)$/m);
			const title = heading_match ? heading_match[1].trim() : id;
			return { id, title, raw };
		})
		// Hide stray pages from the sidebar:
		//   - anything under the images folder (alt-text scratchpads, not real pages)
		//   - the reference-guide index page (a list of links already in the sidebar)
		.filter(p => !p.id.startsWith('images/') && p.id !== 'reference-guide/index')
		.sort((a, b) => {
			const ai = SIDEBAR_ORDER.indexOf(a.id);
			const bi = SIDEBAR_ORDER.indexOf(b.id);
			if (ai !== -1 && bi !== -1) return ai - bi;
			if (ai !== -1) return -1;
			if (bi !== -1) return 1;
			return a.id.localeCompare(b.id);
		});

	// Reset the stored active-page id if it no longer matches a real page (e.g.
	// the manual file was renamed or removed since the user last visited).
	if (!all_pages.some(p => p.id === get(w_help_page_id))) {
		w_help_page_id.set(all_pages[0]?.id ?? 'index');
	}

	let active_page = $derived(all_pages.find(p => p.id === $w_help_page_id) ?? all_pages[0]);

	// Resolve a markdown image path (relative from the source markdown file) to
	// the bundled asset URL. The path comes in as e.g. "images/first-steps/01-opening.png"
	// and the keys in the images map look like "../../../manual/images/first-steps/01-opening.png".
	function resolve_image(rel_path: string): string {
		const key = '../../../manual/' + rel_path;
		return images[key] ?? rel_path;
	}

	// Transform raw markdown so image references point at the bundled URLs, then
	// run it through markdown-it.
	function render(raw: string): string {
		const transformed = raw.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
			if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return match;
			return `![${alt}](${resolve_image(path)})`;
		});
		return md.render(transformed);
	}

	let rendered = $derived(active_page ? render(active_page.raw) : '');

	function handle_keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onclose();
	}

	// Intercept clicks on rendered-markdown links. A link that resolves to one
	// of the user guide's own pages switches the active page in-place. Links
	// that escape the guide (using ../ to break out of the manual root, or
	// pointing at scheme-prefixed / rooted URLs) fall through to the browser.
	function handle_click(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const anchor = target.closest('a');
		if (!anchor) return;
		const href = anchor.getAttribute('href');
		if (!href) return;
		// Scheme-prefixed (http:, mailto:, etc.), protocol-relative, or rooted — leave alone
		if (/^[a-z]+:|^\/\//i.test(href)) return;
		if (href.startsWith('/')) return;
		// Resolve the link relative to the active page's location inside the manual.
		// The manual root is treated as the URL root, so a top-level page sits at "/<id>"
		// and a subfolder page sits at "/<folder>/<id>".
		const base = new URL('http://x/' + encodeURI($w_help_page_id));
		let resolved: URL;
		try { resolved = new URL(href, base); } catch { return; }
		// Anything outside the manual root (host changed, or path leaves with ../) falls through
		if (resolved.host !== 'x') return;
		const candidate = decodeURIComponent(resolved.pathname.replace(/^\//, '').replace(/\.md$/, ''));
		if (all_pages.some(p => p.id === candidate)) {
			event.preventDefault();
			w_help_page_id.set(candidate);
		}
	}
</script>

<svelte:document onkeydown={handle_keydown} />

<div class='user-guide' role="dialog" aria-modal="true" aria-label="User guide">
	<div class='controls-bar'>
		<button class='hamburger'
			onclick={() => w_show_help_sidebar.update(v => !v)}
			aria-label='toggle help sidebar'>
			<svg class='hamburger-icon' viewBox='0 0 {k.height.button.common} {k.height.button.common}' width={k.height.button.common + 20} height={k.height.button.common}>
				<path d={svg_paths.hamburger(k.height.button.common + 2)}/>
			</svg>
		</button>
		<button class='toolbar-button' onclick={onclose}>← Return to Design Intuition</button>
	</div>

	<div class='content-card'>
		<div class='content-row'>
			{#if $w_show_help_sidebar}
				<aside class='sidebar'>
					<ul>
						{#each all_pages as page}
							<li>
								<button
									class:active={page.id === $w_help_page_id}
									onclick={() => w_help_page_id.set(page.id)}>
									{page.title}
								</button>
							</li>
						{/each}
					</ul>
				</aside>

				<Separator vertical kind='main'/>
			{/if}

			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div class='page' role="document" onclick={handle_click}>
				{@html rendered}
			</div>
		</div>
	</div>
</div>

<style>
	.user-guide {
		background      : var(--accent);
		color           : var(--text);
		position        : absolute;
		flex-direction  : column;
		overflow        : hidden;
		display         : flex;
		inset           : 0;
	}

	.controls-bar {
		padding         : 0 0 0 var(--l-gap-large);
		height          : var(--h-controls);
		justify-content : space-between;
		background      : var(--accent);
		gap             : var(--l-gap);
		box-sizing      : border-box;
		overflow        : visible;
		align-items     : center;
		width           : 100%;
		display         : flex;
		flex-shrink     : 0;
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
		left            : -6.5px;
		top             : -1px;
		display         : flex;
		border          : none;
		padding         : 0;
	}

	.hamburger-icon path {
		fill   : currentColor;
		stroke : currentColor;
	}

	.hamburger:hover .hamburger-icon path {
		fill : var(--white);
	}

	.content-card {
		margin                  : var(--l-gap) 0 0 0;
		border-top-right-radius : var(--radius);
		border-top-left-radius  : var(--radius);
		background              : var(--bg);
		flex-direction          : column;
		overflow                : hidden;
		display                 : flex;
		flex                    : 1;
		min-height              : 0;
	}

	.toolbar-button {
		padding         : 0 var(--l-padding) 1px var(--l-padding);
		border          : var(--th-border) solid currentColor;
		height          : var(--h-button-common);
		font-size       : var(--font-common);
		border-radius   : var(--r-common);
		background      : var(--white);
		box-sizing      : border-box;
		position        : relative;
		cursor          : pointer;
		color           : inherit;
	}

	.toolbar-button:hover {
		background      : var(--hover);
	}

	.content-row {
		gap             : var(--l-gap-large);
		padding-right   : var(--l-padding);
		display         : flex;
		flex            : 1;
		min-height      : 0;
	}

	.sidebar {
		padding         : var(--l-padding) 0 0 var(--l-padding-small);
		flex            : 0 0 200px;
		overflow-y      : auto;
	}

	.sidebar ul {
		list-style      : none;
		padding         : 0;
		margin          : 0;
	}

	.sidebar li {
		margin-bottom   : 4px;
	}

	.sidebar button {
		font-size       : var(--font-common);
		border-radius   : var(--r-input);
		background      : transparent;
		padding         : 6px 10px;
		cursor          : pointer;
		color           : inherit;
		text-align      : left;
		border          : none;
		width           : 100%;
	}

	.sidebar button:hover {
		background      : var(--hover);
		border-radius   : 18px;
	}

	.sidebar button.active {
		background      : var(--selected);
		border-radius   : 18px;
		font-weight     : 600;
	}

	.page {
		padding         : 10px var(--l-padding-small);
		overflow-y      : auto;
		line-height     : 1.55;
		flex            : 1;
	}

	.page :global(h1) {
		font-size       : var(--font-huge);
		margin-top      : 0;
	}

	.page :global(h2) {
		margin-top      : 1.5em;
	}

	.page :global(img) {
		border          : var(--th-border) solid var(--accent);
		border-radius   : var(--r-common);
		display         : block;
		margin          : 1em 0;
		max-width       : 100%;
		height          : auto;
	}

	.page :global(em) {
		font-size       : var(--font-small);
		margin-top      : -0.5em;
		display         : block;
		margin-bottom   : 1.5em;
		opacity         : 0.7;
	}

	.page :global(code) {
		font-family     : ui-monospace, SFMono-Regular, monospace;
		border-radius   : var(--r-input);
		background      : var(--accent);
		font-size       : 0.9em;
		padding         : 0 4px;
	}

	.page :global(table) {
		border-collapse : collapse;
		margin          : 1em 0;
	}

	.page :global(th),
	.page :global(td) {
		border          : var(--th-border) solid var(--accent);
		padding         : 4px 8px;
	}
</style>
