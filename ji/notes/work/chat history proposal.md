# chat history feature

Keep each ask exchange — the question, its answer, and the relevant documents it drew from — so the chat operation can show the running conversation.

- [ ] resume chat on refresh
    - [ ] newest first
        - [ ] fetch_exchanges AnythingLLM.ts
            - [ ] batch paging?
            - [ ] returns an array of Exchange records
    - [ ] question above answer
    - [ ] questions highlighted
    - [ ] answers collapsable
        - [ ] each
        - [ ] all
- [ ] exchange
    - [ ] question
    - [ ] answer
    - [ ] sources
    - [ ] when

## Workspaces

Right now we only have one workspace "Intersection" in AnythingLLM. That's to be ours forever. Each group using ji will their own workspace. Future ->

## Future

Each group can have many workspaces, big projects (eg, Intersection-demo, etc.). We will need to assure that group names are unique by asking AnythingLLM for the current list of workspaces. Offline store:

- [ ] IndexedDB
    - [ ] ji-exchanges
    - [ ] keyed by datestamp?
