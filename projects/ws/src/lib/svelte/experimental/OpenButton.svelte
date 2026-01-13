<script>
	import { s_hierarchy, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { k, u, Size, Point } from '../../ts/common/Global_Imports';
	export let center = Point.zero;
	export let multiple = k.empty;		// can be set to 'multiple'
	export let accept = k.empty;
	const label = 'import';
	const labelWidth = u.getWidthOf(label);
	let fileInput;

	function handleClick() {
		fileInput.click();
	}

	function handleFileChange(event) {
		const files = event.target?.files ?? [];
		setTimeout( async () => {
			for (const file of files) {
				await get(s_hierarchy).fetch_fromFile(file);
			}
			target.value = k.empty;		// allow re-selection of the same file
		}, 1);
	}
</script>

<style>
	.button {
		position: absolute;
		left: 0;
		top: 0;
		transform: translate(-50%, -50%); /* Center the button at (x, y) */
		padding: 10px 20px;
		border: 2px solid #000;
		border-radius: 4px;
		background-color: transparent;
		color: #000;
		cursor: pointer;
		transition: background-color 0.3s, color 0.3s;
		user-select: none;
		text-align: center;
	}

	.button:hover {
		background-color: #000;
		color: #fff;
	}
</style>

<input
	type='file'
	accept={accept}
	bind:this={fileInput}
	style='display: none;'
	on:change={handleFileChange}
/>

<button
	class='button'
	on:click={handleClick}
	style='
		top: {center.y}px;
		left: {center.x}px;'>
	{label}
</button>
