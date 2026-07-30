# Performance — the pause before the file list shows

You saw a pause when switching to the list. The table is not the cause. Waiting on AnythingLLM is.

## What the numbers say

A timing line was added to the list and read from the log:

> List timing: 14ms from start to rows on screen for 1 row(s) of 1 in the store — walking and building 0ms, narrowing 1ms, folder counts 0ms, drawing 12ms.

Fourteen thousandths of a second, all in, for the whole table. Nobody sees that.

The four lines just above it in the log say where the time actually went:

> AnythingLLM: read the current address "…trycloudflare.com" from the pointer.
> AnythingLLM: read the current address "…trycloudflare.com" from the pointer.
> AnythingLLM: using existing workspace "intersection" (slug "intersection").
> AnythingLLM: read 1 embedded document(s) from the workspace.
> AnythingLLM: read the record index (relationships 0, predicates 0, documents 1, taggings 0, tags 0).

Five trips out to the internet, through a tunnel, before the list has a single document to draw. The first two are the same read, done twice.

## What I had guessed, and was wrong about

Before measuring I named three suspects: the table being rebuilt from nothing on every switch, every row being drawn with no windowing, and three passes over the store before the first row appears. All three are real, and none of them matters yet — with one document they cost nothing. They come back only when the store holds hundreds of documents. That is the point of the timing line: it will say so.

## Fixes, cheapest first

1. **Stop reading the address pointer twice.** Two identical reads, back to back — one is waste. Cheapest win, no change in behavior.
2. **Draw the list from what this browser already knows.** Keep the AI store's last records here, show them at once, and let the reads catch up. Today the screen waits for the reads before it will decide anything, so an empty screen is held until the network answers.
3. **Redraw when the reads land.** Once the store answers, refill and redraw. A count that changes a moment later is better than a wait with nothing on screen.

## Success

Switching to the list puts rows on screen at once, with no wait for the network. The log's timing line stays in the tens of milliseconds, and the AnythingLLM lines appear after the rows, not before them.

## Later, when the store is large

The three earlier suspects, in the order the timing line will expose them:

1. Every row is drawn, however many there are — no windowing. Fix: draw the rows in view plus a margin.
2. The narrowing runs twice over the whole list: once for what shows, once for the folder counts. Fix: one pass, both answers.
3. The table is rebuilt from nothing on every switch. Fix: keep it and hide it.
