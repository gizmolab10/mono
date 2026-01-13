<script lang='ts'>
	import { k, Point, colors } from '../../ts/common/Global_Imports';
	const { w_separator_color } = colors;
	export let handle_selection: ((types: string[]) => void) | null = null;
	export let selected_hover_text_color: string = 'black';
	export let selected_color: string = $w_separator_color;
	export let hover_background_color: string = 'black';
	export let selected_text_color: string = 'white';
	export let border_color: string = colors.border;
	export let height: number = k.button_height;
	export let allow_multiple: boolean = false;
	export let hover_color: string = 'white';
	export let font_size = k.font_size.info;
	export let allow_none: boolean = false;
	export let origin: Point = Point.zero;
	export let name: string = k.empty;
	export let titles: string[] = [];
	export let selected: string[];
	export let width = 0;
	export let left = 38;

	function button_name(title: string) { return `segment-${name}-${title.replace(/\s+/g, '-').toLowerCase()}`; }

	$: {
		const _ = $w_separator_color;
		update_colors()
	}

	$: {
		const _ = selected;
		setSelected(selected);
	}

	function update_colors() {
		const inverted = colors.luminance_ofColor(selected_color) > 0.5;
		selected_hover_text_color = inverted ? 'white' : 'black';
		selected_text_color = inverted ? 'black' : 'white';
		selected_color = $w_separator_color;
		border_color = colors.border;
	}

	function select(title: string) {
		let selection = [...selected];
		const isSelected = selected.includes(title);
		if (!allow_multiple) {
			if (!isSelected) {
				selection = [title];
			} else if (allow_none) {
				selection = [];
			} else {
				const index = titles.indexOf(title).increment(true, titles.length);
				selection = [titles[index]];
			}
		} else if (isSelected) {
			selection = selected.filter(i => i !== title);
		} else {
			selection = [...selected, title];
		}
		handle_selection?.(selection);
	}

	function setSelected(turnTheseOn: string[]) {
		for (const title of [...titles]) {
			const element = document.getElementById(button_name(title));
			if (element) {
				const flag = turnTheseOn.includes(title);
				if (flag) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			}
		}
	}

</script>

<div class='segmented'
	style='
		position:absolute;
		left:{origin.x}px;
		width:{width}px;'>
	<div class='group-of-segments'
		style='
			--selected-hover-text-color: {selected_hover_text_color};
			--hover-background-color: {hover_background_color};
			--selected-text-color: {selected_text_color};
			--selected-color: {selected_color};
			--border-color: {border_color};
			--hover-color: {hover_color};
			height: {height}px;
			top: {origin.y}px;
			left: {left}px;'>
		{#each titles as title}
			<button class='segment'
				color={selected.includes(title) ? 'black' : 'white'}
				style='font-size:{font_size}px; user-select: none;'
				on:mousedown|preventDefault={() => select(title)}
				class:selected={selected.includes(title)}
				id={button_name(title)}
				type='button'>
				{title}
			</button>
		{/each}
	</div>
</div>

<style>

	.segment.selected:hover {
		color: var(--selected-hover-text-color);
	}

	.segment:not(:last-child) {
		border-right: 1px solid var(--border-color);
	}

	.segment.selected {
		background: var(--selected-color) !important;
		color: var(--selected-text-color);
	}

	.segment:hover {
		background: darkgray !important;
		color: var(--hover-color);
	}

	.group-of-segments {
		border: 1px solid var(--border-color);
		transform: translateX(-50%);
		background: transparent;
		border-radius: 999px;
		position: absolute;
		overflow: hidden;
		display: flex;
		left: 50%;
	}

	.segment {
		justify-content: center;
		padding-bottom: 2.2px;
		font-family: inherit;
		align-items: center;
		white-space: nowrap;
		position: relative;
		width: fit-content;
		padding-right: 8px;
		background: white;
		padding-left: 8px;
		max-width: none;
		cursor: pointer;
		outline: none;
		display: flex;
		min-width: 0;
		height: 100%;
		border: none;
		flex: none;
	}

</style>
