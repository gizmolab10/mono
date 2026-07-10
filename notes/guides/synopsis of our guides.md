# Synopsis of the main guide files

Generic in the sense of "can apply to any development project." These guides are intended to allow hyper fast construction of high quality software.

## Observations:

- **Primary entry points** for a fresh session are pre-flight (gates, keywords, always.md set what runs first) and the two collaborate files chat.md and workflow.md (set the working contract).
- **The pre-flight folder** layers the same idea three ways — keywords trigger gates which point at guides — so the assistant cannot miss the right guide for a given task type.
- **One folder feels like a draft** area: philosophy/limitations.md is a living list of acknowledged failure modes, and pitfalls.md is a similar working list — both grow as new failures surface.
- **One acknowledged conflict** between guides: develop/migration.md and develop/refactoring.md disagree on whether to bundle changes (migration bundles, refactoring scatters per change). The conflict is named in kinds-of-tasks.md so it does not surprise a reader.
- **Two overlapping setup files** (setup/access.md and setup/onboarding.md) cover different scopes: access.md is filesystem access for the Claude Desktop app; onboarding.md is the developer's full machine setup.
- **Two siblings** develop/build.md and develop/build notes.md are siblings with split purpose: one is the tooling reference, the other is the maintenance process for the build-notes log.
- **Two files overlap** on enforcement: collaborate/hooks.md describes the mechanism, pre-flight/always.md lists what the mechanism enforces. They are designed to be read together.

## Still needed

The split is: 25 settled, 10 partial, 4 thin. Plus ten structural gaps the corpus does not cover at all.

### THIN files (stubs or topic-named-without-content):

- collaborate/exclude.md — a folder list without the why. Missing: when and why to exclude, what the impact is, examples of which workflows the exclusions affect.
- hub/port.md — describes one process in one paragraph. Missing: a worked example showing source-read to destination-spec to fresh-built, pitfalls encountered, how to verify the port matches the original.
- philosophy/limitations.md — names failure modes without unpacking them. Missing: concrete examples of each failure, the symptoms that flag the failure has happened, and the workarounds you have discovered.
- tools/single-line.md — describes the idea of a single-line progress display. Missing: a complete working script example, error handling patterns, integration with the build pipeline, comparison with alternatives.

### PARTIAL files (substance present but obvious first-use gaps):

- collaborate/chat.md — the working contract is there. Missing: how to recover when an approach unravels mid-session, what to do if the assistant proposes something unsafe, how to frame disagreement without stalling.
- collaborate/creating a design.md — the rules and completeness check are there, then the file is cut at a "STOP WRITING DOCUMENT" marker at line 76; phases 6 onward are listed in the table of contents with no implementation. Missing: the phases past the cut.
- collaborate/shop keeping.md — the new file I just wrote. Heavy on the uniface case study, light on systematic rules. Missing: when is clutter clutter versus useful history, how to know a file is ready to archive, a trigger list for when to do shop keeping.
- develop/build notes.md — the maintenance process is clear. Missing: sample commit-to-build-note transformations, decision criteria for borderline commits, a worked example of filtering a real two-week window.
- develop/build.md — factual reference present. Missing: why each gotcha matters, recovery steps when each surfaces, criteria for cache-clear versus leave-stale.
- develop/migration.md — structure is comprehensive but the file is cut at the same "STOP WRITING DOCUMENT" marker at line 76; phases 6 to 9 are listed without implementation. Missing: the phases past the cut, plus a real-world example of a completed migration with its work-performed sections filled in.
- setup/creating a proposal.md — the proposal-versus-journal split is documented. Missing: how to pull deferred items back when priorities shift, when a proposal is too long, how to split it.
- test/testing.md — quick reference present. Missing: organisation at scale, patterns for cross-component integration tests, when mocking is necessary versus when it couples tests to implementation.
- collaborate/hooks.md — mechanism, the full live hook suite (all 18 wired-up hooks), and the doubled-reply / warn-only design are documented. Missing: guidance on when a hook is the right tool versus a guide versus a settings entry.
- philosophy/motive.md — foundational philosophy is laid out. Missing: how the approach scales with team size, failure modes when the discipline slips, what to do if context compaction loses something critical.

### Structural gaps (topics a reader would expect a guide to exist for but no file covers):

- Context-compaction protocol — what to preserve and how to recover when the running conversation gets summarized. (The PostCompact hook and refresh.md handle the lexicon and uniface rules — there is no general policy.)
- Error-handling discipline — when crashes, failed tests, or build breaks arise, the systematic response. The debugging guide covers code bugs; nothing covers the "stop and re-read versus keep iterating" judgement.
- When-to-stop protocol — explicit criteria for "this feature is done", "this refactor is complete", "this fix is sufficient".
- Dependency management — when to add, upgrade, or remove a dependency; trade-offs and lock-in.
- Session handoff — how to wrap up a session so the next picks up cleanly. The shop-keeping guide covers maintenance, journals covers the format, but nothing covers "I am ending this session, what do I do in what order".
- Documentation as coordination — what level of detail in a comment, a journal entry, or a guide is load-bearing enough to write down; what is fine to leave to the code.
- Recovery from a misapplied guide — when a discipline was skipped or a guide was misread and damage resulted, the recovery sequence.
- Velocity-versus-depth trade-off — when to rush a fix and when to do it right; the decision criteria for "this is a quick patch" versus "this needs a design".
- Identifying the assistant's knowledge gaps — beyond the limitations file, a guide on how to spot when the assistant does not know something and how to teach it efficiently.
- Multi-project coherence — how guides stay aligned across mono, ws, and di; when a project-specific guide overrides global guidance.

### Priority view, if you want to act on this list:

- The two cut-off-mid-draft files (creating a design and migration) are partial in a literal sense — picking up where the STOP marker sits would close them fastest.
- The four THIN files are short and could each become PARTIAL with a single focused session.
- The most-load-bearing structural gap, given the recent uniface debugging crisis, is the "session handoff" plus "context-compaction protocol" pair — both directly affect whether the next session arrives able to continue safely.

## Exposure

What you risk, ranked by likelihood and cost:

### **Highest**

#### **today's nasty confusion.** 

This session's trust crisis came from emotional signals being misread as redesign authority and compound terms being collapsed to bare words. The new rules in creating-a-design address those two patterns, but the broader phenomenon — the assistant going off the rails mid-session and not knowing how to recover — has no guide. Without a "recovery when the work goes off the rails" protocol, the next variant of this failure has no playbook. I AM GUESSING the next variant arrives within a few sessions if multi-turn debugging or design work continues.

**Direct evidence:** today's session, hours of debugging time.

this is an excellent idea. declare breakdown. describe the problem / objective, analyze the situation, resources, concoct strategies, beat a dead horse to heck. This may just kick the can, this is the same "kind" of difficulty.

### **High**

#### **context-compaction will lose substantive working state.**

The PostCompact hook re-injects refresh.md, which lists the lexicon and the uniface rules. That protects two files. Any in-progress investigation, any not-yet-distilled hypothesis, any half-finished reasoning chain present in the conversation when compaction fires will be gone. The journal entry written for that session, if any, will summarise the conclusion but miss the path. Without a general context-compaction policy, the project relies on the assistant noticing what to preserve before each compaction event. The assistant cannot predict when compaction fires.

**Direct evidence:** the refresh hook was specifically built this session, indicating compaction was a real problem.

proposal

#### **shop keeping will lapse.**

The shop keeping guide describes the practice but does not trigger it. The handoff was just cleared today; without "do shop keeping when X" criteria, it will fill again. The handoff carries the cost on every read of every session, so the bloat compounds until the next big cleanup.

**Direct evidence:** the handoff carried twenty-plus completed proposals plus many unnumbered bug-fix sections before today, and nothing in the guides flagged that as a problem during the weeks it grew.

proposal

### **Medium**

#### **STOP markers mislead readers**

A reader following the design-creation guide hits the marker at line 76 and is stuck — no guidance for phases 6 onward. Same in the migration guide. The risk: the reader either fabricates what they think the missing phases say (off-spec result) or abandons the guide partway through (loss of discipline for the rest of the work).

**Direct evidence:** the explore agent found the markers in both files.

#### **mistakes get repeated**

The limitations file names failure modes (diagnosis-without-prescription, restructuring-logic gaps, optimization rabbit holes) without describing how they show up or what the symptom looks like. The assistant cannot recognise a failure mode in real time from a name alone. So the same modes resurface in slightly different shapes and time is spent diagnosing them as new each time.

**Direct evidence:** the lessons file catches specific incidents (negative-zero, single-key-from-birth) AFTER they happen. The limitations file's purpose is to catch them BEFORE; without unpacking, it cannot.

### **Lower**

#### **porting work will reinvent its own process.** 

If a porting task starts before port.md is filled in, the assistant invents the process from scratch each time. The first port takes longer than it should and the next one cannot copy from a known pattern.

**Direct evidence:** port.md is probably half finished.

#### **some loss of operational quality**

Builds break occasionally; without an error-handling-discipline guide, each break gets ad-hoc handling. Tests get over-coupled to implementation in some cases because the testing guide does not name the mocking-vs-coupling judgement. Quick fixes sometimes get treated like full solutions because no guide names the velocity-vs-depth criterion. These are small individually, compounding over time.

**I AM GUESSING about** how often each of the lower-risk items actually bites, since I cannot point to recent incidents the way I can for the top three. Those three are the real ones; the rest are well-founded but not currently demonstrated

## Folders

Eight folders, each holding one kind of guidance.

### **collaborate**

how Jonathan and the assistant work together. Sets the working contract.

- chat — the division of labour: Jonathan frames and decides; the assistant researches, proposes, builds only on explicit go.
- creating a design — process for writing design documents jointly: core idea from Jonathan, structure from the assistant, simplify together. Has rules and a completeness check.
- exclude — the folders the project-map builder must skip.
- expectations — how to get the assistant's best work: force thinking before coding, use design sessions, know when to stop.
- framing filters — names a known failure: unconsciously excluding adjacent information that does not fit the current task frame.
- journals — formatting rules for the running journal (reverse chronological, bold dates, no headings).
- shop keeping — the practice of maintaining note infrastructure so it keeps guiding future sessions.
- voice — keeps the prose crisp, lighthearted, and grounded in the joy of being human.
- workflow — turn-taking cadence and the propose-first discipline.

### **develop**

how to write the code itself.

- aesthetics — visual design constants, evolved through small perturbations in layout and spacing.
- build notes — how to maintain the hand-distilled build-notes table from git history.
- build — Netlify, VitePress, and related build-tool reference.
- css — CSS patterns and gotchas; static markup with dynamic appearance.
- markdown — heading structure for linkable anchors.
- migration — how to write a migration document for big component refactors.
- refactoring — guidelines for assistant-driven refactoring on a temperamental codebase.
- style — codebase naming, formatting, and organisation conventions.

### **hub**

porting code between projects.

- port — the process: read source, describe what it does, add a spec to the destination's design guides.

### **philosophy**

why the project exists in this shape.

- limitations — known assistant failure modes (diagnosis-without-prescription, restructuring-logic gaps, etc.).
- motive — the underlying premise: let structure emerge from raw curiosity; work files record what happened; guides record what was learned.

### **pre-flight**

what to read or do before acting.

- always — the standing rules, enforced by hook (path conventions, never npm, never preview without approval, exact match).
- gates — task-type to required-guide mapping (refactoring sends you to chat.md, prose to voice.md, etc.).
- keywords — trigger words that require a guide-read before acting (refactor, rename, remove, debug, migrate).
- kinds of tasks — task classification with associated guides and conflict notes (e.g., migration bundles, refactoring scatters).
- pitfalls — edge cases that caused mistakes, mainly read-before-act.
- shorthand — short commands and abbreviations the user types (help, claude, egads, memory, v: ...).
- tools — gotchas for the assistant's own toolset.

### **setup**

onboarding and deployment configuration.

- access — Claude Desktop filesystem access setup.
- creating a proposal — how to write proposals from scratch, with a worked example.
- netlify — Netlify deployment reference (five deployable sites across three projects).
- onboarding — developer machine setup (Node, Yarn, Git, VSCode).
- vitepress — VitePress configuration for the monorepo docs sites.

### **test**

running and writing tests.

- debugging — two principles: verify source first; be systematic.
- testing — yarn-test commands and patterns.

### **tools**

reference for individual tools.

- git — common git fixes (moving commits, reverting).
- hooks — the hooks mechanism: shell commands that fire on assistant events; governs the mandatory side of behaviour while memory holds the advisory side.
- hub-app — overview, architecture, and UI for the Hub app.
- single-line — single-line progress display for build scripts.

