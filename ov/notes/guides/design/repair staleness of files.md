---
kind: design
title: "Repair staleness"
description: "runs in, and there is none — asking it answers \"no key for the model is set on this machine\""
tags: [done, journal]
date: 2026-08-08
---
# Repair staleness

- [x] read guides tagged with 'stale'
    - [x] offer a rewrite of each -> new work file "rewritten guides"
- [x] add the 'stale' tag to everything listed
    - [x] the third entry is a folder
        - [x] add a stale flag to all its children guides — all ten in pre-flight
- [x] add a new repair button called 'stale files'
    - [x] calls handle_stale_files, which does...
    - [x] to each file with a stale tag
    - [x] add a new first subsection called 'proposed rewrite'
    - [x] use dispatcher.py to access the LLM model (currently used for analyzing errors)
        - [x] add a second use
        - [x] take a guide's content, return a few sentences, regarding...
        - [x] what this guide is for
        - [x] what should be removed
        - [x] add it to that subsection

**Not yet working on this machine.** The model needs a key held in the environment the hub
runs in, and there is none — asking it answers "no key for the model is set on this machine".
Until there is, each section opens with only what the app can prove: which of that guide's own
links lead nowhere.

## incomplete

nags at me, need to think