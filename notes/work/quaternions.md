# Quaternions

## Problem

i want to render 3D data as 2D perspective. Rotatable objects, rotatable sub-objects. Euler angles cause gimbal lock—two axes align and you lose a degree of freedom. Not acceptable.

## Goal

1. Learn quaternions and the 3D→2D projection pipeline
2. Build a proof-of-concept with gl-matrix + Canvas 2D
3. Rotate objects smoothly, no gimbal lock
4. Render wireframe with proper perspective
5. Apply color and clipping

## Approach

**Stack:**
- `gl-matrix` for quaternions, matrices, projection math
- Canvas 2D API for line drawing
- Vanilla TS (maybe Svelte later)

**Pipeline:**
1. Define 3D vertices + edges
2. Model matrix: quaternion → rotation matrix → transform vertices
3. View matrix: camera position (`mat4.lookAt`)
4. Projection matrix: perspective (`mat4.perspective`)
5. Perspective divide: clip space → NDC → screen coordinates
6. Draw edges as 2D lines

## Milestones

- [x] Static cube with perspective projection
- [x] Mouse-drag rotation via quaternions
- [x] Nested transforms (object within object)
- [x] Create a VSCode project, in ~/GitHub/di
- [x] Line styling (depth-based opacity)
- [ ] create github repo

## Resume Points

- **2025-01-04**: Created `experiments/quaternion-poc/index.html` in webseriously. Working cube with quaternion rotation + perspective. Drag to rotate. Uses gl-matrix + Canvas 2D.
- **2025-01-05**: Created Vite+TS project in `~/GitHub/di`. Run `yarn && yarn dev` to start.
- **2025-01-05**: Refactored—moved app logic to `src/lib/ts/guts.ts`, `main.ts` is now just boilerplate.
- **2025-01-05**: Implemented manager pattern. Scene, Camera, Render, Input, Animation in `src/lib/ts/managers/`. Classes are simple names, exports are lowercase singletons. Split architecture docs into `project.md`, `managers.md`, `types.md`, `files.md`.
- **2025-01-05**: Rewrote all md files using voice.md guidelines—less machine-like, more human.
- **2025-01-05**: Moved `types.ts` to `types/index.ts`.
- **2025-01-05**: Moved types to `types/Interfaces.ts`; `index.ts` re-exports.
- **2025-01-05**: Added `Angle.ts` (quadrants, orientations) and `Coordinates.ts` (Point, Size, Rect, Polar) to types.
- **2025-01-05**: Added migration plan to `types.md` for converting x/y to Point and width/height to Size.
- **2025-01-05**: Phase 1 done—Render now uses `Size` instead of separate width/height.
- **2025-01-05**: Phase 2 done—Input now uses `Point` for last_position and delta. Updated test.ts caller.
- **2025-01-05**: Applied style.md naming—snake_case for variables/methods, `T_` prefix for types. Updated all managers and test.ts.
- **2025-01-05**: Phase 3 done—Camera.init() now takes `Size`. Phase 5 callers updated. Migration complete (skipping Phase 4 per plan).
- **2025-01-05**: Renamed `SceneObject` to `O_Scene`. Added `O_` prefix to style.md for data object interfaces.

## Repository

Need to push `~/GitHub/di` to GitHub.

### Steps

- [x] 1. Create `.gitignore` (node_modules, dist, .DS_Store)
- [x] 2. `git init`
- [ ] 3. Initial commit
- [ ] 4. Create repo on GitHub: `design.intuition`
- [ ] 5. Add remote, push
- [ ] 6. Verify repo is public/private as intended
