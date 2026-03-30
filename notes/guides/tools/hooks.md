# Hooks

Hooks are shell commands that fire automatically when Claude does something — edits a file, runs a command, receives a message. They live in settings.json and run without asking.

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

The command's stdout is parsed as JSON. Key fields:

* `hookSpecificOutput.additionalContext` — injects text into Claude's context (the debugging reminder uses this)
* `continue: false` — blocks the action
* `stopReason` — message shown when blocking
* `decision: "block"` — for PostToolUse, blocks further processing

No JSON output = hook ran silently, no effect on Claude's behavior.

## Building a hook, step by step

### 1. Decide what triggers it

Pick the event. "When I say something about debugging" = `UserPromptSubmit`. "After Claude edits a file" = `PostToolUse` with matcher `Write|Edit`. "Before Claude runs a bash command" = `PreToolUse` with matcher `Bash`.

### 2. Write the command

The hook receives JSON on stdin. Use `jq` to extract what you need.

```bash
# Extract the user's message
jq -r '.user_prompt'

# Extract the file path from a Write/Edit
jq -r '.tool_input.file_path'

# Extract the bash command
jq -r '.tool_input.command'
```

### 3. Pipe-test it

Synthesize the stdin payload and pipe it through your command:

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

For `UserPromptSubmit`: just send a matching message in your next conversation. For `PostToolUse`: trigger the tool and check the effect. Hook output is invisible on success — if you need proof, temporarily log to a file.

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
* The settings watcher may not pick up new files until you restart or open `/hooks` in the UI.
