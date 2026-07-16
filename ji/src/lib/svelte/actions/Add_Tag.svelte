<script lang='ts'>
	// Create a new tag: type a name and add it to the active store's tags. `ondone`
	// lets the caller close this view (the documents view returns to the list).
	import { databases } from '../../ts/database/Databases';
	import { debug } from '../../ts/common/Debug';

	let { ondone }: { ondone?: () => void } = $props();

	let name = $state('');

	function add() {
		const trimmed = name.trim();
		if (trimmed.length > 0) {
			databases.active.add_tag(trimmed);
			debug.log(`Created tag "${trimmed}".`);
		} else {
			debug.log('Create tag: nothing typed, so nothing added.');
		}
		name = '';
	}

	// Put the cursor in the field as soon as it appears. Doing it ourselves works
	// even though the "add tags" button still holds focus from the click that
	// opened this view — the browser's own auto-focus is refused in that case and
	// warns, so we focus by hand instead.
	function focus_on_mount(field: HTMLInputElement) {
		field.focus();
	}
</script>

<div class='add-tag'>
	<input
		use:focus_on_mount
		class='field'
		type='search'
		bind:value={name}
		placeholder='new tag'
		onkeydown={(e) => { if (e.key === 'Enter') { add(); } }} />
	<button class='button' onclick={add}>add</button>
	<button class='button' onclick={() => { debug.log('Done adding tags — closing the new-tag view.'); ondone?.(); }}>done</button>
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

	.field {
		height     : var(--height-control);
		box-sizing : border-box;
	}

	.button {
		height     : var(--height-control);
		box-sizing : border-box;
		cursor     : pointer;
	}

	.button:hover {
		background : var(--hover);
	}
</style>
