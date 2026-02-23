<script lang='ts'>
	import { Seriously_Range } from '../../types/Seriously_Range';
	import { G_Widget }        from '../../geometry/G_Widget';
	import { k }               from '../../common/Constants';
	import { ux }              from '../../state/ux.svelte';
	import { databases }       from '../../db/Databases';
	import type { Ancestry }   from '../../nav/Ancestry';
	import { onMount }         from 'svelte';

	let { ancestry, left }: {
		ancestry: Ancestry;
		left:     number;
	} = $props();

	const thing          = ancestry.thing;
	const original_title = thing?.title ?? '';
	let input_width      = $state(G_Widget.measureTitleWidth(original_title) + 4);
	let text             = $state(original_title);
	let input: HTMLInputElement;
	let ghost: HTMLSpanElement;
	let blur_armed = false;

	// ————————————————————————————————————————— Lifecycle

	onMount(() => {
		if (input) {
			input.focus({ preventScroll: true });
			const range = ux.selection_range;
			if (range) {
				input.setSelectionRange(range.start, range.end);
			} else {
				input.select();
			}
		}
		requestAnimationFrame(() => { blur_armed = true; });
	});

	// ————————————————————————————————————————— Width tracking

	function update_width() {
		if (ghost) {
			input_width = ghost.scrollWidth + 4;
		}
	}

	// ————————————————————————————————————————— Save selection range

	function save_selection_range() {
		if (input) {
			ux.selection_range = new Seriously_Range(
				input.selectionStart ?? 0,
				input.selectionEnd ?? 0,
			);
		}
	}

	// ————————————————————————————————————————— Confirm + persist

	function confirm() {
		save_selection_range();
		if (thing) {
			thing.title = text;
			ux.confirmEdit();
			databases.db.schedule_persist();
		}
	}

	// ————————————————————————————————————————— Cancel (revert)

	function cancel() {
		if (thing) {
			thing.title = original_title;
		}
		ux.cancelEdit();
	}

	// ————————————————————————————————————————— Handlers

	function handle_key_down(event: KeyboardEvent) {
		const key = event.key.toLowerCase();
		switch (key) {
			case 'enter':
				event.preventDefault();
				confirm();
				break;
			case 'escape':
				event.preventDefault();
				cancel();
				break;
			case 'tab':
				event.preventDefault();
				confirm();
				break;
		}
	}

	function handle_input(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		text = value;
		if (thing) {
			thing.title = value;
		}
		update_width();
	}

	function handle_blur() {
		if (!blur_armed) return;
		if (ux.isEditing_ancestry(ancestry)) {
			confirm();
		}
	}
</script>

<span
	class='ghost'
	bind:this={ghost}
	style:left='-9999px'
	style:white-space='pre'
	style:position='absolute'
	style:visibility='hidden'
	style:font-size='{k.font_size.common}px'>
	{text}
</span>
<input
	type='text'
	bind:this={input}
	bind:value={text}
	class='text-editor'
	onblur={handle_blur}
	oninput={handle_input}
	onkeydown={handle_key_down}
	style:width='{input_width}px'
	style:height='{k.height.row}px'
	style:margin-left='{left - 2}px'
	style:font-size='{k.font_size.common}px' />

<style>
	.text-editor {
		padding      : 0;
		white-space  : pre;
		cursor       : text;
		border       : none;
		outline      : none;
		color        : inherit;
		font-family  : inherit;
		box-sizing   : border-box;
		background   : transparent;
	}
	.text-editor:focus {
		outline : none;
	}
</style>
