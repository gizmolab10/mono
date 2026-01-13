<script lang='ts'>
	import { g, h, k, x, core, files, show, details, elements } from '../../ts/common/Global_Imports';
	import { Point, T_Storage_Need } from '../../ts/common/Enumerations';
	import { onMount } from 'svelte';
	export let accept: string = '.' + files.format_preference;
	export let multiple = k.empty;		// can be set to 'multiple'
	const { w_id_popupView } = show;
	let file_input: HTMLInputElement;
	
	onMount(() => {
		if (file_input) {
			file_input.click();
		}
	});

	function dismiss_popup() {
		$w_id_popupView = null;
	}

	async function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		if (!!files && files.length > 0) {
			await h.fetch_andBuild_fromFile(files[0]);
		}
		target.value = k.empty;		// allow re-selection of the same file, MUST do this AFTER fetch
		details.t_storage_need = T_Storage_Need.direction;
		dismiss_popup();
		g.grand_build();
	}

</script>

<input
	on:change={handle_selection}
	on:cancel={dismiss_popup}
	bind:this={file_input}
	style='display: none'
	name='import-file'
	type='file'
	{multiple}
	{accept}
/>

