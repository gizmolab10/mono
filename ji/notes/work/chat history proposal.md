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

## Workspaces

Right now we only have one workspace "Intersection" in AnythingLLM. That's to be ours forever. Each group using ji will their own workspace. Future ->

## Future

Each group can have many workspaces, big projects (eg, Intersection-demo, etc.). We will need to assure that group names are unique by asking AnythingLLM for the current list of workspaces. Offline store:

- [ ] IndexedDB
    - [ ] ji-exchanges
    - [ ] keyed by datestamp?
