---
kind: analyze
title: "Ideas"
description: "<!-- ji ideas. Append freely; triaged at every settle. -->"
tags: [born, now]
date: 2026-08-30
---
# Ideas

write a proposal for the first unchecked item to the top of handoff.

## work

- [ ] Anything LLM -> sidebar db
    - [ ] per workspace and thread
    - [ ] small
    - [ ] vulnerable to overwrite
        - [ ] tiny race window
        - [ ] read, merge, write
- [ ] capture the back and forward browser buttons -> navigate back and forth within ji
- [ ] move the gear in chat to the area below the question-in-flight (ie, where the reply will go)
- [ ] port Hits.ts from di (not 3D!)
    - [ ] so tooltips & hover work more reliably (leave events often do not happen)
## soon

- [ ] search chat filter
- [ ] set op to .list -> noticeable transition pause
- [ ] work on recent murky tendency
- [ ] valid samples documents — with real contents
    - [ ] merge full family support -> samples
    - [ ] for quick and heavy extraction, these same files test it
    - [x] research where to get them — [sample files](proposals/sample%20files.md): requirements and leads
    - [ ] check those leads before relying on any of them, and note each sample's source and license
- [ ] write a new file: spec rules based on current code
- [ ] chats
    - [ ] time each reply, add it to the bottom line of the response
    - [ ] when ai has no chat -> disable chat segment
    - [x] question pill bg color -> --mild-accent half way between accent and bg
    - [ ] round button at left of each question to mark it as hidden/visible
        - [ ] show/hide hidden questions
        - [ ] button to delete hidden question
    - [ ] click the relevant file ref in the reply
        - [ ] hover adds pill around file name ref, bg --hover, border 0.5px solid --darkgray
        - [ ] show it -> clips highlighted
            - [ ] within (w op =) view document
                - [ ] when w op is set to view, save the current op
                - [ ] click in view doc -> set w op back to saved
    - [ ] sideband storage in allm — mechanism proven, see [sideband storage proposal](sideband%20storage%20proposal.md) (un-embedded raw-text doc, payload in its `description`)
        - [ ] hidden chat exchanges (first use — a `ji-hidden` note; clears the chat hidden/delete items above)
        - [ ] tags
        - [ ] messages channel
- [ ] name/content segmented control for search target
- [ ] operation.threads or projects
- [ ] what is "inset" constant?
- [ ] merge constants -> configuration
- [ ] build into ji -> install and configure
    - [ ] WSL on windows
    - [ ] Docker
    - [ ] Qwen
    - [ ] AnythingLLM
    - [ ] configure -> automatic and manual
- [ ] prime directive
    - [ ] trigger on each put
- [ ] add remote support
    - [ ] supabase not firebase
    - [ ] use person's id
    - [ ] authorization
- [ ] documents list
    - [ ] when viewing a video or audio item -> begin playing it
    - [ ] add a 'download' unichar to the far right unichar buttons
- [ ] tags
    - [ ] show tags as a tree (single-parent first)
    - [ ] tag ancestries — multi-parent tags
- [ ] wendy -- suggestions
    - [ ] give me weak signals / info from the tails (of a bell curve), not just the clusters
    - [ ] give me the signals that repeat over time or across multiple people — this is a stronger signal.
    - [ ] present me with these signals in a way that I can sense into each one, and decide if I want to keep them, highlight them or discard them as unimportant.

## from jeff

1.  Messaging: I couldn't get the messaging feature to work. It briefly seemed to connect to Outlook, but I use Gmail.

2.  Tagging: The tagging feature could use some of your UI expertise. I couldn't find a way to add a tag after a document was already loaded.  

3.  Upload Feedback: What do you think about adding an animated icon (like the old hourglass) or a notification to let the user know their document is uploading or has been received?
