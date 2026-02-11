#!/bin/bash

# Analyze Counts
# Counts lines/words/chars for code files in a project
#
# Usage: analyze-counts.sh [project-root]

PROJECT_ROOT="${1:-$(pwd)}"
cd "$PROJECT_ROOT" || exit 1

# Excluded paths — add new folders here
EXCLUDES=(
	-not -path "./dist/*"
	-not -path "./node_modules/*"
	-not -path "./notes/*"
  -not -name "./test/*"
	-not -path "./.git/*"
	-not -path "./.netlify/*"
	-not -path "./.obsidian/*"
	-not -path "./.svelte-kit/*"
	-not -path "./.vitepress/*"
)

# Extra excludes for JSON (lock files)
JSON_EXTRA=(-not -name "package-lock.json" -not -name "yarn.lock")

echo ""
echo "=== ANALYZE COUNTS: $(basename "$PROJECT_ROOT") ==="
echo ""

# Helper: count files/lines/words/chars for a given find pattern
# Usage: collect_metrics NAME_PATTERN [EXTRA_ARGS...]
# Sets: _FILES _LINES _WORDS _CHARS
TOTAL_FINDS=36
CURRENT=0
printf "Collecting data: 0 of $TOTAL_FINDS"

tick() { CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"; }

# Collect all metrics for each file type
TS_FILES=$(find . -name "*.ts" "${EXCLUDES[@]}" | wc -l); tick
TS_LINES=$(find . -name "*.ts" "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
TS_WORDS=$(find . -name "*.ts" "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
TS_CHARS=$(find . -name "*.ts" "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

SVELTE_FILES=$(find . -name "*.svelte" "${EXCLUDES[@]}" | wc -l); tick
SVELTE_LINES=$(find . -name "*.svelte" "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
SVELTE_WORDS=$(find . -name "*.svelte" "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
SVELTE_CHARS=$(find . -name "*.svelte" "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

JS_FILES=$(find . -name "*.js" "${EXCLUDES[@]}" | wc -l); tick
JS_LINES=$(find . -name "*.js" "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
JS_WORDS=$(find . -name "*.js" "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
JS_CHARS=$(find . -name "*.js" "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

HTML_FILES=$(find . -name "*.html" "${EXCLUDES[@]}" | wc -l); tick
HTML_LINES=$(find . -name "*.html" "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
HTML_WORDS=$(find . -name "*.html" "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
HTML_CHARS=$(find . -name "*.html" "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

CSS_FILES=$(find . \( -name "*.css" -o -name "*.scss" \) "${EXCLUDES[@]}" | wc -l); tick
CSS_LINES=$(find . \( -name "*.css" -o -name "*.scss" \) "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
CSS_WORDS=$(find . \( -name "*.css" -o -name "*.scss" \) "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
CSS_CHARS=$(find . \( -name "*.css" -o -name "*.scss" \) "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

JSON_FILES=$(find . -name "*.json" "${EXCLUDES[@]}" | wc -l); tick
JSON_LINES=$(find . -name "*.json" "${EXCLUDES[@]}" "${JSON_EXTRA[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
JSON_WORDS=$(find . -name "*.json" "${EXCLUDES[@]}" "${JSON_EXTRA[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
JSON_CHARS=$(find . -name "*.json" "${EXCLUDES[@]}" "${JSON_EXTRA[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

SH_FILES=$(find . -name "*.sh" "${EXCLUDES[@]}" | wc -l); tick
SH_LINES=$(find . -name "*.sh" "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
SH_WORDS=$(find . -name "*.sh" "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
SH_CHARS=$(find . -name "*.sh" "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

MD_FILES=$(find . -name "*.md" "${EXCLUDES[@]}" | wc -l); tick
MD_LINES=$(find . -name "*.md" "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
MD_WORDS=$(find . -name "*.md" "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
MD_CHARS=$(find . -name "*.md" "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

CONFIG_FILES=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) "${EXCLUDES[@]}" | wc -l); tick
CONFIG_LINES=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) "${EXCLUDES[@]}" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); tick
CONFIG_WORDS=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) "${EXCLUDES[@]}" -exec wc -w {} + | tail -1 | awk '{print $1}'); tick
CONFIG_CHARS=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) "${EXCLUDES[@]}" -exec cat {} + | tr -d '[:space:]' | wc -c); tick

# Calculate totals
TOTAL_FILES=$((TS_FILES + SVELTE_FILES + JS_FILES + HTML_FILES + CSS_FILES + JSON_FILES + SH_FILES + MD_FILES + CONFIG_FILES))
TOTAL_LINES=$((TS_LINES + SVELTE_LINES + JS_LINES + HTML_LINES + CSS_LINES + JSON_LINES + SH_LINES + MD_LINES + CONFIG_LINES))
TOTAL_WORDS=$((TS_WORDS + SVELTE_WORDS + JS_WORDS + HTML_WORDS + CSS_WORDS + JSON_WORDS + SH_WORDS + MD_WORDS + CONFIG_WORDS))
TOTAL_CHARS=$((TS_CHARS + SVELTE_CHARS + JS_CHARS + HTML_CHARS + CSS_CHARS + JSON_CHARS + SH_CHARS + MD_CHARS + CONFIG_CHARS))

# Calculate code-only totals
CODE_FILES=$((TS_FILES + SVELTE_FILES + JS_FILES))
CODE_LINES=$((TS_LINES + SVELTE_LINES + JS_LINES))
CODE_WORDS=$((TS_WORDS + SVELTE_WORDS + JS_WORDS))
CODE_CHARS=$((TS_CHARS + SVELTE_CHARS + JS_CHARS))

# Clear the progress line
printf "\r\033[K"

echo "   chars    words    lines    files  types"
echo " -------  -------  -------  -------  --------------"

printf "%8d %8d %8d %8d  TypeScript\n" $TS_CHARS $TS_WORDS $TS_LINES $TS_FILES
printf "%8d %8d %8d %8d  Svelte\n" $SVELTE_CHARS $SVELTE_WORDS $SVELTE_LINES $SVELTE_FILES
printf "%8d %8d %8d %8d  JavaScript\n" $JS_CHARS $JS_WORDS $JS_LINES $JS_FILES
printf "%8d %8d %8d %8d  HTML\n" $HTML_CHARS $HTML_WORDS $HTML_LINES $HTML_FILES
printf "%8d %8d %8d %8d  CSS/SCSS\n" $CSS_CHARS $CSS_WORDS $CSS_LINES $CSS_FILES
printf "%8d %8d %8d %8d  JSON\n" $JSON_CHARS $JSON_WORDS $JSON_LINES $JSON_FILES
printf "%8d %8d %8d %8d  Shell\n" $SH_CHARS $SH_WORDS $SH_LINES $SH_FILES
printf "%8d %8d %8d %8d  Markdown\n" $MD_CHARS $MD_WORDS $MD_LINES $MD_FILES
printf "%8d %8d %8d %8d  Config\n" $CONFIG_CHARS $CONFIG_WORDS $CONFIG_LINES $CONFIG_FILES

echo " -------  -------  -------  -------  --------------"
printf "%8d %8d %8d %8d  TOTAL\n" $TOTAL_CHARS $TOTAL_WORDS $TOTAL_LINES $TOTAL_FILES
printf "%8d %8d %8d %8d  CODE FILES ONLY (TS+Svelte+JS)\n" $CODE_CHARS $CODE_WORDS $CODE_LINES $CODE_FILES
echo ""

echo "   chars    words    lines           file (in ./src/lib)"
echo " -------  -------  -------           -------------------"
find . \( -name "*.ts" -o -name "*.svelte" -o -name "*.js" \) "${EXCLUDES[@]}" | while read -r file; do
  chars=$(tr -d '[:space:]' < "$file" | wc -c)
  words=$(wc -w < "$file")
  lines=$(grep -c '\S' "$file" 2>/dev/null || echo 0)
  chars=$(echo "$chars" | tr -d '[:space:]')
  words=$(echo "$words" | tr -d '[:space:]')
  lines=$(echo "$lines" | tr -d '[:space:]')
  if [[ "$chars" =~ ^[0-9]+$ ]] && [[ "$words" =~ ^[0-9]+$ ]] && [[ "$lines" =~ ^[0-9]+$ ]]; then
    printf "%8d %8d %8d %8s  %s\n" "$chars" "$words" "$lines" "" "$file"
  fi
done | sed 's|\./src/lib/||' | sort -nr | head -10
echo ""
