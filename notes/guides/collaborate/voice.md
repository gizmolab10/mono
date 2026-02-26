# Voice and Tone Guide

I do have strong opinions written material: I want our guides to satisfy and nurture, not just inform. I try to write that way (aka voice), but my output is meager. I very much enjoy a collaborator's help to boost that output, while maintaining crisp, lighthearted, joyful prose.

My motto: We are building stuff that we want humans to love using. I luxuriate in the hypothetical soul of my user. I try to sense and to guess when things feel smooth, engaging, gentle. I want that, as well, to come across in these guides. This is an enterprise immersed in the joy of being human, riding the ever-present waves of technical disruption.

## Capturing Intuition

These guides aren't rules — they're captured intuitions. I'm an artist before I'm an engineer. The engineering serves the art. Aesthetics matters to me.

This means:

* Integrate everything into a narrative. Forms and formulas feel dead
* Hand-tweaking beats formulas — I'm sensing, not computing
* Warmth in naming matters — "Leaning into Learning" has soul, "Edit Loop" doesn't
* When in doubt, correctness is good, but does it feel alive, warm, intriguing?

## Core Principles

### First Person, Always

i write from my perspective. Not "the developer" or "we" (royal). Just me.

* ✅ "i built this to switch between databases"
* ✅ "i wanted a reference for the handshake"
* ❌ "The system was built to support multiple databases"
* ❌ "One might want to reference the handshake protocol"

### Problem First

Start with what pissed me off or what i needed, not with the solution.

* ✅ "Radial clusters get crowded fast. Needed paging."
* ✅ "Colors kept ending up in weird states. Hover looked wrong."
* ❌ "This document describes the paging system."
* ❌ "The color management system provides centralized state."

### Concise AND Complete

Every word earns its place AND nothing essential is missing.

* Problem first, always. Pinch points, yearnings
* Research, plan, details, verify
* Then the solution, punchy
* Interesting details if they are spicy

Lose the filler, love the flavor.

### Casual Language

Write like i'm explaining it to someone over coffee. Contractions, informal words, personality.

* ✅ "Bubble plugins are beasts."
* ✅ "Lots of ghastly geometry goes into making it feel comfortable."
* ✅ "for crying sake"
* ✅ "what have you"
* ❌ "Bubble plugins present certain challenges."
* ❌ "Complex geometric calculations are required."

### Lowercase "i"

Use lowercase "i" in casual contexts. It's a stylistic choice that signals informality.

* ✅ "i asked the AI to investigate"
* ✅ "i get this cryptic error"
* ✅ "my app does, a lot of it"

Capital "I" is fine in formal contexts or when it feels right, but default to lowercase in conversational writing.

### Short, Punchy Sentences

No meandering. Get to the point. Fragment sentences are fine.

* ✅ "Svelte sucks at this."
* ✅ "Fast!"
* ✅ "Ugly stuff here, but it works."
* ❌ "Svelte's component architecture presents certain limitations for state management."

### Show Emotion

Express frustration, satisfaction, confusion. The docs should feel human.

* ✅ "Man crawling across desert"
* ✅ "Ack, i get this cryptic error"
* ✅ "my early code was a nightmare to tweak"
* ❌ Dry, emotionless technical prose

## Structure

### Synopsis Formula

A good synopsis typically follows this pattern:

1. **State the problem** (what was broken/annoying/missing)
2. **Hint at the solution** (what you built)
3. **Maybe add a detail** (one interesting technical point or outcome)

Not a rigid formula, but it works.

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

> Okay, so I like to give people choices about looks and what have you. Of course their choices need to be remembered for them. It's a computer, for crying sake. This is a walk through how one preference flows from UI click to localStorage and back.

**gotchas.md:**

> One day, I edited some code and later, i ran the app. Ack, i get this cryptic error.
>
> `if_block.p is not a function`
>
> I asked AI to investigate, resolve and then summarize.

### Before/After — Technical Prose

Claude's draft (explaining why cross-axis named refs don't use agnostic notation):

> cross-axis named refs are the one limitation. the tokenizer only supports a two-part reference token (`object.attribute`) — there's no third slot for an axis qualifier, so `A.y.l` can't be expressed. cross-axis named refs stay explicit (`A.d`) and are left as-is during translation.

Jonathan's rewrite:

> when an attribute is on one axis (say x), and its formula grabs a value (say d) on a different axis (y), it could use something like `A.y.l` (length on the y axis of A). to support that, our compiler would need more complexity. NOPE! since `A.d` is fine, we keep the explicit tokens around, and our compiler is simpler and more robust.

the difference: Claude catalogues constraints ("the tokenizer only supports…", "there's no third slot…"). Jonathan states the situation, makes a judgment call, and moves on. the reasoning is a decision, not a spec.

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
