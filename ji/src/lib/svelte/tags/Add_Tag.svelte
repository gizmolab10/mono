<script lang='ts'>
	// Create a new tag: type a name and add it to the active store's tags.
	import { databases } from '../../ts/database/Databases';

	let name = $state('');

	function add() {
		const trimmed = name.trim();
		if (trimmed.length > 0) {
			databases.active.add_tag(trimmed);
			console.log(`Created tag "${trimmed}".`);
		} else {
			console.log('Create tag: nothing typed, so nothing added.');
		}
		name = '';
	}
</script>

<div class='add-tag'>
	<!-- svelte-ignore a11y_autofocus -->
	<input
		class='field'
		placeholder='new tag'
		autofocus
		bind:value={name}
		onkeydown={(e) => { if (e.key === 'Enter') { add(); } }} />
	<button class='button' onclick={add}>add</button>
</div>

<style>
	.add-tag {
		align-items     : center;
		justify-content : center;
		gap             : var(--gap-tight);
		display         : flex;
	}

	.field, .button {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : 999px;
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
	}

	.button {
		cursor : pointer;
	}

	.button:hover {
		background : var(--hover);
	}
</style>
