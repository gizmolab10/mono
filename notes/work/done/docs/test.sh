#!/bin/bash

# Compile TypeScript
cd /Users/sand/GitHub/webseriously/notes/tools
npx tsc

# Run the test
cd /Users/sand/GitHub/webseriously  
node notes/tools/dist/fix-links.js --test -v
