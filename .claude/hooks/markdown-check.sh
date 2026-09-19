#!/bin/bash
# PostToolUse hook: reads every edit of a .md file as it is written, and says when its markdown
# is malformed. The words are plain-english-check.sh's job; this is the form.
#
# What is checked, .md files only:
#   1. A placeholder such as <X>, written bare outside backticks and code fences, is read by
#      markdown as a tag and dropped from the page. It has to sit inside backticks.
#
# Warn-only: the edit is already written; this says so as next-turn context.
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')
NEW=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // ""')

[[ "$FILE" == *.md ]] || exit 0
[ -z "$NEW" ] && exit 0

# --- bare placeholders -------------------------------------------------------
#
# Fenced code and inline code are taken out first; what is left is searched for <word>,
# an html or svg tag's name passed over.

BARE=$(echo "$NEW" | awk '/^[[:space:]]*(```|~~~)/ { fenced = !fenced; next } !fenced { print }' \
  | sed -E 's/`[^`]*`//g' \
  | grep -oE '<[A-Za-z][A-Za-z0-9 _.-]*>' \
  | grep -viE '^<(br|svg|div|span|text|rect|line|path|g|html|body|head|script|style|title|meta|a|p|pre|code|table|tr|td|th|ul|li|ol|img|button|input|label|section|nav|main|header|footer|article|aside|details|summary|strong|em|b|i|u|small|sup|sub|hr|marker|defs|polyline|tspan|kbd|h[1-6]|thead|tbody|blockquote|dl|dt|dd|iframe|video|audio|source|canvas|form|select|option|textarea|template|slot|link|base)( |>)' \
  | sort -u | tr '\n' ' ' || true)
BARE=${BARE% }

# --- the report --------------------------------------------------------------

[ -z "$BARE" ] && exit 0
MESSAGE="BARE PLACEHOLDER: ${BARE} — markdown reads it as a tag and the page drops it. Put it inside backticks."
jq -cn --arg m "$MESSAGE" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}'
