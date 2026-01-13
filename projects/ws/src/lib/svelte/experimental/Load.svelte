<script lang='ts'>
	import { s_hierarchy, s_id_popupView } from '../../ts/state/Svelte_Stores';
	import { files } from '../../ts/managers/Files';
	import { get } from 'svelte/store';
	import Open from './Open.svelte';

	function handle_cancel() {
		console.log('File selection was cancelled.');
		$s_id_popupView = null;
	}

	function handle_files_selected(event: CustomEvent<FileList>) {
		get(s_hierarchy).fetch_fromFile(event.detail[0]);
		$s_id_popupView = null;
	}

</script>

<Open
	accept='.json'
	on:cancel={handle_cancel}
	on:files_selected={handle_files_selected}
/>
