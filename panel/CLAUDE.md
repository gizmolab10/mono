---
kind: specify
title: "panel"
description: "The page a host draws: a controls row holding one hamburger, a details column, an operation view and a status line, drawn on core, with what the host hands over inside them."
tags: [always, now, session]
date: 2026-09-10
---
# panel

> ov's three regions, as a component. A controls row holding one hamburger and the project's name, a details column, an operation view, and a status line while there are words for it. The host says what goes in each.

`Panel.svelte` is the page. A host draws it, hands it the name, whether the details column is shown and the press that toggles it, and hands what goes in each region as snippets. `App.svelte` is the smallest host, with nothing in any region. gallery imports Panel.svelte, so lv's page is panel's.

Its memory is `memory/panel/` — the index, the log, and `zone/ideas.md`. Everything it takes from core arrives through `common/Core.ts`, the only file that reaches through the `core` alias. `Customizations.ts` holds the name.

Past mistakes never to repeat, this project's own, are in `memory/panel/zone/learn.md`, made the day the first one is written. Those that apply everywhere are in `memory/shared/zone/learn.md`.
