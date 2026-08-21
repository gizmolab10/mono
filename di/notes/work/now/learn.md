---
kind: explain
title: "Learn (di)"
description: "Mistakes made in di's own workings, never to be repeated"
tags: [journal]
date: 2026-08-17
---
# Learn — di

Mistakes in di's own workings: its geometry, its pipeline, the things no other project has. What
went wrong across every project is in [mono's learn](../../../../notes/work/learn.md).

## Raw log

- 2026-02-13 back render mode: got lost in sign conventions. Repeatedly got the "in front of" / "behind" logic wrong for back-facing faces (normals point away from camera, so signed distance signs are inverted vs front faces). Added then removed flip_depth. Core lesson: before writing code, write down the sign convention on paper — what does d>0 mean, what does d<0 mean, for this specific face orientation. Don't guess.
- 2026-03-28 misplaced clear destroyed data for a week: placed `computed_endpoints.clear()` inside `compute_visible_edge_segments` when that function was first written. When intersection compute was later added before it, the clear wiped intersection data (specifically oc endpoints). A save/restore workaround was added but only recovered fi/corner types, silently dropping oc. This caused both phantom endpoints and missing pierce points — a week of investigation chasing symptoms of one misplaced line. The fix: move the clear to the pipeline start. Lesson: data created by one phase and consumed by another must never be cleared by a middle phase. This shook confidence in the app's design.
