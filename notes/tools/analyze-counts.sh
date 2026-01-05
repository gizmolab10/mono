#!/bin/bash

echo ""
echo "=== WEBSERIOUSLY APP - ANALYZE COUNTS ==="
echo ""

# Total number of find operations
TOTAL_FINDS=36
CURRENT=0

printf "Collecting data: 0 of $TOTAL_FINDS"

# Collect all metrics for each file type
TS_FILES=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
TS_LINES=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
TS_WORDS=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
TS_CHARS=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

SVELTE_FILES=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SVELTE_LINES=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SVELTE_WORDS=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SVELTE_CHARS=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

JS_FILES=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JS_LINES=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JS_WORDS=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JS_CHARS=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

HTML_FILES=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
HTML_LINES=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
HTML_WORDS=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
HTML_CHARS=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

CSS_FILES=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CSS_LINES=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CSS_WORDS=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CSS_CHARS=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

JSON_FILES=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JSON_LINES=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JSON_WORDS=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JSON_CHARS=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

SH_FILES=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SH_LINES=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SH_WORDS=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SH_CHARS=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

MD_FILES=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
MD_LINES=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
MD_WORDS=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
MD_CHARS=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

CONFIG_FILES=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CONFIG_LINES=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec grep -c '\S' {} + 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CONFIG_WORDS=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CONFIG_CHARS=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec cat {} + | tr -d '[:space:]' | wc -c); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

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

# Clear the progress line - \r goes to start of line, \033[K clears to end of line
printf "\r\033[K"

echo "   chars    words    lines    files  types"
echo " -------  -------  -------  -------  --------------"

# Print combined counts
printf "%8d %8d %8d %8d  TypeScript\n" $TS_CHARS $TS_WORDS $TS_LINES $TS_FILES
printf "%8d %8d %8d %8d  Svelte\n" $SVELTE_CHARS $SVELTE_WORDS $SVELTE_LINES $SVELTE_FILES
printf "%8d %8d %8d %8d  JavaScript\n" $JS_CHARS $JS_WORDS $JS_LINES $JS_FILES
printf "%8d %8d %8d %8d  HTML\n" $HTML_CHARS $HTML_WORDS $HTML_LINES $HTML_FILES
printf "%8d %8d %8d %8d  CSS/SCSS\n" $CSS_CHARS $CSS_WORDS $CSS_LINES $CSS_FILES
printf "%8d %8d %8d %8d  JSON\n" $JSON_CHARS $JSON_WORDS $JSON_LINES $JSON_FILES
printf "%8d %8d %8d %8d  Shell\n" $SH_CHARS $SH_WORDS $SH_LINES $SH_FILES
printf "%8d %8d %8d %8d  Markdown\n" $MD_CHARS $MD_WORDS $MD_LINES $MD_FILES
printf "%8d %8d %8d %8d  Config\n" $CONFIG_CHARS $CONFIG_WORDS $CONFIG_LINES $CONFIG_FILES

# Print separator and totals
echo " -------  -------  -------  -------  --------------"
printf "%8d %8d %8d %8d  TOTAL\n" $TOTAL_CHARS $TOTAL_WORDS $TOTAL_LINES $TOTAL_FILES
printf "%8d %8d %8d %8d  CODE FILES ONLY (TS+Svelte+JS)\n" $CODE_CHARS $CODE_WORDS $CODE_LINES $CODE_FILES
echo ""

echo "   chars    words    lines           file (in ./src/lib)"
echo " -------  -------  -------           -------------------"
find . \( -name "*.ts" -o -name "*.svelte" -o -name "*.js" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | while read -r file; do
  chars=$(tr -d '[:space:]' < "$file" | wc -c)
  words=$(wc -w < "$file")
  lines=$(grep -c '\S' "$file" 2>/dev/null || echo 0)
  # Strip whitespace and ensure we have valid numbers
  chars=$(echo "$chars" | tr -d '[:space:]')
  words=$(echo "$words" | tr -d '[:space:]')
  lines=$(echo "$lines" | tr -d '[:space:]')
  # Only print if we have valid numbers
  if [[ "$chars" =~ ^[0-9]+$ ]] && [[ "$words" =~ ^[0-9]+$ ]] && [[ "$lines" =~ ^[0-9]+$ ]]; then
    printf "%8d %8d %8d %8s  %s\n" "$chars" "$words" "$lines" "" "$file"
  fi
done | sed 's|\./src/lib/||' | sort -nr | head -10
echo ""
