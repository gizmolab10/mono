#!/bin/sh

# === CONFIGURATION ===
SITE_ID="0770f16d-e009-48e8-a548-38a5bb2c18f5"
DAYS_OLD=15
DRY_RUN=false
KEEP_ACTIVE=true
SHOW_DISQUALIFIED=false
DISQUALIFY_COMMIT_PATTERN='^[0-9][0-9][0-9]'

# === GET NETLIFY ACCESS TOKEN ===
ACCESS_TOKEN="nfp_99qWTwWdjMAMviVd6MqVfFwR7su359Gbb070"
if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get Netlify access token. Run 'netlify login' first."
  exit 1
fi

# === DATE CUTOFF ===
CUTOFF_ISO=$(date -u -d "$DAYS_OLD days ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v-"$DAYS_OLD"d +"%Y-%m-%dT%H:%M:%SZ")
CUTOFF_EPOCH=$(date -u -d "$CUTOFF_ISO" +"%s" 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CUTOFF_ISO" +"%s")

echo "Dry run: $DRY_RUN"
echo "Cutoff date: $CUTOFF_ISO (epoch $CUTOFF_EPOCH)"
echo "Show disqualified: $SHOW_DISQUALIFIED"
echo "------------------------------------------------------"

PAGE=1
PER_PAGE=30
REVIEWED_COUNT=0

OLDEST_EPOCH=9999999999
OLDEST_DEPLOY_ID=""
OLDEST_DATE=""
OLDEST_TITLE=""

while :; do
  echo "➡️  Fetching page $PAGE..."

  RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys?page=$PAGE&per_page=$PER_PAGE")

  DEPLOY_COUNT=$(echo "$RESPONSE" | jq length)

  if [ "$DEPLOY_COUNT" -eq 0 ]; then
    echo "✅ No more deploys found."
    break
  fi

  echo "📄 Found $DEPLOY_COUNT deploy(s) on page $PAGE"

  for deploy_b64 in $(echo "$RESPONSE" | jq -c -r '.[] | @base64'); do
    deploy=$(echo "$deploy_b64" | base64 --decode)

    DEPLOY_ID=$(echo "$deploy" | jq -r '.id')
    CREATED_AT_RAW=$(echo "$deploy" | jq -r '.created_at')
    TITLE=$(echo "$deploy" | jq -r '.title')
    STATE=$(echo "$deploy" | jq -r '.state')

    CREATED_AT=$(echo "$CREATED_AT_RAW" | sed -E 's/\.[0-9]+Z$/Z/')
    CREATED_EPOCH=$(date -u -d "$CREATED_AT" +"%s" 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CREATED_AT" +"%s" 2>/dev/null || echo 0)

    if [ "$CREATED_EPOCH" -eq 0 ]; then
      [ "$SHOW_DISQUALIFIED" = true ] && echo "⚠️  Skipping deploy with unparseable date: $DEPLOY_ID"
      continue
    fi

    AGE_DAYS=$(( ( $(date +%s) - CREATED_EPOCH ) / 86400 ))
    REVIEWED_COUNT=$((REVIEWED_COUNT + 1))

    # Track oldest
    if [ "$CREATED_EPOCH" -lt "$OLDEST_EPOCH" ]; then
      OLDEST_EPOCH=$CREATED_EPOCH
      OLDEST_DEPLOY_ID=$DEPLOY_ID
      OLDEST_DATE=$CREATED_AT_RAW
      OLDEST_TITLE=$TITLE
    fi

    IS_OLD=false
    [ "$CREATED_EPOCH" -lt "$CUTOFF_EPOCH" ] && IS_OLD=true

    IS_ACTIVE=false
    [ "$STATE" = "current" ] && [ "$KEEP_ACTIVE" = true ] && IS_ACTIVE=true

    MATCHES_COMMIT_REGEX=false
    echo "$TITLE" | grep -qE "$DISQUALIFY_COMMIT_PATTERN" && MATCHES_COMMIT_REGEX=true

    if [ "$IS_OLD" = true ] && [ "$IS_ACTIVE" = false ] && [ "$MATCHES_COMMIT_REGEX" = false ]; then
      echo "📦  $DEPLOY_ID | $CREATED_AT_RAW | $STATE | \"$TITLE\" (Age: $AGE_DAYS days)"

      if [ "$DRY_RUN" = true ]; then
        echo "🔒 Would delete $DEPLOY_ID"
      else
        echo "🔥 Deleting $DEPLOY_ID..."
        curl -s -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" \
          "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys/$DEPLOY_ID"
      fi
      echo "-----------------------------"
    elif [ "$SHOW_DISQUALIFIED" = true ]; then
      echo "⛔ Skipped: $DEPLOY_ID | $CREATED_AT_RAW | $STATE | \"$TITLE\" (Age: $AGE_DAYS days)"
      [ "$IS_ACTIVE" = true ] && echo "    Reason: currently active"
      [ "$IS_OLD" = false ] && echo "    Reason: too recent"
      [ "$MATCHES_COMMIT_REGEX" = true ] && echo "    Reason: commit msg starts with 3 digits"
      echo "-----------------------------"
    fi
  done

  PAGE=$((PAGE + 1))
done

echo "✅ Finished. Total deploys reviewed: $REVIEWED_COUNT"

if [ "$REVIEWED_COUNT" -eq 0 ]; then
  echo "ℹ️  No deploys were examined."
elif [ "$OLDEST_DEPLOY_ID" != "" ]; then
  OLDEST_DATE_CLEAN=$(echo "$OLDEST_DATE" | sed -E 's/\.[0-9]+Z$/Z/')
  OLDEST_HUMAN_DATE=$(date -d "$OLDEST_DATE_CLEAN" "+%B %e, %Y at %l:%M %p" 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$OLDEST_DATE_CLEAN" "+%B %e, %Y at %l:%M %p")
  echo "📅 Oldest deploy examined: $OLDEST_HUMAN_DATE | \"$OLDEST_TITLE\" | $OLDEST_DEPLOY_ID"
fi
