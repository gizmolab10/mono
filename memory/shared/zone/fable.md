---
kind: analyze
title: "Fable"
description: "What changed when co switched from Opus to Fable, and the strategy for using both."
tags: [now, born]
date: 1 September 2026
---
# Fable

## What happened

Mid-session, on 1 September 2026, Jonathan switched co's model from Opus to Fable with `/model fable`. His assessment within minutes: the replies are easier to understand, and faster. Since the switch he has typed `t` only for fairly minor bits, and called one reply excellent. He has been using Opus for nine months and has guarded optimism.

**Why the difference?** co cannot see its own word-choosing, so this is a guess: the rules ban words and demand brevity, but they cannot make a model reach for the plain verb first. Today's chat shows Fable reaching for the plain verb first, and Opus packing the meaning into an abstract noun — the packing is what every `t` pointed at.

Speed: a reply's time grows with every word produced, and Fable writes fewer — plus whatever Anthropic serves each model with, which co cannot measure.

## The constraint

Fable costs more than Jonathan can carry for all the hours he works each day. So Opus does most hours, and the question is where each model earns its price.

## The strategy

**One window, two models.** `/model` switches the model and keeps the whole conversation — nothing is lost. So inside one session: Fable for proposals, weighing, and big or complex work; Opus for grinding through a proposal already written; `/model` back and forth as the work changes.

**A second window is a second session** and remembers nothing. Work crosses only in files: the proposal, the log, the truths. Two rules make that crossing safe:

- A proposal handed to Opus reads like the sweep proposal in [[drive]]: success criteria at the top, exact old-to-new pairs wherever possible, a list of what must not be touched.
- When Opus fails twice at the same fault, it writes what it tried into the log and stops. Fable reads this before continuing.

**Rejections go in the log.** Unfinished work is good evidence from which to improve collaboration and consistency across multiple sessions.

## The measurement

The murk record counts complaints per 100 replies, and now each reply's length. Opus's rate over three weeks: 4.3 per 100, swinging 0 to 13 by day. Fable's number against that, over a real week, decides how much the switch is worth.
