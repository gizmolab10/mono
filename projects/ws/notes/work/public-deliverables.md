# Public Deliverables
**Started:** 2026-01-14  
**Status:** Phase 1 in progress


## Under Construction

### Little round button to visit this material

- [x] add a round button component to bottom left corner of build notes component
- [ ] devise a url for presenting this content
  - [x] move deliverables to ws/notes/guides
  - [x] deploy
    - [x] a. Update .vitepress/config.ts with multi-project sidebar
    - [x] b. Create Netlify site for mono-docs
    - [x] c. Symlinks so ws/di point to project notes
    - [x] d. Prebuild script creates symlinks on Netlify
    - [ ] e. Point `docs.gizmolab.com` to mono-docs Netlify (DNS propagating)
    - [ ] f. Update hub config with new public URLs
    - [ ] g. Retire separate ws-docs and di-docs Netlify sites
- [x] wire up the handle click logic


**Steps to move mono-docs to `sites/docs/`**

1. Create directory structure:

```
mkdir -p sites/docs
```

2. Move `.vitepress/` to `sites/docs/`:

```
mv .vitepress sites/docs/
```

3. Update `sites/docs/.vitepress/config.mts`:
    - Change `srcDir: './notes'` → `srcDir: '../../notes'`
4. Move root `netlify.toml` to `sites/docs/`:

```
mv netlify.toml sites/docs/
```

5. Update `sites/docs/netlify.toml`:
    - Change prebuild path: `bash tools/docs/prebuild.sh` → `bash ../../tools/docs/prebuild.sh`
    - Change publish: `.vitepress/dist` stays same (relative to sites/docs)
6. Update `tools/docs/prebuild.sh`:
    - Change target paths: `notes/ws` → `../../notes/ws` (or adjust cd)
7. Update Netlify mono-docs site:
    - Set Base directory to `sites/docs`
8. Test locally:

```
cd sites/docs && yarn docs:build
```

9. Push and verify both Netlify sites build

Want me to execute steps 2-6?

1, 2, 3, 4, 5 done. verify correctness then impl 6
