# Next Steps

Fleshed out from the [[ma/notes/work/done/proposal]].

---

## 1. Share with council members

Steve and Pete need to see the proposal and react before anything gets built.

**What to send:** The proposal as-is. It's short enough to read in one sitting. No deck, no formality — just the doc.

**What to ask:**
- Does this match what we discussed?
- What's missing or wrong?
- Are you in? What role do you see yourselves playing?
- Who else should be at the table?

**Format:** In-person or call, not email. This needs conversation, not comments. Bring a printed copy if in-person.

**When:** This week. Momentum matters — the Wendy meeting was 2/24, and ideas cool fast.

---

## 2. Define the maturity assessment as a usable tool

The proposal lists eight maturity criteria. That's a start, but it needs to become something people can actually use — not just read.

### What exists already

- **CNCF levels** (Sandbox → Incubating → Graduated): The most successful maturity model in practice. Companies use graduated status as a procurement filter. But it's cloud-native only and process-heavy.
- **NASA Reuse Readiness Levels**: 1-9 scale covering documentation, packaging, portability, licensing. Clear and graduated, but no community health dimension and no ongoing monitoring.
- **OpenSSF Scorecard**: Automated security health checks — signed releases, branch protection, CI tests. Actionable but narrow (security only, GitHub only).
- **CHAOSS metrics**: Community health analytics — contributor activity, responsiveness, diversity. Descriptive, not prescriptive. No single score.

### The gap

Nobody combines *code quality* + *UX quality* + *community health* + *ecosystem fit* into one assessment. The tools above measure signals but don't synthesize them into a maturity judgment a human can act on.

### What to build

An interactive scorecard. For each of the eight criteria, define:

| Criterion | What "good" looks like | How to measure it |
|-----------|----------------------|-------------------|
| Minimal bugs and code debt | Low open issue count relative to size, no known critical bugs | Automated (issue tracker) + manual review |
| Rich feature set | Covers the core use cases without hacks or workarounds | Manual review by council |
| UX: well reasoned | Consistent interaction patterns, clear affordances | Manual review + user feedback |
| UX: self-consistent | Same action, same result everywhere | Manual review |
| UX: familiar look and feel | Follows platform conventions, no surprising behavior | Manual review + user feedback |
| Integration | Works with related pieces, clean API boundaries | Automated (dependency analysis) + manual |
| Saves time | Faster to adopt than to rebuild | User testimonials + time-to-integrate metric |
| Fulfills obvious need | Solves a problem people actually have, not a hypothetical | Usage data + request frequency |
| General purpose | Adaptable across contexts, not locked to one stack | Manual review of API surface |
| Awesome support | Responsive, helpful, human | Response time metrics + user feedback |

**Output format:** A single page per project showing a radar chart or simple grid. Green/yellow/red per criterion. No single number — the point is to see the shape, not reduce it to a score.

**First test:** Run the assessment on one of our own projects (ws, di, or s3). Eat our own cooking.

---

## 3. Sketch the request / evaluate / deliver flow

This is the engine. Without it, the ecosystem is just a directory.

### The flow

```
Request → Triage → Search → Evaluate → Match → Deliver → Follow up
```

**Request:** A builder submits a need. Could be specific ("I need a date picker that works with Svelte 5") or abstract ("every project I see rolls their own auth"). Submitted through a simple form — title, description, context.

**Triage:** Council member (or AI first pass) categorizes: Is this a known pattern? Does a mature piece already exist? Is this a gap worth filling?

**Search:** AI scans the registry for existing pieces that match. Surfaces maturity assessments, usage data, and integration notes. This is where AI earns its keep — not deciding, but summarizing.

**Evaluate:** Council reviews the search results. If a mature piece exists, the answer is "use this." If multiple candidates exist, the council assesses which is closest and what's missing. If nothing exists, it becomes a gap to fill.

**Match:** Connect the requester with the builder(s) of the best match. Or, if it's a gap, connect builders who might want to fill it. Small pieces, promised deliverables.

**Deliver:** The piece gets adopted, adapted, or built. The maturity assessment runs on the result.

**Follow up:** Did it work? Did the integration hold? Feed this back into the maturity assessment.

### What to prototype first

A lightweight version: shared doc or simple web form for requests. Council reviews async. AI search is manual (a person using ChatGPT/Claude to scan). Matching is a conversation. No automation yet — prove the flow works before building the plumbing.

---

## 4. Market research

### Who's tried this

**Component discovery platforms:**
- **Bit.dev** — Components as mini-repos with search, playground, auto-docs. Works for React/Angular. Falls short: auth friction, inconsistent previews, fundamentally an npm overlay. Doesn't assess quality.
- **JSR** (Deno team) — TypeScript-first registry, cross-runtime. Smart design, but no curation or quality signals. Tiny ecosystem.
- **Backstage** (Spotify) — Internal developer portal with a software catalog. 99% adoption inside Spotify. Outside: ~10% adoption, 6-12 months to stand up, catalog goes stale fast.

**Maturity / health tools:**
- **OpenSSF Scorecard** — Automated security checks. CISA-endorsed. GitHub-only, security-only. No quality or UX judgment.
- **CHAOSS** — Community health metrics. Descriptive, not prescriptive. No single actionable output.
- **Libraries.io / Tidelift** — Dependency monitoring across 36 package managers. Tidelift pays maintainers to follow best practices. Expensive, catalog-only, creates two tiers.
- **Google deps.dev** — Dependency graphs + vulnerability data at scale. Read-only, no curation, no quality assessment beyond security.

**Governance models:**
- **Apache Software Foundation** — Meritocratic PMCs, 300+ projects, 25 years. Works but quality varies wildly across projects. No centralized direction by design.
- **Eclipse Working Groups** — Vendor-neutral, equal-voice governance. Produces real standards. Slow, consensus-driven, membership paywall.
- **CNCF TOC** — Most visible governance for cloud-native. Corporate membership creates implicit power dynamics. Heavy process.

**API marketplaces:**
- **RapidAPI** — 80k+ APIs, unified interface. Scale is the selling point. Quality control is nonexistent. APIs disappear without warning. Support is absent.
- **Apideck** — Integrations marketplace for SaaS. Focused and useful but narrow — only SaaS-to-SaaS.

### What worked across the board

- **Graduated tiers** (CNCF) give adopters real signal. People trust the label.
- **Paying maintainers** (Tidelift) makes security practices 55% more likely.
- **Automated scanning** (Scorecard, deps.dev) scales. Manual assessment doesn't.
- **Eating your own cooking** (Backstage at Spotify) proves the model before evangelizing.

### What failed across the board

- **Academic maturity models** (QSOS, Capgemini) — no tooling, no adoption.
- **Uncurated marketplaces** (RapidAPI) — scale without quality is noise.
- **Heavy governance** — slows everything down, attracts process people, repels builders.
- **Manual catalogs** — go stale immediately. Trust erodes, adoption collapses.

### The gap we'd fill

Nobody combines curated discovery + maturity assessment + lightweight governance + matchmaking between builders. Especially not for indie and small-team scale. The foundations (Apache, CNCF, Eclipse) serve large corporate ecosystems. The tools (Scorecard, CHAOSS) measure signals but don't act on them. The platforms (Bit, Backstage) help you find things but don't tell you if they're good.

We'd be the first to do all of it together, small and human-first.

---

## 5. Prototype the product / service matchmaker

The matchmaker is the user-facing piece — where someone shows up with a need and leaves with an answer.

### What it is

Not a marketplace. A matchmaker. The difference: a marketplace lists everything and lets you browse. A matchmaker asks what you need and tells you what's good.

### How it works (v1)

1. **You describe your need** — plain language. "I need auth for a Svelte app" or "I need a tree visualization component" or "I need a way to store hierarchical data."

2. **The system searches** — against the registry of assessed pieces. AI does the keyword matching and summarizing. Returns a short list with maturity assessments attached.

3. **A human reviews** — council member or experienced builder adds context. "This one's solid but hasn't been tested at scale." "This one's rough around the edges but the maintainer is responsive." "Nothing exists yet — here's who might build it."

4. **You get connected** — to the piece, the builder, or both. Not a transaction. A relationship.

### What to build first

A single page on the ma docs site:

- **"What do you need?"** — text input
- **Below:** A hand-curated list of pieces we already know about (starting with our own: ws, di, s3)
- **Each entry:** Name, one-line description, maturity summary (the radar/grid from step 2)

No AI search yet. No dynamic matching. Just a static, honest directory that proves the concept. If people use it and ask for more, build the engine.

### Later

- AI-powered search across the registry
- Submission form for new pieces
- Automatic maturity assessment integration
- Notification when a match is found for an open request
