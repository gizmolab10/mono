#!/bin/bash

cd /Users/sand/GitHub/webseriously/notes/tools

echo "Compiling TypeScript..."
npx tsc

if [ $? -ne 0 ]; then
  echo "TypeScript compilation failed"
  exit 1
fi

echo ""
echo "Running tests..."
cd ../..
node notes/tools/dist/fix-links.js --test -v

echo ""
echo "Test complete. Check the results above."
