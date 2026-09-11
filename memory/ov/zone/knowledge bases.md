---
kind: analyze
title: "knowledge bases"
description: "How companies organize and browse their knowledge, and which of those approaches fit ov, mu and ji."
tags: [born]
date: 10 September 2026
---
# knowledge bases

Every company ends up with knowledge nobody can find. i asked how they organize and browse it, then which of those approaches fit ov, mu and ji. Finally, a roadmap to flesh out ov to be better than the best available.

## roadmap: implement them all, on ov

### Success

- [ ] 1. Tagging a file in ov changes the db, never the file.
- [ ] 2. The db holds each ov file's path, never its bytes.
- [ ] 3. A file moved or edited in Finder keeps its tags in ov.
- [ ] 4. Every file in ov shows its authors and where it came from.
- [ ] 5. A file new to ov gets kinds and tags from its name, location and content, with nothing typed by hand.
- [ ] 6. With AI suggestions turned on, a file shows suggested kinds and tags, and none is applied until i accept it.

#### new features

- store tags and such in local storage or local db (not in properties in the files)
- store refs to on-disk files, not store the files, leave the files on disk
    - somehow notice when files change location or content
- incorporate authors and provenance
- create categories and tags from each file, based on the file's:
    - name
    - location
    - content

### Build order

Each phase ending with something to look at:

- [x] 1. The db, and the dispatcher reading and writing it. Ends with: a tag written and read back.
    - Built 10 September 2026. `tools/hub/database.py` makes `tools/hub/ov.db` (git-ignored) with the four tables and writes and reads labels; the dispatcher answers `/labels`, `/add-label` and `/remove-label`; `tools/hub/test_database.py` writes a tag and reads it back against a db of its own, 23 checks.
- [ ] 2. The markdown collection read into the db, and its labels removed from each file. Ends with: the files list filtering from the db.
    - Built 10 September 2026, short of the removal. The dispatcher's `/scan` reads every listed file's kind and tags into the db as hand labels (run once: 485 files, 321 kinds, 780 tags, 152 with no block), and `/all-labels` hands them all back in one answer. ov's files list filters from the db: `Files.ts` asks for every label beside the listing and takes each file's kind and tags from there, never from its block. Changing a kind or tags in the editor, composing labels for a bare file, and making a new file all write the db first. The file's block is still written whole, kind and tags included, until the removal runs.
    - The removal is built as `/strip-labels` (kind and tags lines only, title, description, use_when and date stay) and NOT run. Two hooks read the `always` tag off the files, `inject-always.sh` and `test-always-tag.sh`, and `big-picture.py` writes a block. Those have to read the db first. Jonathan decides when.
- [ ] 3. File watching. Ends with: a file moved in Finder keeps its tags.
- [ ] 4. The authors and provenance rows. Ends with: the editor shows both.
- [ ] 5. Rules. Ends with: a file added to a truth folder shows its project and kind without typing either.
- [ ] 6. AI suggestions. Ends with: with the checkbox on, the editor shows suggestions, and accepting one adds it.

### Design

1. **One db, on disk.** A SQLite file next to the dispatcher (a whole database in one file, read by a standard library). Only the dispatcher reads and writes it. Not the browser's local storage, which is tied to one browser, capped at a few megabytes, and erased with the browser's data.
2. **Four tables.**
    - files:
        - collection
        - path
        - size
        - modified date
        - fingerprint (a short code computed from a file's bytes; same bytes, same code).
    - labels — One row per kind or tag:
        - file
        - name
        - value
        - made by: hand, rule or AI
    - sources:
        - file
        - author
        - where it came from (a url or a person)
        - date
    - rules:
        - reads (name, location or content)
        - pattern to match
        - label it gives (name and value)
3. **Files stay where they are.** ov already reads them in place through the dispatcher; the db keeps only the path.
4. **Labels leave the files.** The labels at the top of each markdown file move into the db, and OKF changes to match.
5. **Noticing changes.** The dispatcher asks the operating system to report changes in each collection's folders (called file watching). At launch it rescans, for changes made while it was off.
    - same path, new fingerprint → content changed; update the row.
    - path gone, same fingerprint at a new path → moved; update the path, keep the labels.
    - path gone, no match → missing; the files list shows it.
6. **Authors and provenance.** Markdown files carry neither, so both are typed into two new information rows in the editor.
7. **Labels from rules.** When a file is added or changes, the dispatcher runs every rule on it. Rule labels are recomputed each time. A rule never changes or removes a hand label.
8. **AI suggestions, optional.** A checkbox in the preferences section of details turns them on. When a file is added or changes, the dispatcher sends its content to AnythingLLM, the AI store ji uses, and saves the kinds and tags it suggests, made by AI. The editor shows them as suggestions; accepting one makes it a hand label. AI never changes or removes a hand label.

## the seven approaches

Most companies mix two or three.

1. **Wiki with a page hierarchy.** Pages sit in spaces, nested. Browse the hierarchy, follow links, or search. Confluence and Notion are the biggest; Confluence wins where Jira is already in use. SharePoint does this at Microsoft companies. Slab and Slite are smaller.
2. **Shared drives.** Plain folders of files in Google Drive, SharePoint or Box. The most common in practice. Easy to start, hard to keep tidy.
3. **Structured knowledge base.** Articles in fixed categories, with permissions and a publishing step. A wiki lets anyone edit; this does not. Often a customer help center. Document360, Zendesk, Helpjuice, Freshdesk.
4. **Verified cards.** Short entries, each with a named owner and a date to re-check it. Guru. Old information cannot stay around unnoticed.
5. **Docs in a git repository.** Markdown kept with the code, reviewed like code, built into a website. GitBook, Docusaurus, MkDocs, Backstage.
6. **AI search across everything.** One tool indexes the wiki, drives, Slack, email and tickets. Ask a question instead of browsing. Glean, Atlassian's Rovo, Microsoft Copilot. The fastest growing approach in 2026.
7. **Q&A site.** People post questions, others answer. Stack Overflow for Teams.

All seven organize with the same few tools: a hierarchy, tags, links between pages, templates, and a named owner per page with a review date. The owner rule matters most. Without it, content goes out of date in any tool.

## what fits ov, mu and ji

ov browses every markdown file in mono. mu browses my music, reading each file's own labels.

### ov and mu

1. **A folder hierarchy.** ov's browse list and mu's by-folder view.
2. **Filters by label**, several at once, each narrowing the list (called faceted filtering). ov's labels are kinds and tags. mu's are artist, album and letter.
3. **Search.** ov has it. mu needs it once the collection grows.

### ov only

1. **Links between files.** ov's editor already shows back links (the files that link to the open one). Obsidian does the same.
2. **Review dates.** Every file carries a date in its frontmatter. A filter for files not touched in N days is the verified-cards idea, minus the owner, since i am the only author.
3. **Docs in git.** mono already is this. ov browses it.

### mu, if it grows

1. **Links between people.** If mu shows who played on what, links from a track to its musicians and back work like ov's back links.

### ji

ji is where i drop documents, tag them, and ask an AI that has read them.

1. **AI search works best.** It is ji's whole point. Glean and Rovo index a company's tools; ji indexes my drops, and the AI store in AnythingLLM answers questions about them.
2. **Folders and tags support it.** A document sits in one folder. Tags nest, and one tag can sit under several. Filtering the list by tags is the same faceted filtering ov and mu use.
3. **The untagged inbox** lists documents with no tag yet, which shows what still needs one.

### neither ov nor mu

1. Publishing workflows and Q&A sites. Both assume many authors.
2. AI search across everything. ov's goals kept AI out at the start.

### combine them all

Three apps, one job: find a file, narrow the list, open it. i want one app that browses every collection, whatever it holds.

1. **One app, several collections.** ov becomes that app. A collection holds markdown (mono's projects), music (mu) or dropped documents (ji). mu is already a collection in ov's browse.
2. **Each collection says three things:** where its files come from, how their labels are read, and which hierarchies it offers.
    - markdown: files on disk, through the dispatcher; labels from the top of each file (kind, tags, date); the folder hierarchy.
    - music: files on disk; labels from inside each file (artist, album, title); by folder, artist, album, name and letter.
    - documents: drops into ji's store; tags from ji's store; the folder hierarchy and the tag hierarchy.
3. **Shared by all:** the files list, the filters stack (one filter per label), search, and the editor.
4. **Kept by one:** back links for markdown, a player for music, asking the AI for documents.
5. **Later:** the AI store reads every collection, so one question searches all three.

Open: ji keeps its records in the browser, not on disk. Either the dispatcher learns to read them, or ji's documents move to disk.
