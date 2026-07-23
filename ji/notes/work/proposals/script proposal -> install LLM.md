# install LLM proposal

Scripts to stand up a local AnythingLLM + Qwen setup on one machine, so a person can run RAG over their documents without touching a cloud model. Two platforms, because Mac and Windows differ. Companion notes and the model research live in [research.md](research.md).

## What the scripts install (both platforms)

- **Ollama** — the program that downloads and runs local models; it listens on port 11434.
- **The answer model** — `qwen3:30b-a3b-instruct-2507-q4_K_M` (~19GB on disk, needs ~16–19GB free memory to run).
- **The embedding model** — `nomic-embed-text` (~274MB); the small model that powers the document search half of RAG.
- **AnythingLLM** — via its Docker image, mounting a storage folder so documents, the index, and settings survive restarts.

## Mac script (one shell script)

Runs top to bottom in Terminal (zsh). Steps:

1. Install Ollama and start it — `brew install ollama`, then `brew services start ollama` so it stays running across reboots.
2. Pull the two models — `ollama pull qwen3:30b-a3b-instruct-2507-q4_K_M` and `ollama pull nomic-embed-text`.
3. Make the storage folder — create `~/anythingllm` and an empty settings file inside it.
4. Start AnythingLLM in Docker — run the container mapping `~/anythingllm` to the container's storage, with restart-on-reboot on.
5. Leaves the browser setup wizard for the person to finish (see Manual tail below).

Requires Docker Desktop already installed. One clean run; no reboot needed.

## Windows script (two PowerShell parts + a reboot)

Windows needs WSL for Docker, and installing WSL forces a restart — so the work splits in two.

- **Part one** (run as administrator):
    1. Install WSL — `wsl --install` (turns on the needed Windows features and installs Ubuntu).
    2. Register part two to auto-run at next login (a scheduled task), then reboot.
- **Reboot** — Windows finishes the WSL install.
- **Part two** (auto-runs after login):
    1. Install Docker Desktop — `winget install Docker.DockerDesktop`.
    2. Install Ollama — `winget install Ollama.Ollama`.
    3. Pull the two models — same `ollama pull` commands as Mac.
    4. Start the AnythingLLM Docker container with the storage mount.
    5. Leaves the browser setup wizard for the person to finish.

## Manual tail (both platforms — not cleanly scriptable)

AnythingLLM's first run is a browser screen the script can't reliably drive:

- Open `localhost:3001`, choose the language model provider (Ollama, address `http://localhost:11434`), pick `qwen3:30b-a3b-instruct-2507-q4_K_M` as the chat model.
- Set the embedding model to `nomic-embed-text`.
- On the Ollama provider screen: leave **auth token** blank (a local Ollama has no login), and set **keep alive** to `-1` if you want the model to stay warm, or the 5-minute default otherwise.
- Make a workspace, drop in documents, and (if ji needs it) turn on the API and copy a key.

A script *can* pre-write the settings file to skip this wizard, but it's fiddly and breaks between AnythingLLM versions — better to let the script get everything running and click through once.

## Known gotchas (learned this session)

- Paste multi-line commands as a single line with no backslashes — a broken paste merges lines and strands the backslashes, causing "invalid reference format" and "not valid in this context" errors.
- Check the storage variable actually holds a path before the Docker run — an empty one produces blank mount paths and the container fails.
- Docker's engine can hang for many minutes on start — quit/reboot/reset to clear it; nothing answers on port 3001 until the container truly starts.
- Disk budget: tens of GB free, not a couple — the Qwen model alone is ~19GB, plus Docker's data (and on Windows, WSL's growing disk).

## Open question

- Single machine per person vs. one shared server: this proposal covers the per-machine install. For ten people a single shared cloud server means nobody installs anything — they just point ji at one address. Decide which model before scripting for everyone.
