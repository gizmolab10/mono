# Collaborator Limitations

Known failure modes. Not excuses — just patterns to watch for.

## Diagnosis Without Prescription

Co can trace code paths, identify bugs, and explain why they fail. But when the fix requires **restructuring logic** (not just patching a value), co often punts:

- Suggests "add logging" instead of proposing the fix
- Stops at diagnosis when the solution is within reach
- Defaults to caution over action

**Example:** Shift-click selection bug. Co traced the path, found the handler, quoted the exact problematic code, articulated why it failed. Had everything needed to propose "move SHIFT check to top of conditional." Didn't.

**Workaround:** If co diagnoses but doesn't propose a fix, ask: "what's the fix?"

## Unknown Unknowns

Co can't reliably predict when these failures will occur. The shift-click example was simple — the fix was one structural change. Co had the context. Still stopped short.

This section will grow as patterns emerge.
