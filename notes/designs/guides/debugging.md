# Debugging Guide

## Table of Contents
- [Two Critical Principles](#two-critical-principles)
- [Principle 1: Verify Source First](#principle-1-verify-source-first)
  - [The Process](#the-process)
  - [Common Patterns](#common-patterns)
  - [Source Verification Checklist](#source-verification-checklist)
- [Principle 2: Be Systematic](#principle-2-be-systematic)
  - [The Problem](#the-problem)
  - [The Approach](#the-approach)
  - [Example: Arrow Sizing Bug](#example-arrow-sizing-bug)
  - [Systematic Checklist](#systematic-checklist)
- [Tools](#tools)
- [Remember](#remember)

## Debugging 101

I asked the AI to write what it had learned while going around in circles, unable to consider venturing outside the box.
## Two Critical Principles

1. **Verify source before assuming usage** - When something is undefined, check where it comes from first
2. **Be systematic** - Form multiple hypotheses and test the complete pipeline, don't jump to assumptions

## Principle 1: Verify Source First

**When something is undefined or not working, ALWAYS check the source first.**

### The Process

1. **Check where it comes from** (imports, destructuring, property access)
2. **Verify it exists on that object** (don't assume destructuring is correct)
3. **Then investigate how it's being used**

### Common Patterns

**Destructuring from wrong object:**
```typescript
// BAD: Assuming destructuring is correct
const { w_s_title_edit } = s;  // But it's on x, not s!

// GOOD: Verify first, then fix
const { w_s_title_edit } = x;  // Correct!
```

**Store access in async functions:**
```typescript
// BAD: Using $ syntax in async
async function foo() {
    const value = $w_s_title_edit;  // ❌ Doesn't work
}

// GOOD: Capture at function start
async function foo() {
    const s_text_edit = $w_s_title_edit;  // ✅ Capture first
    await something();
    if (s_text_edit) s_text_edit.doSomething();  // Use captured value
}
```

### Source Verification Checklist

- [ ] Is it imported/destructured correctly?
- [ ] Does it exist on that object? (use `grep` or `codebase_search` to verify)
- [ ] Is it the right instance/type?
- [ ] Any typos?

**Only after verifying source should you investigate:** timing, async/await, reactivity, scope

## Principle 2: Be Systematic

**Don't jump to assumptions. Form multiple hypotheses and test the complete pipeline.**

### The Problem

When something appears broken, it's tempting to:
- Jump to the most obvious solution (e.g., "mathy" fixes for visual issues)
- Focus on one part of the system
- Assume other parts are correct
- Get tunnel vision on the first hypothesis

### The Approach

1. **Form multiple hypotheses** (rendering setup, data generation, data flow)
2. **Test the complete pipeline** (Data → Component → DOM → Visual output)
3. **Don't assume any part is correct** - verify each step
4. **Test hypotheses independently** - don't get attached to your first guess

### Example: Arrow Sizing Bug

❌ **Wrong:** Assume path coordinates are wrong → spend time fixing math → miss that SVG was missing `width`/`height` attributes

✅ **Right:** Form hypotheses → test rendering setup first → find missing attributes → fix found in 2 minutes

### Systematic Checklist

For visual/rendering issues:
- [ ] Element attributes (width, height, viewBox, etc.)
- [ ] CSS/styling (transform, scale, positioning)
- [ ] Data generation (coordinates, calculations)
- [ ] Data flow between components
- [ ] Compare working vs non-working cases
- [ ] Browser dev tools for actual rendered values

## Tools

- **grep**: `grep -r "pattern" src/` - Find definitions
- **codebase_search**: Semantic search for usage/definitions
- **read_file**: Check actual definitions

## Remember

**Most common mistakes:**
1. Assuming source is correct → jumping to usage fixes
2. Not being systematic → jumping to assumptions instead of testing hypotheses

**Always verify source first, then test the complete pipeline systematically.**

