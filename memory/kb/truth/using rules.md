# Using rules

A rule gives a label, a kind or a tag, to every file that matches it: it reads one thing about a file, its name, its location or its content, and tries a regex against it. The rules are rows in the host's db, ai.db for ai, beside the dispatcher.

## Where the section is

The details column, under the word rules on its separator. Press the word to open or shut the section.

## Reading a rule

Each rule is one line: what it reads, the regex, and the label it gives.

    location ~ /^memory\/[^/]+\/truth\/design\// → kind arch

That one gives the kind arch to every file whose path from the top of the repo begins with a project's truth/design folder. The slashes round the regex are the line's drawing, not part of the regex: the form's regex field takes it bare, `^memory\/[^/]+\/truth\/design\/`. A regex typed with the slashes matches nothing. The × at the end of the line takes the rule away.

1. **name** is the file's name with its ending, such as `questions.md`.
2. **location** is the file's path from the top of the repo, such as `memory/lv/zone/questions.md`.
3. **content** is the file's words, read once per file and only when a rule asks for them.

## Adding one

The form is the four rows at the end of the section. On the first, press what the rule gives, kind or tag. On the second, press what it reads, name, location or content. Type the regex on the third and the label on the fourth, then press add, at the right of the first row. The two choices are remembered across launches, location and kind until changed.

The form shows one of the rules in the db, the first at launch: what it reads and gives picked, its regex and label filled in. The steppers at the far left of the first row move to the rule before or after, and the one shown is remembered across launches. Change what is shown and press add to write a new rule from it; the new rule becomes the one shown.

A rule missing its regex or its label is refused on the page, and a regex that will not compile is refused by the dispatcher, each said on the status line.

## When the rules run

Adding a rule or taking one away runs every rule on every file, and the list is relabeled from the db. Otherwise the rules run on a file only when it is new or has changed, at each of the dispatcher's looks at the disk, three seconds apart. The plugin's labels for a file come with the rules', as rule rows.

## Rules and my own labels

A rule never changes or removes a label i put on by hand. What a rule gives sits beside mine in the db, made by rule. Taking a rule away runs every rule left on every file, so the labels the gone rule gave go with it, and mine stay.

## Where the page meets the dispatcher

kb's Saving.ts asks, the dispatcher answers, and run_rules does the running.

| function | takes | answers | called by |
| --- | --- | --- | --- |
| `/rules` | the host | every rule, oldest first: its id, what it reads, its regex, the label's name and value | D_Rules.svelte, when the section mounts and after every add or removal |
| `/add-rule` | the host and one rule: reads, pattern, name, value | the rule's id and how many files were run, or the refusal | the add button |
| `/remove-rule` | the host and a rule's id | whether it went and how many files were run | the × on a rule's line |

Not: the ai's suggested labels, which are rows made by ai, not by rule, and are proposed in [hosting kb](../../mu/zone/hosting%20kb.md); the labels the plugin reads off a file, which run_rules writes as rule rows but the rules section never shows.
