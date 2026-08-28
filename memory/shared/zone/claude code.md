---
kind: analyze
title: "Claude Code"
description: "Where the toolkit actually runs, and how to install and start Claude Code."
tags: [now]
date: 27 August 2026
---
# Claude Code

## Two places to work

This does not appeal enough to me to investigate yet.

- **Claude Code** — runs on the Mac. Its hooks execute: `inject-always.sh` on every prompt, `banned-words-check.sh` and five more when a reply finishes. It can write `.claude`.
- **The Claude app (Cowork)** — runs in Anthropic's cloud with a bridge to the Mac's files. Same file access, mostly the same abilities. It executes no hooks and cannot write `.claude`. Proof: the hooks' own logs stopped on 24 August, and four days of work happened here after that.

`start` is ours, not the program's. Launching either one does not run it — it is a word typed at the prompt.

## Installing Claude Code

```
brew install --cask claude-code
```

Then `cd ~/GitHub/mono` and run `claude`.

The desktop app download link in the docs points at the ordinary Claude desktop app — Claude Code runs inside it, which is why the link looks wrong. The brew command above is the unambiguous one. Other ways in: `curl -fsSL https://claude.ai/install.sh | bash`, and plugins for VS Code and JetBrains.

All of them share `~/.claude/`, so hooks and settings are the same whichever is used.

Docs: https://code.claude.com/docs/en/setup
