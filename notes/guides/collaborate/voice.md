# Voice and Tone Guide

This doc captures my writing style for documentation. The goal: docs that sound like me, Jonathan, not like a technical writer.

## Core Principles

### First Person, Always

i write from my perspective. Not "the developer" or "we" (royal). Just me.

- ✅ "i built this to switch between databases"
- ✅ "i wanted a reference for the handshake"
- ❌ "The system was built to support multiple databases"
- ❌ "One might want to reference the handshake protocol"

### Problem First

Start with what pissed me off or what i needed, not with the solution.

- ✅ "Radial clusters get crowded fast. Needed paging."
- ✅ "Colors kept ending up in weird states. Hover looked wrong."
- ❌ "This document describes the paging system."
- ❌ "The color management system provides centralized state."

### Casual Language

Write like i'm explaining it to someone over coffee. Contractions, informal words, personality.

- ✅ "Bubble plugins are beasts."
- ✅ "Lots of ghastly geometry goes into making it feel comfortable."
- ✅ "for crying sake"
- ✅ "what have you"
- ❌ "Bubble plugins present certain challenges."
- ❌ "Complex geometric calculations are required."

### Lowercase "i"

Use lowercase "i" in casual contexts. It's a stylistic choice that signals informality.

- ✅ "i asked the AI to investigate"
- ✅ "i get this cryptic error"
- ✅ "my app does, a lot of it"

Capital "I" is fine in formal contexts or when it feels right, but default to lowercase in conversational writing.

### Short, Punchy Sentences

No meandering. Get to the point. Fragment sentences are fine.

- ✅ "Svelte sucks at this."
- ✅ "Fast!"
- ✅ "Ugly stuff here, but it works."
- ❌ "Svelte's component architecture presents certain limitations for state management."

### Show Emotion

Express frustration, satisfaction, confusion. The docs should feel human.

- ✅ "Man crawling across desert"
- ✅ "Ack, i get this cryptic error"
- ✅ "my early code was a nightmare to tweak"
- ❌ Dry, emotionless technical prose

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

### Anti-Examples

❌ "The paging system provides support for displaying large numbers of widgets in manageable batches through a three-class architecture consisting of G_Pages, G_Paging, and G_Cluster_Pager."

❌ "This document outlines the color management system, which centralizes style computation from state snapshots."

❌ "User preferences are persisted to localStorage through a reactive store subscription pattern."

## Synopsis Formula

A good synopsis typically follows this pattern:

1. **State the problem** (what was broken/annoying/missing)
2. **Hint at the solution** (what you built)
3. **Maybe add a detail** (one interesting technical point or outcome)

Not a rigid formula, but it works.

## When to Break the Rules

- **Code blocks**: Use proper capitalization and formatting
- **Technical terms**: Keep them precise (don't make "Svelte" lowercase)
- **Headers**: Follow markdown conventions
- **Tables and diagrams**: Clarity over personality

The voice is for prose, not for code or formal structures.

## Meta Note

This doc itself tries to follow the rules. Notice the casual tone, first person, problem-first thinking. If it doesn't sound like me, something's wrong.
