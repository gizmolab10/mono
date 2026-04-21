# Build Notes

The build-notes table is hand-distilled from the git log. Each entry is one short line that names a single shipped capability or shipped milestone.

The source table is the markdown file `di/src/lib/md/builds.md`. The bundler reads that file at build time and turns each row into one entry the in-app build-notes panel renders. See `notes/guides/develop/build.md` for how that pipeline works.

## How to extend the table

Take this in order. The whole pass takes ten or fifteen minutes for a couple of weeks of commit history.

### 1. Read the existing table

Open the source markdown file and note two things: the highest build number used so far, and the date of the most recent entry. The existing entries are listed newest at the top. Within a same-day pair, the later entry sits above the earlier one and carries the higher build number. New entries follow the same convention.

### 2. Pull the commit history since that date

Run a git log scoped to the window you want to summarise. The reverse flag lists oldest first, which makes consolidation easier. The short date and short hash keep the output narrow. Skip merge commits.

```sh
git log --since='YYYY-MM-DD' --until='YYYY-MM-DD' --no-merges \
  --pretty=format:'%h %ad %s' --date=short --reverse
```

### 3. Filter the list down

Walk the list once and drop everything that is not a real build. Drop:

- pure cosmetic or aesthetic tweaks ("colors", "darker controls", "common hover", "looks better");
- bug fixes by themselves ("fix infinite grids", "rotation tweak", "missed one");
- internal reorganisations and file moves that do not change behaviour;
- documentation-only updates;
- work in other projects in the same repo, when those touch folders outside the design-intuition app;
- mothballed work that was parked rather than shipped — entries that say "give up", "moth ball", "park".

Keep:

- new user-facing capabilities ("snap and pin", "shrink to fit", "background grid");
- new architectural pieces that change what the app can do ("axis-agnostic algebra", "reverse traversal", "lacemaker");
- new screens, panels, navigation modes, or input modes ("electron multi-window", "mobile support", "arrow-key navigation");
- significant data-model additions ("angular smart object", "axis swap", "unlockable givens");
- shipped fix chains for long-standing flaws when the fix lands a real capability ("undo / redo").

### 4. Consolidate multi-commit chains

A single feature often takes several commits to land — false starts, refactors, a "phase A" and a "phase B", then a final "done!". Collapse the chain to one entry, dated on the day the chain finally landed, and use a one-line note that names the shipped feature, not the journey. The intermediate "step 3 done" and "brain fried" commits do not get build numbers.

### 5. Decide on borderline commits

Some commits are between cosmetic and significant — for example a small but visible new column, a new button, a polish pass that meaningfully changes feel. When in doubt, propose to Jonathan with the commit subject and reasoning. Add only after he confirms.

### 6. Write the notes

Aim for one to six words per note. Existing entries set the tone: "library", "formulas", "stairs", "stud wall (stretch)", "list (of SO hierarchy)". Use lowercase except for proper nouns or initialisms. Pick the user-facing capability name where one exists, otherwise the architectural name. Avoid version numbers, ticket numbers, or commit hashes.

### 7. Assign build numbers

Number new entries sequentially in chronological order, starting one above the previous high. Within a same-day pair, the later commit gets the higher build number. The newest overall entry is at the top of the table.

### 8. Insert and verify

Add the new rows above the previous newest entry in the source markdown file. Replace any blank placeholder rows that sit between the header and the previous newest — the bundler skips blanks, but they clutter the file.

After saving, the running dev server picks up the change and the in-app build-notes panel refreshes. The little build button at the bottom of the canvas should now read the new highest number. If it does not, the row may have been dropped because its first cell was not a number with the column-divider bar in front of it.

## Notes for the AI collaborator

- Do not invent capabilities — every entry must trace back to a real commit on a real day.
- Do not include personal commit messages verbatim — distill to one short noun phrase.
- Propose the full list to Jonathan before writing it into the file, especially if the window covers more than two weeks. He will prune.
- Same-day pairs and three-in-a-day clusters happen — match the existing pattern.
- The build number drives the toolbar button label. Adding entries also bumps that label.
