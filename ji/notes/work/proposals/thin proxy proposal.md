# Proposal — a thin proxy

Allow a deployed ji reach into the mac's AnythingLLM safely

Companion to [build LLM proposal](build%20LLM%20proposal.md). This is the "external access" piece, deferred out of the LLM store's first phase. Not needed while ji and AnythingLLM run on the same mac.

## The problem it solves

The moment ji runs somewhere *other* than the mac (a deployed build in a browser), reaching the mac's AnythingLLM directly means two bad things at once: the API key would have to live in the browser (anyone can read it), and AnythingLLM would have to be open to the internet (anyone can hit it). The proxy removes both.

## What it is

A small server process that sits between ji-in-the-browser and AnythingLLM and forwards only the calls ji needs.

- It **holds the AnythingLLM address and key** on the server side. The browser never sees them.
- The browser calls the **proxy**; the proxy attaches the key and forwards to AnythingLLM; the answer comes back the same way.
- It runs **on the mac**, next to AnythingLLM — one box, one hop.

## Getting to the mac from outside

The mac has no public address (home network, behind NAT). Two ways to give the proxy a reachable URL:

- **A tunnel** (a service that exposes one port as a stable https URL). Public doorway; the proxy's own auth is the lock. Use when ji must reach it from anywhere.
- **A private mesh** (only your own devices join a private network; nothing is public at all). Use if only your devices ever need the LLM store — the safest option, no public exposure.

Recommend starting with the private mesh (no public surface); move to a tunnel only if others must reach it.

## Building the tunnel

A tunnel gives the proxy on the mac a **stable public https address**, even though the mac has no public IP. Use it only when someone *other than your own devices* must reach the LLM store — a private mesh can't hand a link to an outsider.

- **The tool.** A tunnel service (Cloudflare Tunnel is the common, free, stable-name choice; ngrok is quicker but its free names churn). A small client on the mac makes an **outbound** connection to the service's edge; requests to the public name are relayed back down that connection to the proxy. **No router ports opened.**
- **The mac's address.** The service binds a name you control (like `https://ji-llm.your-domain`) to the proxy's local port. https is terminated at the service's edge with a real certificate, so the browser's secure-context demand is satisfied for free.
- **How ji reaches it.** ji's LLM store points at that public name whenever it isn't on localhost.
- **The doorway is public — the token is the only lock.** Unlike the mesh, anyone can hit this URL, so the proxy's token and its narrow forwarded-call list are all that stand between the internet and AnythingLLM. Keep the token strong and rotate it if leaked.
- **Optional second gate.** The tunnel provider can put its own access layer in front (email / single-sign-on), so a request must pass provider-auth before it even reaches the proxy — a real belt-and-suspenders for a public surface. Recommended if you keep this on for long.
- **When it's off.** If the mac is asleep or off, the public name simply doesn't answer — the same graceful "not reachable" fallback; drop/view/tag still work.

**Build:** install the tunnel client on the mac, point it at the proxy's local port, bind a hostname; point ji's LLM store there off-localhost. Optionally turn on the provider's access layer in front.

## Building the private mesh

A private mesh links **only your own devices** into one small, encrypted network. Each device gets a stable private address and can reach the others directly, wherever they are and whatever network they're on — with **nothing exposed to the internet**.

- **The tool.** A mesh built on WireGuard (Tailscale is the common, free-for-personal choice). Each device runs a small client, signs in to your account, and joins your private network ("tailnet"). No ports opened, no router config.
- **The mac's address.** With the mesh's name feature on, the mac gets a stable private name (like `mac.your-tailnet`). AnythingLLM and the proxy run on the mac as before; the proxy listens on that private address.
- **How ji reaches it.** On any of your devices with the mesh client running, open ji in the browser and point the LLM store at the mac's private address (`http://mac.your-tailnet:port`). No public URL, no tunnel.
- **The gate is membership.** Only devices you've added to the mesh can reach the proxy at all — that's the outer lock. The proxy's token (next section) stays as a second, inner lock.
- **Secure-context, if needed.** If the browser insists on https for the LLM calls, the mesh can hand the proxy a real certificate for its private name, so it serves https without any public exposure.
- **The limit is the point.** Only devices in your mesh can reach it — you can't hand a plain link to someone outside. If one trusted person ever needs in, the mesh can share a single device with just them (still no public surface); a public tunnel is only for truly open access.

**Build:** install the mesh client on the mac and your other devices, turn on the name feature, note the mac's private name, and point ji's LLM store there whenever it isn't on localhost. Optionally turn on the mesh's certificate so the proxy serves https.

## The lock: the proxy's own auth

The proxy must **not** be an open relay to AnythingLLM.

- The browser sends a **token**; the proxy checks it before forwarding. No valid token, no call.
- Start with **one shared token** (kept out of the repo and the build). Later, swap it for **per-person tokens** tied to the remote-support work (person id + authorization) — this is exactly where that work plugs in.

## A narrow doorway, not a passthrough

The proxy forwards only the handful of calls ji actually makes:

- upload a document's words to the workspace,
- remove a document from the workspace,
- ask a question and return the answer with its citations.

Everything else is refused. So even a valid token can only do ji-shaped things — it can't drive AnythingLLM arbitrarily.

## CORS

The proxy allows the deployed ji's origin; AnythingLLM itself never talks to the browser and needs no CORS of its own.

## Config

- The AnythingLLM address, the key, and the allowed origin live in the **proxy's environment** — never in the repo, never in the build.
- Tokens live in the proxy's own small store at first; validated against the remote-support person store (supabase) once that lands.

## Build order

- **A — stand it up.** A tiny service on the mac forwards the three calls to AnythingLLM using its env key; one shared token guards it; a private mesh (or tunnel) gives it a reachable URL. ji points the LLM store at that URL whenever it isn't on localhost.
- **B — per-person auth.** Replace the shared token with per-person tokens tied to remote support (person id + authorization).

## Success criteria

A deployed ji (not on the mac) can push a document and ask a question through the proxy — with the key never present in the browser and AnythingLLM never directly reachable from the internet.

## Notes and risks

- If the mac is asleep or off, the LLM store's *asking* is unavailable — the same graceful "not reachable" fallback as the localhost case; drop/view/tag still work.
- The words still pass through the proxy on their way to AnythingLLM. That's fine — the proxy is your own, on your own mac — but it is the one trust point.
- Keep the forwarded-call list narrow and the token secret; the tunnel (if used) is only as safe as that lock.
