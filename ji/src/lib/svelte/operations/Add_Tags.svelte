<script lang='ts'>
	// Create a new tag, then choose which tags a drop gets. The create
	// row adds to the active store's tags; the chip picker below (Tags) shares
	// the chosen set with the parent (the add flow tags the drop with them).
	import { databases } from '../../ts/database/Databases';
	import Tags from './Tags.svelte';

	let { selected = $bindable(new Set<string>()) }: { selected?: Set<string> } = $props();

	let name = $state('');

	function add() {
		const trimmed = name.trim();
		if (trimmed.length === 0) {
			console.log('Create tag: nothing typed, so nothing added.');
			return;
		}
		databases.active.add_tag(trimmed);
		console.log(`Created tag "${trimmed}".`);
		name = '';
	}
</script>

<div class='add-tag'>
	<input
		class='field'
		placeholder='new tag'
		bind:value={name}
		onkeydown={(e) => { if (e.key === 'Enter') { add(); } }} />
	<button class='add' onclick={add}>add</button>
</div>

<Tags bind:selected />

<style>
	.add-tag {
		align-items : center;
		gap         : var(--gap-tight);
		display     : flex;
	}

	.field {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : 999px;
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
	}

	.add {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : 999px;
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
	}

	.add:hover {
		background : var(--hover);
	}
</style>
