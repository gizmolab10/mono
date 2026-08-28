---
kind: specify
title: "chat history feature"
description: "Keep each ask exchange — the question, its answer, and the relevant documents it drew from — so the chat operation can show the running conversation"
tags: [maybe, proposal]
date: 2026-08-19
---
# chat history feature

Keep each ask exchange — the question, its answer, and the relevant documents it drew from — so the chat operation can show the running conversation.

- [x] resume chat on refresh — the chat view (the "ask" operation, Ask_LLM) reads the saved conversation back on mount, so a refresh resumes it
    - [x] newest first
        - [x] get_exchanges AnythingLLM.ts — fetches the workspace's saved chats, pairs each question with its reply
            - [ ] batch paging? — deferred: the endpoint has no offset, only a newest-N limit (currently 50); real paging waits for the offline store
            - [x] returns an array of Exchange records
    - [x] question above answer
    - [x] questions highlighted — the question is a header lit in the accent
    - [x] answers collapsable — click a question to hide/show its answer
        - [x] each
        - [x] all — collapse-all / expand-all controls
- [x] exchange
    - [x] question
    - [x] answer — stored as `reply`
    - [x] sources
    - [x] when — stored as `time`

## Chunk retrieval

two ways:

- **With the answer:** the chat/stream-chat reply's sources already carry each matched chunk's **text** (plus its file title and metadata), not just the filename — ji today reads only the title and throws the text away. (The "sources contains a large amount of data" complaint is exactly that chunk text: [issue #3209](https://github.com/Mintplex-Labs/anything-llm/issues/3209).)
- **Without spending an answer:** there's a dedicated **vector-search** endpoint — you send a query and it returns the top matching chunks as a `results` array, each with `text` (the chunk), `score`, `distance`, and `metadata` (title, source, etc.) — files and chunks, no LLM reply, no tokens burned ([issue #2811](https://github.com/Mintplex-Labs/anything-llm/issues/2811), [Similarity Search – DeepWiki](https://deepwiki.com/Mintplex-Labs/anything-llm/6.4-similarity-search-and-reranking)).

Caveat: in your workspace the chat path is returning zero sources right now, so that route needs the similarity-threshold looked at first; the vector-search endpoint is a clean alternative.

Sources: [issue #2811 – vector search via Workspace API](https://github.com/Mintplex-Labs/anything-llm/issues/2811), [Similarity Search and Reranking – DeepWiki](https://deepwiki.com/Mintplex-Labs/anything-llm/6.4-similarity-search-and-reranking), [issue #3209 – stream-chat sources](https://github.com/Mintplex-Labs/anything-llm/issues/3209).

## Workspaces

Right now we only have one workspace "Intersection" in AnythingLLM. That's to be ours forever. Each group using ji will their own workspace.

## Future

Each group can have many workspaces, big projects (eg, Intersection-demo, etc.). We will need to assure that group names are unique by asking AnythingLLM for the current list of workspaces. Offline store:

- [ ] IndexedDB
    - [ ] ji-exchanges
    - [ ] keyed by datestamp?
