#!/bin/bash

# Usage help
if [ "$1" = "?" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  echo "Usage: update-docs.sh [option]"
  echo ""
  echo "Updates VitePress documentation for all projects."
  echo "Builds docs, fixes broken links, syncs sidebars."
  echo ""
  echo "Options:"
  echo "  (none)    Update all projects (mono, ws, di, ma)"
  echo "  ws        Update ws project only"
  echo "  di        Update di project only"
  echo "  ma        Update ma project only"
  echo "  ?         Show this help message"
  exit 0
fi

if [ "$1" = "ws" ]; then
  bash ~/GitHub/mono/notes/tools/docs/update-project-docs.sh ~/GitHub/mono/ws
  exit $?
fi

if [ "$1" = "di" ]; then
  bash ~/GitHub/mono/notes/tools/docs/update-project-docs.sh ~/GitHub/mono/di
  exit $?
fi

if [ "$1" = "ma" ]; then
  bash ~/GitHub/mono/notes/tools/docs/update-project-docs.sh ~/GitHub/mono/ma
  exit $?
fi

bash ~/GitHub/mono/notes/tools/docs/update-project-docs.sh all
