---
kind: specify
title: "Cancel — stopping what is already under way"
description: "Cancel today waits"
tags: [now, proposal, stale]
date: 2026-08-19
---
# Cancel — stopping what is already under way

Cancel today waits. It should not.

## What happens now

Pressing cancel during a drop sets a state, and the saving reads that state only between files. On my store a file is saved in a moment, so the wait is invisible. On the AI store each file goes out over the internet — its content, then its words, then the record list — so cancel does nothing until the file in flight is finished. Nothing on screen says a stop was asked for.

Where the state is read, between one file and the next: [Drop.ts:217](../../../src/lib/ts/managers/Drop.ts)

## What it should do

1. **Stop the call in flight.** Every call out to AnythingLLM is given a stop switch. Cancel flips it, and the upload ends at once instead of running to completion.
2. **Say so immediately.** The moment cancel is pressed, the status line reads "stopping…" and the button goes quiet, so the press is never in doubt. The line clears when the drop actually ends.
3. **Leave nothing half-there.** A stopped upload can leave a file's content on the server with its words not uploaded and its record not written. Cancel removes what it started for that one file, and the log names the file and what was removed.

## Also worth having, once the switch exists

The same switch stops a question mid-answer. The chat already keeps whatever words arrived when a stream breaks, so a stop button on the ask box is a small addition after this.

## What the server does when we stop listening

Checked in AnythingLLM's own source, not guessed. It never notices. Its streaming answer endpoint sets up the stream and hands off, with no watch for the connection closing — no listener for the client leaving, no check that the connection is still open before writing. The same holds for the document upload endpoints: no abort handling, and no cleanup of a partly written file.

So stopping from our side stops our waiting, not its working. Two things follow:

1. **The words stop at once, but the model keeps going** until it finishes on its own. Nothing we can do from here; only its own settings would change that.
2. **A stopped upload can leave debris on the server** — a temporary file it never cleans up, and possibly a stored document with no words. So the third part above is not optional: cancel must remove what it started, and the log must name it.

Source read: its workspace endpoints, its chat handler, and its document endpoints, on the master branch, July 2026.

## Success

Press cancel during a drop of several files onto the AI store. The status line says stopping at once. Saving ends within a moment, not after the current file finishes. The list holds only whole files, and the log names any part-file that was removed.
