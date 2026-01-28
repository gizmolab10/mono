# Work: Filesystem

Started: 2025-01-04

## Problem

Need a way to visualize filesystem folders in webseriously. Currently no database plugin exists that can scan a folder and represent files/folders as Things with navigable relationships.

## Goal

Build `DB_Filesystem` plugin that:
1. Takes a folder path as input
2. Creates Things from files/folders
3. Creates Relationships (parent→child folder structure)
4. Each Thing gets a `link` Trait that opens the file via OS default app


## Approach

**Browser constraints:**
- True "open in OS app" impossible from pure web app (security)
- File System Access API for folder reading (Chrome/Edge ~70% desktop)
- No Tauri/Electron—keep as web app
- Safari/Firefox users won't get folder picking (can still manually add files)

## What we did

- Added `filesystem` to T_Database and `DB_Name` enums
- Created `DB_Filesystem.ts` with:
	- File System Access API integration
	- Recursive folder scanning
	- Thing creation per file/folder
	- Relationship creation (contains)
	- Link trait with file path (except for non-preview-able extensions)
	- Helper methods: `readFileAsText`, `readFileAsDataURL`, `downloadFile`, `copyPath`
	- Color coding by file extension
- Registered in `Databases.ts` (db_forType + db_next_get cycle)
- Fixed stale rootAncestry/root references after folder selection (clear caches in selectFolder)
- Created Preview.svelte component with full-screen overlay for file previews
	- Added `T_Control.preview` enum and preview stores to `Visibility.ts`
	- Styled preview buttons same as build notes (background, colors)
	- Copy-path button for manual OS opening (copies to clipboard)
- Features
	- `Widget` click on root (no folder) → triggers folder picker
	- `Widget` click on file → shows preview + grabs ancestry (non-previewable just grabs)
	- In `D_Data`, remove `filesystem` from `ids_forDatabase` if isSupported returns `false`
	- Arrow-right on a preview-able file also shows preview
	- Fixed preview for files without link trait (Widget_Title uses `isPreviewable()` directly)
	- Consolidated extension handling into enums (`T_Image_Extension`, `T_Text_Extension`, `preview_type_forFilename()`)
	- Moved preview stores and `show_previewOf_file()` from `Visibility.ts` to `Files.ts`
	- Renamed interfaces to `Snake_Case` per style guide
	- Remember last folder choice (`IndexedDB` stores `handle`, `fetch_all` auto-restores, `selectFolder` saves)

## TODO

- [ ] Handle non-previewable files gracefully in UI
- [ ] Add more preview types (PDF, audio, video)

