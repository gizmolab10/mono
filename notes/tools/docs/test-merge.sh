#!/bin/bash

cd /Users/sand/GitHub/webseriously

# Compile TypeScript
cd notes/tools
rm -rf dist
npx tsc > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

cd ../..

# Reset test fixtures
cat > notes/tools/docs/test/merge-fixtures/file-a.md << 'EOF'
# File A - To Be Merged

## Introduction

This is content from File A that will be merged into File B.

## Unique Section A

This section only exists in File A and should be merged into B.

## Shared Section

This content appears in both A and B - should be deduplicated.

## Another Unique Section

More unique content from File A.
EOF

cat > notes/tools/docs/test/merge-fixtures/file-b.md << 'EOF'
# File B - Target File

## Table of Contents
- [Overview](#overview)
- [Shared Section](#shared-section)
- [Conclusion](#conclusion)

## Overview

This is File B, the target file for the merge.

## Shared Section

This content appears in both A and B - should be deduplicated.

## Conclusion

Final thoughts in File B.
EOF

cat > notes/tools/docs/test/merge-fixtures/test-links.md << 'EOF'
# Test Document with Link to A

This document has a link to file-a: [[file-a]]

And a markdown link: [File A](merge-fixtures/file-a.md)

After merge, these should point to file-b.
EOF

# Run the merge
node notes/tools/dist/merge-files.js \
  notes/tools/docs/test/merge-fixtures/file-a.md \
  notes/tools/docs/test/merge-fixtures/file-b.md
