# The thin proxy

A tiny server that sits on the mac, next to AnythingLLM, so a deployed ji (in a browser, off the mac) can reach it safely. The proxy holds the AnythingLLM address and key on this side — the browser never sees them — and forwards **only** ji's calls. See the design in [thin proxy proposal](../notes/work/proposals/thin%20proxy%20proposal.md).

This is **Phase A** (stand it up with one shared token). Phase B (per-person tokens tied to remote support) comes later.

## Run it

No dependencies — just Node 18+ (it uses Node's own `http` and global `fetch`). Settings come from `.env` — copy `.env.example` to `.env` and fill in the key and a strong token (`.env` is gitignored; never commit it).

- **Proxy only** (e.g. on the same mac as ji): `yarn --cwd ji/proxy start`
- **Proxy + tunnel, supervised** (reachable from off-mac): `yarn --cwd ji/proxy serve` — starts the proxy, brings up the free tunnel, writes the current public address to `current-url.txt`, and re-publishes it if it changes.

`.env` keys, all optional except the first two:

| Variable          | What it is                              | Default                              |
|-------------------|-----------------------------------------|--------------------------------------|
| `ANYTHINGLLM_KEY` | the AnythingLLM API key                 | (required)                           |
| `PROXY_TOKEN`     | the shared token ji must present        | (required)                           |
| `ANYTHINGLLM_URL` | where AnythingLLM listens               | `http://localhost:3001`              |
| `ALLOWED_ORIGIN`  | the deployed ji's origin (for CORS)     | `*`                                  |
| `PORT`            | the port the proxy listens on           | `3017`                               |
| `CLOUDFLARED`     | path to the tunnel client               | `/usr/local/opt/cloudflared/bin/…`   |
| `PUBLISH_URL_CMD` | hook run when address changes (`$URL`)  | (none)                               |

`GET /health` answers `{ "ok": true }` with no token, so a URL-finder can tell it's up.

## Keep it running (reboot-surviving)

A launchd job runs the supervisor at login and restarts it if it stops:

```bash
cp ji/proxy/com.ji.proxy.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.ji.proxy.plist     # start it now + at every login
launchctl unload ~/Library/LaunchAgents/com.ji.proxy.plist   # stop it and turn it off
```

Logs go to `run.log` (the supervisor) and `tunnel.log` (the tunnel); the live public address is always in `current-url.txt`. If node's path changes (a Node upgrade), update the `PATH` line at the top of `run.sh`.

## Point ji at it

No ji code change — it's all config. In ji's data settings (or localStorage):

- `llmUrl` → the proxy's URL (its tunnel address when off the mac; see below).
- `llmKey` → the **`PROXY_TOKEN`** (not the AnythingLLM key — that stays on the proxy).

ji already sends `Authorization: Bearer <llmKey>` and calls `<llmUrl>/api/v1/…`, which is exactly what the proxy expects; it checks the token, swaps in the real key, and forwards.

## The doorway

Only these calls pass — everything else is refused (`403`), and a wrong or missing token is `401`:

- `GET  /api/v1/workspaces` — find the workspace
- `POST /api/v1/workspace/new` — make the workspace
- `POST /api/v1/document/upload` — upload a document's words
- `POST /api/v1/workspace/{slug}/update-embeddings` — embed / un-embed it
- `POST /api/v1/workspace/{slug}/chat` — ask a question
- `GET  /api/v1/workspace/{slug}/chats` — read the saved chat
- `DELETE /api/v1/system/remove-documents` — delete the document

## Reaching it from off the mac (behind NAT)

The mac has no public address, so run a **free tunnel** whose client dials outward — no router config. Cloudflared, zero-cost (churning name):

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3017
```

It prints a temporary `https://…trycloudflare.com` address. Because the free name changes on each restart, publish it to a **fixed free pointer** (a GitHub Gist's raw URL, or a small file on ji's static host) with a wrapper that captures the printed URL on start; ji reads that pointer once at load. Keep the tunnel alive across reboots by running `cloudflared` as a background service. Full detail (and the fixed-name variant if a domain turns up) is in the proposal.
