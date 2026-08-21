---
kind: analyze
title: "Replace Claude"
description: "Could a stack of small models running on your own machine do what Claude Code does for us? You sent me an article that says yes"
tags: [now, stale]
date: 2026-08-19
---
# Replace Claude

Could a stack of small models running on your own machine do what Claude Code does for us? You sent me an article that says yes. It doesn't hold up, but the question underneath it is a fair one, so here is the whole discussion, kept as the record.

## The article

[I Fused 3 Tiny Local LLMs on my Laptop and Matched the Reasoning of Anthropic Fable 5](https://pub.towardsai.net/i-fused-3-tiny-local-llms-on-my-laptop-and-matched-the-reasoning-of-anthropic-fable-5-4e62930b2bf0) — Addepalle Nikhil Varma, July 14 2026, four minutes long.

The pitch: run three small models side by side, let them vote on each next word before any word is chosen, and you get frontier reasoning on consumer hardware for nothing. It calls this active logit-level fusion, and contrasts it with permanently blending model weights together, which it says quietly damages each model.

## Why it doesn't hold

1. **There is no agent in it.** The one piece of code produces a single word and stops. No conversation loop, no reading or editing files, no shell, no tools, no memory of the task. That harness *is* Claude Code — the model is one part of it. The article replaces the part we aren't missing.
2. **It won't run as written.** Every line sends work to an NVIDIA graphics card. Your Mac has none. It also feeds all three models through the first model's word list, which only works if all three share the exact same vocabulary — it never says they do, and it never names the three models. The only names in the whole piece are Llama 3 8B and Gemma 2 9B, mentioned in passing as examples of models people dismiss.
3. **The claim is never tested.** No benchmark, no task, no comparison, no numbers. The headline says it matched Fable 5; nothing in the article measures anything.

So: nothing here to follow. Setting the article aside, the real local version of this idea is one capable model behind an agent harness, not three averaged.

## What a real local setup looks like

1. **Run a model locally.** Install Ollama (`brew install ollama`, then `ollama serve`) and pull one model. Quality pick: `qwen3-coder:30b`. Speed pick: `qwen2.5-coder:7b` or `14b`.
2. **Point an agent harness at it.** Cline or Roo Code inside VS Code, or the Aider command-line tool. Each takes a local address in place of a cloud key. This is the piece that gives you file editing, a shell, and a task loop — everything the article skipped.
3. **Expect a real drop.** A 7B model is a fast typist who forgets. A 14B holds a single file well and loses the thread across several. Good for boilerplate, single-file edits and questions; frustrating for the multi-file work we actually do.

## Hardware

**What you have now.** A 2018 Intel Mac mini — `Macmini8,1`, 64 GB. No Apple-silicon graphics, so a local model runs on the processor alone, at roughly a few words per second for an 8B model. An agent task needs thousands of words. Memory is not your limit here; the processor is. This machine can run the setup above, but not pleasantly.

**M4 with 24 GB — would it suffice?** Yes for speed, no for the quality you're used to. 24 GB leaves roughly 16 GB for the model, which fits a 14B comfortably and a tightly quantized 30B only with everything else closed. Fast enough to feel interactive; still well short of Claude Code on multi-file work.

**The machine that changes the answer.** [Mac mini, M4 Pro, 14-core processor, 20-core graphics, 48 GB, 1 TB](https://www.apple.com/shop/buy-mac/mac-mini/m4-pro-chip-14-core-cpu-20-core-gpu-48gb-memory-1tb-storage). 48 GB holds a 30B-class model with room for the rest of your work, and the faster graphics roughly double the words per second over a plain M4. That is the step from "technically works" to "genuinely usable".

UA! I have no measured word-rate for any of these three machines — the numbers above are estimates from how these models size up in memory, not from a test I ran. Worth an hour on a borrowed M4 before spending anything.

## Where this leaves it

Local is a real option for the small, private, repetitive work. It is not a replacement for what we do together on a whole project, on any of the three machines above. If cost is the pressure, the honest lever is which model does which task, not which machine sits on the desk.
