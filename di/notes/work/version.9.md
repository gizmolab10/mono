# version 9

## open

- [ ] locked givens (read-only flag, lock/unlock toggle in UI)
    - [ ] test with bottom drawer height in two drawer cabinet
- [ ] hide children boolean

## done

- [x] rename GivenEntry as Portable_Given
- [x] rename serialized field `constants` → `givens` in Portable_Scene
- [x] bump CURRENT_VERSION to '9'
- [x] migration step: `v < 9` renames `constants` → `givens`
- [x] migration tests (4 passing)
- [x] drop underscores — store spaces everywhere
- [x] idempotent `_` → ` ` migration (SO names, given names, formula strings) before early return
- [x] `merge_refs` joins with space instead of underscore
- [x] `merge_refs` added to `Compiler.compile()` and `Attribute.deserialize()`
- [x] removed forced `replace(/ /g, '_')` from Engine.ts and P_Givens.svelte
- [x] underscore migration tests (4 passing, 8 total)
- [x] auto remove `_` from file names (saving + library display)

### rename constants as givens

the givens rename landed — `constants` → `givens` everywhere. migration chain works: v5 `standard_dimensions` → v6 `constants` → v9 `givens`. bundled `.di` files still say `constants` and that's fine, the migrator handles it.

### drop underscores

underscores gone from SO names, given names, and formulas. spaces stored directly. `merge_refs` handles multi-word name resolution in formulas. migration is idempotent (`replace(/_/g, ' ')` is a no-op on already-spaced data), runs before the version-gated early return so it cleans every load.
