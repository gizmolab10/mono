# Refactoring Guide

Code debt. Snarly, ad-hoc, organically fussed with, did i say temperamental? Man crawling across the desert, barely able to say "refactor, need refactor."

Aren't people saying, how perfect AI is at doing such a mundane, hair-pulling chore? Sure, but kinda know not to trust AI refactoring my baby. So, I asked it to compile these guidelines. Then, I asked it to use it on an easy, simple refactoring. The result? Nice, almost painless. Needed mild manual intervention, and go!

I plan to use this to do some harder refactoring, making a backup, first.

## Table of Contents

* [General Principles](#general-principles)
  * [1. Centralization Over Distribution](#1-centralization-over-distribution)
  * [2. Declaration Over Management](#2-declaration-over-management)
  * [3. State Persistence](#3-state-persistence)
  * [4. Enum-Based Configuration](#4-enum-based-configuration)
  * [5. Automatic Lifecycle](#5-automatic-lifecycle)
  * [6. Single Source of Truth](#6-single-source-of-truth)
* [Refactoring Process](#refactoring-process)
  * [Phase 1: Analysis](#phase-1-analysis)
  * [Phase 2: Design](#phase-2-design)
  * [Phase 3: Implementation](#phase-3-implementation)
  * [Phase 4: Cleanup](#phase-4-cleanup)
* [Performance Optimization Principles](#performance-optimization-principles)
  * [1. Batch Operations](#1-batch-operations)
  * [2. Lazy Evaluation](#2-lazy-evaluation)
  * [3. Incremental Updates](#3-incremental-updates)
  * [4. Efficient Data Structures](#4-efficient-data-structures)
  * [5. Minimize Re-renders](#5-minimize-re-renders)
* [Simplification Principles](#simplification-principles)
  * [1. Remove Duplication](#1-remove-duplication)
  * [2. Reduce Nesting](#2-reduce-nesting)
  * [3. Single Responsibility](#3-single-responsibility)
  * [4. Clear Abstractions](#4-clear-abstractions)
  * [5. Eliminate Workarounds](#5-eliminate-workarounds)
* [Migration Strategy](#migration-strategy)
  * [Incremental Migration](#incremental-migration)
  * [Backward Compatibility](#backward-compatibility)
  * [Testing Strategy](#testing-strategy)
* [Example: Mouse Timing Centralization](#example-mouse-timing-centralization)
  * [Before: Distributed Timing](#before-distributed-timing)
  * [After: Centralized Timing](#after-centralized-timing)
  * [Key Abstractions](#key-abstractions)
  * [Migration Pattern](#migration-pattern)
* [Applying to Layout Algorithms](#applying-to-layout-algorithms)
  * [Analysis Questions](#analysis-questions)
  * [Design Questions](#design-questions)
  * [Simplification Opportunities](#simplification-opportunities)
  * [Performance Opportunities](#performance-opportunities)

## General Principles

### 1. Centralization Over Distribution

**Move from scattered logic to single source of truth.**

**Pattern:**

* Before: Logic duplicated across multiple components
* After: One manager owns the responsibility
* Benefit: Consistency, easier debugging, single point of change

### 2. Declaration Over Management

**Components declare intent, manager handles execution.**

**Pattern:**

* Component sets properties: `needs_X = true`, `X_callback = fn`
* Manager reads properties and handles lifecycle automatically
* Component receives callbacks at appropriate times

### 3. State Persistence

**State lives on persistent objects, not ephemeral components.**

**Why:** Components can be destroyed/recreated. Shared state objects persist.

**Pattern:**

* Move state from component-local variables to shared state objects
* State survives component recreation
* Enables cross-component coordination

### 4. Enum-Based Configuration

**Single enum replaces multiple boolean flags.**

**Benefits:**

* Enforces mutual exclusivity or valid combinations
* Type-safe, self-documenting
* Easier to extend with new options

### 5. Automatic Lifecycle

**Manager handles all lifecycle automatically.**

**Events:**

* Start conditions → Manager detects and starts
* Stop conditions → Manager detects and stops
* Edge cases → Manager handles cleanup

### 6. Single Source of Truth

**One manager, one timer/cache/state per concern.**

**Benefits:**

* No conflicts between multiple instances
* Easier to reason about
* Better performance (shared resources)

## Refactoring Process

### Phase 1: Analysis


1. **Identify scattered logic** - Where is the same pattern repeated?
2. **Find the manager** - What should own this responsibility?
3. **Map state flow** - Where does state live? Where should it live?
4. **Identify lifecycle** - What are start/stop/cleanup conditions?

### Phase 2: Design


1. **Define the abstraction** - What properties/components are needed?
2. **Design the interface** - How do components declare intent?
3. **Plan state migration** - How to move from old to new?
4. **Design lifecycle** - When does manager start/stop/cleanup?

### Phase 3: Implementation


1. **Build manager infrastructure** - Core timing/state management
2. **Add target properties** - State and callbacks on shared objects
3. **Migrate components** - One by one, remove old logic
4. **Test edge cases** - Re-renders, hover-leave, rapid interactions

### Phase 4: Cleanup


1. **Remove deprecated patterns** - Old code, unused properties
2. **Update documentation** - Reflect new architecture
3. **Verify performance** - Ensure improvements realized

## Performance Optimization Principles

### 1. Batch Operations

**Group related work to minimize overhead.**

**Pattern:**

* Collect all changes first
* Apply in single batch
* Use spatial indexes for efficient queries

### 2. Lazy Evaluation

**Compute only when needed, cache when possible.**

**Pattern:**

* Don't precompute everything
* Compute on-demand
* Cache results until invalidated

### 3. Incremental Updates

**Update only what changed, not everything.**

**Pattern:**

* Track what changed
* Update only affected parts
* Skip unchanged work

### 4. Efficient Data Structures

**Choose structures optimized for access patterns.**

**Pattern:**

* Spatial queries → R-tree (RBush)
* Fast lookups → Maps/Dictionaries
* Sequential access → Arrays

### 5. Minimize Re-renders

**Reduce component recreation and style recomputation.**

**Pattern:**

* State on persistent objects (not components)
* Batch style updates
* Use reactive statements efficiently

## Simplification Principles

### 1. Remove Duplication

**Extract common patterns into shared logic.**

**Pattern:**

* Find repeated code blocks
* Extract to manager or utility
* Components call shared logic

### 2. Reduce Nesting

**Flatten conditional logic and state checks.**

**Pattern:**

* Early returns
* Guard clauses
* Extract complex conditions to named methods

### 3. Single Responsibility

**Each class/function does one thing well.**

**Pattern:**

* Manager: Owns timing/state
* Component: Declares needs, handles callbacks
* Target: Holds state and configuration

### 4. Clear Abstractions

**Names and structure reveal intent.**

**Pattern:**

* Enum values are self-documenting
* Method names describe what, not how
* Properties clearly indicate purpose

### 5. Eliminate Workarounds

**Replace hacks with proper solutions.**

**Pattern:**

* Identify workarounds (e.g., `s_mouse_forName` for state persistence)
* Design proper solution (state on target)
* Migrate away from workaround

## Migration Strategy

### Incremental Migration

**Migrate one component/feature at a time.**

**Benefits:**

* Lower risk
* Easier to test
* Can rollback individual changes

### Backward Compatibility

**Support both old and new patterns during transition.**

**Pattern:**

* Add new properties alongside old
* Manager supports both
* Remove old after migration complete

### Testing Strategy

**Test each migrated component thoroughly.**

**Focus:**

* Normal operation
* Edge cases (re-renders, rapid interactions)
* Regression (existing behavior preserved)

## Example: Mouse Timing Centralization

### Before: Distributed Timing

```
Component → Own Timer → Manual Start/Stop → Component State
```

* Each component manages its own timer lifecycle
* State lives in component (lost on re-render)
* Duplicated logic across components
* Manual hover-leave handling per component

### After: Centralized Timing

```
Component → Declares Intent → Central Manager → Automatic Lifecycle
```

* Single manager owns all timers
* State persists on shared target (survives re-render)
* Logic centralized in one place
* Automatic hover-leave cleanup

### Key Abstractions

* **Timing Types**: Autorepeat, long-click, double-click
* **State Transitions**: Down → Timer → Callback → Up
* **Configuration**: Enum-based (`T_Mouse_Detection`)
* **Lifecycle**: Automatic start/stop/cancel

### Migration Pattern


1. Remove component timer
2. Declare on target (`mouse_detection`, `*_callback`)
3. Remove manual lifecycle code
4. Test thoroughly

## Applying to Layout Algorithms

### Analysis Questions


1. **What is scattered?** - Layout logic in multiple places?
2. **What is the manager?** - Should there be a `Layout` manager?
3. **What is the state?** - Positions, sizes, constraints?
4. **What is the lifecycle?** - When to compute? When to update?

### Design Questions


1. **What do components declare?** - Size constraints? Position preferences?
2. **How does manager compute?** - Single pass? Incremental? Cached?
3. **What triggers updates?** - Size changes? Content changes? User actions?
4. **How to optimize?** - Spatial index? Dirty tracking? Batch updates?

### Simplification Opportunities


1. **Remove duplication** - Common layout patterns?
2. **Reduce complexity** - Nested calculations? Circular dependencies?
3. **Clear abstractions** - What are the core concepts?
4. **Eliminate workarounds** - Hacks for edge cases?

### Performance Opportunities


1. **Batch operations** - Compute all layouts together?
2. **Lazy evaluation** - Only compute visible/needed?
3. **Incremental updates** - Only update what changed?
4. **Efficient structures** - Spatial index for layout queries?
5. **Minimize re-renders** - Cache layout results?


