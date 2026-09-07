---
kind: specify
title: "AI on My Mac"
description: "What a coding agent running on the new M3 Ultra Studio actually takes, in the order the work has to happen"
tags: [keep, now, proposal]
date: 2026-08-21
---
# AI on my mac

Two days ago the honest answer was "not on that 2018 mini." Now there's an M3 Ultra Mac Studio coming, so the question changes from *can it* to *what should run on it, and in what order*. This supersedes the hardware section of [Replace Claude](./proposals/replace%20claude.md); the rest of that note still stands.

## Two projects wearing one name

"My own Claude Code" is really two pieces of work, and they are nothing alike in size.

1. **Local model, someone else's harness.** Serve a coding model on the Studio, point OpenCode or Codex CLI at it. A weekend. You get tool calling, diffs, permissions, LSP feedback and MCP for free.
2. **My own harness.** The loop is also a weekend. What takes months is everything wrapped around it: context compaction, permission gates, subagents, recovering when the model emits a malformed tool call. That wrapper *is* the product.

Do them in that order. Otherwise the first hard bug is ambiguous, and you burn a week deciding whether the harness is broken or the model just isn't smart enough.

Set the expectation now: a local 30B to 80B model is good at scoped edits in code it can see, and noticeably worse at long unattended runs. Plan on hybrid. Local for the grinding, Claude for the thinking.

## The number that decides everything

GPU cores set speed. Unified memory sets what can run at all. The memory shortage has already made that choice for us.

Apple pulled the 512 GB option in March, cut more in May, and today the store lists exactly one Ultra build: 28-core processor, 60-core graphics, 96 GB, 1 TB. 96 GB or nothing. The 256 GB tier, and every model that needed it, is gone.

And macOS does NOT hand the graphics side all of it. There's a ceiling on how much memory Metal may pin for weights and cache, and it needs raising.

```bash
sysctl iogpu.wired_limit_mb              # what the GPU may pin now
sudo sysctl iogpu.wired_limit_mb=86016   # 96 GB machine, ~84 GB ceiling
sudo sysctl iogpu.wired_limit_mb=0       # back to default
```

It's a runtime setting, so it dies at reboot. Wrap it in a launch agent. Leave the OS real headroom (starving it produces swap thrash that reads exactly like an inference bug).

| Installed | Practical model + cache budget | What it buys |
| --- | --- | --- |
| 96 GB (the only one sold) | ~82 GB | an 80B mixture-of-experts model at 4-bit, long context, comfortable |
| 256 GB (withdrawn) | ~232 GB | that same model at 8-bit, or the 200B+ models |
| 512 GB (withdrawn) | ~480 GB | frontier-size open weights, no offload |

## The catch nobody puts in the headline

M3 Ultra has gorgeous memory bandwidth, so words come out fast once it starts.

Starting is the problem. Prompt processing (chewing through the context before the first word) is the weak spot, and agentic coding is nothing but prompt processing. Every single turn re-reads a huge context. Apple added dedicated accelerators for exactly this in the M5 generation. M3 Ultra doesn't have them, and no Ultra chip does yet (the M5 family so far is only the Air, the small Pro and the Neo).

So prompt caching stops being an optimization and becomes a requirement. Stable prefix first, volatile content last, always.

## Serving the model

Everything downstream speaks the OpenAI HTTP API, so this piece is swappable. Start with MLX. It's Apple's own framework, tuned for this silicon, and its server does structured tool calling, which is the part that actually matters for an agent.

```bash
pip install mlx-lm
mlx_lm.server --model mlx-community/Qwen3-Coder-Next-4bit --port 8080

curl -s http://127.0.0.1:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"default_model","messages":[{"role":"user","content":"hi"}]}'
```

LM Studio is the nicer thing to live with day to day (same endpoint, serves both MLX and GGUF, real model management). llama.cpp has the widest quant selection. Ollama is simplest but takes the quant and context knobs away, which is a bad trade here.

Whichever one, set the context length on purpose. Agent work wants 128k or more, and the cache at that length is tens of gigabytes *on top of* the weights. That total is what decides whether a model fits, not the download size.

## Which model

The test is not code benchmarks. It's whether the thing emits well-formed tool calls turn after turn without drifting. Plenty of models that write lovely one-shot functions fall apart inside a harness.

| Model | Shape | Fits in | Why |
| --- | --- | --- | --- |
| Qwen3-Coder-Next | ~80B MoE, ~3B active | ~46 GB at 3-4 bit, ~85 GB at 8-bit | the default for this machine. 262k context, Apache 2.0, trained for tool use |
| Qwen 3.6 35B-A3B | 35B MoE, 3B active | ~30-40 GB | lighter and quick. the right thing to wire everything up with first |
| DeepSeek V4-Flash | ~284B MoE, 13B active | 256 GB+ | out of reach. it wants memory Apple no longer sells |

Two settings people get wrong. Don't quantize below about 3-bit (tool-call formatting degrades well before the prose visibly does). And use the model's published sampling numbers, not the harness defaults: for the Qwen coder line that's temperature 1.0, top-p 0.95, top-k 40, min-p 0.01, repetition penalty off.

UA! Every model name here is from August 2026 write-ups, not from anything i ran. This corner turns over every few weeks. Check the current MLX and Unsloth quant repos before downloading.

## Borrow a harness first

Spend a week inside OpenCode on local weights before writing a line of your own. It's the only way to learn which failures belong to the model and which belong to the harness, and that list becomes the requirements for the next section.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "mlx/default_model",
  "provider": {
    "mlx": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "MLX (local)",
      "options": { "baseURL": "http://127.0.0.1:8080/v1" },
      "models": { "default_model": { "name": "Default MLX Model" } }
    }
  }
}
```

OpenCode is the closest open thing to what we want. MIT, model-agnostic, sessions in SQLite, MCP support, and it feeds compiler diagnostics back to the model after every edit so the agent sees its own errors. Steal that idea outright.

Try Codex CLI against the same endpoint too. The same model behaves differently in different harnesses, and Codex is markedly more frugal per task, which matters a lot when prefill is the bottleneck.

Run three real ji tasks through each. Watch for malformed tool calls, runaway file reads, and whether it recovers from a failed edit. Every place the harness saves the model from itself is a requirement.

## Building the thing

The loop is small. Call the model, run the tool calls it asks for, append the results, repeat until it stops asking. Everything that makes an agent feel competent lives in the four systems around that loop.

**Six tools, and resist the seventh.** Read (with line numbers, offset and limit), Glob, Grep on ripgrep, Edit as exact unique string replacement, Write for whole new files only, Bash with a timeout and truncated output. Every schema costs context on every call. Later, once those are solid: a todo tool (it visibly steadies long tasks) and a subagent spawner.

**Compact before each call, not when you overflow.** Keep the head (system prompt, original task) and the tail (recent turns), summarize the middle. Summarize tool results per tool, because a grep hit and a stack trace compress differently. Push big outputs to disk and hand back a handle.

**Permissions in layers, assuming each one fails.** Prompt guidance, then a tool allowlist (read-only plan mode is just a shorter list), then a runtime approval gate with remembered decisions, then per-tool validation with a blocklist and timeouts, then hooks that can block or rewrite arguments before a tool runs.

**One agent class, constructed differently.** Don't build a subagent framework. One class that takes an allowed-tools list and a prompt override, a fresh empty context each time, a structured result back. A read-only planner and an explorer that reports a summary instead of dumping files into the parent's context cover most of the value.

**Design for an imprecise model.** Local models are approximately right more often than Claude is. So: fuzzy-match an edit before failing it, background a command that looks like a server, retry a malformed tool call with the schema error fed back in. Each of those is worth more than a better prompt.

One thing we already have: the CLAUDE.MD files and the guides under `notes/`. Load the nearest one as a system prompt section and the harness inherits its instruction set on day one. i've been writing that for months without calling it that.

## Prove it, don't feel it

Build a fixed suite of five to ten real tasks from our own repos, gradeable pass or fail, and run it against every change. Without it the tuning happens on vibes, and vibes are how a month disappears.

- words per second, and time to first word, at 8k / 32k / 128k of context. the second number is the one that will surprise you
- malformed tool calls per hundred
- pass rate at each quantization, which is how the real quant floor gets found
- peak memory under load, watching for swap, then set the wired limit from what you saw
- the same suite against Claude, so the size of the gap is always a known number

## Where this lands

The Studio makes local genuinely usable for the grinding work, which the 2018 mini never could. It does not make local a replacement for what we do together on a whole project. The lever is still which model does which task.

The next decision isn't the memory config. It's the calendar.

Order the M3 Ultra now and it's 13 to 14 weeks, so it lands in October, at $5,299 for the 96 GB (it was $3,999). A Studio with M5 Max and M5 Ultra is expected around October as well, tested as high as 768 GB, though the same shortage makes that timing soft. Same wait either way. And the M5 generation is precisely the one that fixes the prompt-processing weakness above.

UA! The M5 Studio is a rumor with a date attached, not an announcement. If it slips, waiting costs real months.
