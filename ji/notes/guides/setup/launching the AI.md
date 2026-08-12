---
kind: howto
title: "Launching the AI"
description: "Everything between a cold mac and ji answering a question: Docker, AnythingLLM, the model, the key-holding server, the tunnel, and the password."
tags: [platform, program, setup, tools]
date: 2026-08-07
---

# Launching the AI

Five things have to be up before ji can answer a question, and each one leans on the one before it. This walks them in order, says what each is for, and gives the one command that proves it is really running.

## What the parts are

**Docker** — the program that runs other programs in their own sealed box. AnythingLLM lives in one of those boxes.

**AnythingLLM** — the AI itself, as far as ji is concerned. It holds the documents, cuts them into pieces, remembers which piece said what, and passes questions to the model. It listens on port 3001.

**Ollama and the model** — AnythingLLM does the finding; the model does the answering. Ollama is what holds the model in memory and runs it. Without it, AnythingLLM answers but has nothing to answer *with*.

**The key-holding server** — a small server of ours sitting beside AnythingLLM. ji never talks to AnythingLLM directly from off the mac. This one holds the real AnythingLLM key on this side, checks that the caller carries a share token of ours, swaps the token for the real key, and passes along only the handful of calls ji actually makes. Anything else it refuses outright. It listens on port 3017.

**The tunnel** — the mac has no address of its own on the open web. The tunnel dials outward and gets back a temporary public address that leads to the key-holding server. That address changes every time it restarts, so the server writes its current one into a single fixed link, and ji reads that link to find out where to call.

## Starting them, in order

### 1. Docker

Start Docker Desktop and wait until it says it is running. Nothing below works until it does.

```bash
docker ps
```

An empty list is fine — an error about the daemon means Docker is not up yet.

### 2. AnythingLLM

If the box already exists, start it:

```bash
docker start anythingllm
```

If it does not exist, make it. The one folder holds everything — the documents, what it learned from them, and its own settings — so backing up that folder backs up the whole thing:

```bash
mkdir -p ~/anythingllm
touch ~/anythingllm/.env
docker run -d -p 3001:3001 --name anythingllm -v ~/anythingllm:/app/server/storage -v ~/anythingllm/.env:/app/server/.env -e STORAGE_DIR="/app/server/storage" mintplexlabs/anythingllm
```

Prove it:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/v1/system
```

**401** is the right answer — the server is there and asking who you are. **000** means nothing is listening.

### 3. Ollama and the model

```bash
brew services start ollama
ollama list
```

The list must hold the model AnythingLLM is set to use. Without it, questions come back saying the model is not installed.

### 4. The key-holding server, with its tunnel

```bash
yarn --cwd ji/proxy serve
```

That starts the server, brings up the tunnel, writes the current public address into `ji/proxy/current-url.txt`, and publishes it to the fixed link ji reads. On this mac alone, `yarn --cwd ji/proxy start` is enough — no tunnel needed.

Its settings live in `ji/proxy/.env`, which is never committed: the real AnythingLLM key, and the share token ji must present.

Prove it:

```bash
curl -s http://localhost:3017/health
```

It answers `{"ok":true}` without any token, so anything can check that it is up.

### 5. Keep it alive across a reboot

```bash
cp ji/proxy/com.ji.proxy.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.ji.proxy.plist
```

That starts it now and at every login, and restarts it if it stops. To turn it off, `launchctl unload` the same file.

## How ji finds it

ji keeps two settings in the browser, and nothing else:

- **the pointer link** — the one fixed address that always holds the tunnel's current address. ji reads it once at launch, asking fresh each time since it is served through a short cache.
- **the share token** — what ji presents to the key-holding server. Not the AnythingLLM key; that never leaves the mac.

A browser without those two shows a single password box. Typing **`suchness`** writes both, reads back what the AI holds, and drops you into the file list. It is a low gate, not a secret: the two settings and the password all ride in the build, so anyone reading the built code can find them. What they guard is convenience, not the key — the key stays behind the server.

## Logging into AnythingLLM itself

Open `http://localhost:3001` in a browser. That is AnythingLLM's own screen, where the model is chosen, the documents are looked at, and the API key is made. ji never uses that screen; it only ever talks through the key-holding server.

## When it will not answer

Work down the chain — each of these is the one below failing:

| What ji says | What it means | Where to look |
| --- | --- | --- |
| waiting for the AI | the last call did not reach the server at all | the tunnel, then the key-holding server |
| Couldn't reach the model | the call went out and came back with nothing | Ollama, and whether the model is installed |
| the model "…" is not installed | AnythingLLM answered, and said so plainly | `ollama pull` the model it names |

The app writes every one of these to `logs/intersection.log`, with the address it tried. Read that before guessing.

**One trap worth knowing.** A page served from one address calling a server at another is refused by the browser before any answer comes back — it reads as "Failed to fetch" in the log, and looks exactly like the server being down, though the very same call from the command line succeeds. If the command line says the address is alive and the app says it is not, this is why.
