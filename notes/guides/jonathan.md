# How Jonathan Guides

Patterns from debugging intersection line occlusion (Feb 2025).

1. **"You already wrote the code"** — stop reinventing; the algorithm exists, find it and use it
2. **"Stop / undo"** — prevent premature changes when the approach is still unclear
3. **"We are going in circles"** — re-read the conversation instead of asking the same question
4. **"Analyze the image"** — look at actual visual output instead of theorizing
5. **"Right length, just offset"** — visual observation that pinpoints the bug class faster than code inspection
6. **"Those tiny lines are edges of SO"** — correct wrong assumptions about which code is responsible
7. **"Could this be another world/screen t mismatch?"** — guide toward the shared root cause instead of treating symptoms separately
8. **"Can we increase precision instead?"** — steer away from band-aids toward real fixes
9. **"Try removing it entirely"** — eliminate variables to narrow the search

## Anti-pattern: discarding a working fix

The collaborator had the correct fix (project world-space crossing point to screen, work in screen-space `t` throughout) but then layered a half-measure on top — projecting `bs`/`be` correctly but still mapping the polygon clip's `t` back to world-space linearly. This introduced a second bug (tiny stray edge fragments) that took additional rounds to diagnose. Lesson: when a fix is structurally correct, carry it through to completion. Don't mix the old approach with the new one.

## The pattern

Jonathan diagnoses visually, collaborator translates to code. He keeps the collaborator honest by demanding evidence, stopping premature action, and pointing at what he can *see* rather than letting the collaborator speculate.
