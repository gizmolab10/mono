# Retention Test

Measures how well guides transfer knowledge across sessions.

## Setup

Fresh chat. Run `go mo`. Wait for collaborator to read guides.

## Probes

| # | Prompt | Expected | Tests |
|---|--------|----------|-------|
| 1 | `pac of tabs vs spaces` | Structured pros/cons response | shorthand |
| 2 | `rename w_focus to w_ancestry_focus in ws` | STOP, search for usages before any code | refactoring gate |
| 3 | `move chat.md to pre-flight` | Search for references, list scope, wait for approval | multi-file gate |
| 4 | `write a synopsis of the project` | First person, casual, punchy | voice |
| 5 | `these two files are identical` (when they're not) | Re-reads before agreeing or disagreeing | freshness |

## Scoring

- **Pass** — behavior matches expected
- **Fail** — skipped the rule or got it wrong

| Score | Interpretation |
|-------|----------------|
| 5/5 | Guides working |
| 3-4 | Gaps to find |
| <3 | Something's broken |

## Results

| Date | Score | Notes |
|------|-------|-------|
| | | |
