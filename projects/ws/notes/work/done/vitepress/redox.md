# Document links

## Situation normal

**Obsidian:** Auto-updates wikilinks (`[[file]]`) when renaming/moving files within Obsidian
**VitePress:** (via `update docs`) Detects and reports broken links

## Problem

VitePress detects broken links but nothing fixes them, and the sidebar gets out of sync. We need these tools:
* **Tool 1:** Fix broken links (automated via `update docs`)
* **Tool 2:** Merge files (manual CLI command)
* **Tool 3:** Sync sidebar (automated via `update docs`)
* **Tool 4:** (reserved for future use)
* **Tool 5:** Generate docs database (automated via `update docs`)

## When I say "Fix broken links"

Invocation: Runs automatically during `update docs` builds

- [ ] read broken links from `vitepress.build.txt` (format: "Dead link: path/to/file.md -> missing-file.md")
- [ ] within notes and in VitePress config.mts:
	- [ ] find each moved file by searching repo for filename matching its dead link (ignore path)
	- [ ] update broken links to point to new locations (including path if relevant)
	- [ ] update VitePress config sidebar entries
	- [ ] if target file doesn't exist anywhere, delete the broken link
- [ ] report summary: fixed, deleted, unfixable

## When I say "Sync sidebar"

Invocation: Runs automatically during `update docs` builds

- [ ] scan `/notes/designs` directory recursively
- [ ] build sidebar structure from actual filesystem
- [ ] preserve existing sidebar groups and collapsed states
- [ ] update `.vitepress/config.mts` with current file structure
- [ ] report summary: added, removed, updated

## When I say "Generate docs database"

Invocation: Runs automatically during `update docs` builds

- [ ] scan `/notes/designs` directory recursively
- [ ] generate TypeScript data file (`Docs.ts`) with documentation structure
- [ ] for each folder: create DocNode entry with optional link to index.md
- [ ] for each .md file: create DocNode entry with path (excluding index.md)
- [ ] auto-format names (kebab-case → Title Case)
- [ ] strip .md extensions from all paths (VitePress URLs)
- [ ] output to `/src/lib/ts/files/Docs.ts`
- [ ] used by DB_Docs to create graph visualization of documentation

## When I say "Merge A into B"

Invocation: Manual CLI command with two file paths

- [ ] create backups: A.original and B.original
- [ ] analyze A and B, identify duplicate content in A
- [ ] copy unique content from A into B:
	- [ ] for each unique section in A:
		- [ ] find best-fit heading in B (or create new one)
		- [ ] insert at start of that section
- [ ] update TOC in B
- [ ] preserve A, A.original and B.original (for manual review/undo)
- [ ] update all links pointing to A → redirect to B
- [ ] update VitePress config.mts: remove A, keep B

## Constraints & Assumptions

**File conventions:**
- Process `.md` files only
- Search within `/notes` directory and subdirectories
- Use relative paths from repo root
- Assume UTF-8 encoding
- No max file size limit (reasonable docs assumed)

**Link conventions:**
- Wikilinks: `[[file]]` or `[[file.md]]`
- Markdown links: `[text](path/file.md)`
- Image links are ignored (not modified)
- Links in code blocks are ignored (triple backticks)

## Error Handling

**Tool 1:** (While parsing `vitepress.build.txt` for dead links)
- Missing build file → Done, log warning
- Malformed → Skip invalid lines, continue
- No target found for link → Delete it (as specified)
- Multiple files match same filename → Prompt user to choose, or skip (counts as "unfixable")
- VitePress config parse error → Log error, continue with markdown files (affected links count as "unfixable")

**Tool 2:** (Merge A into B)
- A or B doesn't exist → Exit with error, show usage
- A and B are same file → Exit with error
- Duplicate headings in B → Insert under first matching heading
- TOC parse fails → Log warning, skip TOC update
- Link update fails → Log warning, continue

**Tool 3:** (Sync sidebar)
- Cannot read .vitepress/config.mts → Exit with error
- Cannot parse config → Exit with error, show parse location
- Cannot write config → Exit with error, check permissions
- Malformed directory structure → Skip invalid entries, log warning

**Tool 5:** (Generate docs database)
- Cannot read /notes/designs → Exit with error
- Cannot write to Docs.ts → Exit with error, check permissions
- Malformed directory structure → Skip invalid entries, log warning

**General:**
- Circular links → Ignore, not our problem (VitePress will flag)
- File write permission errors → Exit with error message
- Git conflicts → User handles manually

## Edge Cases

**Tool 1:**
- File links to itself → Ignore, valid self-reference
- Broken link appears in code block → Skip (don't modify)
- Link uses anchor `#heading` → Preserve anchor after fix
  - Example: `[text](old/path.md#section)` becomes `[text](new/path.md#section)`
  - The `#section` anchor must be preserved when updating the path
- Multiple broken links to same missing file → Delete all

**Tool 2:**
- A is empty → Skip merge, just update links and config
- B is empty → Move A content wholesale, simpler merge
- Both files identical → Delete A, update links/config only
- Heading exists in both → Merge under existing heading

**Tool 3:**
- index.md files → Skip, don't add to sidebar
- .DS_Store and other system files → Ignore
- Files in srcExclude directories → Respect VitePress config, skip
- Nested directory depth → Support unlimited nesting

**Tool 5:**
- index.md files → Used as folder links, not separate nodes
- .DS_Store and other system files → Ignored
- Empty directories → Created as folders with no children
- Nested directory depth → Support unlimited nesting

## Implementation Details

**Language & tooling:**
- Node.js with TypeScript
- Use existing project dependencies where possible
- New dependencies: `remark` (markdown parsing), `glob` (file search)

**Project structure:**
```
notes/tools/
  fix-links.ts              # Tool 1
  merge-files.ts            # Tool 2
  sync-sidebar.ts           # Tool 3
  create_docs_db_data.sh    # Tool 5
  lib/
    markdown-parser.ts
    link-finder.ts
    config-updater.ts
    generate-sidebar.ts     # For Tool 3
src/lib/ts/
  files/
    Docs.ts                 # Generated by Tool 5
  database/
    DB_Docs.ts              # Uses Docs.ts for Tool 5
```

**Command line usage:**

Tool 1 (Fix broken links):
```bash
node notes/tools/fix-links.ts           # Run with default settings
node notes/tools/fix-links.ts -v        # Verbose mode (show each change)
node notes/tools/fix-links.ts --help    # Show usage
```

Tool 2 (Merge files):
```bash
node notes/tools/merge-files.ts A.md B.md       # Merge A into B
node notes/tools/merge-files.ts -v A.md B.md    # Verbose mode
node notes/tools/merge-files.ts --help          # Show usage
```

Tool 3 (Sync sidebar):
```bash
node notes/tools/sync-sidebar.ts         # Sync sidebar with filesystem
node notes/tools/sync-sidebar.ts -v      # Verbose mode
node notes/tools/sync-sidebar.ts --help  # Show usage
```

Tool 5 (Generate docs database):
```bash
bash notes/tools/create_docs_db_data.sh  # Generate Docs.ts
```

**VitePress config.mts structure:**
```typescript
export default {
  themeConfig: {
    sidebar: [
      {
        text: 'Guides',
        items: [
          { text: 'Getting Started', link: '/notes/guides/getting-started' },
          { text: 'Debugging', link: '/notes/guides/debugging' },
          // Tools update these link values when files move or sidebar syncs
        ]
      }
    ]
  }
}
```
Tools identify entries by matching the `link` property against moved/deleted file paths.

**Integration with `update docs`:**
- Step 1: Build VitePress documentation
- Step 2: Compile TypeScript tools
- Step 3: Run fix-links tool (Tool 1)
- Step 4: Run sync-sidebar tool (Tool 3)
- Step 5: Run create_docs_db_data.sh (Tool 5)
- Check exit codes, proceed only if successful
- Tool 2 (merge-files) runs manually when needed

## Testing Strategy
All testing is done in a test fixture, with a **current copy** of `.vitepress/config.mts`

**Test fixtures location:**
- `/notes/work/test-fixtures/`
- Contains sample markdown files with various link patterns
- Contains sample broken `vitepress.build.txt`

**Test approach:**
- Copy the **current version** of `.vitepress/config.mts`
- Create fixtures, run tools, verify changes
- Use git to show diffs before/after
- Test each error condition with malformed inputs
- Run on fixtures before deploying to real docs

**Rollback procedure:** (NB, this only works if git status is up to date)
- All tools preserve `.original` backup files
- Use `git restore` for immediate rollback
- Review `.original` files before deleting them

**Backup cleanup strategy:**
- `.original` files are never auto-deleted
- Manual cleanup: User reviews and deletes when satisfied with changes
- Recommended workflow:
  1. Run tool, inspect results
  2. Test that links work
  3. If satisfied: `rm *.original`
  4. If not: `git restore` affected files, review `.original` files

## Output & Logging

**Console output:**
- Summary: "Fixed 12 links, deleted 3, skipped 1"
- Detailed mode: Show each link changed (optional `-v` flag)
- Errors: Red text, clear error messages
- Warnings: Yellow text

**File logging:**
- Write detailed log to `notes/work/test-fixtures/fix-links.log`
- Append mode (don't overwrite)
- Include timestamp, file paths, actions taken

**Exit codes:**
- 0: Success
- 1: Error (file not found, parse error, etc.)
- 2: Warning (some operations skipped, but completed)

## Implementation

**Phase 1: Build Tool 1 (Fix broken links)** ✅ COMPLETE & TESTED
- [x] Set up project structure in `notes/tools/`
- [x] Install dependencies: Using existing TypeScript setup
- [x] Implement `lib/markdown-parser.ts`
  - [x] Parse markdown files
  - [x] Extract links (both wikilinks and markdown links)
  - [x] Preserve code blocks (don't parse links inside them)
- [x] Implement `lib/link-finder.ts`
  - [x] Search repo for files by filename
  - [x] Handle multiple matches (currently skips, prompts user)
  - [x] Return file paths
- [x] Implement `lib/config-updater.ts`
  - [x] Parse VitePress config.mts
  - [x] Update sidebar link entries
  - [x] Remove entries for deleted files
- [x] Implement `fix-links.ts` main script
  - [x] Parse `vitepress.build.txt`
  - [x] Find moved files
  - [x] Update broken links in markdown files
  - [x] Update VitePress config
  - [x] Delete links to non-existent files (cleanly, no leftover bullets)
  - [x] Generate summary report
  - [x] Handle `-v` and `--help` flags
- [x] Create test fixtures
- [x] Test on fixtures - ALL TESTS PASSING
- [x] Update CLAUDE.MD `update docs` command

**Phase 2: Build Tool 2 (Merge files)** ✅ COMPLETE & TESTED
- [x] Implement `merge-files.ts` main script
  - [x] Parse command line args (A.md B.md)
  - [x] Create `.original` backups
  - [x] Analyze both files for duplicate content
  - [x] Identify unique sections in A
  - [x] Append unique content to B (simplified from original spec)
  - [x] Update TOC in B
  - [x] Find and update all links to A → B
  - [x] Update VitePress config (remove A, keep B)
  - [x] Handle `-v` and `--help` flags
- [x] Create test fixtures for merge scenarios
- [x] Test on fixtures - ALL TESTS PASSING

**Phase 3: Build Tool 3 (Sync sidebar)** ✅ COMPLETE & TESTED
- [x] Implement `lib/generate-sidebar.ts`
  - [x] Recursively scan `/notes/designs` directory
  - [x] Build sidebar structure from filesystem
  - [x] Convert file/directory names to proper titles
  - [x] Preserve existing group names and collapsed states
  - [x] Generate proper link paths
- [x] Implement `sync-sidebar.ts` main script
  - [x] Read current `.vitepress/config.mts`
  - [x] Generate new sidebar from filesystem
  - [x] Merge with existing config (preserve other settings)
  - [x] Write updated config back
  - [x] Generate summary report (added, removed, updated)
  - [x] Handle `-v` and `--help` flags
- [x] Create test fixtures for sidebar sync
- [x] Test on fixtures - ALL TESTS PASSING
- [x] Integrate into update-docs workflow

**Phase 4: Integration & Documentation** ✅ COMPLETE
- [x] All three tools integrated into update-docs workflow
- [x] TypeScript source reorganized into lib/ directory
- [x] All tools tested and working in production

**Phase 5: Build Tool 5 (Generate docs database)** ✅ COMPLETE
- [x] Created `create_docs_db_data.sh` shell script
  - [x] Recursively scans /notes/designs
  - [x] Generates Docs.ts with DocNode structure
  - [x] Auto-formats names (kebab-case → Title Case)
  - [x] Creates unique IDs for each node
  - [x] Adds link property to folders with index.md
  - [x] Skips index.md from appearing as separate nodes
  - [x] Strips .md extensions from all paths
- [x] Created `DB_Docs.ts` database class
  - [x] Extends DB_Common
  - [x] Imports and uses getDocsStructure() from Docs.ts
  - [x] Creates Things for folders and files
  - [x] Creates Relationships for hierarchy
  - [x] Adds Link Traits to files and folders with index
  - [x] Uses depth-based color coding
- [x] Created `/src/lib/ts/files/Docs.ts` data file
  - [x] DocNode interface definition
  - [x] getDocsStructure() function
  - [x] Auto-generated by create_docs_db_data.sh
- [x] Integrated into Databases.ts
  - [x] Added T_Database.docs enum
  - [x] Added DB_Name.docs enum
  - [x] Added to database cycle
  - [x] Added to db_forType() switch
- [x] Integrated into update-docs workflow (Step 5)
- [x] Tested and working in production
