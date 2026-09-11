# Porting Code

How to port code from one project A to another B.

---

## Process

1. **Read** the source file in A
2. **Describe** what it does (write a spec). add it to design guides for mono
3. **Build** it fresh in B from scratch using the spec

## Why

- Avoids copying cruft, dead code, outdated patterns, ad-hoc madness
- Builds on understanding acquired during fabrication of A
- Results in cleaner code that fits the B's conventions
- Catches hidden dependencies early
- Supports revising the spec

## Template

When porting `<source>` to `<target>`:

### 1. Source Analysis

```
File: <path>
Purpose: <one line>
```

**What it does:**
- ...

**Key functions/classes:**
- ...

**Dependencies:**
- ...

**State it manages:**
- ...

### 2. Spec for Target

**Goal:** tbd

**Interface:**
- ...

**Behavior:**
- ...

**Differences from source:**
- ...

### 3. Implementation

Build fresh using the spec above.
