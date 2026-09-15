# Code debt

i wanted one place that says where unfinished work sits, across every project, without reading every file. `tools/code_debt.py` writes it: [code debt.md](../zone/code%20debt.md), one line per memory file that holds unfinished work. The shorthand `debt` runs the script and replies with the count of lines and the file's path.

## The row

One table per project, under the project's own heading, which carries how many items the project's tables name: the numbers in its clauses added up, a clause with no number counting one. Three columns: z/t, the file as a link, needs this. A file in zone gets z, a file in truth gets t, and a file outside both, the log among them, no letter. The link is relative to where code debt.md sits, a space in a name percent-encoded.

## The patterns

Eight, each a count by grep, never a reading, no judgment anywhere. A file gets one line, its clauses joined with "and".

| file | what is counted | the clause |
| --- | --- | --- |
| any .md | lines opening with a dash and an empty checkbox | N open, or N open truths inside truth |
| decisions.md | pac bullets under Evaluations without "Decided" | decide N pacs |
| proposals.md | `##` sections without "Decided" or "dead" | decide N proposals |
| questions.md | list lines | answer N questions |
| logs/log.md | dash lines after the consolidated marker and before any rule, S: and D: lines left out | settle N lines |
| learn.md | raw-log entries, `- N.` | distill N entries |
| collisions.md | `##` entries | rewrite N collisions |
| drive.md | the file exists | dissolve the drive |

## The walk

Every project folder under memory, every markdown file however deep, code debt.md itself left out. The folders archive, done and node_modules are skipped. A logs folder is walked, since the project's log has sat there from 13 September 2026.

## What it writes

The file whole: today's date and the count, then the tables. Running it twice writes the same file. The file's own labels, kind analyze, tag now, its title and description, go into the db beside the dispatcher, never into the file.

## The proof

`tools/test_code_debt.py` feeds the script a made-up project folder and checks every pattern, 15 checks. The proposal that made it is the section big picture, 9 September 2026, of [proposals.md](memory/shared/logs/proposals.md), its name until 13 September 2026, and unfinished its name from then until 15 September 2026.
