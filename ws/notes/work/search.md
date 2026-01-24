# Search

search is mixed up in grabs. let's start over.

## Goals

* Put search results into an `S_Items` object (with next, item, index...)
* One item is "the search result i am interested in"
* Display its breadcrumbs and details
* Browse the results (up and down arrows)
* "Go to" the interesting item (make it focus, grab it)

## Design

- Search has its own `si_results: S_Items<Thing>` — completely separate from grabs
- `si_results.item` is the currently highlighted result
- Browsing results changes `si_results.index` — does NOT touch grabs
- "Go to" explicitly calls `ancestry.becomeFocus()` (does not change grabs?) — a deliberate user action, not automatic
- Details panel shows `si_results.item.ancestry` when search is active.

## Key Principle

Search results are **read-only exploration**. Grabs are **user intent**. They don't mix.

## What Changes

* Remove `update_grabs_forSearch()` — grabs stay untouched during search
* `w_ancestry_forDetails` depends on search mode
* `save_grabs`/restore pattern goes away — grabs never change during search
* Remove search fallback from `isGrabbed` — grabbed means grabbed


