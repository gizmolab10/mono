# Using rules

A rule assigns a kind or a tag reads one thing about every file, its name, its location or its content, tries a regex against it, and gives every file that matches one label, a kind or a tag.

## Where the section is

The details column, under the word rules on its separator. Press the word to open or shut the section.

## Reading a rule

Each rule is one line: what it reads, the regex, and the label it gives.

    location ~ /^memory\/[^/]+\/truth\/design\// → kind arch

That one gives the kind arch to every file whose path from the top of the repo begins with a project's truth/design folder. The slashes round the regex are the line's drawing, not part of the regex: the form's regex field takes it bare, `^memory\/[^/]+\/truth\/design\/`. A regex typed with the slashes matches nothing. The × at the end of the line takes the rule away.

## Adding one

The form is the four rows at the end of the section. On the first, press what the rule gives, kind or tag. On the second, press what it reads, name, location or content. Type the regex on the third and the label on the fourth, then press add, at the right of the first row. The two choices are remembered across launches, location and kind until changed.

The form shows one of the rules in the db, the first at launch: what it reads and gives picked, its regex and label filled in. The steppers at the far left of the first row move to the rule before or after, and the one shown is remembered across launches. Change what is shown and press add to write a new rule from it; the new rule becomes the one shown.

1. **name** is the file's name with its ending, such as `questions.md`.
2. **location** is the file's path from the top of the repo, such as `memory/lv/logs/questions.md`.
3. **content** is the file's words, read only when a rule asks for them.

A regex that will not compile is refused, and so is a rule missing its regex or its label.

## What happens next

The dispatcher runs every rule on every file at once, and the list is relabeled from the db. From then on the rules run on a file only when it is new or has changed, at each of the dispatcher's looks at the disk, three seconds apart.

## Rules and my own labels

A rule never changes or removes a label i put on by hand. What a rule gives sits beside mine in the db, made by rule. Taking a rule away runs every rule left on every file, so the labels the gone rule gave go with it, and mine stay.

## Under the hood

The rules are rows in ai.db. The dispatcher's /rules, /add-rule and /remove-rule answer the section, and run_rules does the running.
