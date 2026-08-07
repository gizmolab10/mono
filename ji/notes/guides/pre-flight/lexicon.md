---
kind: specify
title: "Lexicon (ji)"
description: "The exact words ji uses in prose, comments, log lines, and test names."
tags: [prose, session]
date: 2026-07-30
---

# Lexicon

The words used in this project. When writing prose, comments, log lines, or test names, use these words exactly, even when near synonyms exist. If it's here, that's its name.

The shared [banned words](../../../../notes/guides/pre-flight/banned%20words.md) list holds the words that mean nothing to Jonathan, each with the word to use instead.

Use good grammar.

## What ji holds

- **document** — one thing in a store: a file that was dropped, or a folder. Never *item*, *asset*, *entry* or *record* for this.
- **folder** — a document that holds others. It has no bytes of its own.
- **file** — what arrives from outside, before it becomes a document. After it's saved, say document.
- **tag** — a word put on a document. Putting one on is **tagging**.
- **store** — one whole collection of documents, with its own tags and its own structure. There are two: **mine** (this browser) and the **AI store** (kept in AnythingLLM). Never *database*, *backend*, or *storage* in prose.
- **hierarchy** — how documents sit inside folders, and which tags lead to which. Never *tree*.

## A document's five answers

Every document answers these, worked out from its ending:

- **family** — the broad sort of thing it is: video, sound, image, text, spreadsheet, book, or folder. Never *type*, *category* or *class*.
- **ending** — the last part of a filename, after the dot. Never *extension* in prose (the code still says extension).
- **showable** — can a browser draw it here. Not showable means the row never opens; it does not mean unwanted.
- **words-readiness** — how much work its words need: **already words**, a **quick pull** (strip the styling, read the document), or the **heavy** one (read writing off a picture, turn speech into words).
- **stored as words / stored as bytes** — which of the two ways it was saved.

## What happens to a document

- **drop** — bringing files in from outside. The **drop box** is where they land.
- **extracting words** — getting a document's words out of it so the model can read them. Never *parsing*, *ingestion*, *processing* or *conversion*.
- **needs converting** — the model can't read this kind as it stands; something must turn it into words first.
- **the list** — the table of documents on screen. Never *view* or *grid*.
- **filter** — anything that narrows the list: picked tags, the all/any mode, the typed name text, picked families.
- **fold** — a shut folder, hiding what's under it. Shutting one is **folding**.
- **the viewer** — where one document is shown.
- **erase** — remove everything in a store, for good. Removing one document is **trashing** it.

## The saved settings

- **saved setting** — one thing the browser remembers between visits. Every name starts `ji_` and joins its parts with underscores.
- **the sweep** — the launch-time clear-out of saved names the app no longer uses.
- **the rename** — the launch-time move of an old saved name to its new one, keeping the value.

## Testing

- **testing** — running the checks. Never *the test suite* or *CI*.
- **sample** — a file built or kept for testing. Never *fixture* or *mock*.
- **the table of kinds** — the written-down answers for every ending, which testing checks each sample against.

## Names in logs and tests

Documents in tests are named in plain capitals — ALPHA, BETA, GAMMA — and folders after what they hold. A log line says what happened and the numbers behind it, in a full sentence, readable by someone who has never seen the code.
