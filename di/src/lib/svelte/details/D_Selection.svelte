<script lang='ts'>
	import { face_label } from '../../ts/editors/Face_Label';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Editing } from '../../ts/types/Enumerations';
	import { scenes, stores } from '../../ts/managers';
	import { engine } from '../../ts/render';

	const { w_s_face_label } = face_label;
	const { w_root_so, w_selection } = stores;

	let selected_so = $derived($w_selection?.so ?? $w_root_so);

	let display_name = $derived(
		$w_s_face_label ? $w_s_face_label.current_name : selected_so?.name ?? ''
	);

	function handle_name(e: Event) {
		const input = e.target as HTMLInputElement;
		if (selected_so) {
			selected_so.name = input.value;
			scenes.save();
			stores.w_all_sos.update(sos => sos);
			face_label.sync(input.value);
		}
	}

	function handle_name_keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			if (face_label.state) face_label.cancel();
			else stores.w_editing.set(T_Editing.none);
			(e.target as HTMLInputElement).blur();
		}
	}

	function handle_name_focus(e: FocusEvent) {
		stores.w_editing.set(T_Editing.details_name);
		const cur = face_label.cursor;
		if (cur) {
			const input = e.target as HTMLInputElement;
			requestAnimationFrame(() => input.setSelectionRange(cur.start, cur.end));
		}
	}

	function handle_name_blur(e: FocusEvent) {
		const input = e.target as HTMLInputElement;
		face_label.cursor = { start: input.selectionStart ?? 0, end: input.selectionEnd ?? 0 };
		setTimeout(() => {
			if (stores.editing() !== T_Editing.face_label) {
				if (face_label.state) {
					face_label.commit(selected_so?.name ?? '');
				} else {
					stores.w_editing.set(T_Editing.none);
				}
			}
		});
	}
</script>

{#if selected_so}
	<label class='field'>
		<span class='label'>Name</span>
		<input
			type      = 'text'
			value     = {display_name}
			oninput   = {handle_name}
			onkeydown = {handle_name_keydown}
			onfocus   = {handle_name_focus}
			onblur    = {handle_name_blur}
		/>
	</label>
{:else}
	<p>No object selected</p>
{/if}
<div class='settings'>
	<button class='action-btn' use:hit_target={{ id: 'add-child', onpress: () => engine.add_child_so() }}>add child</button>
</div>

<style>
	.field {
		gap            : 0.25rem;
		flex-direction : column;
		display        : flex;
	}

	.label {
		font-size : 0.75rem;
		opacity   : 0.6;
	}

	input[type='text'] {
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		font-size     : 0.875rem;
		color         : inherit;
		background    : white;
		padding       : 0 6px;
		height        : 20px;
		outline       : none;
		border-radius : 4px;
	}

	input[type='text']:focus {
		border-color : currentColor;
		opacity      : 1;
	}

	.settings {
		display : flex;
		gap     : 6px;
	}

	.action-btn {
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		background    : white;
		padding       : 0 8px;
		border-radius : 10px;
		font-size     : 11px;
		height        : 20px;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	p {
		font-size : 0.875rem;
		opacity   : 0.6;
		margin    : 0;
	}
</style>
