# Maturity Guidance

AI is boosting the churn. We build fast, alone, and we reinvent constantly. The same auth system, the same state patterns, the same deployment pipelines — a thousand times over. Not because the old ones were bad. Because nobody could find them, trust them, or plug them in.

i keep noticing this. What if we could do things once and give ourselves greater reach? Build toward each other in small pieces. Use patterns from nature — adaptable, benevolent, curious. And the hard part: leave room for leniency and breakdowns.

That's the idea. An ecosystem for pattern-making in software. APIs are the memes — repeatable units that spread because they're simple enough to adopt and good enough to trust.

---

## What it takes

### A way to measure maturity

Not a gate. A mirror. Where does a project actually sit?

- [ ] minimal bugs and code debt
- [ ] rich feature set
- [ ] UX that's well reasoned, self-consistent, familiar
- [ ] integrates with related pieces
- [ ] saves time
- [ ] fulfills an obvious and strong need
- [ ] general purpose
- [ ] awesome customer support

Projects don't need to score perfectly. The assessment says what's solid and what's not. Adopters decide for themselves.

Nobody does this well yet. CNCF has graduated tiers — real signal, but cloud-native only and heavy. NASA has Reuse Readiness Levels — clear and graduated, but static and no community dimension. OpenSSF Scorecard automates security checks but that's it. CHAOSS measures community health but doesn't tell you if it's *good enough*.

The gap: nobody combines code quality + UX quality + community health + ecosystem fit into one assessment that a human can act on.

What i'd build: an interactive scorecard. Per criterion, what "good" looks like and how to measure it. Output is a single page per project — radar chart or simple grid, green/yellow/red. No single number. The shape matters more than the score.

First test: run it on one of our own projects. Eat our own cooking.

### A council

Steve, Pete, others. Not gatekeepers — shepherds. Their job:

- evaluate pieces against the maturity framework
- approve, suggest revisions, flag concerns
- guide projects in trouble
- protect the ecosystem from malicious behavior

Bias toward inclusion. Creativity leads. No rigidity.

The approval process: submit a piece or guideline, council reviews, approve or reject with feedback. Meetings as needed. The Apache Foundation has done this for 25 years with meritocratic PMCs — it works, but quality varies wildly without direction. Eclipse Working Groups are vendor-neutral but slow and paywalled. CNCF's TOC has corporate money backing it, which helps and hurts.

What we'd do differently: stay small, stay human, stay fast. No membership fees. No corporate capture.

### An engine to connect builders

This is the heart. Without it, we're just a directory.

```
request → triage → search → evaluate → match → deliver → follow up
```

Someone says "i need a better date picker" or "every project rolls their own auth." Council (or AI first pass) triages: known pattern? mature piece exists? gap worth filling?

AI scans, matches, summarizes — it earns its keep here, but humans make the calls. Council reviews. If something mature exists, the answer is "use this." If there are candidates, assess which is closest. If nothing exists, it's a gap — connect builders who might fill it.

Small pieces. Promised deliverables. Universally adaptable.

Prototype: shared doc for requests. Council reviews async. AI search is manual (a person using Claude to scan). Matching is a conversation. Prove the flow before building the plumbing.

### Standards that breathe

Best practices framed as guidelines, not rules.

- what to standardize and when
- submit → approve → reject (with meetings as needed)
- fun, curiosity, flex and adapt as core values

If a pattern can't spread on its own, it's too complicated. That's the whole test.

### A matchmaker, not a marketplace

The difference: a marketplace lists everything and lets you browse. A matchmaker asks what you need and tells you what's good.

You describe your need in plain language. The system searches assessed pieces. A human adds context — "this one's solid but untested at scale," "this one's rough but the maintainer is responsive," "nothing exists yet, here's who might build it."

You get connected. Not a transaction. A relationship.

v1 is dead simple: a single page with a hand-curated directory of pieces we know about (starting with our own — ws, di, s3). Name, one-line description, maturity summary. No AI search yet. Prove the concept, then build the engine.

---

## The landscape

i looked at who else is doing pieces of this.

**Discovery platforms** solve finding, not assessing. Bit.dev is an npm overlay with auth friction. JSR is smart but tiny and uncurated. Backstage works beautifully inside Spotify (99% adoption) and poorly outside it (~10%, takes a year to stand up, catalogs go stale).

**Health tools** measure signals but don't synthesize. Scorecard is automated but security-only. CHAOSS is descriptive, not prescriptive. deps.dev has Google-scale graphs but it's read-only — no community, no curation. Tidelift pays maintainers (which actually works — 55% more likely to implement security practices) but it's expensive and creates a two-tier ecosystem.

**Governance models** work at foundation scale. Apache's been at it 25 years. Eclipse produces real standards. CNCF has the most visible process. But they're all heavy, slow, and corporate-oriented. Nothing exists for small teams or indie builders collaborating across projects.

**API marketplaces** (RapidAPI, Apideck) are commodity exchanges. 80k APIs with no quality control is just noise. They connect buyers and sellers but don't build shared understanding.

The gap across all of them: nobody does curated discovery + maturity assessment + lightweight governance + matchmaking between builders. Especially not at indie scale. We'd be the first to do it all together, small and human-first.

---

## Values

These run through everything:

- **adaptability** over standardization
- **benevolence** over competition
- **curiosity** over convention
- **leniency** over gatekeeping
- **wisdom** over speed

Systems fail. People fail. The ecosystem absorbs that gracefully, not punishes it.

---

## What's next

- [ ] share this with Steve and Pete — in person, this week, while the Wendy meeting is fresh
- [ ] build the maturity scorecard and test it on one of our own projects
- [ ] prototype the request/evaluate/deliver flow with a shared doc
- [ ] sketch the matchmaker page for the docs site
- [ ] keep researching — who else is moving in this direction, what can we learn from
