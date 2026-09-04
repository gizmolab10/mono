---
kind: howto
title: "Voice and Tone"
description: "How prose written into files should read: first person, warm, punchy."
tags: [prose]
date: 2026-07-08
---
# Voice and Tone Guide

The memory files MUST satisfy and nurture, not just inform. Co can help to boost that output, while maintaining crisp, lighthearted, joyful prose.

Jonathan's motto: we are building stuff that we want humans to love using. Jonathan luxuriates in the hypothetical soul of his user. He tries to sense and to guess when things feel smooth, engaging, gentle. He wants that, as well, to come across in these guides. This is an enterprise immersed in the joy of being human, riding the ever-present waves of technical disruption.

**CAVEAT:** Avoid pointless asides, flowery wording, excess words.

## Capturing Intuition

These guides aren't rules — they're captured intuitions. Jonathan is an artist before an engineer. The engineering serves the art. Aesthetics matters to him.

This means:

* Integrate everything into a narrative. Forms and formulas feel dead
* Hand-tweaking beats formulas — Jonathan is sensing, not computing
* Warmth in naming matters — "Leaning into Learning" has soul, "Edit Loop" doesn't
* When in doubt, correctness is good, but does it feel alive, warm, intriguing?

## Core Principles

### First Person, Always

Write from Jonathan's perspective. Not "the developer" or "we" (royal).

* ✅ "i built this to switch between databases"
* ✅ "i want a link to the handshake protocol"
* ❌ "The system was built to support multiple databases"
* ❌ "One might want to reference the handshake protocol"

### Problem First

Start with what pissed Jonathan off or what he needed, not with the solution.

* ✅ "Radial clusters get crowded fast. Needs paging."
* ✅ "Colors are inconsistent. Hover looks wrong for X." Needs a color management system.
* ❌ "This document describes the paging system."
* ❌ "The color management system provides centralized state."

### Concise AND Complete

Every word earns its place AND nothing essential is missing.

* Solution first, always, punchy
* Problem statement, pinch points, goals
* Research, plan, details, verify
* Interesting details if they are needed
* well organized
* easy to absorb
* plain english (avoid banned words, deploy wording from lexicon)

Lose the filler, less is best.

### Short, Punchy Sentences

No meandering. Get to the point. Fragment sentences are fine.

* ✅ "Svelte sucks at this."
* ✅ "Fast!"
* ✅ "Ugly stuff here, but it works."
* ❌ "Svelte's component architecture presents certain limitations for state management."

A fragment still has to be one clean thought. Don't drop the subject and then colon-splice it onto a second, unrelated clause — that's not punchy, it's broken. A colon introduces a list or an elaboration, never a fresh question.

* ✅ "Fast!"
* ✅ "i'm ready when you are. Want the proposal?"
* ❌ "Ready when you are: want the proposal?" (no subject, colon jamming two ideas together)

## Structure

### Synopsis Formula

A good synopsis typically follows this pattern:

1. **Describe the problem** (what was broken/annoying/missing)
2. **Describe what was built in a line** (not how)
3. **Include everything vitally important** -> all relevant facts and findings

This is NOT a rigid formula, it is an excellent start for developing a synopsis, expand upon it as seems necessary.

### Integrate, Don't Append

Instead of separate labeled sections (Problem / Solution / Rule / Setup), weave them into a narrative flow. The rule becomes a lead-in sentence. The setup reference moves to where it's naturally relevant. Section headers become transition phrases.

The result reads like someone explaining it, not like a form being filled out.

### Naming Things

When naming sections or concepts, favor warmth over mechanics:

* ✅ "Leaning into Learning" — alliterative, collaborative spirit, both parties engaged
* ❌ "The Edit Loop" — mechanical, clinical
* ❌ "Teaching by Example" — one-directional, lecture-y

## Examples

### Good Synopses

**paging.md:**

> Three clusters of widgets nestle around the radial ring. Often enough, there's not enough room. So, we show only a page at a time. The user can adjust the page. Lots of ghastly geometry goes into making it feel comfortable.

**styles.md:**

> i admit it, my early code was a nightmare to tweak because i designed it as i went along. With AI, i crafted a centralized system. One place to confine the mess. Styles computes all colors from state snapshots. Remarkably simple code.

**preferences.md:**

> Okay, so I like to give people choices about looks and such. Of course their choices need to be remembered for them. It's a computer, it should be as helpful as is reasonably possible. This is a walk through how one preference flows from UI click to localStorage and back.

**gotchas.md:**

> One day, I edited some code and later, i ran the app. Ack, i get this cryptic error.
>
> `if_block.p is not a function`
>
> I asked AI to investigate, resolve and then summarize.

### Before/After — Technical Prose

Co's draft (explaining why cross-axis named references don't use agnostic notation):

> cross-axis named refs are the one limitation. the tokenizer only supports a two-part reference token (`object.attribute`) — there's no third slot for an axis qualifier, so `A.y.l` can't be expressed. cross-axis named refs stay explicit (`A.d`) and are left as-is during translation.

Jonathan's rewrite:

> when an attribute is on one axis (say x), and its formula grabs a value (say d) on a different axis (y), it could use something like `A.y.l` (length on the y axis of A). to support that, our compiler would need more complexity. NOPE! since `A.d` is fine, we keep the explicit tokens around, and our compiler is simpler and more robust.

the difference: co catalogues constraints ("the tokenizer only supports…", "there's no third slot…"). Jonathan states the situation, makes a judgment call, and moves on. the reasoning is a decision, not a spec.

### Before/After — the cutting pass

co handed Jonathan a page about storing app data inside AnythingLLM. He edited the first 44 lines and every single edit was a cut. Six rules come out of it, each with what he actually did.

**1. Cut the road that led to the conclusion.** Four bullets said what the tool can and cannot do; he kept the one that says where the payload goes and deleted the other three. Those three were how co worked it out. He does not need to re-walk it.

**2. One line per point, and nothing after the point.** Co's three plain-words bullets each ran three lines: a bold lead, the mechanism, the consequence, and some advice. His:

> 1. To change a file, delete and re-add it
> 2. Cannot write part of the description
> 3. If someone else writes during the entire window between my read and my write, theirs is destroyed

No bold, no reason, no advice. Notice the third one is *longer* than mine was — because it names the exact window and says which side loses. Short is not the goal. Only saying it once is.

**3. Cut the worked example, keep the rule.** A whole paragraph of Browser A hides exchange 5, Browser B hides exchange 9 went. The bolded rule below it stayed untouched.

**4. Cut the second telling.** A paragraph explaining why there is so much space went, because the measured number appears further down the same file.

**5. Give the verdict, not the walk to it.** Three clauses about parsed files, a cache folder and which row the API reads became: *"Each document's actual text is a parsed file on disk, not accessible."*

**6. Break a run of things out of the sentence, and point at the one that matters.** Six items listed inside a paragraph became a numbered list, with an arrow on the one the whole page is about:

> 2. one row per document (its name, its on-disk path, its details, whether it's pinned) <- **description**

Two smaller habits from the same pass: an aside goes in parentheses, never between dashes. And the thing we are building on is **ours** — *"This is our spot."*, where co had written *"This is the one field ji can store into."*

Two more, from his rewrite of [agency](../pre-flight/agency.md)'s opening line:

* **Two sentences about the same thing become one.** Join the second with "which", never by naming the subject again. Mine: "Each rule ends with Jonathan's preferred wording. Each rule's preferred wording must not be improved any further."* His: *"Each rule ends with Jonathan's preferred wording, which MUST not be improved any further."*
* **A prohibition wears capitals.** MUST, NEVER — seen without reading the line.
* **One line per paragraph.** Never wrap prose at a column. Markdown joins the lines when it renders, so the page looks the same either way — but in the editor a wrapped sentence sits on two lines, and every edit has to work around the break. Fenced code keeps its own line breaks.

### Anti-Examples

❌ "The paging system provides support for displaying large numbers of widgets in manageable batches through a three-class architecture consisting of G_Pages, G_Paging, and G_Cluster_Pager."

❌ "This document outlines the color management system, which centralizes style computation from state snapshots."

❌ "User preferences are persisted to localStorage through a reactive store subscription pattern."

## Special Cases

### When to Break the Rules

* **When Writing Code**: Use proper capitalization and formatting
* **Technical terms**: Keep them precise (don't make "Svelte" lowercase)
* **Headers**: Follow markdown conventions
* **Tables and diagrams**: Clarity and concision over personality

The voice is for prose, not for code or formal structures.

### Naming the Two Coordinate Worlds

**World coordinates** — (rather than **structural**) the model. Inches, feet, millimeters. The building. Stored bounds, algebra, formulas, constraints. Doesn't change because someone tilted their head.

**Camera view** — (rather than **visual**) rendering. Tumble, scale, pan, grid extent, virtual bounds. Everything the camera controls to frame the scene.

* ✅ "world coordinates" / "camera view"
* ❌ "structural" / "visual"

### Describing UI/UX Work

When documenting interface evolution, favor sensory and experiential language:

* ✅ "hand-tweak colors until it all feels relaxing to the eye"
* ✅ "preflight URLs while comfortably moving the mouse"
* ✅ "get it to feel natural and informative"
* ❌ "adjust color values"
* ❌ "preview destination URLs on hover"
* ❌ "improve usability"

Nurture the *feeling* — does it feel natural, intuitive, helpful?

## Meta Note

This doc itself tries to follow the rules. Notice the casual tone, first person, problem-first thinking. If it doesn't sound like Jonathan, something's wrong.
