<script lang='ts'>
	import { add_rule, remove_rule, rules_in_db, type Rule } from '../../ts/utilities/Saving';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { show_status } from '../../ts/managers/Status';
	import { files } from '../../ts/managers/Files';
	import { hit_target, Steppers } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';
	import { onMount } from 'svelte';

	// The rules the dispatcher runs on every file added or changed: what each reads — the file's
	// name, its location or its content — the regex it matches, and the label it gives, a kind
	// or a tag. A rule never changes or removes a label a person put on. Adding one or taking
	// one away runs every rule on every file, and every record here is relabeled from the db.

	let rules   = $state<Rule[]>([]);
	let pattern = $state('');
	let value   = $state('');

	// What the next rule reads and what it gives, one choice each, remembered across launches:
	// location and kind until changed.
	const READS: Rule['reads'][] = ['name', 'location', 'content'];
	const GIVES: Rule['name'][]  = ['kind', 'tag'];
	const w_reads = preferences.persistent<Rule['reads']>(T_Preference.rule_reads, 'location');
	const w_gives = preferences.persistent<Rule['name']>(T_Preference.rule_gives, 'kind');

	// Which of the db's rules the form shows, remembered across launches, the first until stepped.
	// The steppers move it, and the rule at it is put into the form: what it reads and gives
	// picked, its regex and label filled in. With no rules at all the form is empty.
	const w_rule_index = preferences.persistent<number>(T_Preference.rule_index, 0);

	function show_rule() {
		const index = Math.min(Math.max($w_rule_index, 0), Math.max(rules.length - 1, 0));
		if (index !== $w_rule_index) { w_rule_index.set(index); }
		const rule = rules[index];
		if (!rule) { pattern = ''; value = ''; debug.log('Rules: the db holds none, so the form is empty.'); return; }
		pattern = rule.pattern;
		value   = rule.value;
		w_reads.set(rule.reads);
		w_gives.set(rule.name);
		debug.log(`Rules: showing rule ${index + 1} of ${rules.length} — ${rule.reads} matching /${rule.pattern}/ giving ${rule.name} "${rule.value}".`);
	}

	function step_to(index: number) {
		w_rule_index.set(index);
		show_rule();
	}

	async function fetch_rules() {
		rules = await rules_in_db();
		debug.log(`Rules: the db holds ${rules.length}.`);
		show_rule();
	}

	onMount(fetch_rules);

	async function handle_add() {
		const regex = pattern.trim();
		const label = value.trim();
		if (regex === '' || label === '') { show_status('a rule needs a regex and a label'); return; }
		const answer = await add_rule({ reads: $w_reads, pattern: regex, name: $w_gives, value: label });
		if (!answer.ok) {
			show_status(`rule not added — ${answer.why}`);
			debug.log(`Rules: NOT added — ${$w_reads} matching /${regex}/ giving ${$w_gives} "${label}" — ${answer.why}.`);
			return;
		}
		debug.log(`Rules: added — ${$w_reads} matching /${regex}/ gives ${$w_gives} "${label}". Every rule was run on every file.`);
		w_rule_index.set(rules.length);            // the new rule is the last, oldest first, and the form shows it
		await fetch_rules();
		await files.relabel_all();
		show_status(`rule added — ${rules.length} now`);
	}

	async function handle_remove(rule: Rule) {
		const answer = await remove_rule(rule.id);
		if (!answer.ok) {
			show_status(`rule not taken away — ${answer.why}`);
			debug.log(`Rules: NOT taken away — ${rule.reads} matching /${rule.pattern}/ giving ${rule.name} "${rule.value}" — ${answer.why}.`);
			return;
		}
		debug.log(`Rules: taken away — ${rule.reads} matching /${rule.pattern}/ gave ${rule.name} "${rule.value}". Every rule left was run on every file.`);
		await fetch_rules();
		await files.relabel_all();
		show_status(`rule taken away — ${rules.length} left`);
	}
</script>

<div class='rules'>
	{#each rules as rule (rule.id)}
		<div class='rule'>
			<span class='says'>{rule.reads} ~ /{rule.pattern}/ → {rule.name} {rule.value}</span>
			<button class='pill'
				use:hit_target={{ id: `rules.remove.${rule.id}`, onpress: () => handle_remove(rule), tip: 'take this rule away' }}>×</button>
		</div>
	{/each}
	<!-- One more rule, on four rows: the steppers, what it gives and add at the right, then what
	     the rule reads centered on a row of its own, then the regex and the label each the whole width. -->
	<div class='add'>
		<div class='buttons'>
			<Steppers id='rules.step' always_both can_back={$w_rule_index > 0} can_forward={$w_rule_index < rules.length - 1}
				onprev={() => step_to($w_rule_index - 1)} onnext={() => step_to($w_rule_index + 1)}
				back_says='the rule before' forward_says='the rule after' />
			<div class='segments'>
				{#each GIVES as choice (choice)}
					<button class='segment' class:current={$w_gives === choice}
						use:hit_target={{ id: `rules.gives.${choice}`, onpress: () => w_gives.set(choice), tip: `the rule gives a ${choice}` }}>{choice}</button>
				{/each}
			</div>
			<span class='spacer'></span>
			<button class='pill' use:hit_target={{ id: 'rules.add', onpress: handle_add, tip: 'add this rule, and run every rule on every file' }}>add</button>
		</div>
		<div class='buttons'>
			<span class='spacer'></span>
			<div class='segments'>
				{#each READS as choice (choice)}
					<button class='segment' class:current={$w_reads === choice}
						use:hit_target={{ id: `rules.reads.${choice}`, onpress: () => w_reads.set(choice), tip: `the rule reads the file's ${choice}` }}>{choice}</button>
				{/each}
			</div>
			<span class='spacer'></span>
		</div>
		<input class='field wide' placeholder='regex' bind:value={pattern} use:hit_target={{ id: 'rules.pattern', tip: 'the regex it matches' }} />
		<input class='field wide' placeholder='label' bind:value={value} use:hit_target={{ id: 'rules.value', tip: 'the kind or the tag it gives' }} />
	</div>
</div>

<style>
	.rules {
		flex-direction : column;
		display        : flex;
		gap            : var(--gap-tiny);
		padding        : 0;      /* the section's own box already gives a gap all round */
	}

	.rule {
		height      : var(--height);
		align-items : center;
		display     : flex;
		gap         : var(--gap-tiny);
		font-size   : var(--font-tiny);
	}

	.says {
		text-overflow : ellipsis;
		flex          : 1 1 auto;
		overflow      : hidden;
		white-space   : nowrap;
		min-width     : 0;
	}

	.field {
		height        : var(--height);
		border        : var(--thick-small) solid var(--black);
		font-size     : var(--font-tiny);
		border-radius : var(--radius);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		font-family   : inherit;
		width         : 5.5em;
		min-width     : 0;
	}

	/* The form's two rows, with a gap below them. */
	.add {
		gap            : var(--gap-tiny);
		margin-bottom  : var(--gap-tiny);
		flex-direction : column;
		display        : flex;
	}

	.wide {
		padding-left : var(--gap);
		width        : 100%;
	}

	/* The first row: the steppers at the far left, the gives control, a spacer, and add at the
	   right; the reads control's, centered by a spacer at each end. */
	.buttons {
		height      : var(--height);
		align-items : center;
		display     : flex;
		gap         : var(--gap);
	}

	.spacer {
		flex : 1 1 0;
	}

	/* The two segmented controls, drawn as the kinds row's: one box, the segments divided by
	   lines, the picked one on the accent. */
	.segments {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height);
		background    : var(--white);
		box-sizing    : border-box;
		overflow      : hidden;
		display       : flex;
		flex-shrink   : 0;
	}

	.segment {
		padding     : var(--pad-control);
		font-size   : var(--font-tiny);
		background  : transparent;
		font-family : inherit;
		white-space : nowrap;
		color       : var(--text);
		cursor      : pointer;
		border      : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thick) solid var(--black);
	}

	.segment.current {
		color      : var(--text-on-accent);
		background : var(--accent);
		cursor     : default;
	}

	.segment:not(.current):global([data-hit]) {
		background : var(--hover);
	}

	.pill {
		height        : var(--height);
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-tiny);
		background    : var(--white);
		padding       : 0 var(--gap);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
		font-family   : inherit;
		white-space   : nowrap;
	}

	.pill:global([data-hit]) {
		background : var(--hover);
	}
</style>
