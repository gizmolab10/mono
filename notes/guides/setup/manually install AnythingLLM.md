---
kind: howto
title: "Installing AnythingLLM by Hand"
description: "The steps that get the AnythingLLM engine running on this machine."
tags: [setup]
date: 2026-07-24
---
# Installation Steps

## **1. Install Docker Desktop**

**download and then open** it once so the engine is running.

1. Go to **docker.com/products/docker-desktop** and click Download for Mac.
2. Pick the right build — **Apple Silicon** for M1/M2/M3/M4 Macs, **Intel chip** for older ones. (Apple menu → About This Mac tells you which.)
3. Open the downloaded `.dmg` and drag the **Docker whale icon** into your Applications folder.
4. Launch Docker from Applications, accept its permission prompt (it asks for admin once to install helper tools), and wait for the whale icon in the top menu margin to stop animating — steady means the engine is running.
5. Confirm it's alive: open Terminal and run `docker --version`; a version number back means step 1 is done.

btw: Docker Desktop is free for personal use and small teams — no account strictly required to run it, though it'll nudge you to sign in.

## **2. Run AnythingLLM**

**with a storage folder that survives restarts:**

Open the **Terminal** app, then run these:

1. **Make the folder that holds everything permanently:**

```
export STORAGE="$HOME/anythingllm"
```

```
mkdir -p "$STORAGE"
```

```
touch "$STORAGE/.env"
```

This creates a folder named `anythingllm` in your home directory and an empty settings file inside it. Your documents and the searchable index will live here, on your Mac's real disk — outside the container — so they survive any restart.

2. **Start the AnythingLLM container pointed at that folder:**

```
docker run -d -p 3001:3001 \  --cap-add SYS_ADMIN \  -v "$STORAGE":/app/server/storage \  -v "$STORAGE/.env":/app/server/.env \  -e STORAGE_DIR="/app/server/storage" \  --restart unless-stopped \  mintplexlabs/anythingllm
```

Line by line: run in the background · make it reachable at `localhost:3001` · grant a permission its document reader needs · link your folder to the container's storage · link your settings file · tell it where storage lives · bring it back automatically after any reboot · use the official AnythingLLM image (downloads the first time).

3. **Confirm it's up:**

```
docker ps
```

You should see a line for `mintplexlabs/anythingllm`. Then open `localhost:3001` in a browser — the setup wizard means it's running.

I am guessing on the exact flags (`--cap-add SYS_ADMIN`, the mount paths) — these match AnythingLLM's published Docker instructions, but versions drift; if step 2 errors, check their current Docker doc rather than fighting the command.

btw: the first `docker run` downloads the image, so it may sit for a minute or two before returning — that's normal, not a hang.

4. original script:
```
export STORAGE="$HOME/anythingllm"mkdir -p "$STORAGE" && touch "$STORAGE/.env"docker run -d -p 3001:3001 \  --cap-add SYS_ADMIN \  -v "$STORAGE":/app/server/storage \  -v "$STORAGE/.env":/app/server/.env \  -e STORAGE_DIR="/app/server/storage" \  --restart unless-stopped \  mintplexlabs/anythingllm
```

`--restart unless-stopped` brings it back after reboots. I am guessing on the exact flag set — versions drift; if it fails, check AnythingLLM's current Docker docs.

## **3. Confirm and finish**

open `localhost:3001`, finish the setup wizard, set a password (Settings), make your workspace, turn on the API and move the key. From memory of AnythingLLM's setup — exact wording shifts by version, so match the intent, not the letter:

1. **Finish the wizard**

- Pick the **language model** — choose a provider and paste its key, or pick a local model. This is the engine that writes answers; you can't skip it.
- Pick the **embedding model** — the default built-in one is fine; it's what turns your documents into searchable form.
- Pick the **vector store** — leave the default (built-in LanceDB); it stores the searchable form.
- If it asks for a survey or team info, skip or fill quickly — not required.

2. **Set a password** — after the wizard, go to **Settings** (gear, bottom-left) → look under **Security** (or "Instance/Password"). Turn on password protection and set one. This is what guards the instance once you expose it.

3. **Make your workspace** — click **New Workspace** in the left sidebar, name it. This is the shared bucket the ten people's documents land in.

4. **Turn on the API** — Settings → **Tools → Developer API** (or "API Keys"). Click **Generate New API Key**.

    WAWZT9J-1BEM8Q0-H4X7P3S-K2M4PQY

5. **Move the key** — move it the moment it shows; some versions only show it once. Paste it somewhere safe — that plus the server address is what each ji app needs.

I am guessing on the exact menu labels (Security, Tools → Developer API) — they've moved between versions. If a label isn't where I said, tell me what you see on the Settings screen and I'll point you.

btw: generate a **separate** API key per person, not one shared key — then you can revoke one without cutting off the others.
## **4. Stop the Mac sleeping**

System Settings → Battery/Energy → prevent sleep when plugged in. For belt-and-suspenders, run `caffeinate -s` in a Terminal you leave open.

## **5. Expose it to the ten people**

install `cloudflared`, run a tunnel pointing at `localhost:3001`; it hands you a public HTTPS address. Each person's ji app uses that address + their own API key.

## **6. Lock it down before sharing**

the AnythingLLM password from step 3 is what stands between the public address and your documents. Set it, and set per-user API keys so you can revoke one without touching the others.