#!/bin/bash
# Copies project docs into notes/ for VitePress build
# Netlify runs this; locally use symlinks instead

cd "$(dirname "$0")/../.."

# Remove old symlinks/copies
rm -rf notes/ws notes/di

# Copy (not symlink) so VitePress sees correct paths
cp -r projects/ws/notes notes/ws
cp -r projects/di/notes notes/di

echo "✅ Copied project docs to notes/ws and notes/di"
