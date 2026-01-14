# VitePress for Shared

**Started:** 2025-01-09
**Status:** Phase 2 pending

## Problem

Shared repo has guides in markdown but no way to browse them as a website.

## Goal

Deploy shared's md files via VitePress, same as ws.

## Phase 1: Setup VitePress ✅

- [x] Create package.json with vitepress deps
- [x] Create .vitepress/config.mts
- [x] Create .vitepress/theme/ (custom theme files)
- [x] Add netlify.toml
- [x] Add index.md files for sections
- [ ] Add .gitignore entries
- [x] Test locally with `yarn docs:dev`

## Phase 1.5: Dev Servers ✅

- [x] Create dev-servers.sh (start/restart all sites)
- [x] Create dev-hub.html (keyboard nav to localhost ports)
- [x] Add logging to ~/GitHub/shared/logs/
- [x] Add `restart` alias to ~/.zshrc

## Phase 2: Deploy

- [ ] Create Netlify site
- [ ] Configure deploy settings
- [ ] Verify live site

## Next Action

**Phase 2:** Create Netlify site for shared docs
