<script lang='ts'>
	import { Main, w_search_at, w_search_for, w_search_text, type File } from '../../ts/common/Kb';
	import Edit_Markdown from '../content/Edit_Markdown.svelte';
	import Edit_Fields from '../content/Edit_Fields.svelte';
	import Search from '../content/Search.svelte';
	import Back_Links from '../content/Back_Links.svelte';
	import { get } from 'svelte/store';

	// The host of kb's page: draws it, and hands it four snippets. The edit filter section since
	// step 10 of the plan, ai's information rows, given the file, its words and a call that sets
	// them. The operation view since step 11, the words drawn as a page, given the file, the width
	// and the height, the words and the call that sets them, and the call for a note. The search
	// row since step 13, given the file's name, rendered in the label form's first subsection. The
	// back links since step 14, given the file's key and its name, at the foot of the editor frame.
	//
	// The renderer and the search are wired here, both being ai's: the renderer hands its html up, the
	// search looks through it, and a file drawn or drawn again tells the search so.

	// The drawn words, handed up by the renderer, so the search can look inside them.
	let page = $state<HTMLElement | null>(null);

	// The search, held so a file just drawn, or drawn again, can be told to look through the new
	// words rather than the ones it highlighted before.
	let find: ReturnType<typeof Search> | null = $state(null);

	/**
	 * A file has just been read and drawn. Anything highlighted belonged to the drawing before
	 * it, and the words in the field are looked for again in this one — so coming back from the
	 * list, or from a refresh, arrives where the search left off. A file with fewer places than
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
</script>

{#snippet edit_filter(guide: File, text: string, set_text: (words: string) => void)}
	<Edit_Fields {guide} {text} {set_text} />
{/snippet}

{#snippet search_row(name: string)}
	<Search bind:this={find} {name} {page} />
{/snippet}

{#snippet back_links(key: string, name: string)}
	<Back_Links {key} {name} />
{/snippet}

{#snippet operation_view(guide: File, _width: number, _height: number, text: string, set_text: (words: string) => void, onshow: (message: string) => void)}
	<Edit_Markdown name={guide.name} address={guide.address} {guide} {text} {set_text}
		set_page={(drawn_page) => { page = drawn_page; }} ondrawn={drawn} onredrawn={() => find?.forget()} {onshow} />
{/snippet}

<Main {edit_filter} {search_row} {operation_view} {back_links} />
