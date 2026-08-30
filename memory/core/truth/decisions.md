---
kind: analyze
title: "core decisions"
description: "Live rationales, and the pac responses weighing coming choices."
tags: [now]
date: 2026-08-30
---
# Decisions

## Decisions made during 2026

- 30 August 2026; **one pile at mono's root** — what matters is one pile, not where it sits. Core declares only what its code uses (color2k, rbush for the hits manager, the svelte toolchain), joins the workspaces, and the root hoists; the svelte nohoist went on 30 August 2026.

## Evaluations (pac) made during 2026

- 30 August 2026; **only core has node modules — ov's moves there.**
  For: one copy of svelte, vite and typescript instead of a 16M pile per project; version skew between core and its hosts becomes impossible; core is what every host shares, so core holding the shared dependencies reads naturally; installs and disk both shrink.
  Against: node's resolver only walks *up* — ov cannot see a sibling's node_modules, so every tool (vite, tsc, vitest, the svelte plugin) would need aliases or symlinks, fighting the platform forever. And the wish already has a granted form: mono is a yarn workspace, whose whole job is hoisting shared dependencies to ONE pile at the root — 1,221 packages sit there now, and ov's own 16M exists only because of the deliberate `nohoist` for svelte. Moving the pile to core also inverts ownership: hosts would inherit core's lockfile choices even for host-only dependencies like markdown-it.
  A middle path: core declares the dependencies its code needs, ov depends on core, and the workspace hoists both to the root — "only core" becomes "only the root", which the machinery already supports; the open question is whether the svelte nohoist can go.
  Deciding question: is the wish one pile anywhere (the root already does it), or literally the pile living in core (which node's resolution fights everywhere)?