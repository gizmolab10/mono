#!/usr/bin/env bash
# Write the current tunnel address into the gist, so ji's fixed pointer link always
# shows the live address. The supervisor runs this with $URL set to the new address;
# GIST_ID, GITHUB_TOKEN (and optionally GIST_FILE) come from the environment (.env).

set -euo pipefail
: "${URL:?URL not set}"
: "${GIST_ID:?set GIST_ID in .env}"
: "${GITHUB_TOKEN:?set GITHUB_TOKEN in .env}"
FILE="${GIST_FILE:-ji-address.txt}"

payload=$(printf '{"files":{"%s":{"content":"%s"}}}' "$FILE" "$URL")
code=$(curl -s -o /dev/null -w '%{http_code}' \
	-X PATCH "https://api.github.com/gists/${GIST_ID}" \
	-H "Authorization: token ${GITHUB_TOKEN}" \
	-H "Accept: application/vnd.github+json" \
	-d "$payload")
echo "[publish] wrote address to gist ${GIST_ID} -> HTTP ${code}"
