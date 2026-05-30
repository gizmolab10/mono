# Always (di)

Rules specific to the di project. Read alongside the global always file at `~/GitHub/mono/notes/guides/pre-flight/always.md` and the project file at `~/GitHub/mono/di/CLAUDE.md`.

1. **Lexicon enforcement** — every prose response goes through `di/.claude/hooks/precheck.sh` before sending. The lexicon and banned-substitutions table at `di/notes/guides/development/learn/lexicon.md` is the source of truth for word choice.
2. **Yarn, never npx** — every package binary call uses yarn.
3. **Snap hook for reverts** — `di/.claude/hooks/snap.sh` handles file reverts; never restore files manually.
4. **Read on load** — these four `di` files
    - [ ] `notes/work/now/learn.md`
    - [ ] `notes/guides/pre-flight/lexicon.md`
    - [ ] `notes/work/now/handoff.md`
    - [ ] `CLAUDE.md`.
