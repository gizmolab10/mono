# Cleanup

**Started:** 2026-01-14
**Status:** Complete ✅

## Problem

The monorepo consolidation left scattered stale references. Old paths point to `~/GitHub/shared`, old structures assume sibling repos, and TOCs were out of sync with actual files.

## Goal

Fresh, accurate docs. Every path correct, every TOC matching its directory.

## Phase 1: Audit ✅

Found stale paths and out-of-sync TOCs.

## Phase 2: Fix TOCs ✅

All index.md files updated during January 28, 2026 session:
- [x] collaborate/index.md — now matches contents
- [x] develop/index.md — now matches contents
- [x] guides/index.md — now matches contents
- [x] notes/work/index.md — now matches contents

## Phase 3: Update Path References ✅

Verified — no stale `~/GitHub/shared` refs remain:
- [x] setup/vitepress.md — clean
- [x] setup/access.md — uses placeholders, clean
- [x] setup/onboarding.md — describes monorepo correctly

## Result

All paths correct, all TOCs in sync.
