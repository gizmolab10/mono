#!/bin/bash

cd /Users/sand/GitHub/webseriously

echo "=== Fix Links Tool Test ==="
echo ""
echo "Test Setup:"
echo "  - index.md has links to guides/test-moved.md and guides/test-deleted.md"
echo "  - test-moved.md exists at advanced/test-moved.md"
echo "  - test-deleted.md doesn't exist anywhere"
echo "  - vitepress.build.txt reports both as broken links"
echo ""
echo "Expected Results:"
echo "  - Links to test-moved.md should update to advanced/test-moved.md"
echo "  - Links to test-deleted.md should be deleted"
echo "  - Links in code blocks should NOT be modified"
echo "  - Anchors should be preserved"
echo ""
echo "Before running tool - index.md content:"
echo "---"
cat notes/work/test-fixtures/index.md
echo "---"
echo ""
echo "Running fix-links tool..."
echo ""

# Run the tool with the test fixtures
npx ts-node --esm notes/tools/fix-links.ts --test -v

echo ""
echo "After running tool - index.md content:"
echo "---"
cat notes/work/test-fixtures/index.md
echo "---"
echo ""
echo "Config file changes:"
echo "---"
cat notes/work/test-fixtures/config.mts
echo "---"
