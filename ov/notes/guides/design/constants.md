---
kind: refer
title: "UX terms and concepts"
description: ""
tags: [stale, think, UX, visual-design]
date: 2026-08-07
---
# UX terms and concepts

## constants

The names of subtypes of measurement types are completely inconsistent. They can easily be standardized, reducing the need to open the file of constants to make sure i am using the right one. The first column below are my proposed subtypes. The other columns are the names of subtypes, each column being a type.

| type➜  | sep   | thick  | gap     | font    | fw     | em       | corner | width   | height   | size      |
| ------ | ----- | ------ | ------- | ------- | ------ | -------- | ------ | ------- | -------- | --------- |
| micro  |       |        | micro   |         |        |          |        |         |          |           |
| faint  |       | faint  | details | credit  |        |          |        |         |          |           |
| tiny   | nrmal |        | tight   | label   |        | tracking | banner |         |          |           |
| small  | big   | mild   | small   | control |        | small    | build  | details |          | svg       |
| normal | huge  | normal | default | base    | normal | launch   | main   | window  | control  | control   |
| big    |       | bold   |         | banner  | banner | big      |        | content | hideable | hamburger |
| fat    |       | fat    | fat     | large   |        |          |        | modal   | banner   | button    |
| huge   |       |        | huge    | huge    | title  |          |        |         |          |           |

### the ladder — built 2026-08-08

Both tables above are history now. Every type below uses the same words, and the styling names match: `--font-tiny`, `--gap-tiny`, `--thick-small`.

| type➜  | thickness | gap   | font  | fw  | em  | corner | width | height | size |
| ------ | --------- | ----- | ----- | --- | --- | ------ | ----- | ------ | ---- |
| micro  |           | 1.3   |       |     |     |        |       |        |      |
| faint  | 0.56      | 1.94  | 8.75  |     |     |        |       |        |      |
| tiny   |           | 3.89  | 10.4  |     | .03 | 10     |       |        |      |
| small  | 0.78      | 4.32  | 11.7  |     | 1.4 | 11.67  | 245   |        | 19.69|
| normal | 1.11      | 7.78  | 13    | 550 | 2   | 17.5   | 300   | 21.88  | 21.88|
| big    | 1.67      |       | 14    | 650 | 8   |        | 350   | 28.44  | 24.5 |
| fat    | 2.22      | 16.33 | 17.5  |     |     |        | 605.5 | 42     | 28   |
| huge   | 7.78      | 31.11 | 24.5  | 750 |     |        |       |        |      |

### proposal

One ladder of nine steps — micro, faint, tiny, small, normal, big, fat, huge, pill — and every type uses those words and no others. A step a type has no use for simply does not exist there; nothing is invented to fill a gap. Then reaching for a size is one decision, not two: pick the type, pick the step, and never open the file to check what this type happens to call its middle.

**What it changes.** Only names. Every number stays exactly what it is, so nothing on screen moves. It is one pass over the constants and one over everything that reads them.

**What it buys.** `--font-label` and `--gap-tight` become `--font-tiny` and `--gap-tiny`, and the two read as the same step of two different ladders — which is what they are. Today nothing says so.

**Combined.** `separator` and `thickness` are both thicknesses of a line. The two collapse into one type -> `thickness`. The ladder, however does not get shorter.

**Some names carry a why, not a size** — `launch`, `banner`, `title`. Renaming them to steps loses that, so each wants its note kept in a comment: `normal, // the setting-up words`.
