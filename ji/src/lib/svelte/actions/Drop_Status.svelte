<script lang='ts'>
	import { w_drop_total, w_drop_captured, w_drop_question, w_drop_message, T_Keep } from '../../ts/managers/Dropping';
	import { say_bytes } from '../../ts/types/Document';
	import { k } from '../../ts/common/Constants';

	// Two lines that only appear while something is being dropped.
	//
	// The status line counts: "captured 3 of 40", with a ring filling beside it. It
	// stands where the list of families stands when nothing is happening.
	//
	// The dialog line sits below it and is rarely seen: it carries the question
	// asked when two files share a name but not their dates, and any single thing
	// the drop has to say (a refusal). The saving waits here — nothing is saved or
	// removed until OK — and the line vanishes the moment OK is pressed.

	const busy     = $derived($w_drop_total > 0);
	const fraction = $derived($w_drop_total > 0 ? $w_drop_captured / $w_drop_total : 0);

	// The ring: one circle drawn as a dashed line whose dash is as long as the part
	// already done, so it fills up as the count climbs.
	const radius        = k.size.svg / 2 - 2;
	const circumference = 2 * Math.PI * radius;
	const drawn         = $derived(circumference * fraction);

	// Which copies the person has picked. Starts with the dropped one alone — the
	// common wish is "take the newer one" — and OK is dead if neither is picked.
	let keep_stored  = $state(false);
	let keep_dropped = $state(true);
	let repeat       = $state(false);
	$effect(() => {
		if ($w_drop_question) { keep_stored = false; keep_dropped = true; repeat = false; }
	});

	function say_date(date?: number | null): string {
		return (date == null) ? 'no date' : new Date(date).toLocaleString();
	}

	function ok_question() {
		const question = $w_drop_question;
		if (!question) { return; }
		const keep = (keep_stored && keep_dropped) ? T_Keep.both : keep_stored ? T_Keep.old : T_Keep.new;
		question.answer(keep, repeat);
	}
</script>

{#if busy}
	<div class='drop-status'>
		captured {$w_drop_captured} of {$w_drop_total}
		<svg class='drop-ring' viewBox='0 0 {k.size.svg} {k.size.svg}'>
			<circle cx={k.size.svg / 2} cy={k.size.svg / 2} r={radius} class='ring-track' />
			<circle cx={k.size.svg / 2} cy={k.size.svg / 2} r={radius} class='ring-done'
				stroke-dasharray='{drawn} {circumference}' />
		</svg>
	</div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<!-- a click in here is an answer, not a click on the background: the view's
     background clearer would close the drop box out from under the question -->
{#if $w_drop_question}
	{@const question = $w_drop_question}
	<div class='drop-dialog' onclick={(event) => event.stopPropagation()}>
		<div class='dialog-text'>"{question.name}" is already here, with a different date. Which do you want to keep?</div>
		<label class='dialog-choice'>
			<input type='checkbox' bind:checked={keep_stored} />
			the one already here — {say_bytes(question.stored.size ?? 0)}, {say_date(question.stored.date)}
		</label>
		<label class='dialog-choice'>
			<input type='checkbox' bind:checked={keep_dropped} />
			the one just dropped — {say_bytes(question.dropped.size ?? 0)}, {say_date(question.dropped.date)}
		</label>
		{#if question.offer_repeat}
			<label class='dialog-choice'>
				<input type='checkbox' bind:checked={repeat} />
				do the same for the rest of this drop
			</label>
		{/if}
		<button class='dialog-ok' disabled={!keep_stored && !keep_dropped} onclick={ok_question}>OK</button>
	</div>
{:else if $w_drop_message}
	{@const said = $w_drop_message}
	<div class='drop-dialog' onclick={(event) => event.stopPropagation()}>
		<div class='dialog-text'>{said.message}</div>
		<button class='dialog-ok' onclick={said.answer}>OK</button>
	</div>
{/if}

<style>

	.drop-status {
		align-items     : center;
		justify-content : center;
		font-size       : var(--font-label);
		gap             : var(--gap);
		display         : flex;
	}

	.drop-ring {
		width     : var(--size-svg);
		height    : var(--size-svg);
		transform : rotate(-90deg);        /* start the fill at the top, not the right */
	}

	.ring-track {
		stroke       : var(--hover);
		stroke-width : 2;
		fill         : none;
	}

	.ring-done {
		stroke       : var(--accent-dark);
		stroke-width : 2;
		fill         : none;
	}

	.drop-dialog {
		flex-direction : column;
		align-items    : center;
		font-size      : var(--font-label);
		margin-top     : var(--gap);
		gap            : var(--gap);
		display        : flex;
	}

	.dialog-text {
		text-align : center;
	}

	.dialog-choice {
		align-items : center;
		cursor      : pointer;
		gap         : var(--gap);
		display     : flex;
	}

	.dialog-ok {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		background    : transparent;
		cursor        : pointer;
		padding       : 0 var(--gap);
	}

	.dialog-ok:hover:enabled {
		background : var(--hover);
	}

	.dialog-ok:disabled {
		opacity : var(--opacity-label);
		cursor  : default;
	}

</style>
