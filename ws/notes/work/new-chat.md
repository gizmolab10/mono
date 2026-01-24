# New Chat

**Started:** 2025-01-22

Summary of steps taken during "go ws" initialization, plus research on AI memory systems.

## Steps

1. **Attempted ws CLAUDE.MD** — failed, wrong path (`/Users/jonathanmast/...`)
2. **Listed allowed directories** — discovered correct base is `/Users/sand/GitHub`
3. **Explored mono structure** — found `mono/projects/ws/CLAUDE.MD`
4. **Read ws/CLAUDE.MD** — instructions: read `../../CLAUDE.MD` and `notes/guides/*.md`
5. **Read mono/CLAUDE.MD** — shared context: defaults, gates, workarounds
6. **Read collaborate guides (batch 1)** — index, access, chat, evolve, filesystem, gating
7. **Read collaborate guides (batch 2)** — journals, markdown, repo, shorthand, voice, workflow
8. **Read mono/notes/work files** — index, resume.md, journal.md
9. **Explored ws/notes** — found collaborate dir (no guides dir)
10. **Read ws-specific guides** — gotchas.md, composition.md (Svelte patterns)
11. **Read ws/notes/work files** — index, deliverables.md (bug tracking)
12. **Searched for recents docs** — found done/recents.md
13. **Read recents.md** — learned Phase 5 complete, redesign finished Jan 21
14. **Summarized state** — noted memory about "Phase 3 next" is stale

## Observations

- Path discovery took 4 tool calls (could be 1 if I knew the base path)
- ws/CLAUDE.MD says "Read all `.md` files in `notes/guides/`" but that dir doesn't exist — actual guides are in `notes/collaborate/`
- Memory said "Phase 3 next" for recents but the work is complete


## userMemories Staleness Discovery

**Problem:** userMemories contained stale entry "ws recents redesign: Phase 1-2 done, Phase 3 next" — but that work completed Jan 21.

**Root cause:** userMemories updates "periodically in the background" — exact period unknown. System prompt says deletion cleanup is "nightly" but creation/update cadence is undocumented.

**Freshness comparison:**

| Source | Freshness |
|--------|-----------|
| CLAUDE.MD, guides, work/*.md | Fresh — read live |
| conversation_search / recent_chats | Fresh — searches actual history |
| userMemories (auto-generated) | **Stale** — unknown lag |
| memory_user_edits (manual) | Immediate, reliable |

**Resolution:** 
- Removed stale memory entry
- Updated CLAUDE.MD to say: "userMemories: Ignore entirely. Stale data risk outweighs serendipity. Use `memory` command if curious."
- Added stable context (Who section, execution mode) directly to CLAUDE.MD
- Added `memory` shorthand command to surface auto-generated insights on demand

**Implication:** Don't trust userMemories for anything time-sensitive. The md files are the real memory system.


## AI Memory Systems Research

Searched for consumer products that accomplish something like Jonathan's md-based memory system.

### Products Found

**PAI (Personal AI Infrastructure)** — Daniel Miessler, 5.4k GitHub stars
- TELOS: 10 identity files (MISSION.md, GOALS.md, BELIEFS.md, etc.)
- User/System separation (customizations survive upgrades)
- Skill system with routing
- Memory system with learning signals (ratings, sentiment)
- Hook system (lifecycle events)
- "Continuous learning" — captures feedback
- Philosophy: "AI as persistent assistant, friend, coach, mentor"
- Gap: No gates, no discipline enforcement, more "life coach" than project workflow

**Basic Memory** — basicmachines-co
- Local markdown files as knowledge graph
- Bidirectional read/write (human and AI edit same files)
- SQLite index for semantic search
- Obsidian-compatible
- True local-first, no cloud
- Gap: Storage system only, no workflow enforcement

**Nick Cao's Memory Bank** — 5-mode workflow MCP server
- `.memory_bank` directory with tasks.md, implementation-plan.md
- 5-mode lifecycle: VAN (init) → PLAN → CREATIVE → IMPLEMENT → REFLECT+ARCHIVE
- Complexity levels (1-4)
- File-based persistence
- Gap: Rigid phases, no organic evolution, no gates

**Other tools:** Cursor (.cursorrules), Claude Projects, Windsurf, Mem0, various MCP servers

### Feature Comparison

| Feature | PAI | Basic Memory | Nick Cao | **Jonathan's System** |
|---------|-----|--------------|----------|----------------------|
| Persistent context | ✅ | ✅ | ✅ | ✅ |
| Markdown-based | ✅ | ✅ | ✅ | ✅ |
| Work tracking | ❌ | ❌ | ✅ (phases) | ✅ (resume points) |
| Gates | ❌ | ❌ | ❌ | ✅ |
| Discipline enforcement | ❌ | ❌ | ❌ | ✅ |
| "Leaning into learning" | partial | ❌ | ❌ | ✅ |
| Shorthand commands | ❌ | ❌ | ❌ | ✅ |
| Voice/tone guide | ❌ | ❌ | ❌ | ✅ |
| Organic evolution | ❌ | ❌ | ❌ | ✅ |

### Unique Contributions of Jonathan's System

1. **Gates** — forced checkpoints before action (refactoring → read workflow.md first)
2. **Discipline enforcement** — recovery paths ("lazy" → reread refactoring discipline)
3. **"Leaning into learning"** — iterative guide refinement from actual collaboration
4. **Shorthand as UI** — compact commands for collaboration flow
5. **Voice guide** — personality/tone consistency in documentation

**Key insight:** Most tools provide *storage and retrieval*. Jonathan's system provides *accountability and learning loops*. It's methodology, not just tooling.

### The Irony

Jonathan built an entire methodology — CLAUDE.MD, gates, work files, guides — to work around AI unreliability. That labor compensates for the tool's opacity. The collaboration guides he's written are clearer documentation of how to work with Claude than anything Anthropic provides.
