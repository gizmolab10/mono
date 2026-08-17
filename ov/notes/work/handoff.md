---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [journal, now, proposal, session]
date: 2026-08-17
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## What GitHub says is unsafe

GitHub is raising warnings against this repo's dependencies. Nothing has been read yet — what they
are, how many, and whether any of them can actually be reached from the app is all still unknown.

### Success

1. Every warning GitHub raises is named, with what it is in and how bad it says it is.
2. Each one is judged for whether it can be reached at all from what we build, and that judgement is
   written down beside it — a warning against something only the build machinery uses is not the
   same as one against something a reader's browser runs.
3. The ones worth mending are mended, and the app still passes its own checks: 531 files clean, 406
   tests.
4. Any left standing say why, in the debt list, so the next look does not start over.

### Where it stands

Overview holds two dependencies of its own — the color maths and the markdown reader:
[package.json](../../package.json).

Everything else comes in below them, and the whole repo shares one lockfile at its top, so a warning
is as likely to be against a tool as against anything the app runs.

### Open

1. **Where the list is.** GitHub keeps it on the repo's own security page. Nothing in the repo holds
   it, so the first step is to read it there and write it down here.
2. Whether any of it wants a version raised, which changes the lockfile every project shares — so
   the other three collections have to be checked after, not just overview.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
