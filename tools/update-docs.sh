#!/bin/bash

# Usage help
if [ "$1" = "?" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  echo "Usage: update-docs.sh [option]"
  echo ""
  echo "Updates VitePress documentation for all projects."
  echo "Builds docs, fixes broken links, syncs sidebars."
  echo ""
  echo "Options:"
  echo "  (none)    Update all projects (mono, ws, di)"
  echo "  ws        Update ws project only"
  echo "  di        Update di project only"
  echo "  ?         Show this help message"
  exit 0
fi

if [ "$1" = "ws" ]; then
  bash ~/GitHub/mono/tools/docs/update-project-docs.sh ~/GitHub/mono/projects/ws
  exit $?
fi

if [ "$1" = "di" ]; then
  bash ~/GitHub/mono/tools/docs/update-project-docs.sh ~/GitHub/mono/projects/di
  exit $?
fi

bash ~/GitHub/mono/tools/docs/update-project-docs.sh all
