# Cleanup

**Started:** 2025-01-14
**Status:** Phase 1 in progress

## Problem

The monorepo consolidation left scattered stale references. Old paths point to `~/GitHub/shared`, old structures assume sibling repos, and TOCs are out of sync with actual files.

## Goal

Fresh, accurate docs. Every path correct, every TOC matching its directory.

## Phase 1: Audit Completed ✅

Found these issues:

### Stale Path References

| File | Issue |
|------|-------|
| `guides/collaborate/vitepress-setup.md` | References `~/GitHub/shared` throughout |
| `guides/collaborate/work-site.md` | References `~/GitHub/shared/notes/tools/sites/` |
| `guides/collaborate/access.md` | References `~/GitHub/<project>` structure |
| `guides/setup/onboarding.md` | Describes old 3-repo sibling structure |
| `guides/collaborate/repo.md` | Describes old shared/project sibling architecture |

### Out-of-Sync TOCs

| File | Issue |
|------|-------|
| `guides/collaborate/index.md` | Missing: markdown.md, work-site.md |
| `guides/develop/index.md` | Missing: single-line.md |
| `guides/index.md` | Missing "Setup" in description bullets |
| `notes/work/index.md` | Lists nonexistent files: crazy-idea.md, projects.md, working-minimum.md |

## Phase 2: Fix TOCs

- [ ] Update collaborate/index.md
- [ ] Update develop/index.md
- [ ] Update guides/index.md
- [ ] Update notes/work/index.md

## Phase 3: Update Path References

- [ ] vitepress-setup.md → monorepo paths
- [ ] work-site.md → monorepo paths
- [ ] access.md → monorepo paths

## Phase 4: Restructure Architecture Docs

- [ ] onboarding.md → describe monorepo structure
- [ ] repo.md → describe monorepo structure (or archive if redundant)

## Next Action

**Phase 2:** Fix the TOC files to match actual directory contents.
