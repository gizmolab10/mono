#!/bin/bash
# Creates symlinks for VitePress to find project docs
# Run locally after clone, or automatically by Netlify

cd "$(dirname "$0")/../.."

# Remove old copies/symlinks
rm -rf notes/ws notes/di

# Create symlinks using absolute paths (prevents path resolution issues)
ln -s "$(pwd)/projects/ws/notes" notes/ws
ln -s "$(pwd)/projects/di/notes" notes/di

echo "✅ Created symlinks: notes/ws, notes/di"
