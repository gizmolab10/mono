# What are all these files?

## Topology pipeline (8 files, one domain)

**Historical:**
- render.md — early Render.ts pipeline diagram (predates Topology.ts)
- pipeline.md — pac about starting over with fresh architecture
- facets.md — original problem statement for facet painting
- facets-session-summary.md — 2026-03-28 session log, how facets got built

**Current code:**
- topology.md — documents the current 5-phase Topology.ts code, solved bugs, open issues

**Rewrite plan:**
- simpler topology.md — the handoff file: session plan, test suite status, decisions
- simpler design.md — detailed spec for the new 3-pass architecture
- 3D sweep algorithm.md — the sweep-line algorithm research and brute-force decision
---
  

**Collaboration guides** (how co should behave — read every session):

- `notes/guides/collaborate/` — chat.md, voice.md, workflow.md, expectations.md, framing filters.md, creating a design.md
- `notes/guides/pre-flight/` — always.md, keywords.md, shorthand.md, gates.md, pitfalls.md, kinds.of.tasks.md

**Meta-collaboration** (thinking about how to work with co):

- `notes/work/co.md` — product idea for a "wisdom layer"
- `notes/work/faster.md` — reducing session-start token cost
- `notes/work/worktrees.md` — worktree branch cleanup
- `notes/work/Agent Skills.md` — generic skill format spec

**Topology pipeline** (8 files, one domain):

- **Historical:** render.md, pipeline.md, facets.md, facets-session-summary.md
- **Current code:** topology.md
- **Rewrite plan:** simpler topology.md, simpler design.md, 3D sweep algorithm.md

**Other project work:**

- journal.md, revisit.mo.md, code.debt.md, propagating value changes.md, data schema for wendy.md, collaboration priorities.md, working features.md

---

The "nearly a dozen variations" you're sensing is the topology cluster — 8 files that all describe pieces of the same rendering pipeline, accumulated across sessions. The collaboration guides are separate and intentional (they serve different purposes at different times).

---


- how to organize all this into a guidance system for me to use
    - coherent
    - easy to use
    - easy to navigate

## Proposal: use the milestone system you already have

You already have `milestones/` with numbered milestones (26 done, 4 active, 3 future) and a `done/` subfolder. The loose work files should plug into this — not a parallel system.

### What exists

```
di/notes/work/
    milestones/
        done/        ← 1–25 completed milestones
        26.snap.pin.md
        27.selection.algorithm.md
        28.colors.md
        29.cut.lists.md
        30.user.manual.md
        31.licensing.md
        32.marketing.md
        index.md     ← milestone table
    (loose files)    ← topology stuff, debt, etc.
```

### What to do

**1. The topology rewrite becomes a milestone.**

Create `milestones/33.topology.md` — a one-page milestone file with tasks and checkboxes, linking to the detail files. The detail files stay where they are but get a home.

```
# Milestone 33 — Topology Rewrite

Handoff: [simpler topology.md](../simpler%20topology.md)
Design: [simpler design.md](../simpler%20design.md)
Algorithm: [3D sweep algorithm.md](../3D%20sweep%20algorithm.md)
Current code: [topology.md](../topology.md)

- [ ] Pass 1: visibility (Session 1)
- [ ] Pass 2: arrangement (Session 2, autonomous)
- [ ] Pass 3: labeling + wiring (Session 3)
- [ ] Side-by-side comparison passes
- [ ] Old Topology.ts deleted
```

**2. Move historical files to done/.**

- render.md, pipeline.md, facets.md, facets-session-summary.md → `done/`

**3. Loose ongoing files stay loose.**

- code.debt.md, propagating value changes.md — these aren't milestones, they're running lists. Fine where they are.

**4. Update milestones/index.md** to add milestone 33.

### What this fixes

- The topology rewrite has a number and a home, not 8 floating files
- Milestones stay the one system for tracking progress
- No new folder structure to learn — active/ and archive/ are just milestones/ and done/ renamed
- index.md answers "where do I start?" → milestone 33's handoff link
- Historical files stop cluttering the active folder
