#!/bin/bash

# Update Docs Workflow
# Builds VitePress documentation and automatically fixes broken links
#
# Usage: update-docs.sh [project-root]

PROJECT_ROOT="${1:-$(pwd)}"
cd "$PROJECT_ROOT" || exit 1

# Source project-specific config if it exists
CONFIG_FILE="notes/tools/config.sh"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

# Find shared tools directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_TOOLS="${SHARED_TOOLS:-$SCRIPT_DIR}"

# Defaults (can be overridden by config.sh)
NOTES_DIR="${NOTES_DIR:-notes}"
TOOLS_DIST="${TOOLS_DIST:-$NOTES_DIR/tools/dist}"

echo "=================================================="
echo "UPDATE DOCS WORKFLOW"
echo "Project: $PROJECT_ROOT"
echo "=================================================="
echo ""

# Step 1: Compile TypeScript tools
echo "Step 1: Compiling TypeScript tools..."
cd "$SHARED_TOOLS"
npx tsc --outDir "$PROJECT_ROOT/$TOOLS_DIST"

if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo "✅ TypeScript compiled successfully"
cd "$PROJECT_ROOT"
echo ""

# Step 2: Sync index.md files
echo "Step 2: Syncing index.md files..."
bash "$SHARED_TOOLS/sync-index-files.sh" "$PROJECT_ROOT"

if [ $? -ne 0 ]; then
  echo "❌ Index sync failed"
  exit 1
fi
echo ""

# Step 3: Try building VitePress (may fail with broken links)
echo "Step 3: Building VitePress documentation..."
yarn docs:build > vitepress.build.txt 2>&1

BUILD_EXIT=$?
if [ $BUILD_EXIT -eq 0 ]; then
  echo "✅ VitePress build successful (no broken links)"
else
  echo "⚠️  VitePress build found issues, attempting to fix..."
fi

echo ""

# Step 4: Run fix-links tool
echo "Step 4: Running fix-links tool..."
node "$TOOLS_DIST/fix-links.js"

FIX_LINKS_EXIT=$?

if [ $FIX_LINKS_EXIT -eq 0 ]; then
  echo ""
  echo "✅ All links fixed successfully"
elif [ $FIX_LINKS_EXIT -eq 2 ]; then
  echo ""
  echo "⚠️  Some links could not be fixed (unfixable)"
  echo "Please review the output above"
else
  echo ""
  echo "❌ Link fixing failed"
  exit 1
fi

echo ""

# Step 5: Generate docs database structure (if configured)
if [ -n "$DOCS_OUTPUT" ]; then
  echo "Step 5: Generating docs database structure..."
  bash "$SHARED_TOOLS/create-docs-db-data.sh" "$PROJECT_ROOT"

  if [ $? -ne 0 ]; then
    echo "❌ Docs database generation failed"
    exit 1
  fi
  echo ""
else
  echo "Step 5: Skipping docs database generation (DOCS_OUTPUT not set)"
  echo ""
fi

# Step 6: Rebuild VitePress (should succeed now)
echo "Step 6: Rebuilding VitePress documentation..."
yarn docs:build > vitepress.build.txt 2>&1

if [ $? -ne 0 ]; then
  echo "❌ VitePress rebuild failed"
  cat vitepress.build.txt
  exit 1
fi

echo "✅ VitePress build successful"
echo ""

# Step 7: Run sync-sidebar tool
echo "Step 7: Syncing sidebar..."
node "$TOOLS_DIST/sync-sidebar.js"

if [ $? -ne 0 ]; then
  echo "❌ Sidebar sync failed"
  exit 1
fi

echo ""
echo "=================================================="
echo "UPDATE DOCS COMPLETE"
echo "=================================================="
