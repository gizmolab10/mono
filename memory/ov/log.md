<!-- consolidated: 2026-08-22 -->

## 2026-08-22
- S: memory bring-up: index, scope, lexicon pointer, zone created
- Q: fold ov/notes/guides/pre-flight/lexicon.md into truth/lexicon.md, or leave it where ov's CLAUDE.md already points?
- S: dispatcher /list-files now lists each collection's CLAUDE file (both spellings); test_dispatcher gained three checks
- S: site_of_file and file_path_of now place collection-top CLAUDE files (both spellings, never deeper); three tests added — run yarn vitest on the Mac to confirm
- S: fixed CLAUDE placement: the lowercase .md gate in site_of_file/file_path_of turned uppercase CLAUDE.MD away — CLAUDE check now stands before the gate
- S: is_listed_note (the read/write door) now admits collection-top CLAUDE files, either spelling; dispatcher tests cover read + refusal
- S: name-stripping made case-blind (four /\.md$/ regexes gained /i) — uppercase CLAUDE.MD files were keeping the extension in their names, so every collection's CLAUDE link resolved to ov's lowercase one and back-linked it
