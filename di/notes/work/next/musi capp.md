# Music/File App — Working Notes

A read-only file finder. Point it at a folder, it indexes everything by category,
and gives you a clean way to search and open files (e.g. music) — without ever
moving, renaming, or deleting your originals.

---

## The journey (how we got here)

1. **Started broad:** a generic, cross-platform file *organizer*.
2. **Asked: is AI overkill?** → Yes for the core. The bulk of organizing is
   deterministic (crawl, sort, dedup, rename). AI only earns its place on the
   fuzzy ~10% (content-based tags).
3. **Does it already exist?** → Yes. Rule-based (`organize`, Hazel, FolderFresh)
   and AI-based (AI File Sorter, Local-File-Organizer). Crowded space.
4. **Is their UX good?** → No. Engines are fine; UX is the weak link. CLI/config
   tools (organize) or plain, dated GUIs. **UX is the opening.**
5. **Scoped down:** don't move files at all. Crawl → metadata index with a
   *category* per file. A read-only UX to find and open. Near-zero risk.
6. **Built it.** Working, tested prototype.

---

## Conclusions

- **AI is not needed.** Extension-based categories cover the real job
  ("find my music"). AI is an optional garnish, skippable.
- **UX is the defensible bit.** Everyone has the sorting logic. Nobody nails the
  feel. Compete on UX, not on the engine.
- **Read-only by design = no risk.** The index is disposable; originals are
  untouchable. No approve/undo needed because nothing is destructive.

---

## Risk model (why read-only wins)

Risk tracks *destructiveness × confidence*:

- Read/crawl → **none**
- Move/rename → low–med (recoverable with undo log)
- Delete (esp. AI-driven near-dup removal) → **highest**, where data is lost

Our tool stays entirely in the "read" tier. That's the whole safety story.

---

## The prototype: `fileindex.py`

One Python file, standard library only, cross-platform (macOS/Windows/Linux).
Nothing to install.

```
python3 fileindex.py crawl ~/Music      # builds index.db (SQLite)
python3 fileindex.py serve              # opens read-only browser UI
```

- **Index** = SQLite `index.db`: path, name, ext, **category**, size, mtime, mime.
- **Categories** from extension: Music, Video, Images, Documents, Spreadsheets,
  Presentations, Ebooks, Archives, Code, Fonts, Apps → unknowns fall to "Other".
- **Crawl** recurses subfolders, skips hidden files/dirs.
- **Viewer** is read-only: category sidebar w/ counts, live name search, click a
  row to open in the native app. Re-scan rebuilds the index.

Tested: deep recursion, hidden-file skipping, uppercase extensions, music filter.

---

## UX design (the read-only finder)

One screen. No setup, no modes. Principles: nothing to configure, nothing
destructive, instant feedback.

- **Open** → shows your stuff immediately. First run asks for a folder, once.
- **Left** → categories with live counts (Music 412, Photos 1.2k…). One click
  filters. "All" is default.
- **Top** → one search box. Type "live 1998" → narrows as you type. Search is
  the primary verb.
- **Center** → results list (name, type, size, date). Click → opens in native app.
- **Invisible safety** → read-only, so no approve/undo to need. Re-scan is one
  button.

The defensible "natural" is what's *absent*: no rules to write, no folders to
drag, no fear of breaking anything. **Feels like Spotlight for a folder, not
like Hazel.**

> Hazel = program a rules engine that rearranges your disk (config + destructive).
> This = search a thing you never configured (zero config + safe). Opposite lane.

---

## Optional AI tag layer (parked, not needed)

> Optional pass: AI reads file contents, adds smart category tags.

"Smart" = semantic, content-derived labels the extension can't know:

- **Music:** genre, mood, artist, album, BPM (audio/ID3)
- **Documents:** topic, type (invoice/contract/résumé), project, people named
- **Images:** what's in them (beach, receipt, screenshot), OCR'd text

Extension tells you *it's an .mp3*; smart tells you *it's lo-fi jazz*.

---

## How we work together

- **You own taste & intent:** what "natural" feels like, what to cut, which
  flows matter, real-world testing on your own files. Judgment calls are yours.
- **I own execution & breadth:** working variations fast, cross-platform
  plumbing, edge cases, refactors, honest pushback. Cheap to ask — use me as a
  fast option-generator.
- **The loop:** intent → 2–3 options → your taste reacts → build the chosen one.
  Short cycles, real files, your gut as tiebreaker. Avoid letting logic drift
  from feel — so you test, not me.

---

## Next steps (when ready)

- Incremental re-crawl (only update changed files)
- The AI tag layer (if ever wanted)
- One-page spec / clickable HTML wireframe

_Status: muddling on my own for now._
