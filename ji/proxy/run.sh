#!/usr/bin/env bash
# Supervisor for the thin proxy + free tunnel. launchd runs this at login and keeps it
# up (see com.ji.proxy.plist). It starts the proxy, starts the tunnel in front of it,
# captures the tunnel's public address the moment it appears, writes it to a local
# pointer (current-url.txt), and runs the optional publish hook so a fixed remote pointer
# can be kept current. If the tunnel exits, this script exits and launchd restarts it —
# a fresh address, re-published.

set -euo pipefail
cd "$(dirname "$0")"

# launchd hands us a bare PATH; add where node and cloudflared live.
export PATH="/Users/sand/.nvms/versions/node/v20.19.5/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

# Secrets and settings come from .env (gitignored), never the repo.
if [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${ANYTHINGLLM_KEY:?set ANYTHINGLLM_KEY in ji/proxy/.env}"
: "${PROXY_TOKEN:?set PROXY_TOKEN in ji/proxy/.env}"
PORT="${PORT:-3017}"
CLOUDFLARED="${CLOUDFLARED:-/usr/local/opt/cloudflared/bin/cloudflared}"

echo "[run] starting proxy on port ${PORT}"
yarn start &
PROXY_PID=$!

echo "[run] starting tunnel"
"$CLOUDFLARED" tunnel --url "http://localhost:${PORT}" > tunnel.log 2>&1 &
TUNNEL_PID=$!

# Stop everything when this script is told to stop — including the node the yarn
# wrapper spawns (which can outlive yarn) and the tunnel, by name, so nothing lingers.
trap 'kill "$PROXY_PID" "$TUNNEL_PID" 2>/dev/null || true; pkill -f "ji/proxy/proxy.mjs" 2>/dev/null || true; pkill -f "cloudflared tunnel --url http://localhost:${PORT}" 2>/dev/null || true' EXIT

# Wait for the tunnel to print its public address, then record and publish it.
url=""
for _ in $(seq 1 30); do
	url="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' tunnel.log | head -1 || true)"
	[ -n "$url" ] && break
	sleep 1
done
if [ -n "$url" ]; then
	printf '%s' "$url" > current-url.txt
	echo "[run] tunnel address: $url"
	if [ -n "${PUBLISH_URL_CMD:-}" ]; then
		URL="$url" sh -c "$PUBLISH_URL_CMD" || echo "[run] publish hook failed"
	fi
else
	echo "[run] no tunnel address after 30s — check tunnel.log"
fi

# Stay alive as long as the tunnel does; when it drops, exit so launchd restarts us.
wait "$TUNNEL_PID"
