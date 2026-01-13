<script lang='ts'>
	import { T_Search, T_Layer, T_Hit_Target, T_Preference, T_Search_Preference } from '../../ts/common/Global_Imports';
	import { g, k, p, x, show, Point, search, elements, controls, features } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	export let zindex = T_Layer.graph;
	export let top = 0;
	const { w_thing_fontFamily } = x;
	const { w_rect_ofGraphView } = g;
	const s_search = elements.s_element_for(null, T_Hit_Target.search, k.empty);
	const { w_t_search, w_t_search_preferences, w_search_results_found } = search;
	let input: HTMLInputElement;
	let filter_width = 80;

	$: if (!!input) {
		s_search.html_element = input;				// so s_element_set_focus_to will work
	}

	$: if ($w_t_search != T_Search.enter) {
		setTimeout(() => {
			elements.s_element_set_focus_to(s_search);	// so 'f' will not be added to the input
		}, 1);
	}

	function search_width() { return graph_width() + 26; }
	function graph_width() { return g.windowSize.width - 84; }

	function handle_input(event) {
		const text = input.value;
		if (!!text) {
			p.writeDB_key(T_Preference.search_text, text);
		}
		search.search_for(text.toLowerCase());
	}

</script>

<div class='search-preferences' style='
	top: {top}px;
	height: 25px;
	z-index: {zindex};
	position: absolute;
	width: {graph_width()}px;
	background-color: transparent;'>
	<div class='search-results-found'
		style='
			top: 3.8px;
			left: 6px;
			width: 60px;
			text-align: right;
			position: absolute;
			font-size: {k.font_size.banners}px;
			font-family: {$w_thing_fontFamily};'>
		{$w_search_results_found} match{$w_search_results_found == 1 ? '' : 'es'}
	</div>
	<input class='search-input'
		id='search'
		type='search'
		bind:this={input}
		autocomplete='off'
		on:input={handle_input}
		bind:value={search.search_text}
		placeholder={'enter ' + $w_t_search_preferences + ' text'}
		style='
			top: 1px;
			left: 70px;
			color: blue;
			padding-left: 6px;
			border-radius: 6px;
			position: absolute;
			background-color: white;
			border: 1px solid lightgray;
			height: {k.height.button + 2}px;
			font-size: {k.font_size.banners}px;
			font-family: {$w_thing_fontFamily};
			width: {search_width() - (search.search_text?.length > 0 ? 100 : 0)}px;'/>
	<Segmented name='search-filter'
		width={filter_width}
		height={ k.height.button}
		selected={[$w_t_search_preferences]}
		origin={new Point(graph_width() - filter_width + 80, 1)}
		titles={[T_Search_Preference.title, T_Search_Preference.trait]}
		handle_selection={(titles) => controls.handle_segmented_choices('search', titles)}/>
</div>

<style>
	.search-input::placeholder {
		color: lightblue;
	}
	.search-input:focus::placeholder {
		color: transparent;
	}
	.search-input:focus {
		outline: none;
		border: 1px dashed blue !important;
	}
</style>
