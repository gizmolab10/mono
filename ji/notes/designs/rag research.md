---
kind: design
title: "Design trade-offs (ji)"
description: "What was weighed in choosing how ji stores and searches what it is given."
tags: [data, done, plans, proposal, research]
date: 2026-08-06
---
# RAG design trade-offs


## RAG + AnythingLLM for ji

### What RAG is

- Two stages: a search step finds relevant document pieces, then the language model answers using those pieces as source text.
- The search step does *not* use the big model — it uses a small embedding model plus a plain math similarity match. Only the answer step hits the language model.
- One store (the vector database of document pieces) plus one engine (the language model). The model is a processor, not a place data sits.

### AnythingLLM

- Built around RAG: drop in documents, it chunks, embeds, and stores them automatically.
- Usually no need to pre-chunk; only tune chunk size and overlap if the defaults don't suit.
- Has a web API — ji can upload, embed, and query over HTTP, no direct database access needed.

### Embedding models (the search half of RAG)

- This is a *separate, small* model from the answer model — it turns your documents and each question into the numeric fingerprints the search step matches on. Retrieval quality depends on it.
- Recommended default: `nomic-embed-text` — the repeated winner for local RAG, tiny (~274MB).
    - `ollama pull nomic-embed-text`
- Set it in AnythingLLM: Settings → Embedding Preference → Ollama → `nomic-embed-text`.
- Two models run side by side: the embedding model does the search, the answer model (Qwen or Gemma) writes the reply. Changing the embedding model later means re-embedding your documents.

Sources: [InsiderLLM](https://insiderllm.com/guides/best-local-llms-rag/), [LMSA](https://lmsa.app/blog/the-ultimate-guide-to-the-best-ollama-models-for-rag-in-2026/), [Hugging Face](https://huggingface.co/blog/daya-shankar/open-source-llm-models-to-run-locally), [PromptQuorum](https://www.promptquorum.com/power-local-llm/anythingllm-vs-privategpt-vs-openwebui-rag), [Ollama qwen3 tags](https://ollama.com/library/qwen3/tags), [Ollama gemma3](https://ollama.com/library/gemma3).

### Sharing one store across people

- All machines must point at *one* shared AnythingLLM server, not a copy each.
- Separate local copies means separate stores that never see each other's files.

#### Hosting the shared server

- Paid options: Railway/Render one-click, a DigitalOcean/Hetzner droplet (~$6–12/mo), the big clouds, or AnythingLLM's own hosted cloud.
- Free-ish options: a home always-on Mac/Pi reached via Cloudflare Tunnel or Tailscale; Oracle Cloud's always-free VM; Fly/Railway free credit (verify current limits).
- At ~10 users a small always-on cloud box beats a home Mac — it removes the sleep, single-machine, and home-upload-speed risks.

#### Mac-as-host setup (chosen path)

- Run the Docker image, not the Desktop app — Desktop is local-only and won't serve other machines.
- Mount a storage folder so documents and the index survive restarts; use restart-on-reboot; keep the Mac awake; expose via Tailscale or Cloudflare; set a password plus per-user API keys.
- Gotchas hit along the way:
    - Pasted multi-line commands merged lines and stranded backslashes — paste as one line with no backslashes.
    - An empty storage variable produced blank mount paths — check it echoes the real path first.
    - The Docker engine hung ~15 minutes on start — quit/reboot/reset to clear it.
    - Port 3001 refused because the container never actually started.

### Model choice NOT taken — cloud

- Sonnet 5: best default for grounded Q&A, sticks to the retrieved text, lower cost per question.
- Opus 4.8: top quality on messy or long context; reserve for the hard questions.
- Cloud means documents leave the Mac — privacy vs. quality is the real fork.

### Model choice — local (researched, 2026)

- Qwen3-30B-A3B-Instruct-2507 — most-recommended pick; ~30B of knowledge but only ~3B of work per answer, ~15–17GB, long context.
- Llama 3.3 70B — best synthesis, closest to cloud; heavier and slower per answer.
- Gemma 3 (12B/27B) — best when memory is tight; quality-preserving compressed versions with native Ollama support.
- Retrieval quality depends on the embedding model — `nomic-embed-text` is the repeated winner.
- On Apple Silicon the model shares main memory — "16GB" ties up 16GB of total RAM while running.

## Setup

#### Anything LLM storage

- After chunking, AnythingLLM keeps the *full parsed text* of each document — not just the searchable chunks. The chunks are extra, not a replacement.
- On disk: inside the storage folder (`~/anythingllm`), under a `documents/` folder (user uploads land in `custom-documents/`), **each document is saved as a JSON file**. Its `pageContent` field holds the complete extracted text, plus metadata (title, source, and so on).
- Getting the text back — most reliable route is reading that JSON file directly. The API can *list* documents (`GET /v1/documents`, `GET /v1/documents/folder/<name>`) but has no clean documented endpoint that returns one document's full text, so the on-disk JSON is the dependable path.
- Caveat: what's retained is the parsed *text*, not necessarily the original file (the PDF or Word binary). If you need the exact original back, keep your own copy — I am guessing AnythingLLM does not reliably hold the original upload for re-download; confirm before depending on it.

#### **Setting up the storage folder (Docker version):**

- The storage folder is a normal folder on your Mac that the container maps to its own internal storage, so documents, the index, and settings survive restarts and updates.
- Create the folder and an empty settings file:
    - `mkdir -p ~/anythingllm`
    - `touch ~/anythingllm/.env`
- Link it when starting the container — two mounts: the folder to the container's storage, and the settings file to the container's settings file:
    - `-v ~/anythingllm:/app/server/storage`
    - `-v ~/anythingllm/.env:/app/server/.env`
    - plus `-e STORAGE_DIR="/app/server/storage"` so it looks there.
- Everything then lives in that one folder: `documents/` (parsed text), the vector database, and settings — so backing up this single folder backs up the whole instance.
- Desktop-app note: the Desktop app picks its own storage location automatically (shown in its settings); the mount step above is only for the Docker version.

#### **Further configuration**

- **Keep alive** — how long Ollama holds the model in memory after answering. Leave the default (5 minutes) for occasional use; set it to `-1` (stay loaded forever) if you have the RAM and want no reload delay on each question. Shorter frees memory faster but makes the next question wait while the model reloads.
- **Auth token** — leave it **blank**. It's only for when your Ollama server itself sits behind a login/proxy that requires a bearer token. A plain local Ollama has no authentication, so there's nothing to enter.

#### Installing Qwen (the answer model)

- Install Ollama first — the program that downloads and runs local models. On a Mac: download from ollama.com, or `brew install ollama`. Start it so it's listening (it serves on port 11434).
    - brew install ollama
    - brew services start ollama
- Pull the recommended build (the compressed one that fits in memory, ~19GB on disk):
    - `ollama pull qwen3:30b-a3b-instruct-2507-q4_K_M`
- Point AnythingLLM at it: Settings → LLM Provider → Ollama, base address `http://localhost:11434`, then pick `qwen3:30b-a3b-instruct-2507-q4_K_M` as the chat model.
- Needs roughly 16–19GB of your Mac's memory free while running; it shares main RAM on Apple Silicon.

#### Installing Gemma (the lighter answer model)

- Same Ollama step as above (install once, keep it running).
- Pull whichever size fits your memory:
    - `ollama pull gemma3:12b` — the tight-memory choice.
    - `ollama pull gemma3:27b` — stronger reasoning and long context on a well-specced Mac.
- Point AnythingLLM at it the same way: LLM Provider → Ollama, then pick `gemma3:12b` or `gemma3:27b` as the chat model.
- The 27B also handles images and many languages; use it if you have the memory, the 12B if you don't.

