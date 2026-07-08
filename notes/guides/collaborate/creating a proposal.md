# How we wrote the proposal from scratch

## Where we started

There was one line of work on the to-do list: "make the home page show content from md files instead of having the text baked into the page." The home page at that point held a single hard-coded line — the project name. The md folder held one note. The assets folder held one image. Everything else was empty.

## How we worked

We did not try to write the whole proposal in one go. We worked in short cycles. Each cycle had the same three steps.

1. **Read what is there.** Before saying anything about the design or the files, we opened the actual files and looked. When you said the sidebar file was hand-written, we read the file to see how. When the proposal said a piece of code lived somewhere, we checked.
2. **Find the gap.** We re-read what we had and asked: is there anything missing, anything two parts contradict each other on, anything that would block someone trying to build it? Each gap was one specific bullet.
3. **Settle the gap.** You picked an answer. Sometimes you picked from a list of options I laid out. Sometimes you wrote the answer yourself in the file. Once an answer was settled, the proposal got the new wording.

Then we ran the cycle again. And again. Each pass picked up smaller gaps than the one before, because the big-shape questions were already answered.

## What lived where

We kept two documents side by side.

The **proposal** carries the forward-facing design — what someone needs to know if they want to build the thing. It stays clean. It does not carry the history of how it got there.

The **journal** carries the record — every decision we settled, every option that got ruled out, every thing we agreed to defer until later. It does not contradict the proposal. It just remembers why the proposal is the way it is.

When something was a decision we made, it went in the journal as a decision. When something was a thing the builder needs to know, it went in the proposal as a fact about the design.

## Choosing between options

Some questions had real options with tradeoffs. Should a click load the new page from scratch, or swap the content in place? Should the centered-text feature use HTML, or a new symbol, or a re-purposed callout? Where should the styling file live?

For each of those, we wrote out the options with their pros and cons. You picked one. The proposal recorded the pick; the journal recorded the choice and (sometimes) what we ruled out and why.

## Things we set aside

A few features came up that we decided not to build in the first pass — math, syntax-highlighted code blocks, body tags, wiki-links that scroll to a specific spot inside a page. Instead of dropping them on the floor, we wrote them down in a "deferred — possible future features" section of the journal, with a note about what each one would need.

That way the next time we open the journal, the deferred work is still listed. We do not have to remember it from scratch.

## How we knew when to stop

We stopped each round when re-reading the proposal turned up nothing new — no contradictions, no undefined behavior, no thing that pointed at code without saying where the code lived. The first few rounds turned up many real gaps. The last rounds turned up smaller and smaller things — a stray word, a sentence in the wrong section, a piece of code with no listed home — until even the smaller things stopped appearing.

At that point, the proposal could be picked up by someone who had never seen this conversation, and they could start building.

## What helped

A few habits made the cycles work:

- **Read before claiming.** When the proposal said something, we checked the source. When you wrote a directive, we read it back to be sure of the wording.
- **One change, then re-evaluate.** We did not stack five edits into one round. Each round had its small batch and then a fresh read.
- **Tighten language as we go.** Words we used early got replaced by sharper words later. "Notes" became "md files." Vague phrases got specific examples.
- **Surface contradictions early.** When two parts of the proposal disagreed (for example: who owns the toggle button, the sidebar component or the page shell?), we named the contradiction in plain English and you picked the side.
- **Leave a paper trail.** Every decision left a bullet in the journal. Nothing was lost when the proposal got re-shaped.
