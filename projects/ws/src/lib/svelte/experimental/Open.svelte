<script lang='ts'>
	import { s_hierarchy } from '../../ts/state/Svelte_Stores';
	import { k } from '../../ts/common/Global_Imports';
	import { get } from 'svelte/store';
	export let label = 'Choose a file';
	export let multiple = false;		// Can be set to 'multiple'
	export let accept = '';
	let file_input: HTMLInputElement;

	function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		if (files) {
			for (const file of Array.from(files)) {
				get(s_hierarchy).fetch_fromFile(file);
			}
			target.value = '';		// Allow re-selection of the same file
		}
	}

</script>

<style>
	.file-input {
		display: none;
	}

	.invisible-button {
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		position: absolute;
		overflow: hidden;
		margin: -1px;
		height: 1px;
		width: 1px;
		padding: 0;
		border: 0;
	}

	.invisible-button:focus {
		outline: 2px solid #0056b3;
		outline-offset: 2px;
	}
</style>

<label
	on:keydown={() => {
		if (event.key.toLowerCase() == 'enter') {
			event.preventDefault();
			file_input.click();
			console.log('file_input.click()');
		}
	}}
	class='invisible-button'
	aria-label={label}
	for='file-input'
	role='button'
	tabindex='0'
>
	{label}
</label>

<input
	on:change={handle_selection}
	bind:this={file_input}
	class='file-input'
	accept={accept}
	id='file-input'
	type='file'
	{multiple}
/>
