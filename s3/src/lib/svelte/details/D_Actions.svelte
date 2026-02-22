<script lang='ts'>
	import { ux }        from '../../state/ux.svelte';
	import { k }         from '../../common/Constants';

	let ancestry = $derived(ux.ancestry_forDetails);
	let thing    = $derived(ancestry?.thing ?? null);

	const actions = [
		{ label: 'create child', icon: '+',  disabled: () => !thing },
		{ label: 'delete',       icon: '×',  disabled: () => !thing || thing!.isRoot },
		{ label: 'duplicate',    icon: '⊕',  disabled: () => !thing || thing!.isRoot },
	];

	function handle_action(label: string) {
		if (!ancestry || !thing) return;
		switch (label) {
			case 'create child':
				// stub — will wire to persistent_create in Phase 9 session 2
				console.log('create child of', thing.title);
				break;
			case 'delete':
				console.log('delete', thing.title);
				break;
			case 'duplicate':
				console.log('duplicate', thing.title);
				break;
		}
	}
</script>

{#if thing}
	<div class='actions'>
		{#each actions as action}
			<button
				class    = 'action-button'
				disabled = {action.disabled()}
				onclick  = {() => handle_action(action.label)}>
				<span class='icon'>{action.icon}</span>
				<span class='label'>{action.label}</span>
			</button>
		{/each}
	</div>
{:else}
	<p class='empty'>{k.nothing_to_show}</p>
{/if}

<style>
	.actions {
		display         : flex;
		flex-wrap       : wrap;
		gap             : 4px;
		padding         : 6px 8px;
	}

	.action-button {
		display          : flex;
		align-items      : center;
		gap              : 4px;
		padding          : 3px 8px;
		border           : 1px solid #555;
		border-radius    : 4px;
		background-color : transparent;
		color            : #aaa;
		font-size        : 10px;
		font-family      : system-ui, sans-serif;
		cursor           : pointer;
		transition       : background-color 0.1s;
	}

	.action-button:hover:not(:disabled) {
		background-color : #444;
		color            : #ddd;
	}

	.action-button:disabled {
		opacity : 0.3;
		cursor  : default;
	}

	.icon {
		font-size : 12px;
	}

	.empty {
		padding     : 8px;
		text-align  : center;
		font-size   : 10px;
		color       : #666;
		font-family : system-ui, sans-serif;
	}
</style>
