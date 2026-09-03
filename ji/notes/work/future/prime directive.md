# Prime directive

What ji is really for — the thing that sets it apart from every other "ask your documents" tool.

## Where ji stands today

ji already is the common "ask your documents" tool, and a bit past it: a private, local document store mirrored to a local AI (AnythingLLM on a local model), with cited answers and a running chat — plus its own storage, a real interface, and multi-machine sharing through the thin proxy. The rougher sketches of this (a laptop RAG script with a plain chat box) are behind where ji already is.

What ji does **not** yet do is the thing that makes it distinct: the weak-signal engine below. The common tool is question-driven — you ask, it fetches the nearest few and answers. It never maps the whole field or looks at the edges. That mapping is the unbuilt part, and it's the whole point.

So: the plumbing is done; the differentiator is the proposal below.

## Proposal — building the rest

### (a) The weak-signal engine

The good news: the dots already exist. When ji mirrors a document, the AI's helper already turns each clip into a dot (an embedding) and stores it. So we're not starting from nothing — we're reusing what's already made.

The build, in stages (each a usable step on its own):

1. **Reach the dots.** Get at the stored dots for the workspace's clips. *(First unknown to verify: the AI keeps them in its own vector store — check whether it hands them back through its interface, or whether ji must run the same dot-maker itself over the clips. Settle this before building.)*
2. **Group them, loners allowed.** Cluster the dots with a method that leaves outliers ungrouped (so the lonely ones survive as candidates, not forced into a bucket). This gives the strong huddles and the weak tail. No AI — plain math.
3. **Score each huddle.** Count the distinct people in it, how tight it is, and how it spreads over time (and how far it sits from the big crowds). Plain arithmetic.
4. **Name the strong ones (easy win).** Let the AI read each strong huddle and put a short name to it. This is a real, complete feature on its own — a "themes" view over the store.
5. **Triage + curate the weak ones.** Rank the weak huddles by the score, show the top ~20 with their real clips and who wrote them, and let a person keep / highlight / toss. Feed the calls back so the pile sharpens each round.

Phase it: 1–4 first (reach the dots, cluster, score, name the strong huddles — a themes view). Then 5 (the weak-signal curate loop), which is the harder, judgment-heavy differentiator.

### (b) Content framing

Keep the engine mission-agnostic — the machinery above cares nothing about the topic. The "framing" is a **swappable lens**, not baked in:

- A per-store setting holds a short written directive (the aim, the values, what to look for). The AI reads it only at the narrating step — naming huddles, describing candidates — so the same engine serves any mission by swapping that text.
- The curator's lens is the human half of the same thing: the person judging weak huddles brings the framing to the keep/highlight/toss call.

So one neutral engine, many missions: change the directive text (and who curates), not the code. This keeps ji a general instrument — the values live in a setting, not in the wiring.

## The aim

Surface the **weak signals and the patterns that repeat across many people's inputs**. Not the loud consensus — the quiet stuff at the edges that more than one person quietly touched, and the themes that keep coming back across different voices.

Ordinary "ask an AI about your documents" does the opposite. You pin your question and it hands you the few closest pieces — the crowded middle, what most people already say. Point that at the quiet edges and it works against you. So the common tool is the wrong tool for our aim on its own.

## The board

Picture every scrap of everyone's writing as a dot on a huge board, where dots that mean the same thing sit close together. That board has hundreds of directions, not two — the exact number depends on the helper that makes the dots (a few hundred to a few thousand; a small common one is 384) — but the idea holds: close dots, close meanings.

## The recipe

1. **Dotify.** Turn everyone's writing into dots on the board. (A helper called an embedder does this — it boils a whole passage down to one point. It is not the chatting AI.)
2. **Find the lonely huddles.** Look for small groups far from the big crowds — the sparse edges, not the dense center.
3. **Keep the ones fed by several different people.** Count how many distinct people (or documents) sit in each huddle; a theme that repeats is one fed by many separate sources.
4. **Let the AI narrate.** Only now does the chatting AI step in — it reads each finalist and says, in words, what it's about.

Who does what: the embedder dotifies (step 1); plain counting and measuring find the huddles and tally the people (steps 2–3, no AI at all); the chatting AI only narrates the finalists (step 4).

The dots are the same raw material the common tool builds — we just use them with the opposite move: not "grab the nearest few," but "look deliberately at the sparse edges, and count who keeps showing up there."

## A piece is a clip, not a whole file

A long file holds many ideas, so dotting it whole gives one blurry average. So a file is chopped into clips — a paragraph or a few sentences each — and every clip gets its own dot. A short note can be one piece; a long doc becomes many. Finer clips make sharper dots.

## Two kinds of huddle

A huddle is a spot on the board where a bunch of dots sit close together — a clump of clips that mean nearly the same thing. Nobody names it in advance; it shows up because that many clips landed near each other. It's really a slope from crowded to lonely, but two useful buckets:

- **Strong huddles** — big, dense, fed by many separate people. Trustworthy on their own; they barely need judgment, just a name.
- **Weak huddles** — small, sparse, faint: a handful of dots, roughly two to ten. If one grew bigger it'd be strong. Down here signal and noise look alike, so these are the ones a human has to weigh.

Roughly, a modest pile (a few hundred to a few thousand clips) settles into a handful up to a few dozen strong themes, plus a long tail of tiny huddles and loners. The count swings with the clip size and how loose the grouping is set — it's a dial you turn.

## Curating the weak huddles

The machine is a good filter, not an oracle. It can't tell a faint gem from noise on its own — a lonely clump might be a real weak signal, or a typo, a tangent, or one person repeating themselves. So a person judges the weak ones.

For each weak huddle, shown with its real clips and *who* wrote them (words, not a score):

- **Sit with it.** Does this ring true? Is it one real idea, or a coincidence — the same words used for different things, or one person repeating themselves?
- **Make a call.** Keep it, highlight it (worth more attention), or toss it as noise.
- **The calls teach the next pass.** Tossed ones stay gone; kept ones get watched and count more when they recur. So the pile to sift shrinks and sharpens each round.

Only a small batch is ever hand-judged at once — about ten to twenty-five per pass — even though the raw weak tail can be many. You set the cutoff there on purpose, so curating stays sift-able.

## Triage — a crude, no-AI ranking

Which weak huddles to judge first? Score each with cheap signals (plain arithmetic, no model), sort high-to-low, and put the top ~20 in front of the eye first:

- **How many *different* people are in it** — the strongest cheap signal. Three people beats one person saying it three times; single-person huddles sink to the bottom on their own.
- **How tight it is** — a crisp little knot (dots almost on top of each other) is more likely one real idea; a loose smear is more likely coincidence.
- **Spread over time** — it recurs across different dates, not one burst; and how far it sits from the big crowds (truly off on its own reads as more novel).

Add those up into one rough number and sort. It's all counting and measuring — no AI — and it floats the most promising faint echoes to the top and the junk to the bottom, so the human eye is spent where it pays.
