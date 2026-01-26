# Shorthand

Short commands and abbreviations for working with collaborator.

## Navigation

| Command | Action |
|----|----|
| `go` | Read ~/GitHub/mono/`<current-go>`/CLAUDE.MD |
| `go mo` | Read ~/GitHub/mono/CLAUDE.MD |
| `go <X>` | Set current-go to X, read ~/GitHub/mono/X/CLAUDE.MD |
| `what go` | Tell current-go value |
| `claude` | Reread CLAUDE.MD |

## Work Tracking

| Command | Action |
|----|----|
| `work on <X>` | If `notes/work/<X>.md` missing, create it; else read + resume |
| `what work` | Tell current work on value |
| `ua` | Update accordingly (see below) |

## Execution

| Command | Action |
|----|----|
| `help` | Show this table |
| `ex` | Execute mode — skip proposals, just do it |
| `rs` | Reserved mode — propose before file changes |
| `propose` | Explain plan before executing |
| `undo` | Revert last file change |
| `chime in` | Give observations, suggestions, corrections about the topic at hand |
| `summary` | Summarize what you just did (forces verification) |
| `relearn` | Reread relevant guides before continuing |
| `show` | Show your work — quote the lines or evidence |
| `lean` | Reread workflow.md, identify the principle at play, propose where to capture it |

## Memory

| Command | Action |
|----|----|
| `memory` | Describe any useful auto-generated insights from userMemories (normally ignored) |

## Abbreviations

| Abbrev | Meaning |
|----|----|
| `cb` | Use checkboxes for this |
| `m` | Milestone |
| `m<#>` | Milestone # |
| `ni` | No improvement, try something different |

## Update Accordingly

In the `what go` project, add (to the `what work` md file) all/any of this chat that seems significant or brings it up to date, remove redundancies, simplify without losing significant details. If there is no such md file, create a new one called "what.md" in notes/work. If there is no such project specified, ask.
