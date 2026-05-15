<script lang='ts'>
	import { confirm } from '../../ts/managers/Confirm';

	const { w_request } = confirm;

	let remember = $state(false);

	function on_yes() { confirm.commit(remember); }
	function on_no()  { confirm.cancel(); }

	function on_keydown(e: KeyboardEvent) {
		if (!$w_request) return;
		if (e.key === 'Enter')  { e.preventDefault(); on_yes(); }
		if (e.key === 'Escape') { e.preventDefault(); on_no(); }
	}

	// Reset the checkbox each time a new request opens.
	$effect(() => {
		if ($w_request) remember = false;
	});
</script>

<svelte:document onkeydown={on_keydown} />

{#if $w_request}
	<div class='backdrop' onclick={on_no} role="presentation"></div>
	<div class='dialog' role="dialog" aria-modal="true">
		<div class='message'>{$w_request.message}</div>
		<label class='remember'>
			<input type='checkbox' bind:checked={remember}>
			don't ask again
		</label>
		<div class='buttons'>
			<button class='action-button cancel' onclick={on_no}>no</button>
			<button class='action-button confirm' onclick={on_yes}>yes</button>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		background      : rgba(0, 0, 0, 0.4);
		z-index         : var(--z-frontmost);
		position        : fixed;
		inset           : 0;
	}

	.dialog {
		transform       : translate(-50%, -50%);
		border-radius   : var(--r-common);
		background      : var(--bg);
		box-shadow      : 0 4px 16px rgba(0, 0, 0, 0.3);
		z-index         : var(--z-frontmost);
		flex-direction  : column;
		min-width       : 280px;
		max-width       : 420px;
		padding         : 20px;
		position        : fixed;
		color           : var(--text);
		gap             : 14px;
		display         : flex;
		top             : 50%;
		left            : 50%;
	}

	.message {
		font-size       : var(--font-common);
		line-height     : 1.4;
	}

	.remember {
		font-size       : var(--font-small);
		align-items     : center;
		cursor          : pointer;
		opacity         : 0.8;
		display         : flex;
		gap             : 6px;
	}

	.buttons {
		justify-content : flex-end;
		display         : flex;
		gap             : 10px;
	}

	.action-button {
		border          : var(--th-border) solid currentColor;
		padding         : 0 var(--l-padding) 1px var(--l-padding);
		height          : var(--h-button-common);
		font-size       : var(--font-common);
		border-radius   : var(--r-common);
		background      : var(--white);
		box-sizing      : border-box;
		cursor          : pointer;
		color           : inherit;
	}

	.action-button:hover {
		background      : var(--hover);
	}

	.confirm {
		background      : var(--accent);
	}
</style>
