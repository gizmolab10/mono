# Co — wisdom layer for AI assistants

**Started:** 2026-02-23
**Status:** Ideas

**The pitch:** OpenClaw gives your AI superpowers. Co gives it wisdom and creative force multiplier.

Co is the free open-source layer, monetized through templates/onboarding ("get started in 10 minutes instead of 3 months")

beginning each chat. detect files that need updating & inform me (eg, maps)

## The problem

AI assistants are powerful and generic. OpenClaw connects yours to 50+ integrations, WhatsApp, Slack, cron jobs, the works. It's an excellent *body*. But it doesn't know what you hate. It doesn't learn from its mistakes. It doesn't write in your voice. Every session starts from zero.

i spent months building a collaboration system that actually works — guides, gates, pitfalls, learning loops, voice rules, role definitions. The AI got better at working with me over time. Most people will never do this. They shouldn't have to.

- [ ] what's the minimum viable collaboration system?
- [ ] how to onboard without months of grinding?

## The idea

Co is the missing layer. Not a competing platform — a collaboration layer that sits on top of whatever AI assistant you already use. OpenClaw, Claude Code, whatever comes next.

The architecture is general. The content is personal. Co ships the architecture and helps you fill in the content.

## What Co does

### Persistent memory that improves

Not session history. Not `/compact` summaries. Structured guides that the AI reads every time, written in your words, updated from real experience.

### Learning from mistakes

raw log → pattern → rule → guide update. Every collaboration accumulates friction. Co has a pipeline for turning friction into polish. You correct the AI, Co logs it, finds the pattern, writes the rule. Next session, same mistake doesn't happen.

### Gates

Forced checkpoints before risky actions. Not optional discipline — structural. The AI *must* read the relevant guide before acting. Skipping always costs more than pausing. This is the thing nobody else does.

### Roles

Human owns direction and taste. AI owns execution and recall. Explicitly defined, enforced. When the AI starts volunteering competing directions, the collaboration breaks. Co prevents that.

### Voice

The AI writes like *you*, not like a help desk. Captured from examples, enforced every response. A lawyer gets precision. An artist gets warmth. The system captures any voice, doesn't impose one.

### Task taxonomy

Different kinds of work need different discipline. Refactoring needs search-first. Debugging needs hypotheses. Prose needs voice. Co lets you define your categories, each with its own rules and gates.

### Shorthand

Your commands, your shortcuts. Not a fixed set — a way to define them.

## How it sits on OpenClaw

OpenClaw has `AGENTS.md`, `SOUL.md`, `TOOLS.md` — static config files. Co replaces them with a living system:

| OpenClaw provides | Co adds |
|---|---|
| Gateway, routing, 50+ integrations | — |
| AgentSkills (shell, file, web) | gates that intercept before risky skills fire |
| Session history, `/compact` | structured guides that persist *across* sessions |
| Static workspace config | learning pipeline that *updates* config from mistakes |
| Model selection, thinking depth | voice capture, role definition, task taxonomy |
| Cron, webhooks, automation | discipline that prevents the automation from doing dumb things |

**Concretely:**

- Co's guides become a dynamic `SOUL.md` — not hand-written once, but evolving
- Co's learn log feeds distillation that updates the soul automatically
- Co's gates inject pre-action checkpoints into AgentSkills
- Co's voice shapes every response, regardless of channel
- Co's shorthand becomes custom commands in the session system

**What OpenClaw would need:**

- pre/post action hooks (gates need to intercept before execution)
- persistent structured storage beyond session history
- config self-modification from within a session (learning loop writes rules)
- or: Co runs as a sidecar wrapping the gateway, injecting context

**Why on top, not competing:** OpenClaw has the community, the integrations, the momentum. Building a competing platform is a losing move. Building the missing layer on top of the winning platform — that's leverage.

### OpenClaw's price structure

OpenClaw is open-source. Free to self-host. The money is in their cloud offering:

| Plan | Price | Messages | Channels | Support |
|---|---|---|---|---|
| **Essential** | $39/mo | 1,000/mo | Telegram only | Email (48hr) |
| **Professional** | $79/mo | 3,000/mo | All (Telegram, WhatsApp, Discord) | Email (24hr) |
| **Executive** | $149/mo | Unlimited | All + priority routing | 4hr response, dedicated manager |

Self-hosted costs $5–30/mo in API fees. Most personal users land around $6–13/mo. Teams $25–50. Heavy automation $100+.

**What this tells us about Co's positioning:**

- OpenClaw monetizes *hosting and convenience* — "no API keys, 60-second deploy"
- The value increases with *volume* (more messages, more channels)
- There's nothing in their tiers about *collaboration quality* — no learning, no voice, no gates
- Co's value is orthogonal: it doesn't compete on messages-per-month. It competes on *how good each message is*
- Co could be a paid add-on at any tier. $10–20/mo for the wisdom layer? The user already paying $79 for Professional would pay more for an AI that actually learns their preferences
- Or: Co is the free open-source layer, monetized through templates/onboarding ("get started in 10 minutes instead of 3 months")

## What's universal vs. personal

**Universal — everyone needs these:**

- persistent memory that survives sessions
- learning from mistakes (log → pattern → rule)
- gates before risky actions
- clear roles (human = what/why, AI = how/where)
- correction protocol (log it, find the pattern, write the rule, move on)

**Personal — varies per human:**

- voice (lowercase i vs. legalese vs. warmth)
- task taxonomy (refactor/debug/prose vs. wireframe/critique/iterate)
- shorthand (your commands, your shortcuts)
- domain knowledge (geometry vs. law vs. teaching — the *structure* of guides transfers, the content doesn't)

## Productizing

- [ ] the core loop: show the AI what good looks like, extract the lesson, store it
- [ ] a place for rules that persist (guides equivalent)
- [ ] a place for mistakes that get distilled (learn.md equivalent)
- [ ] gates — forced reading before acting
- [ ] voice — captured from examples, enforced
- [ ] roles — defined, not implicit
- [ ] onboarding: guided setup that asks the right questions to seed the system
- [ ] escape hatches: "relearn", "stop", shorthand that feels natural

## Open questions

- [ ] ask it the right qs -> lean into learning
	- [ ] are you leading me down the garden path?
- [ ] is this a template? a tool? an app?
- [ ] who's the audience — developers? creatives? both?
