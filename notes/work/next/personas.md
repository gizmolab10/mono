# Claude Persona Design Investigation

## Core insight

shared infrastructure (\~15 lines of defaults) belongs in Claude user preferences, leaving CLAUDE.MD files as pure persona. Exploring `shared/` repo for personal persona

## Goal

Two distinct personas—work and personal—each with their own gating and guides. Choose at chat start. Simple mental model, minimal infrastructure, adaptable.

Merge with [personas](notes/work/jonathan.md)

## Current State

* Single `CLAUDE.MD` in mono root
* Guides live in `mono/notes/guides/collaborate/`
* Work tracking in `mono/notes/work/`
* "go" commands read project-specific CLAUDE.MD files

## Design Questions

### 1. What differentiates the personas?

| Aspect | Work | Personal |
|----|----|----|
| Voice | Professional, systematic | Conversational, exploratory |
| Gating | Strict (refactoring discipline, tests) | Lighter (creative latitude) |
| Execution | Hybrid (propose before execute) | May differ |
| Content | Code, docs, architecture | Ideas, journals, personal projects |
| Tracking | work/\*.md files | Different location |

### 2. What should be shared vs separate?

**Shared** (infrastructure):

* Filesystem defaults
* Memory usage patterns
* Undo behavior
* Basic collaboration style

**Separate** (persona-specific):

* Gates table
* Voice/style guides
* Execution mode
* Work tracking location

### 3. Mental Model Options

**Option A: Two Root Files**

```
mono/CLAUDE.MD         → work persona
shared/CLAUDE.MD       → personal persona
```

* Chat starts with "go mono" or "go shared"
* Each file is self-contained
* Duplication of shared infrastructure

**Option B: Layered (Base + Persona)**

```
mono/CLAUDE.MD              → shared base
mono/notes/guides/work.md   → work persona overlay
shared/CLAUDE.MD            → personal persona (includes base)
```

* Cleaner separation of concerns
* More complex mental model
* Potential for drift between layers

**Option C: Single Router + Sections**

```
mono/CLAUDE.MD
  - Shared defaults
  - ## Work Persona
  - ## Personal Persona
```

* One file to maintain
* "go work" / "go personal" switches context
* Monolithic, grows over time

---

## Shared Defaults

These \~15-20 lines are infrastructure, independent of persona:

```markdown
## Defaults

FILESYSTEM: Full read/write/execute within `~/GitHub/<repo>`

MEMORY: Use `conversation_search/recent_chats` before claiming no context

FILES: ALWAYS read file before editing—no exceptions. If proposing edits, quote the lines being changed.

FRESHNESS: When comparing files, checking differences, or claiming file contents—ALWAYS re-read immediately before. Never rely on cached content from earlier in conversation.

SHOW WORK: If not quoting evidence, assume verification didn't happen.

UNDO: Before `write_file`, always `read_file` first and hold content. On "undo", restore it.

## Workarounds

`filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`
`delete` unavailable → user must delete manually
`execute` unavailable → user must run commands manually
```

**Persona-specific** (would differ):

| Work | Personal |
|----|----|
| `EXECUTE: Never granted, must be explicitly requested` | Maybe more permissive? |
| Gates table (refactoring discipline, voice.md) | Different or none |
| `Read notes/guides/collaborate/*.md` | Different guides path |
| `WORK TRACKING: Keep notes/work/<file>.md updated` | Journal? Or nothing? |
| Implementation from Plans section | Probably not needed |

---

## Sharing the Shared Portion

If mono and personal are separate repos, three approaches:

### 1. Reference Pattern

```markdown
# mono/CLAUDE.MD
First read ~/GitHub/shared/CLAUDE-BASE.md, then continue here.

## Work-Specific
...
```

Both persona files point to the same base. Adds one read per chat start.

### 2. Symlink

```
shared/CLAUDE-BASE.md        ← the actual shared content
mono/base.md                 → symlink to shared/CLAUDE-BASE.md
shared/base.md               → symlink (or same file)
```

Each CLAUDE.MD says "read base.md first." Single source of truth.

### 3. User Preferences

Put shared defaults in Claude user preferences (Settings → Profile). Then CLAUDE.MD files only contain persona-specific content. No duplication, no extra reads.

**Trade-offs:**

| Approach | Pros | Cons |
|----|----|----|
| Reference | Single source, explicit | Extra file read each time |
| Symlink | Single source, local to repo | Symlinks fiddly, git handles inconsistently |
| User preferences | Zero duplication, always loaded | Less visible, can't version control easily |

User preferences is cleanest if shared portion is stable infrastructure. Persona files become pure personality.

---

## Repository Decision: Where does personal live?

You mentioned having a repository in mind. Based on what I see, `shared` seems like the natural candidate.

### Pros of `shared/`

1. **Already exists** — minimal setup
2. **Clean separation** — personal isn't mixed into work codebase
3. **Parallel structure** — can mirror mono's notes/guides pattern
4. **Portable** — could sync to other machines differently than work
5. **Mental model** — "mono = work, shared = personal" is intuitive

### Cons of `shared/`

1. **Context switching cost** — Claude can't easily cross-reference between repos in same chat
2. **Filesystem permissions** — need both in allowed directories
3. **Dependency uncertainty** — if personal starts referencing work code, structure breaks down
4. **Maintenance split** — two places to update if shared infrastructure changes

### Pros of keeping personal in mono (subfolder like `mono/personal/`)

1. **Single source of truth** — one CLAUDE.MD, one place to look
2. **Cross-reference** — guides can link freely
3. **Unified maintenance** — update once, applies everywhere

### Cons of keeping in mono

1. **Pollutes work repo** — personal journals in a "work" monorepo feels off
2. **Git history mixing** — personal commits in work history
3. **Harder boundaries** — temptation to blur personas

---

## Recommendation

**Start with Option A: Two root files in separate repos**, with **shared defaults in user preferences**.

Rationale:

* Simplest mental model: repo = persona
* No layering complexity
* Shared infrastructure lives in preferences (always loaded, zero duplication)
* CLAUDE.MD files are pure persona
* Adaptable: can evolve independently
* Clean git histories

### Minimal Structure

```
mono/
  CLAUDE.MD                  ← work persona (no shared defaults)
  notes/guides/collaborate/  ← work guides

shared/
  CLAUDE.MD                  ← personal persona (no shared defaults)
  notes/guides/              ← personal guides (create as needed)
  notes/journal/             ← or whatever emerges
```

### Chat Entry Points

Update user preferences:

```
"go work" → read ~/GitHub/mono/CLAUDE.MD
"go personal" → read ~/GitHub/shared/CLAUDE.MD
"go" → ask which: (w) work or (p) personal
```

---

## Open Questions

1. **User preferences visibility** — Preferences aren't version-controlled. Acceptable tradeoff for stable infrastructure?
2. **Persona bleed** — What if a personal project becomes work? Move it? Reference across?
3. **Guides location** — Personal guides in `shared/notes/guides/` or simpler flat structure?
4. **Code in shared** — You mentioned it might have code. Does that change the calculus? (Probably fine—repos can hold both)

---

## Next Steps

* [ ] Decide: `shared/` or different repo?
* [ ] Move shared defaults to user preferences
* [ ] Draft `shared/CLAUDE.MD` with personal persona
* [ ] Update user preferences for "go" commands
* [ ] Create minimal `shared/notes/guides/` structure (or defer until needed)
