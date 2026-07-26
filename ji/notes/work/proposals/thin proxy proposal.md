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
- **Not the work-sites hub's dispatch server (decided).** ji's own small proxy, kept separate.

## Getting to the mac from outside

The mac has no public address (home network, behind NAT). Two ways to give the proxy a reachable URL:

- **A tunnel** (a service that exposes one port as a stable https URL). Public doorway; the proxy's own auth is the lock. Use when ji must reach it from anywhere.
- **A private mesh** (only your own devices join a private network; nothing is public at all). Use if only your devices ever need the LLM store — the safest option, no public exposure.

Decision: tunnel. **Constraint: it must be free — zero cost.**

## Building the tunnel

A tunnel gives the proxy on the mac a **stable public https address**, even though the mac has no public IP. Use it only when someone *other than your own devices* must reach the LLM store — a private mesh can't hand a link to an outsider.

- **The tool.** A tunnel service (Cloudflare Tunnel is the common, free choice; ngrok is quicker but its free names churn). A small client on the mac makes an **outbound** connection to the service's edge; requests to the public name are relayed back down that connection to the proxy. **No router ports opened.**
- **Cost: must be free — and that pulls against a stable name.** Cloudflare Tunnel itself is free, but a *fixed, custom* hostname needs a domain on Cloudflare, and a domain has a yearly cost. At truly zero cost with no domain, the free "quick tunnel" names are random and churn (like ngrok's free tier). So resolve this before building: either (a) accept a churning name and have ji rediscover the current URL through a free stable pointer (**decided — see "Finding the churning address" below**), or (b) find a free service that hands out a fixed subdomain, or (c) if a spare/free domain turns up, Cloudflare's fixed name becomes free. No zero-cost path gives a guaranteed stable name on its own.
- **The mac's address.** The service binds a name you control (like `https://ji-llm.your-domain`) to the proxy's local port. https is terminated at the service's edge with a real certificate, so the browser's secure-context demand is satisfied for free.
- **How ji reaches it.** ji's LLM store points at that public name whenever it isn't on localhost.
- **The doorway is public — the token is the only lock.** Unlike the mesh, anyone can hit this URL, so the proxy's token and its narrow forwarded-call list are all that stand between the internet and AnythingLLM. Keep the token strong and rotate it if leaked.
- **Optional second gate.** The tunnel provider can put its own access layer in front (email / single-sign-on), so a request must pass provider-auth before it even reaches the proxy — a real belt-and-suspenders for a public surface. Recommended if you keep this on for long.
- **When it's off.** If the mac is asleep or off, the public name simply doesn't answer — the same graceful "not reachable" fallback; drop/view/tag still work.

**Build:** install the tunnel client on the mac, point it at the proxy's local port, bind a hostname; point ji's LLM store there off-localhost. Optionally turn on the provider's access layer in front.

### Behind NAT — configuring the mac

The mac sits behind NAT (a home router; no public address, no inbound reach). The tunnel is exactly what solves this: **the tunnel client on the mac dials OUT to the tunnel service, and traffic to the public name rides back down that same outbound connection.** So there is **no router config at all** — no port forwarding, no static IP, no firewall inbound rule, no UPnP. That is the whole reason to use a tunnel rather than opening a port.

Concrete steps (Cloudflare Tunnel via `cloudflared`, macOS):

1. **Install the client:** `brew install cloudflared` (Homebrew — not npm).
2. **Zero-cost, no domain (churning name):** run `cloudflared tunnel --url http://localhost:<proxy-port>`. It opens the outbound connection and prints a temporary `https://…trycloudflare.com` address. Point ji's LLM URL at that address (off localhost). The name changes every run — see the free-vs-stable note above; ji reads the current URL from a small lookup, or you paste it into ji's settings each session.
3. **Keep it running across reboots:** run `cloudflared` as a background service (a `launchd` agent, or `brew services`), so it re-dials on wake and after a restart without a terminal open.
4. **Fixed name (only if a domain is on hand — has a cost):** `cloudflared tunnel login`, `cloudflared tunnel create ji-llm`, route a hostname to it (`cloudflared tunnel route dns ji-llm ji-llm.your-domain`), then run the named tunnel as the service. This gives a stable `https://ji-llm.your-domain` and drops the churn, but needs the domain.

Router note: nothing to change on the router. If a strict outbound firewall is in play, allow the client's outbound https (443) to the tunnel service — that single outbound allowance is all it needs.

### Finding the churning address (a free, stable pointer)

The free tunnel's name changes on every restart, but ji needs one fixed thing to look at. Put a **stable pointer** in front of the churning name — a tiny file at a fixed, free URL that always holds the current tunnel address:

- **Where the pointer lives.** A fixed free spot: a GitHub Gist (its raw URL never changes), or a small file on the same free static host ji already deploys to. Free, and its address is permanent.
- **The mac keeps it current.** A small wrapper around the tunnel client captures the URL the tunnel prints on start and writes it to the pointer (one write, only on a restart). So the pointer always names the live tunnel.
- **ji reads it once.** On start, ji fetches the pointer, learns the current tunnel address, and uses it for the session — caching it, not re-reading per call. (Performance: one small fetch at load, a few bytes; nothing per request.)
- **The result.** A stable entry point at zero cost — only the name behind the pointer churns, and ji never sees the churn. If a fetch of the pointer fails or the mac is off, ji falls back to "not reachable" and drop/view/tag still work.

### Recovering when the address changes (done) and shortening the lag (proposal)

**Re-read on a lost connection — done.** ji used to read the pointer once and cache the address for the whole session, so after the tunnel churned it stayed stuck on the dead address until a reload. Now, the moment a call can't reach the server, ji forgets the cached address and re-reads the pointer on the next try; a background retry runs every few seconds, so the "reconnecting" note clears on its own once a fresh address is found. (The supervisor on the mac already brings up a new tunnel and re-publishes within ~15s.)

**The remaining lag — and how to shorten it.** The gist's raw link is served through GitHub's CDN with a roughly one-minute cache. ji cache-busts its read (a changing query plus a no-store fetch), which *may* not fully beat that CDN — so after a churn, ji can keep seeing the old, dead address for up to ~1 minute before the new one shows. Options, cheapest first:

- **Confirm the cache-buster is enough (free, first).** Measure whether ji's cache-busted read actually gets the fresh gist content quickly. If GitHub honors it, there's nothing to fix. *(Unknown — verify before building anything.)*
- **Point at a host with a short cache (reliable).** Swap the gist for a tiny endpoint we control that serves the address with a short (or no) cache — a small file on the same free static host ji already deploys to, a free Cloudflare KV/Worker, or the work-sites hub dispatcher. Same shape (the mac writes the current address; ji reads it), but the lag drops from ~1 minute to seconds. Cost: one more small piece to keep running.
- **A fixed tunnel name (removes the churn entirely).** With a domain on Cloudflare, the tunnel keeps one address and there's no pointer to lag at all — but a domain has a yearly cost (see the cost note above).

Recommendation: measure the cache-buster first; if the lag is real, move the pointer to a short-cache host we control.

### Setting up the fixed pointer (a GitHub gist)

A gist is a tiny free web page for a scrap of text — a public sticky note with its own permanent link. You paste some text, anyone with the link can read it, and you (or the mac) can change what it says while the link stays the same. That fixed link is what ji reads to find the mac's current address. Do this once, in order:

**A. Sign in to GitHub.** If you don't have an account, make one free at github.com, then sign in.

**B. Make the gist.**

1. Go to **gist.github.com**.
2. In the "Filename including extension…" box, type `ji-address.txt`.
3. In the big text box below it, type anything — for example `placeholder`.
4. Click the green **Create public gist** button (lower right).

**C. Build the link that stays the same.** (You build it from the gist's own address — no button to hunt for.)

1. On your gist's page, copy the web address from the browser's address bar. It looks like `https://gist.github.com/yourname/abc123…`.
2. Change two things in it: replace `gist.github.com` with `gist.githubusercontent.com`, and add `/raw/ji-address.txt` at the end. Result: `https://gist.githubusercontent.com/yourname/abc123…/raw/ji-address.txt`.
3. That link always shows the newest text — it's the fixed link ji will use. Paste it into a browser to check it shows your placeholder.

**D. Make a key that lets the mac update the gist.**

1. Top-right of GitHub, click your picture → **Settings**.
2. In the left list, scroll to the bottom → **Developer settings**.
3. Click **Personal access tokens** → **Tokens (classic)**.
4. Click **Generate new token** → **Generate new token (classic)** (it may ask for your password).
5. Give it a note like `ji proxy address`, set Expiration to **No expiration** (or a long one), and tick the **gist** checkbox.
6. Click **Generate token** at the bottom, then copy the token it shows — you only see it once. (Keep it out of the repo — hand it over privately; it goes only in the gitignored `.env`.)

**E. Hand me two things:** the fixed link from step C, and the token from step D. I'll set the mac to write the live address into the gist on each change, and set ji to read that link on start.

After that, nothing to paste again — ji finds the live address on its own each time it loads.

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
- ask a question and return the answer with its citations,
- read the workspace's saved chat exchanges (the chat history).

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
