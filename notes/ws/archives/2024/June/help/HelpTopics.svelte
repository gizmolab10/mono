<script>
	import { k, onMount } from '../../ts/common/GlobalImports';

	let dots = $state();
	let edit = $state();
	let focus = $state();
	let browse = $state();
	let selection = $state();
	let dotsTitle = $state(k.empty);
	let editTitle = $state(k.empty);
	let focusTitle = $state(k.empty);
	let browseTitle = $state(k.empty);
	let selectionTitle = $state(k.empty);
	let showingDots = $state(false);
	let showingEdit = $state(false);
	let showingFocus = $state(false);
	let showingBrowse = $state(false);
	let showingSelection = $state(true);

	const updateTitles = () => {
		dotsTitle = showingDots ? 'How the <b>Dots</b> work' : 'Dots';
		editTitle = showingEdit ? 'How to <b>Edit</b> an item' : 'Edit';
		focusTitle = showingFocus ? 'Changing the <b>Focus</b>' : 'Focus';
		browseTitle = showingBrowse ? '<b>Browsing</b> to a nearby item' : 'Browse';
		selectionTitle = showingSelection ? 'When a item is <b>selected</b>' : 'Select';
	}

	const showDots = () => {
		showingDots = true;
		showingEdit = false;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};

	const showEdit = () => {
		showingDots = false;
		showingEdit = true;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};
	
	const showSelection = () => {
		showingDots = false;
		showingEdit = false;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = true;
		updateTitles();
	};
	
	const showFocus = () => {
		showingDots = false;
		showingEdit = false;
		showingFocus = true;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};

	const showBrowse = () => {
		showingDots = false;
		showingEdit = false;
		showingFocus = false;
		showingBrowse = true;
		showingSelection = false;
		updateTitles();
	};

	onMount(() => {
		import('/src/lib/svelte/help/HelpDots.svelte').then(module => {
			dots = module.default;
		});
		import('/src/lib/svelte/help/HelpEdit.svelte').then(module => {
			edit = module.default;
		});
		import('/src/lib/svelte/help/HelpFocus.svelte').then(module => {
			focus = module.default;
		});
		import('/src/lib/svelte/help/HelpBrowse.svelte').then(module => {
			browse = module.default;
		});
		import('/src/lib/svelte/help/HelpSelection.svelte').then(module => {
			selection = module.default;
		});
		updateTitles();
	});
</script>

<style>
	button {
		height: 20px;
		color: #b64b1d;
		border: 1px solid;
		border-radius: 0.5em;
	}
	.selected {
		color: #223;
		background-color: #eff;
	}
	.help-buttons {
		gap: 15px;
		display: flex;
		margin-top: 10px;
		margin-bottom: 20px;
		justify-content: center;
	}
</style>

<div class='help-buttons'>
	<button class:selected={showingSelection} onclick={showSelection}>{@html selectionTitle}</button>
	<button class:selected={showingBrowse} onclick={showBrowse}>{@html browseTitle}</button>
	<button class:selected={showingFocus} onclick={showFocus}>{@html focusTitle}</button>
	<button class:selected={showingEdit} onclick={showEdit}>{@html editTitle}</button>
	<button class:selected={showingDots} onclick={showDots}>{@html dotsTitle}</button>
</div>
{#if showingSelection && selection}
	{@const SvelteComponent = selection}
	<SvelteComponent />
{/if}
{#if showingBrowse && browse}
	{@const SvelteComponent_1 = browse}
	<SvelteComponent_1 />
{/if}
{#if showingFocus && focus}
	{@const SvelteComponent_2 = focus}
	<SvelteComponent_2 />
{/if}
{#if showingEdit && edit}
	{@const SvelteComponent_3 = edit}
	<SvelteComponent_3 />
{/if}
{#if showingDots && dots}
	{@const SvelteComponent_4 = dots}
	<SvelteComponent_4 />
{/if}
