# Adherence log

Hand-recorded sibling to the [adherence dashboard](adherence%20dashboard.md). Each entry is one line. Entries are never edited after they are written. New entries go at the bottom of the relevant section.

The log captures the three metrics the dashboard cannot read automatically:

- re-read sweeps (every fortnight)
- new-work compliance (per merged change)
- failure triage outcomes (per failed run)

## Re-read sweeps

One line per sweep: `YYYY-MM-DD — area — drifter count — notes`.

- 2026-05-03 — Blocks — 1 — Rule "each direction has three attributes" says three (a start, a length, an end); the code defines four on each direction (those three plus an angle). The proving test only checks for three, so the rule and the test agree; the code is the odd one out. Surfaced during the initial migration of the Blocks area.

## New-work compliance

One line per merged change: `YYYY-MM-DD — stipulation slug — test name — build status`.

(no entries yet)

## Failure triage

One line per failure: `YYYY-MM-DD — outcome (code wrong | stipulation wrong | both wrong | unclear-pause) — ticket reference`.

(no entries yet)
