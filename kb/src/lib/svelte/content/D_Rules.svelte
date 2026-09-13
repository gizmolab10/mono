<script lang='ts'>
	import { add_rule, remove_rule, rules_in_db, type Rule } from '../../ts/utilities/Saving';
	import { show_status } from '../../ts/managers/Status';
	import { files } from '../../ts/managers/Files';
	import { hit_target } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';
	import { onMount } from 'svelte';

	// The rules the dispatcher runs on every file added or changed: what each reads — the file's
	// name, its location or its content — the regex it matches, and the label it gives, a kind
	// or a tag. A rule never changes or removes a label a person put on. Adding one or taking
	// one away runs every rule on every file, and every record here is relabeled from the db.

	let rules   = $state<Rule[]>([]);
	let reads   = $state<Rule['reads']>('location');
	let pattern = $state('');
	let name    = $state<Rule['name']>('kind');
	let value   = $state('');

	async function fetch_rules() {
		rules = await rules_in_db();
		debug.log(`Rules: the db holds ${rules.length}.`);
	}

	onMount(fetch_rules);

	async function handle_add() {
		const regex = pattern.trim();
		const label = value.trim();
		if (regex === '' || label === '') { show_status('a rule needs a regex and a label'); return; }
		const answer = await add_rule({ reads, pattern: regex, name, value: label });
		if (!answer.ok) {
			show_status(`rule not added — ${answer.why}`);
			debug.log(`Rules: NOT added — ${reads} matching /${regex}/ giving ${name} "${label}" — ${answer.why}.`);
			return;
		}
		debug.log(`Rules: added — ${reads} matching /${regex}/ gives ${name} "${label}". Every rule was run on every file.`);
		pattern = '';
		value = '';
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
	<!-- One more rule: what it reads, the regex, and the label it gives. -->
	<div class='rule add'>
		<select class='field' bind:value={reads} use:hit_target={{ id: 'rules.reads', tip: 'what the rule reads' }}>
			<option value='name'>name</option>
			<option value='location'>location</option>
			<option value='content'>content</option>
		</select>
		<input class='field grows' placeholder='regex' bind:value={pattern} use:hit_target={{ id: 'rules.pattern', tip: 'the regex it matches' }} />
		<select class='field' bind:value={name} use:hit_target={{ id: 'rules.name', tip: 'what the rule gives' }}>
			<option value='kind'>kind</option>
			<option value='tag'>tag</option>
		</select>
		<input class='field' placeholder='label' bind:value={value} use:hit_target={{ id: 'rules.value', tip: 'the kind or the tag it gives' }} />
		<button class='pill' use:hit_target={{ id: 'rules.add', onpress: handle_add, tip: 'add this rule, and run every rule on every file' }}>add</button>
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
		align-items : center;
		display     : flex;
		gap         : var(--gap-tiny);
		font-size   : var(--font-faint);
	}

	.says {
		flex        : 1 1 auto;
		min-width   : 0;
		overflow    : hidden;
		white-space : nowrap;
		text-overflow : ellipsis;
	}

	.field {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius);
		font-size     : var(--font-faint);
		background    : var(--white);
		color         : var(--text);
		font-family   : inherit;
		box-sizing    : border-box;
		min-width     : 0;
		width         : 5.5em;
	}

	.grows {
		flex : 1 1 auto;
	}

	.pill {
		border        : var(--thick) solid var(--black);
		padding       : 0 var(--gap);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
		white-space   : nowrap;
		font-family   : inherit;
	}

	.pill:global([data-hit]) {
		background : var(--hover);
	}
</style>
