# Finished

One place that says where finished work sits, across every project, without reading every file. `tools/finished.py` writes this file, one line per memory file that holds finished work. The shorthand `finished` runs the script and replies with the count of lines it prints and the file's path. A twin of [write the code debt](write%20the%20code%20debt.md), decided 15 September 2026 from [proposal for finished](../zone/proposal%20for%20finished.md).

## The row

One table per project, under the project's own heading, which carries how many items the project's tables name: the numbers in its clauses added up. Three columns: z/t, the file as a link, finished. A file in zone gets z, a file in truth gets t, and a file outside both an empty cell.

## The patterns

Two, each a count by grep, never a reading, no judgment anywhere. A file gets one line, its clauses joined with "and".

| file | what is counted | the clause |
| --- | --- | --- |
| any .md but learn.md | lines opening with a dash and a checked box | N done |
| proposals.md | `##` sections with "Decided" or "culled" | N proposals settled |

No box inside a logs folder is counted: the work journal there is where finished items end up, and a done file moved there holds its boxes as a record; a logs folder's proposals.md still counts its settled sections. Nor are decided pacs: decisions.md is the rationale's home, and the process leaves it alone.

## The walk

Every project folder under memory, every markdown file however deep, finished.md itself left out. The folders archive and node_modules are skipped. A done folder is walked, since finished work sits there; code debt skips it.

## What it writes

The file whole: every project's items added up in the H1; today's date and the count of files; then the tables. Running it twice writes the same file. The file's own labels, kind analyze, tag now, its title and description, go into the db beside the dispatcher, never into the file.

## The process

`tools/process_finished.py`, run by the shorthand `process finished <X>` for one project X, decided 15 September 2026 from [proposal for finished](../zone/proposal%20for%20finished.md). Every checked box in X's memory files, with the lines indented under it, becomes part of one journal entry per file in `memory/X/logs/work journal.md`, the journal made where none exists, and leaves the file. Every settled proposal section does the same. Every file in a done folder moves whole to X's logs folder, index.md files staying, the links it holds or that name it re-pointed; a name already in logs is a collision, said and not moved. The logs folder is never read for boxes. finished.md is written again, and one D: line goes into X's log. `tools/test_process_finished.py` proves it on a made-up project.

## The proof

`tools/test_finished.py` feeds the script a made-up project folder and checks every pattern, the logs folder's boxes left out, a done folder walked, and the H1.
