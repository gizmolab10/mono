#!/bin/bash
# Creates symlinks for VitePress to find project docs
# Run locally after clone, or automatically by Netlify

cd "$(dirname "$0")/../.."

# Create symlinks (remove first if they exist)
rm -f notes/ws notes/di
ln -s ../projects/ws/notes notes/ws
ln -s ../projects/di/notes notes/di

echo "✅ Created symlinks: notes/ws -> projects/ws/notes, notes/di -> projects/di/notes"
