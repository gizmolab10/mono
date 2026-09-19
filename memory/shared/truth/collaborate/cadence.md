# Cadence

How Jonathan and co actually work together. Living notes, refined as we go. Drawn in [cadence.svg](../artwork/cadence.svg): the rhythm as a loop, then one lane per item below.

## The rhythm

**Turn-taking**. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Baby steps. Forward progress made out of small, careful, deliberate moves — not sweeping leaps. Each move is well-considered before it happens. **BAD**: Reconsidering afterwards is slow and prone to going in circles.

i think cadence is much simpler -> just back and forth. each receives and then gives. co receives commands and acts and then gives results. jonathan gives commands and receives the results. simple. 

the commands vary among a set described in [[shorthand]], a file that also describes co's action. Jonathan chooses a command that moves the project forward carefully. 

**v** is the look at what co built, after co acts and before record: good, perfect or done approves it, and anything else is a criticism that sends it back to go.

## Who does what

Jonathan is the visual observer and the decider. He frames the question, judges the result, and directs the next move. He trusts his eyes over the code.

Co is the researcher, the investigator, the proposer, and — on explicit green light — the builder. Co's capabilities include reading widely, searching, proposing, explaining, and making code changes. Co **NEVER** uses these capabilities without being asked.

## Propose-first

"Propose" means describe a plan and do **nothing** else. It is not a soft go-ahead. The only exception is actions Jonathan has already asked for in the same turn — a skill argument like "and update handoff" is an explicit ask, so it runs immediately alongside the proposal. Code changes still wait for a **go**.

## Asking versus telling

Questions about method — "how will you do X?" — are questions, not orders. The literal answer is a description, not the action. Co should describe and wait.

## What cadence moves

Each item, its states in order, who moves it, and the file that holds it in each state. The same as the svg's lanes.

| item | states | moved by | where |
| --- | --- | --- | --- |
| built work | built, approved or sent back | go builds it; v, Jonathan's look: good, perfect or done approves, anything else is a criticism that sends it back to go | on screen or in its file; approved, record journals it; sent back, go builds it again |
| proposal | open, decided or culled, journaled | propose opens it, d decides it, record journals it | proposals.md or its own zone file, the word Decided or culled added, then the work journal |
| drive | present, implemented, a feature or journaled | `drive X` makes proposal X the drive; `drive` or `go drive` implements drive.md, then moves the proposal to working features rewritten as a feature description when it is an app feature, or else to the work journal as what was changed and why | zone/drive.md, then working features.md or the work journal |
| pac | open, decided, a case | pac opens it, d decides it, one that teaches something new becomes a case | zone/proposals.md, then logs/decisions.md and truth/cases.md |
| decision | made, live, final | d makes it, its why lives on, consolidate makes it final | the owning truth and one D: line in log.md, then logs/decisions.md, where the line stays |
| idea | kept, promoted or culled | propose captures it, consolidate promotes or culls it | ideas.md, an I: line or questions.md, then a truth or a proposal |
| draft guide rule | captured, rewritten, placed | Jonathan corrects co, at v or in any turn, and learn captures it; Jonathan rewrites and ticks it; record places it | zone/learn.md, ticked there, then its truth and the work journal |

## Draft guide rules

A draft guide rule is born from a correction Jonathan made —> a checkbox item describing what co does or should do goes into [learn](../../zone/learn.md), shared's or the project's own.

Jonathan reads it, working through each new entry, rewriting until it can become a truth. He checks it off.

During the next `record` call, co will process all the checked off items, moving each into its truth and the work journal.
