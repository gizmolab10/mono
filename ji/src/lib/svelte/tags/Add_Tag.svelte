<script lang='ts'>
	// Choose which tags a drop gets, and create new ones. Normally shows the tag
	// chips with an "add" button after the last one. Clicking add hides the chips
	// and shows a name field; adding a name creates the tag and returns to chips.
	import { databases } from '../../ts/database/Databases';
	import Tags from './Tags.svelte';

	let { selected = $bindable(new Set<string>()) }: { selected?: Set<string> } = $props();

	let adding = $state(false);
	let name   = $state('');

	function begin() {
		adding = true;
	}

	function add() {
		const trimmed = name.trim();
		if (trimmed.length > 0) {
			databases.active.add_tag(trimmed);
			console.log(`Created tag "${trimmed}".`);
		} else {
			console.log('Create tag: nothing typed, so nothing added.');
		}
		name = '';
		adding = false;                                   // back to the chips
	}
</script>

{#if adding}
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
{:else}
	<Tags bind:selected {trailing} />
{/if}

{#snippet trailing()}
	<button class='button after-tags' onclick={begin}>add</button>
{/snippet}

<style>
	.add-tag {
		align-items : center;
		gap         : var(--gap-tight);
		display     : flex;
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

	/* Sit further from the last chip: the flex gap is one unit, add two more = 3x. */
	.after-tags {
		margin-left : calc(var(--gap-tight) * 2);
	}

	.button:hover {
		background : var(--hover);
	}
</style>
