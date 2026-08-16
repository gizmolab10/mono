---
kind: specify
title: "UX terms and concepts"
description: ""
tags: [active, data, done, program, proposal]
date: 2026-08-07
---
# Constants and subtypes

## constants

The names of subtypes of measurement types are completely inconsistent. They can easily be standardized, reducing the need to open the file of constants to make sure i am using the right one. The first column below are my proposed subtypes. The other columns are the names of subtypes, each column being a type.

| type➜  | sep   | thick  | gap     | corner | font    | size      | height   | width   | fw     | em       |
| ------ | ----- | ------ | ------- | ------ | ------- | --------- | -------- | ------- | ------ | -------- |
| micro  |       |        | micro   |        |         |           |          |         |        |          |
| faint  |       | faint  | details |        | credit  |           |          |         |        |          |
| tiny   | nrmal |        | tight   | banner | label   |           |          |         |        | tracking |
| small  | big   | mild   | small   | build  | control | svg       |          | details |        | small    |
| normal | huge  | normal | default | main   | base    | control   | control  | window  | normal | launch   |
| big    |       | bold   |         |        | banner  | hamburger | hideable | content | banner | big      |
| fat    |       | fat    | fat     |        | large   | button    | banner   | modal   |        |          |
| huge   |       |        | huge    |        | huge    |           |          |         | title  |          |

## the ladder — built 2026, August 8

The table above is history now. Every type below uses the same words, and the styling names match: `--font-tiny`, `--gap-tiny`, `--thick-small`.

| type➜  | thick | gap   | corner | font | size  | height | width | fw  | em  |
| ------ | ----- | ----- | ------ | ---- | ----- | ------ | ----- | --- | --- |
| micro  |       | 1.3   |        |      |       |        |       |     |     |
| faint  | 0.56  | 1.94  |        | 8.75 |       |        |       |     |     |
| tiny   |       | 3.89  | 10     | 10.4 |       | 2.19   | 50    |     | .03 |
| small  | 0.78  | 4.32  | 11.67  | 11.7 | 19.69 | 17.07  | 245   |     | 1.4 |
| normal | 1.11  | 7.78  | 17.5   | 13   | 21.88 | 21.88  | 300   | 550 | 2   |
| big    | 1.67  | 9.72  |        | 14   | 24.5  | 28.44  | 350   | 650 | 8   |
| fat    | 2.22  | 16.33 |        | 17.5 | 28    | 42     | 605.5 |     |     |
| huge   | 7.78  | 38.89 |        | 24.5 |       |        |       | 750 |     |

## gap and thickness and size

can they have non-overlapping ranges?
size of interleaving lines

## proposal

rewrite -> summary of the code
One set of eight subtypes — micro, faint, tiny, small, normal, big, fat, huge — and every type uses those words and no others. A step a type has no use for simply does not exist there; nothing is invented to fill a gap. Then reaching for a size is one decision, not two: pick the type, pick the subtype, and never open the file to check what this type happens to call its middle.

**What it changes.** Only names. Every number stays exactly what it is, so nothing on screen moves. It is one pass over the constants and one over everything that reads them.

**What it buys.** `--font-label` and `--gap-tight` become `--font-tiny` and `--gap-tiny`, and the two read as the same step of two different ladders — which is what they are. Today nothing says so.

**Combined.** `separator` and `thickness` are both thicknesses of a line. The two collapse into one type -> `thickness`. The ladder, however does not get shorter.

**Some names carry a why, not a size** — `launch`, `banner`, `title`. Renaming them to steps loses that, so each wants its note kept in a comment: `normal, // the setting-up words`.
