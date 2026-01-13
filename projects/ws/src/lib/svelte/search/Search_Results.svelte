<script lang='ts'>
	import { k, u, x, Thing, colors, search, elements } from '../../ts/common/Global_Imports';
	const { w_index: results_index } = x.si_found;
	const { w_search_results_changed } = search;
	const { w_separator_color } = colors;
	let element: HTMLDivElement;
	let results: Array<Thing> = [];
	
	$: $w_search_results_changed, results = x.si_found.items;

	$: {
		const row = $results_index;
		let selected_row: HTMLElement | null = null;
		if (row !== null && !!element) {
			selected_row = element.children[row] as HTMLElement;
		}
		elements.element_set_focus_to(element);
		selected_row?.scrollIntoView({ block: 'nearest' });
	}

	function handle_row_selected(event: MouseEvent, index: number) {
		const prior_row = $results_index;
		if (prior_row !== null && prior_row === index) {
			search.deactivate_focus_and_grab();
		} else {
			search.selected_row = event.shiftKey ? null : index;
			u.consume_event(event);
		}
	}

	function highlightMatch(title: string) {
		if (!search.search_words || search.search_words.length === 0) return title;
		
		const escapedWords = search.search_words.map(word => 
			word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		);
		const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
		
		return title.replace(pattern, (match) => 
			`<span style='background-color: ${$w_separator_color}'>${match}</span>`
		);
	}

</script>

<div class='search-results'
	tabindex='0'>
	<ul bind:this={element}>
		{#key `${$w_separator_color}:::${$results_index}:::${$w_search_results_changed}`}
			{#each results as result, index}
				<li class:selected={$results_index === index} style='color: {result.color}'
					on:mousedown={(event) => handle_row_selected(event, index)}>
					<span>{@html highlightMatch(result.title)}</span>				</li>
			{/each}
		{/key}
	</ul>
</div>

<style>
	.search-results {
		outline: none !important;
		position: absolute;
        z-index: 100;
		height: 100%;
		width: 100%;
	}
	ul {
		list-style: none;
		outline: none;
		width: 100%;
		padding: 0;
		margin: 0;
	}
	li {
		box-sizing: border-box;
		white-space: nowrap;
		padding: 0 12px;
		cursor: pointer;
		width: 100%;
	}
	li span {
		text-overflow: ellipsis;
		display: inline-block;
		overflow: hidden;
		max-width: 100%;
	}
	li.selected,
	li.selected:hover {
		background-color: lightblue;
	}
	li:hover {
		background-color: #eee;
	}
</style>
