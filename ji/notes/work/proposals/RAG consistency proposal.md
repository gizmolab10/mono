# Consistency check — find discrepancies across the store

> A whole-collection sweep that reads every document and flags statements that disagree. The ask box answers one question from the few passages it retrieves; this walks all of them, so a contradiction can't hide just because it looked unrelated to a query.

## Why the ask box isn't enough

The ask box pulls the top few most-similar passages for one question. Two facts that contradict each other only get caught if both happen to land in that same handful. If they sit in different documents that don't look similar to the question, they're never retrieved together, and the conflict goes unseen.

So a real consistency check has to visit *every* document on a schedule I control — not only what one question happens to fetch.

## What ji already provides for this

- Every document's words are stored locally, per store. The sweep can read them straight from there.
- There's already a client that talks to the model (the same one behind the ask box). The model host stays AnythingLLM; I just drive it directly instead of through the ask box.

## The shape — smallest version first

### 1. Facts from each document

Loop over the stored documents. Send each one to the model with "list the factual claims as short lines." Collect them, tagged with which document they came from.

- Example: `Contract A: payment due in 30 days` / `Contract B: payment due in 45 days`
- Working with clean one-line facts, not raw prose, is what makes the later compare tractable.

### 2. Group and judge in one call (small store)

For a handful of documents, skip grouping entirely. Hand the whole fact list to the model: "which of these disagree, and in which documents?" Show the flagged pairs in a new details area next to the ask box.

### 3. Add grouping only when the pile gets big

Once there are too many facts for one call, insert a closeness-based bucketing step first: turn each fact into a point in meaning space, gather facts that land near each other (same subject), and judge each bucket on its own. This is automatic — the same closeness-of-meaning trick RAG already uses. I only set the dial for how tight a cluster counts as "the same subject," and review what it flags.

Comparing every fact to every other is far too many pairs; bucketing by subject is what keeps it from blowing up.

## What I own vs what's automatic

- **Automatic:** pulling facts, grouping by subject, flagging disagreements.
- **Mine:** set the "same subject" tightness dial, and review the flagged conflicts (the model proposes, I decide).

## Open questions

- Where does the sweep live in the UI — a button by the ask box, or its own view?
- Run on demand only, or also after each drop?
- Cost/time on the slow local model — a full-store sweep is many model calls; may want the small fast model for the fact-pulling step.

## Status

Proposal only. Not built. Phase 1 is steps 1–2 (no grouping); step 3 waits until the store is large enough to need it.
