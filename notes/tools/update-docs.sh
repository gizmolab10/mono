#!/bin/bash

# Update Docs Workflow
# Builds VitePress documentation and automatically fixes broken links

cd /Users/sand/GitHub/webseriously

echo "=================================================="
echo "UPDATE DOCS WORKFLOW"
echo "=================================================="
echo ""

# Step 1: Compile TypeScript tools
echo "Step 1: Compiling TypeScript tools..."
cd notes/tools
npx tsc

if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo "✅ TypeScript compiled successfully"
cd ../..
echo ""

# Step 2: Sync index.md files
echo "Step 2: Syncing index.md files..."
bash notes/tools/sync-index-files.sh

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
node notes/tools/dist/fix-links.js

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

# Step 5: Generate docs database structure
echo "Step 5: Generating docs database structure..."
bash notes/tools/create-docs-db-data.sh

if [ $? -ne 0 ]; then
  echo "❌ Docs database generation failed"
  exit 1
fi
echo ""

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
node notes/tools/dist/sync-sidebar.js

if [ $? -ne 0 ]; then
  echo "❌ Sidebar sync failed"
  exit 1
fi

echo ""
echo "=================================================="
echo "UPDATE DOCS COMPLETE"
echo "=================================================="
