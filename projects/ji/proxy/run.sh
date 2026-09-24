#!/usr/bin/env bash
# Supervisor for the thin proxy + free tunnel. launchd runs this at login and keeps it
# up (see com.ji.proxy.plist). It starts the proxy, starts the tunnel in front of it,
# captures the tunnel's public address the moment it appears, writes it to a local
# pointer (current-url.txt), and runs the optional publish hook so a fixed remote pointer
# can be kept current. It then watches the whole chain — if either the proxy or the tunnel
# stops, or the public address stops answering (a free tunnel can silently expire), this
# script exits and launchd restarts it, so a fresh address gets captured and re-published.

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
	# No address means the free tunnel wouldn't start — often Cloudflare rate-limiting quick
	# tunnels after too many were made too fast (a 429 in tunnel.log). Restarting straight away
	# just asks for another and keeps the limit alive, so back off well before exiting. This
	# turns a hammering ~30s retry into a gentle few-minutes one, letting the limit clear.
	echo "[run] no tunnel address after 30s — likely rate-limited (see tunnel.log); backing off 3 minutes before restart"
	sleep 180
	exit 1
fi

# Stay up only while the whole chain is actually working. Every 5s: the proxy and the tunnel
# must both still be running, and the public address must answer. The address check tolerates
# blips — a free tunnel can be briefly slow — so it takes three misses in a row (~15s) to
# count as dead; only then do we exit so launchd restarts us with a fresh, re-published
# address. (A single slow probe used to cause needless restarts that churned the address.)
misses=0
while true; do
	sleep 5
	if ! kill -0 "$PROXY_PID" 2>/dev/null; then echo "[run] proxy exited — restarting"; exit 1; fi
	if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then echo "[run] tunnel exited — restarting"; exit 1; fi
	if [ -z "$url" ]; then continue; fi
	if curl -fsS -m 8 -o /dev/null "$url/health"; then
		misses=0
	else
		misses=$((misses + 1))
		echo "[run] tunnel address didn't answer (${misses}/3)"
		if [ "$misses" -ge 3 ]; then echo "[run] tunnel address dead — restarting with a fresh one"; exit 1; fi
	fi
done
