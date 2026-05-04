# Logic Driven Design

## development process

### scope and pacing

- [ ] adopt the framework opt-in by area
    - [ ] algebra, units, version migration — yes (stable, well-bounded, benefit clearly)
    - [ ] visual layout, colour, animation tick — no (resist formalisation)
    - [ ] each area decides for itself based on its own shape
- [ ] apply the framework only to stable code
    - [ ] a feature must have lived for some months without major redesign before its stipulations get pinned
    - [ ] newer features run looser; they earn the framework after they have proved their shape
- [ ] keep two registers, side by side
    - [ ] stipulations — testable invariants, gated by the build
    - [ ] design notes — un-testable design choices (visual feel, animation pacing, layout balance, emotional intent), kept alongside but never gated by a test
    - [ ] both count as canonical; only the first goes into the lock-step loop

### tooling first

- [ ] build the link-checker before adopting the framework
    - [ ] a build pass that flags broken catalogue-to-test pointers
    - [ ] the build pass that flags missing test references
    - [ ] the build pass that flags orphan stipulations (in the catalogue, not in any test)
    - [ ] without this, the framework rots silently

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

## goal

i want to focus AI work on its strengths. It can:

- [ ] read and summarize
- [ ] analyze code
- [ ] follow complete instructions
- [ ] search and cross-reference at scale
    - [ ] find every place a name appears, every site that calls a helper, every flag that gates a feature
- [ ] refactor mechanically
    - [ ] rename across many files, extract a function, change a parameter signature, apply a recipe everywhere it fits
- [ ] verify a cited claim against the code
    - [ ] does this guide page's pointer still match the file, did this method survive a rename, did this number drift
- [ ] translate between representations
    - [ ] markdown table to typed data, English description to schema, checklist to sequence diagram, code shape to one-line summary
- [ ] spot pattern divergence
    - [ ] read several similar files and surface where one deviates from the convention the others share
- [ ] generate structured first drafts
    - [ ] boilerplate for a new component, a test scaffold for a new rule, an empty page that follows the project's voice and structure
- [ ] compare alternatives systematically
    - [ ] lay out pros, cons, side effects, blast radius
- [ ] maintain mechanical hygiene
    - [ ] lint, format, dead-link sweep, broken-import sweep, unused-export sweep, repeatedly, without getting bored

It is poor at:

- [ ] visual judgement ("does this look right")
- [ ] understanding how a real user will actually behave
- [ ] multi-day planning with real-world feedback loops
- [ ] knowing when to stop tinkering

## therefore

a strong guidance system must:

- [ ] build a set of first principles (stipulations)
- [ ] build a test for each of them
- [ ] build code that passes all the tests

## feasibility

The restructured proposal above is the project's development process. We will strictly follow it.

- [ ] every change to the project, from this point forward, is governed by the rules in the proposal section
- [ ] no shortcut, no exception, no "just this once"
- [ ] when the proposal and reality conflict, the proposal wins, and the conflict is logged for review at the next re-read
- [ ] the proposal can be amended — but only through the same propose-first cycle it describes

## proposal — measuring adherence

A small dashboard, refreshed on every build, that scores the project against the development process.

### what to measure

- [ ] coverage by area
    - [ ] for each opted-in area, count the load-bearing modules and the stipulations
    - [ ] coverage = stipulations divided by modules (a rough number, not a strict ratio)
    - [ ] flag areas where the count of stipulations is below the count of modules
- [ ] test binding
    - [ ] count of stipulations with a matching test
    - [ ] count of stipulations without a matching test (uncovered)
    - [ ] target: zero uncovered
- [ ] orphan tests
    - [ ] count of tests that do not point back at a stipulation
    - [ ] target: zero orphan tests
- [ ] build-gate health
    - [ ] is the build green right now
    - [ ] longest red streak in the last quarter
    - [ ] count of build failures caused by drift in the link
- [ ] re-read recency
    - [ ] date of the last re-read sweep
    - [ ] count of stipulations re-read in the last fortnight
    - [ ] count of drifters surfaced and not yet resolved
- [ ] new-work compliance
    - [ ] for every merged change in the last quarter: did a stipulation land first, did a test land alongside, did a passing run precede merge
    - [ ] target: every merged change satisfies all three
- [ ] failure-triage health
    - [ ] count of failures resolved with each of the four outcomes (code wrong, stipulation wrong, both wrong, unclear-pause)
    - [ ] count of "unclear, pause" tickets currently open

### how to collect

- [ ] coverage, test binding, and orphan tests — read from a small script that walks the catalogue and the test index
    - [ ] runs as part of the build
    - [ ] writes a single dashboard page in the docs site
- [ ] build-gate health — read from the build's own log
    - [ ] count failures and their causes from the build output
- [ ] re-read recency — recorded by hand, in a single dated file in the development folder
    - [ ] one line per re-read sweep: date, area, drifter count
- [ ] new-work compliance — recorded by hand, in the same dated file
    - [ ] one line per merged change: stipulation reference, test reference, build status
- [ ] failure-triage health — recorded by hand, in the same dated file
    - [ ] one line per failure: outcome, ticket reference

### cadence

- [ ] every build refreshes the four automated metrics (coverage, binding, orphans, build-gate)
- [ ] every fortnight refreshes re-read recency
- [ ] every quarter rolls up new-work compliance and failure-triage health into a single short report

### surface

- [ ] a single dashboard page lives at the top of the development folder
    - [ ] one section per metric
    - [ ] each section names the current value, the target, and the gap
    - [ ] the page is generated, not hand-edited
- [ ] the human-recorded log lives alongside as a sibling file
    - [ ] one entry per recording event
    - [ ] never edited after the entry is written

### when to act on the measurements

- [ ] coverage gap by area — schedule an extraction sprint
- [ ] uncovered stipulations — schedule a test-writing slice
- [ ] orphan tests — schedule a catalogue review
- [ ] re-read recency more than a month stale — re-read this fortnight
- [ ] new-work compliance below 100 percent in the last quarter — review the merge gate
- [ ] more than two open "unclear, pause" tickets at once — pause new work and resolve them first

### what we deliberately do not measure

- [ ] the visual or emotional quality of any feature
    - [ ] those live in the design-notes register
    - [ ] they are not gated by the build, by definition
- [ ] the assistant's per-turn behaviour
    - [ ] cadence and propose-first compliance is a human-side observation
    - [ ] tracked in the human-recorded log only when a violation surfaces, not as a routine metric

## steps to build the dashboard

### 1. fix the catalogue and test-index formats

- [x] choose a structured shape for the stipulations catalogue
    - [x] the existing stipulations file is a flat markdown list — keep that
    - [x] every stipulation gets a stable id (a short slug)
    - [x] every stipulation carries a "test:" pointer line (path to the test file plus the test name)
    - [x] every stipulation carries a "code:" pointer line (file plus line range that proves it)
- [x] choose a structured shape for the test index
    - [x] the existing testing file is the index — keep that
    - [x] every entry carries a "stipulation:" pointer back at the slug
- [x] add a small example to each file showing the expected shape

### 2. write the extractor

- [x] one script under the project's tooling folder
    - [x] reads the stipulations file and emits a list of stipulation records (id, area, test pointer, code pointer)
    - [x] reads the test-index file and emits a list of test records (file, name, stipulation pointer)
    - [x] cross-joins the two lists
    - [x] returns four arrays: matched pairs, uncovered stipulations, orphan tests, malformed entries
- [x] handle the edge cases
    - [x] missing pointer line — flag as malformed
    - [x] pointer that does not resolve to a real file — flag as malformed
    - [x] duplicate slugs — flag as malformed
- [x] Lives at `notes/tools/extract-adherence.mjs`. Skips fenced code blocks. Run with `node notes/tools/extract-adherence.mjs` from the project root.

### 3. compute the metrics

- [x] coverage by area
    - [x] count load-bearing modules per area (a static list, hand-maintained, lives in a small data file in the development folder)
    - [x] count stipulations per area from the extractor's output
    - [x] coverage = stipulations divided by modules
- [x] test binding
    - [x] count of matched pairs and count of uncovered stipulations
- [x] orphan tests
    - [x] count of tests in the extractor's orphan list
- [x] modules-per-area data file lives at `notes/guides/project/development/areas.json`
- [x] every area starts at zero modules and the dashboard reports "not yet audited" until audited

### 4. generate the dashboard markdown

- [x] one generated file at a known path under the development folder
    - [x] the file is generated by the script, never hand-edited
    - [x] one section per metric
    - [x] each section names current value, target, gap
    - [x] the file's first line carries the timestamp of the run that produced it
- [x] the file ends with a "as of build N, generated by the adherence script" footer
- [x] Lives at `notes/guides/project/development/adherence dashboard.md`. Sections: Test binding, Orphan tests, Build-gate health, Coverage by area, Migration progress, Malformed entries (when present). Top-level Overall badge (green or red).

### 5. wire the script into the build

- [x] build-gate health
    - [x] read from the docs build's exit code
    - [x] note: this metric is binary (green or red) on every run
    - [x] a small wrapper script runs the docs build, captures the exit code, and writes it to `notes/guides/project/development/build-status.json`. The extractor reads that file to populate the build-gate metric. The dashboard always reflects the last recorded build outcome.
- [x] the package.json gets a new entry that runs the script and the docs build in order
    - [x] the script runs first
    - [x] the docs build runs second and includes the generated page
    - [x] new entry: `yarn adherence` — chains the extractor and the build-with-status wrapper
- [x] the existing yarn shoot script and yarn e2e script are unaffected
- [x] if the script fails (malformed entries), the docs build aborts before vitepress runs (the chain uses `&&`)

### 6. add thresholds and a green/red badge

- [x] for each metric, define a threshold
    - [x] coverage: every opted-in area at one stipulation per module or higher
    - [x] test binding: zero uncovered
    - [x] orphan tests: zero
    - [x] build-gate: green
- [x] the dashboard page gains a top-level badge that summarises the four metrics
    - [x] all green = green badge
    - [x] any red = red badge with a list of the failing metrics
- [x] thresholds live as a comment block in the extractor next to where the four green flags are computed; the per-section "Target" line in the dashboard echoes each threshold for the reader. When red, the badge names every failing metric (build-gate first, then test binding, orphan tests, coverage with the area names appended).

### 7. decide tracking policy

- [x] the generated dashboard file is committed to the repository
    - [x] every change to the project surfaces its dashboard impact in the diff
    - [x] reviewers see the metrics drift as the change happens
- [x] the human-recorded log lives alongside, also committed
    - [x] one entry per recording event (re-read sweep, merge compliance, triage outcome)
    - [x] never edited after the entry is written
- [x] dashboard file (`adherence dashboard.md`) and status file (`build-status.json`) are not excluded by either `.gitignore`, so the diff captures every shift as it happens. Hand-written log lives at `notes/guides/project/development/adherence log.md` with three append-only sections (re-read sweeps, new-work compliance, failure triage).

### 8. publish the dashboard

- [x] the docs site gets a new top-level link in the project section pointing at the dashboard page
- [x] a one-line entry in the project index names the dashboard
- [x] the layout map picks up the new file
- [x] sidebar gains a new "Project" section in `.vitepress/config.mts` with a direct entry for the adherence dashboard plus the logic-driven-design page. The project index lists the dashboard as its first contents entry; the development index lists the dashboard and the log. The guide layout file and the overview map both gained the four new files (`adherence dashboard.md`, `adherence log.md`, `areas.json`, `build-status.json`), and the overview map now has a Notes — Tools section with the two scripts.

### 9. validate end-to-end

- [x] write a small fixture: three stipulations, three tests, two matched, one uncovered, one orphan test
- [x] run the script against the fixture
- [x] confirm the dashboard reports one uncovered, one orphan
- [x] flip the matching links and re-run
- [x] confirm the dashboard reports zero of each
- [x] Lives at `notes/tools/validate-adherence.mjs`. The extractor exports `parse_stipulations`, `parse_test_index`, and `cross_join`; the validator imports them, builds two in-memory catalogues, runs them through the cross-join twice, and asserts the expected counts. The extractor's own `main()` only runs when the file is invoked as a script, so the import is side-effect-free. Run with `node notes/tools/validate-adherence.mjs`.

### 10. document the dashboard itself

- [x] a short page in the development folder that describes how to read the dashboard
    - [x] what each metric means
    - [x] what action each red value triggers
    - [x] who owns each action
- [x] this page is hand-written; it is not generated
- [x] Lives at `notes/guides/project/development/dashboard guide.md`. Walks through the at-a-glance badge, the five (sometimes six) sections, what each metric means, the red-value action table with owner, and a "when the dashboard is wrong" appendix that points at the validator. Linked from the development index, the project sidebar, the guide layout, and the overview map.

## steps to move everything to the new format

The catalogue currently holds 58 rules in the old "Covered:" shape. Each one needs a short stable name, a pointer at the test that proves it, and a pointer at the code that proves it. The matching test entry needs a pointer back at the rule. This section is a recipe applied one rule at a time. The development process forbids a single big sweep — migration grows on demand, in step with feature work and audit sprints.

### 1. pick the next rule

- [ ] start where the work already is
    - [ ] if a load-bearing module is being touched by current feature work, migrate every rule that names it
    - [ ] if no feature work is touching anything, pick the next "not yet audited" area on the dashboard
- [ ] never migrate speculatively
    - [ ] migrating a rule that nobody is reading is just churn
    - [ ] the rule will get its turn when its module gets its turn

### 2. give the rule a short stable name

- [ ] the name is hyphenated, lower case, and reads like a sentence fragment
    - [ ] e.g. `axis-bounds-locked-by-invariant` not `rule-12`
- [ ] the name survives renames in the source code
    - [ ] tying the name to a class or method invites a rename to break the catalogue
    - [ ] tie the name to the rule's intent, not its current spelling
- [ ] the name is unique across the whole catalogue
    - [ ] the extractor flags a duplicate name as a malformed entry

### 3. find or write the test that proves it

- [ ] search the test index first
    - [ ] an existing test that already proves the rule needs no rewrite — just a back-pointer
- [ ] if no test exists, write one
    - [ ] one rule per test
    - [ ] small enough to read on one screen
    - [ ] named after the rule

### 4. add the test pointer to the rule

- [ ] one line under the rule prose:
    - [ ] `- test: [the test's name](path/to/the/test.file.ts)`
- [ ] the path is project-relative
    - [ ] the extractor checks the file exists; a missing path is flagged as malformed

### 5. add the code pointer to the rule

- [ ] one line under the rule prose:
    - [ ] `- code: [a short label](path/to/source.ts:start-end)`
- [ ] the line range is the smallest span that proves the rule
    - [ ] big ranges blur the link; tiny ranges break the moment a comment is added

### 6. add the back-pointer on the test entry

- [ ] one line under the test entry:
    - [ ] `- stipulation: the-rule-name`
- [ ] one test may prove several rules — list them comma-separated
    - [ ] `- stipulation: rule-one, rule-two`

### 7. remove the old "Covered:" line

- [ ] the new pointers replace the old line
    - [ ] keep both temporarily and the rule will be flagged as malformed (mixing old and new shape)
- [ ] re-run the extractor — confirm the rule now sits in the matched count

### 8. when an area is fully migrated, audit it

- [ ] count the load-bearing modules in that area by hand
    - [ ] update the area's module count in `areas.json`
- [ ] the dashboard switches that area from "not yet audited" to a real coverage figure
    - [ ] coverage at one rule per module or higher = green
    - [ ] below = red, which triggers an extraction sprint per the dashboard guide

### 9. confirm the run is clean

- [ ] run `yarn adherence`
    - [ ] migration count goes up by one
    - [ ] legacy count goes down by one
    - [ ] uncovered, orphan, and malformed all stay at zero
- [ ] run `node notes/tools/validate-adherence.mjs`
    - [ ] the parser still behaves correctly on the in-memory fixture

### 10. repeat until the legacy count is zero

- [ ] migration progress section in the dashboard reports the running totals
- [ ] when legacy is zero and no malformed entries remain, the catalogue is fully migrated
- [ ] from that point on, every new rule lands in the new shape from day one — the rule on this is in the development process section above ("no new feature lands without a stipulation in its area")
