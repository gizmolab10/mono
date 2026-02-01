#!/bin/bash
PROJECT_DIR="${1:-.}"
OUTPUT="snapshot.md"
EXCLUDE="-name node_modules -o -name .git -o -name dist -o -name build -o -name .svelte-kit -o -name archives -o -name .vitepress -o -name done"

echo "# Project Snapshot" > "$OUTPUT"
echo "Generated: $(date)" >> "$OUTPUT"
echo -e "\n## Structure\n\`\`\`" >> "$OUTPUT"

find "$PROJECT_DIR" \( $EXCLUDE \) -prune -o -type f -print | head -200 >> "$OUTPUT"

echo -e "\`\`\`\n\n## Files" >> "$OUTPUT"

find "$PROJECT_DIR" \( $EXCLUDE \) -prune -o -type f -print | while read -r file; do
    echo -e "\n### $file\n\`\`\`${file##*.}" >> "$OUTPUT"
    head -500 "$file" >> "$OUTPUT"
    echo '```' >> "$OUTPUT"
done

echo "Done: $(wc -c < "$OUTPUT") bytes"