---
kind: explain
title: "Hooks"
description: "What hooks are, how they differ from memory, and which ones are live."
tags: [always, session, team, tools]
date: 2026-07-08
---
# Hooks

Hooks are shell commands that fire automatically when Claude does something — edits a file, runs a command, receives a message. They live in settings.json and run without asking.

## The cut, and the two parts

What a hook incorporates is cut off at about 2000 characters.



**Part A** — (first 2000) the always file, whole, every single turn. It holds the nine rules that govern every single reply. It is kept short deliberately, so it always survives the cut.

**Part B** — (everything else): the reply rules, how the work is done, and the two lists of banned words. These are divided into three smaller pieces. One of them is incorporated per turn, in rotation. The rotation pointer is kept in a tiny file. 

The cost is minimal: a rule in part B is out of sight for two or three turns at a time.

## The live suite

Sixteen hook commands run today. Scripts live in `di/.claude/hooks/`, invoked from `.claude/settings.local.json`. Some hooks are a whole command written into the settings file itself, others are scripts it invokes.

### UserPromptSubmit — fires when Jonathan sends a message

| Hook | What it does |
|----|----|
| debug-reminder *(inline)* | On words like bug/fix/log/why, injects "read the log data first" |
| log-present *(inline)* | When Jonathan pastes log markers, injects "read the log yourself, don't ask me to" |
| geometric-mode *(inline)* | Toggles a flag on "geometric"; while on, injects geometry-caution and log-naming rules |
| done-checklist.sh | On a "done" command, injects the done checklist from shorthand.md |
| inject-always.sh | Injects part A whole, then one part of B in turn; complains first if any file's labels disagree with what is sent (lives in `.claude/hooks/`) |

### PreToolUse — fires before a tool runs

| Hook | What it does |
|----|----|
| snapshot-before-edit.sh | Copies the file to a snapshot folder before an Edit/Write, for undo |
| bash-command-check.sh | Denies batched commands, npx, and git worktree; auto-approves read-only exploration |

### PostToolUse — fires after an Edit/Write

| Hook | What it does |
|----|----|
| plain-english-check.sh | Says when a banned word or a lexicon-settled word goes into a file — the whole edit of an .md, the comment and log lines of a .ts or .svelte. Reads the banned-words tables' mechanical rows and the lexicon's never-words; di's twenty identifiers kept (lives in `.claude/hooks/`) |
| mark-ts-check-pending.sh | If a .ts/.svelte changed, drops a marker so the end-of-turn type check runs |

### Stop — fires when co finishes (all warn-only now)

| Hook | What it does |
|----|----|
| banned-words-check.sh | Logs banned words; hard ones get rewritten on screen by display-fix.sh |
| conciseness-check.sh | Logs filler and over-length |
| phrase-check.sh | Logs permission-asking and hollow reassurances |
| required-disclaimer-check.sh | Logs a hedge that lacks "I AM GUESSING" |
| diagnostic-citation-check.sh | Logs a cause-claim with no citation |
| read-this-turn-check.sh | Names every file the reply mentions that no tool touched this turn, and says so as next-turn context |
| murk-count.sh | Writes one row per reply, and a second row when any line of Jonathan's message begins with t, translate, rewrite, plain, simplify or murky. Each row carries the rule that counted it (`any-line` from 1 September 2026, `first-word` before) and the length of the reply it is about |
| check-ts.sh | If a .ts/.svelte changed, runs svelte-check; injects any errors as next-turn context |

**The one with no word list.** Every other judgment hook here matches phrases, so anything phrased differently walks past — `diagnostic-citation-check` caught none of the seven wrong statements of 1 September 2026, since none of them said "the cause is". `read-this-turn-check` compares two sets of paths instead: the files a reply names, and the files a tool touched since Jonathan last spoke. There is nothing to phrase around.

Two things it has to know.

**Where the turn begins.** The record of the conversation files two different things under the same word. When a tool hands back its answer, that answer is written as a `user` line — the very label Jonathan's own typing gets. So looking for the last `user` line finds the last tool answer, not his last message. The hook reads what each line holds instead: his messages hold plain words, a tool's answer holds a result block.

**Where a filename ends.** The hook finds names by looking for a run of characters ending in `.ts`, `.md` and the rest. The first version let that run include spaces, so it kept reading outward through the sentence and reported whole phrases as filenames — "is read. And Persistence.ts". Taking spaces out of the run stops it at the name.

### MessageDisplay — fires as text is shown

| Hook | What it does |
|----|----|
| display-fix.sh | Rewrites hard banned words on screen as the reply streams |

### Proving the two halves agree

Every file that arrives, in either part, wears the `always` tag. Two things can go wrong, and the hook complains about both, before anything else it prints:

1. A file arrives without the tag — its labels lie.
2. A file wears the tag and never arrives — they lie the other way.

`/always` proves the complaint works, by breaking each half in turn and putting it back. A check that stays silent when something is broken is not a check.

## Why hooks

Memory tells Claude what to remember. Hooks make Claude's environment *react*. A memory says "prefer tabs." A hook reformats the file after every write. Memory is advice; hooks are mandatory.

The debugging reminder is a hook because it needs to fire *before* Claude starts reasoning — injected into context at the moment the user says "bug," not recalled later when Claude remembers to check.

## Where they live

| File | Scope |
|----|----|
| `~/.claude/settings.json` | All projects |
| `.claude/settings.json` | This project, committed |
| `.claude/settings.local.json` | This project, personal |

Settings load in order: user then project then local. Later overrides earlier.

## Anatomy

```json
{
  "hooks": {
    "EVENT": [
      {
        "matcher": "ToolName",
        "hooks": [
          {
            "type": "command",
            "command": "your-shell-command"
          }
        ]
      }
    ]
  }
}
```

**matcher** is optional. Without it, the hook fires on every event of that type. With it, only when the tool name matches (e.g., `"Write|Edit"` for file changes).

## Events

| Event | When | Matcher |
|----|----|----|
| `UserPromptSubmit` | User sends a message | -- |
| `PreToolUse` | Before a tool runs | Tool name |
| `PostToolUse` | After a tool succeeds | Tool name |
| `MessageDisplay` | Text is about to be shown on screen | -- |
| `Stop` | Claude finishes responding | -- |
| `PreCompact` | Before context compaction | "manual"/"auto" |
| `SessionStart` | New session begins | -- |

## Hook types

**command** — runs a shell command. Receives JSON on stdin with session info, tool name, input, and (for Post) output.

```json
{ "type": "command", "command": "echo hello" }
```

**prompt** — asks an LLM to evaluate a condition. Only for tool events.

```json
{ "type": "prompt", "prompt": "Is this edit safe? $ARGUMENTS" }
```

## What hooks can do

The command's stdout is parsed as JSON. Which fields matter depends on the event:

**Inject text into co's context** — `hookSpecificOutput.additionalContext`. Works on UserPromptSubmit, PostToolUse, and Stop. The debugging reminder and inject-always.sh use this. It is advice co reads, not a hard stop — and it is cut off at about two thousand characters, which is the whole reason for the two parts below.

**Approve or deny a tool** (PreToolUse only) — `hookSpecificOutput.permissionDecision` set to `"deny"` or `"allow"`, plus `permissionDecisionReason`. bash-command-check.sh uses this to deny npx and to auto-approve read-only greps.

**Reject a finished reply** (Stop, PostToolUse) — `decision: "block"` plus a reason. co reads the reason and writes a NEW reply. This is what causes the doubled reply — see below.

**Rewrite text on screen** (MessageDisplay only) — `hookSpecificOutput.displayContent`. It changes what Jonathan SEES; the saved transcript keeps the original. It cannot reject or regenerate. display-fix.sh uses this to swap hard banned words as the reply streams.

No JSON output = the hook ran silently, no effect.

## The doubled-reply trap

A Stop hook fires AFTER the reply is finished and already on screen. If it returns `decision: "block"`, co reads the reason and generates a fresh reply — so Jonathan sees the first attempt AND the corrected one, stacked. That is the doubled reply.

Nothing runs before display that can quietly swallow the first attempt. Confirmed against the official docs: there is no pre-send gate, and MessageDisplay can only rewrite what's shown, never reject.

The fix we settled on: judgment hooks are **warn-only**. They log the violation to `di/.claude/hooks/log.jsonl` and exit clean — never reject. Hard banned words (the deterministic ones) get rewritten on screen by display-fix.sh instead of rejected. The cost: style, hedge, and citation rules became advisory — logged, not enforced. The always-rules injected each turn still nudge co toward them.

## Building a hook, step by step

### 1. Decide what triggers it

Pick the event. "When Jonathan says something about debugging" = `UserPromptSubmit`. "After co edits a file" = `PostToolUse` with matcher `Write|Edit`. "Before co runs a bash command" = `PreToolUse` with matcher `Bash`.

### 2. Write the command

The hook receives JSON on stdin. Use `jq` to extract what is needed.

```bash
# Extract the user's message
jq -r '.user_prompt'

# Extract the file path from a Write/Edit
jq -r '.tool_input.file_path'

# Extract the bash command
jq -r '.tool_input.command'
```

### 3. Pipe-test it

Synthesize the stdin payload and pipe it through the command:

```bash
# Test a UserPromptSubmit hook
echo '{"user_prompt":"there is a bug here"}' | your-command

# Test a PostToolUse Edit hook
echo '{"tool_name":"Edit","tool_input":{"file_path":"src/foo.ts"}}' | your-command
```

Check: did it produce the right output? Did it stay silent when it should?

### 4. Add to settings.json

Merge into the hooks object — don't replace existing hooks. Use `jq -e` to validate:

```bash
jq -e '.hooks.UserPromptSubmit[0].hooks[0].command' .claude/settings.local.json
```

### 5. Verify it fires

For `UserPromptSubmit`: just send a matching message in the next conversation. For `PostToolUse`: trigger the tool and check the effect. Hook output is invisible on success — if proof is needed, temporarily log to a file.

## Example: the debugging reminder

When the user's message contains a debugging keyword, inject a reminder into Claude's context.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.user_prompt' | grep -qiE '\\b(bug|debug|phantom|fix|wrong|broken|fails|crash)\\b' && echo '{\"hookSpecificOutput\":{\"hookEventName\":\"UserPromptSubmit\",\"additionalContext\":\"DEBUGGING REMINDER: The code is the suspect — read log data FIRST. Do not reason from code structure about what should happen. Reason from evidence about what did happen.\"}}' || true"
          }
        ]
      }
    ]
  }
}
```

**How it works:** `jq` extracts the user's message. `grep -q` checks for keywords silently. If found, echo the JSON that injects context. The `|| true` ensures non-matching messages don't cause an error.

## Gotchas

* Invalid JSON in settings.json silently disables ALL settings from that file. Always validate with `jq`.
* Hooks that write to stdout without valid JSON will show raw text to the user.
* `|| true` at the end prevents non-zero exit codes from blocking Claude.
* The settings watcher may not pick up new files until Jonathan restarts or open `/hooks` in the UI.
