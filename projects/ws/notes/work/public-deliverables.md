# Public Deliverables
**Started:** 2026-01-14  
**Status:** Complete ✅

## Problem
Needed a public-facing deliverables page for the Catalist demo. The "visit material" button in BuildNotes needed a working URL.

## Solution
Moved mono-docs to `sites/docs/` and deployed to Netlify.

## Completed
- [x] Add round button to BuildNotes (bottom left)
- [x] Move `.vitepress/` to `sites/docs/`
- [x] Update config.mts srcDir to `../../notes`
- [x] Move netlify.toml to `sites/docs/`
- [x] Update prebuild path in netlify.toml
- [x] Set Netlify base directory to `sites/docs`
- [x] Add package.json with vitepress dependency
- [x] Update .gitignore with `**/.vitepress/cache/` wildcards
- [x] Wire up button click handler

## Still Pending
- [ ] Point `docs.gizmolab.com` to mono-docs Netlify (DNS)
- [ ] Update hub config with new public URLs
- [ ] Retire separate ws-docs and di-docs Netlify sites
