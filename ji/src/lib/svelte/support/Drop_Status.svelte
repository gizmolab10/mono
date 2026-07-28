<script lang='ts'>
	import { w_drop_total, w_drop_captured, w_drop_question, w_drop_message, w_drop_cap, request_drop_cancel, T_Keep } from '../../ts/managers/Dropping';
	import { say_bytes } from '../../ts/types/Document';
	import { debug } from '../../ts/common/Debug';
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

	// The ring: a light disc with a solid wedge that sweeps around like a clock hand,
	// growing from nothing to a full disc as the count climbs — a pie, easier to read
	// at a glance than a thin arc. The svg is turned so the wedge starts at the top.
	const radius = k.size.svg / 2 - 2;
	const wedge  = $derived.by(() => {
		const c = k.size.svg / 2;
		const r = radius;
		const f = Math.max(0, Math.min(1, fraction));
		if (f <= 0) { return ''; }                                    // nothing done yet: no wedge
		if (f >= 1) {                                                 // all done: a full disc (two half arcs)
			return `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c} ${c + r} A ${r} ${r} 0 1 1 ${c} ${c - r} Z`;
		}
		const angle = 2 * Math.PI * f;
		const end_x = c + r * Math.cos(angle);
		const end_y = c + r * Math.sin(angle);
		const long  = f > 0.5 ? 1 : 0;                                // past halfway, take the long way round
		return `M ${c} ${c} L ${c + r} ${c} A ${r} ${r} 0 ${long} 1 ${end_x} ${end_y} Z`;
	});

	// Which copies the person has picked. Each new question starts with the more recent
	// copy checked (the common wish is "take the newer one"). "Do the same for the rest"
	// starts checked, but keeps whatever it was last set to: turn it off on one question
	// and it stays off for the next, so a person is never re-asked to opt out. OK is dead
	// if neither copy is picked.
	let keep_stored  = $state(false);
	let keep_dropped = $state(true);
	let repeat       = $state(true);
	// The more recent copy shows on top; when the dropped one is newer, it leads.
	const dropped_newer = $derived($w_drop_question ? ($w_drop_question.dropped.date ?? 0) >= ($w_drop_question.stored.date ?? 0) : true);
	$effect(() => {
		if ($w_drop_question) {
			keep_dropped = dropped_newer;
			keep_stored  = !dropped_newer;
		}
	});
	// A new drop starts with "do the same" back on; within one drop it keeps its setting.
	let was_busy = false;
	$effect(() => {
		if (busy && !was_busy) { repeat = true; }
		was_busy = busy;
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

	// The AI too-big refusal: a "do not ask again" tick sits above its OK. Each new one starts
	// unticked.
	let hide_next = $state(false);
	$effect(() => { if ($w_drop_cap) { hide_next = false; } });
	function ok_cap() { $w_drop_cap?.answer(hide_next); }
</script>

{#if busy}
	<div class='drop-status'>
		captured {$w_drop_captured} of {$w_drop_total}
		<svg class='drop-ring' viewBox='0 0 {k.size.svg} {k.size.svg}'>
			<circle cx={k.size.svg / 2} cy={k.size.svg / 2} r={radius} class='ring-track' />
			<path d={wedge} class='ring-done' />
		</svg>
		<!-- Stops the drop between items; whatever is already saved stays. -->
		<button class='drop-cancel' onclick={(event) => { event.stopPropagation(); debug.log('Drop cancel pressed — stopping the capture.'); request_drop_cancel(); }}>cancel</button>
	</div>
{/if}

<!-- A line between the counting line above and the dedup question below. -->
{#if busy && $w_drop_question}
	<hr class='drop-divider' />
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<!-- a click in here is an answer, not a click on the background: the view's
     background clearer would close the drop box out from under the question -->
{#if $w_drop_question}
	{@const question = $w_drop_question}
	<div class='drop-dialog' onclick={(event) => event.stopPropagation()}>
		<div class='dialog-text'>"{question.name}" is already here, with a different date. Which do you want to keep?</div>
		{#snippet stored_choice()}
			<label class='dialog-choice'>
				<input type='checkbox' bind:checked={keep_stored} />
				the one already here, {dropped_newer ? 'older' : 'newer'} — {say_bytes(question.stored.size ?? 0)}, {say_date(question.stored.date)}
			</label>
		{/snippet}
		{#snippet dropped_choice()}
			<label class='dialog-choice'>
				<input type='checkbox' bind:checked={keep_dropped} />
				the one just dropped, {dropped_newer ? 'newer' : 'older'} — {say_bytes(question.dropped.size ?? 0)}, {say_date(question.dropped.date)}
			</label>
		{/snippet}
		{#if dropped_newer}
			{@render dropped_choice()}
			{@render stored_choice()}
		{:else}
			{@render stored_choice()}
			{@render dropped_choice()}
		{/if}
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
{:else if $w_drop_cap}
	{@const capped = $w_drop_cap}
	<div class='drop-dialog' onclick={(event) => event.stopPropagation()}>
		<div class='dialog-text'>{capped.message}</div>
		<label class='dialog-choice'>
			<input type='checkbox' bind:checked={hide_next} />
			do not ask again
		</label>
		<button class='dialog-ok' onclick={ok_cap}>OK</button>
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

	/* A small pill to stop the drop; matches the OK button below. */
	.drop-cancel {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		font-size     : var(--font-label);
		background    : transparent;
		cursor        : pointer;
		padding       : 0 var(--gap);
	}

	.drop-cancel:hover {
		background : var(--hover);
	}

	.ring-track {
		fill         : var(--white);
		stroke       : var(--accent);
		stroke-width : 1;
	}

	.ring-done {
		fill : var(--accent-dark);
	}

	.drop-divider {
		border     : none;
		border-top : var(--thickness-normal) solid var(--accent);
		margin     : var(--gap) 0 0;
		width      : 100%;
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
