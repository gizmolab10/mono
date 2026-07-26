<script lang='ts'>
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { refresh_llm_docs } from '../../ts/database/LLM_Docs';
	import { debug } from '../../ts/common/Debug';

	// The init screen for the AI store: when this browser is missing the two settings that
	// let it reach the shared AnythingLLM (the address pointer and the share token), it asks
	// for a password. The right word writes both settings and drops to the list; a wrong one
	// says so and clears the field. The settings and the password ride in the build — a low-
	// stakes gate, not a secret.

	const PASSWORD = 'suchness';

	// The two settings the password unlocks. Saved as quoted text (the way the store reads
	// them), so the hand-editing mistake can't happen.
	const POINTER = 'https://gist.githubusercontent.com/gizmolab10/1e32a9ee731eb1644f99dc88a26f2f5d/raw/ji-address.txt';
	const KEY     = 'DYpAsrYJUsgeFZKbyFwLJlt8klezXXaMxwYdDSZCl_o';

	let entry = $state('');
	let wrong = $state(false);

	function submit() {
		const word = entry.trim();
		if (word !== PASSWORD) {
			wrong = true;
			entry = '';
			debug.log('AI credentials: wrong password — nothing saved.');
			return;
		}
		preferences.write(T_Preference.llmPointer, POINTER);
		preferences.write(T_Preference.llmKey, KEY);
		debug.log('AI credentials: password accepted — saved the address pointer and the share token; reading what the AI holds.');
		refresh_llm_docs();
		w_operation.set(T_Operation.list);
	}

	function on_key(event: KeyboardEvent) {
		if (event.key === 'Enter') { event.preventDefault(); submit(); }
	}
</script>

<div class='init-local'>
	<div class='prompt'>enter the password to connect this browser to the AI</div>
	<input class='entry' type='password' placeholder='password'
		bind:value={entry} onkeydown={on_key} oninput={() => wrong = false} />
	{#if wrong}
		<div class='wrong'>that isn't it — try again</div>
	{/if}
</div>

<style>
	.init-local {
		gap             : var(--gap);
		flex-direction  : column;
		align-items     : center;
		justify-content : center;
		display         : flex;
		height          : 100%;
		width           : 100%;
	}

	.prompt {
		opacity   : var(--opacity-label);
		font-size : var(--font-label);
		color     : var(--text);
	}

	.entry {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		text-align    : center;
		width         : 220px;
	}

	.entry:focus {
		background : var(--hover);
		outline    : none;
	}

	.wrong {
		color     : var(--accent-dark);
		font-size : var(--font-label);
	}
</style>
