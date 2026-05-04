# Logic Driven Design

The development process the project follows.

Three things kept in lock-step: a catalogue of load-bearing rules, a test for each rule, and code that passes every test. When all three line up the build is green; when any one drifts the build catches it.

## development process

### scope and pacing

- [ ] adopt the framework opt-in by area
    - [ ] algebra, units, version migration — yes (stable, well-bounded, benefit clearly)
    - [ ] visual layout, color, animation tick — no (resist formalisation)
    - [ ] each area decides for itself based on its own shape
- [ ] apply the framework only to stable code
    - [ ] a feature must have lived for some months without major redesign before its stipulations get pinned
    - [ ] newer features run looser; they earn the framework after they have proved their shape
- [ ] keep two registers, side by side
    - [ ] stipulations — testable invariants, gated by the build
    - [ ] design notes — un-testable design choices (visual feel, animation pacing, layout balance, emotional intent), kept alongside but never gated by a test
    - [ ] both count as canonical; only the first goes into the lock-step loop

### extracting stipulations

- [ ] grow the set on demand, not in one big sweep
    - [ ] read load-bearing modules when work next touches them
    - [ ] write each invariant the module assumes as a single short sentence
    - [ ] tag each sentence with the source file and lines that prove it
    - [ ] every gap surfaced by a future failure is a learning opportunity that adds to the catalogue
- [ ] time-box every focused extraction sprint
    - [ ] a week, max, then back to feature work
    - [ ] extraction continues in background as part of feature work, never blocking it
- [ ] group the stipulations by area
    - [ ] one section per area (algebra, units, version migration, ...)
    - [ ] the area becomes the name of a test file
- [ ] keep the granularity steady
    - [ ] one stipulation per axis of behaviour, not per line
    - [ ] write a one-sentence assertion that captures the rule
    - [ ] name a single failure mode it would catch
    - [ ] if either fails, the stipulation is wrong-sized

### binding stipulations to tests

- [ ] for each stipulation, verify a test pins it
    - [ ] match every stipulation to an existing test by name and assertion
    - [ ] tag stipulations with no current test as "uncovered"
- [ ] write a test for every uncovered stipulation
    - [ ] one test per stipulation, named after the stipulation
    - [ ] keep the test small enough to read in one screen
- [ ] keep the catalogue and the test index in lock-step
    - [ ] every catalogue entry points at its test
    - [ ] every test points back at the stipulation it proves
    - [ ] the build catches drift in the link

### handling failures

- [ ] run the suite and triage every failure into one of four outcomes
    - [ ] code wrong — fix the implementation, never the test
    - [ ] stipulation wrong — update the catalogue entry and the test together
    - [ ] both wrong — fix both, in the same change
    - [ ] unclear — pause, open a discussion, decide before acting
- [ ] fix one slice at a time
    - [ ] each ticket carries the chosen fix direction
    - [ ] no slice spans more than one area

### staying honest over time

- [ ] re-read habit
    - [ ] every fortnight or so, pick a random subset of stipulations
    - [ ] re-read each against the current code
    - [ ] mark drifters (the wording no longer describes what the code does)
    - [ ] the re-read is a process gate, not a build gate
- [ ] codify the workflow for new work
    - [ ] no new feature lands without a stipulation in its area
    - [ ] no stipulation lands without a test
    - [ ] no test lands without a passing run
- [ ] carve out a fixes exemption
    - [ ] a bug fix needs a test that demonstrates the fix
    - [ ] a new stipulation lands only when the bug reveals an invariant nobody had written down
    - [ ] if the bug violates an existing stipulation, a regression test is enough

### collaboration discipline

- [ ] turn-taking
    - [ ] human frames the question and decides
    - [ ] assistant researches, traces, proposes, and on a green light builds
    - [ ] forward progress is small careful deliberate moves, not sweeping leaps
- [ ] propose-first
    - [ ] "propose" describes the plan and does nothing else
    - [ ] code changes wait for a go
    - [ ] the one exception is an action the human asked for in the same turn
- [ ] questions are not orders
    - [ ] "how will you do X" asks for a description, not the action
    - [ ] describe and wait

### where things live

- [ ] one truth, one place
    - [ ] guides hold living reference, grouped by topic
    - [ ] work notes hold what is currently being done
    - [ ] the entry-point file points at where to start
    - [ ] do not duplicate; reference
- [ ] starting work
    - [ ] check whether a work file already exists for the topic
    - [ ] if yes, read it and resume
    - [ ] if no, create it with a problem section, a goal section, and phase sections
- [ ] standard work-file shape
    - [ ] title, started date, status
    - [ ] problem (what is being solved)
    - [ ] goal (what success looks like)
    - [ ] phases as checklists
    - [ ] next-action line at the bottom
    - [ ] update status and check off items as the work moves
- [ ] finishing work
    - [ ] historical record goes to the done archive
    - [ ] living reference goes to the guides

### document hygiene

- [ ] tidying up
    - [ ] read what exists
    - [ ] spot overlap and blur
    - [ ] propose cleaner splits
    - [ ] move or merge until each file has one clear job
    - [ ] trim dated material and work-in-progress hedging
- [ ] safe updating of work documents
    - [ ] reorder, never delete
    - [ ] "propose a rewrite" means propose; wait for approval before touching the file
    - [ ] summarize by adding alongside, not by replacing
    - [ ] design notes (types, rationale, lifecycle, error sources) stay
    - [ ] when in doubt, add a new section instead of cutting an old one

## why this fits AI-assisted work

AI is strong at: reading and summarising; analyzing code; following complete instructions; searching and cross-referencing at scale; mechanical refactoring; verifying cited claims against the code; translating between representations; spotting pattern divergence; generating structured first drafts; comparing alternatives systematically; mechanical hygiene (lint, dead-link sweeps, broken-import sweeps, repeatedly, without getting bored).

AI is poor at: visual judgement; predicting how real users will behave; multi-day planning with real-world feedback loops; knowing when to stop tinkering.

A first-principles framework — rules → tests → code — plays to the strengths and corners off the weaknesses.

## the commitment

Every change to the project is governed by the rules above. No shortcut, no exception, no "just this once". When the rules and reality conflict, the rules win and the conflict is logged for review at the next re-read. The rules can be amended — but only through the same propose-first cycle they describe.

## adherence dashboard

A small auto-generated dashboard scores the project against the process on every build. Four gated metrics:

- **Coverage by area** — every audited area at one rule per module or higher.
- **Test binding** — zero uncovered rules.
- **Orphan tests** — zero tests pointing at rules that do not exist.
- **Build-gate** — green right now.

Three hand-recorded metrics, captured in [adherence log.md](./adherence%20log.md), one append-only line each:

- **Re-read recency** — date of last sweep, drifters surfaced, drifters resolved.
- **New-work compliance** — per merged change: did a rule land first, did a test land alongside, did a passing run precede merge.
- **Failure triage** — per failure: outcome (code wrong, rule wrong, both wrong, unclear-pause), ticket reference.

The auto dashboard lives at [adherence dashboard.md](./adherence%20dashboard.md), regenerated by `yarn adherence`. The reading guide is at [dashboard guide.md](./dashboard%20guide.md).

We deliberately do not measure the visual or emotional quality of any feature (those live in the design-notes register, never gated by the build), or the collaborator's per-turn behaviour (cadence and propose-first compliance is a human-side observation; logged only when a violation surfaces).

## adding a new rule

When a new rule lands — from feature work or from an audit sprint that exposes a missing invariant — eight steps:

1. **Pick the area.** If feature work is touching a module, migrate every rule that names it. Otherwise pick the next un-audited area on the dashboard. Never migrate speculatively.
2. **Give the rule a short hyphenated name.** Ties to the rule's intent, not its current spelling. Unique across the catalogue.
3. **Find or write the proving test.** One rule per test, small enough to read on one screen, named after the rule.
4. **Add a `test:` pointer line** under the rule prose. The extractor checks the file resolves.
5. **Add a `code:` pointer line** under the rule prose. The line range is the smallest span that proves the rule.
6. **Add a `stipulation:` back-pointer** on the test entry in the test index.
7. **Audit the area when fully covered.** Count its load-bearing modules and update `areas.json`. The dashboard switches that area from "not yet audited" to a real coverage figure.
8. **Run `yarn adherence`.** Confirm the rule lands in the matched count with zero uncovered, orphan, or malformed.

A rule that mixes the old and new shape is flagged malformed; the extractor's exit code fails the build, so it never lands silently. The fixture validator at `node notes/tools/validate-adherence.mjs` re-runs on demand and confirms the parser still behaves correctly.
