---
kind: explain
title: "Work journal"
description: "Reverse chronological log of finished work on ji (the Jeff intersection project)"
tags: [journal]
date: 2026-08-11
---
# Work journal

Reverse chronological log of finished work on ji (the Jeff intersection project).

## 2026-07-29 — every spreadsheet ending taken

- **Fifteen more table endings**, in three groups by what they actually are. Rows of words (tsv, also spelled tab, plus psv, dif and slk) are stored as their own words and are ready to read, needing nothing done to them. Packed workbooks (the seven Excel endings, ods, ots, gnumeric) are raw bytes, heavy, and each needs its sheets read out first. The four commonest are recognized by what the browser reports as well, for a file that arrives without an ending.
- **The five old ones are named on their own list.** Lotus (wk1, wk3, wk4) and Quattro Pro (qpw, wb3) behave like any other packed table, but they sit in a list of their own so they can be told at a glance — and dropped later in one line, if it turns out nobody has one.
- **The table of kinds carried it.** Every new ending needed a row saying what it is, or the test failed — which is exactly what that check is for. Eighteen table endings now, 112 tests.

## 2026-07-29 — spreadsheets and books, and every kind of file tested with a real one

- **Two new families.** Spreadsheet takes csv, numbers and qb; book takes epub, kfx, azw3 and azw4. Neither can be shown here — a row of one never opens — but their words are the point, so both are taken in and listed.
- **Pdf and web page stopped being families.** Both are words, so both are text now; the viewer draws each its own way from the file's ending. That forced one thing into the open: a picture dropped through the folder door often reports no type at all, and its family had been read off how the viewer would draw it — so the pictures now have a list of their own.
- **Two refusals lifted, or nothing new could arrive.** A dropped file used to be thrown away entirely when a browser couldn't show it, which quietly kept out Word files and the unplayable clips as well; and the drop box hid those endings from its family words. Both gone.
- **Every kind of file now has a real file testing it.** All 38 built in code from real bytes, saved the way a drop saves, then read back: family, showable, how ready its words are, words-or-bytes, the bytes byte-for-byte, size and date — all 38 held at once and found again after a reload. A completeness check means a newly added ending fails until someone writes down what it is. I proved the table can fail before trusting it: one row marked wrong on purpose failed on exactly those two lines.
- **Written up.** What ji decides about a file the moment it arrives, and what's still owed, in [full family support](proposals/full%20family%20support.md) — including the two the model reads unconverted (docx and mpg), and why a plain-text table is deliberately not on the needs-converting list.

## 2026-07-29 — the log says less, and can say more again on one edit

- **The lines that only said "this happened" are gone.** Thirty-four of them: every tooltip move and mouse press, the accent picker opening and closing, key presses and clicks across the viewer, drop box, help pages, header cells, tag picker and folds, the manage-tags stub, and two in the tree — one line per row of the whole walk, and "the document list is now this long". Four imports and one loop that existed only to feed a removed line went with them.
- **Thirteen more are written but silent.** A companion to the logging call takes the same words and says nothing, so a line worth having only while something is being worked on can stay where it belongs: the measured layout decisions (does the title fit, do both regions fit side by side, how many popup rows fit, the chat's scrollbar gap), the viewer's stepping, the two tree oddities (a loop stopped, a thing shown under a second parent), how a dropped file's kind was decided, and a help link with no matching action. Changing that one body makes all thirteen speak again.
- **What was kept, and why.** The rule that decided each line: does it carry the numbers behind a decision, or does it only say something happened. Roughly ninety kept — the settings rename and sweep, the per-store filters and folds, the list's filter counts and scroll restore, the store's add/replace/erase, the whole drop, the byte store, and every line from the AI store, which is the least finished and so earns its noise.

## 2026-07-29 — the browser's saved settings are swept and spelled one way

- **Unknown saved settings are removed at launch.** The app holds the list of names it actually uses — the plain settings, each store's record lists, each store's four filters — and removes anything else saved under its own `ji:` start, naming each removal and its size in the log. Other apps' settings are never touched, and the document bytes live elsewhere and aren't in scope.
- **Every saved name is spelled the one way, marker included, and the old data moves across.** `ji_` then the parts joined by underscores: `ji_mine_documents`, `ji_ai_key`, `ji_mine_filter_tags`, `ji_details_data_open` — one kind of separator throughout, no slashes, no run-together words, a store's word lowercased so the AI store's data and the AI connection settings share it. The rename runs in three passes (the run-together settings, then a store's slash names, then whatever is left under the old `ji:` start) and it can't lose anything: if a new name is already taken, the older value is kept aside under a name that says so, and the sweep never touches those. The words in the code match the saved ones now, so there is one spelling to remember instead of two.
- **The rename and the sweep now run before anything reads a setting** — as the settings file itself is read, not from the launch code. Done from the launch code, the screens had already loaded and read the new, empty names: the file list came up empty and the AI connection read as "not set up", which is exactly what went wrong the first time.
- **Names that say what they hold:** the shut folders, the picked store, the family picks (was "collapsed", "database", "families"), and the remembered scroll spot, now "scroll files to".
- **The details region's two open/shut flags became one list.** The two sections are named in one place, and which of them are open is saved as a list of those names — an empty list means both shut, nothing saved at all means both open. Each section keeps its own on/off view of the list, so its banner still just flips itself.
- **The shut folders belong to a store, not to the app.** Each store's set is held by that store's own tree, so switching away and back brings the same folds back. My own store saves its set for the next launch; the AI store's are never saved, since its files come from elsewhere and a remembered fold there would be a guess about a list this browser doesn't own.
- **A cost, learned the hard way.** The first pass at this ran the rename from the launch code, after the screens had already loaded — so they read the new, empty names, and my own store's records were lost in the window between renaming the names and adding the rename step (the app relaunches on every file save while I work). The rename now runs as the settings file is read, before anything can read a setting, and it can no longer throw a value away.

## 2026-07-29 — the file list remembers how it was narrowed

- **Each store keeps its own filters.** "Mine" and the AI store save their four filters separately — the same tag names and files don't live in both, so one store's picks have no business narrowing the other's list. Switching stores puts away what's on screen and brings out that store's own picks; the log names which store the filters came from and how many were in each.
- **All four filters survive a reload.** The picked tags, whether a row must carry all the picked tags or any of them, and the typed name text now save themselves the same way the family picks already did, under their own saved settings. Reopen the list and it comes back narrowed exactly as it was left. A line in the log names what was restored — how many tags, which all/any mode, the search words, the families.
- **A folder's count is files only.** It used to add the subfolders in as well, so a folder holding two subfolders of three files each read eight instead of six. The subfolders are the structure holding the files, not things to tally; only files count now, each one counting for its own folder and for every folder above it.
- **A picked tag that no longer exists is ignored, not obeyed.** Saved tag picks are matched against the tags the store actually holds; the missing ones sit out of the filter (the pick itself stays saved, so if that tag comes back the filter does too). Without this, deleting the last tag hides the tag picker while its saved picks keep narrowing the list to nothing, with nothing on screen to undo it. The log says how many picks were kept and how many were ignored.

## 2026-07-29 — the family filter finds files inside shut folders, plus tooltip polish

- **The family filter works again, and reaches into shut folders.** Two problems fixed. First, a loaded file's family was blank (the AI store's index didn't carry it), so the family filter couldn't see it — the family is now recomputed from the file's kind on load, the same as its viewable/status flags (folders keep their family). Second, the filter only searched the *open* rows, so files under a shut folder were missed; now an active filter searches the whole list, but the display still honors the folds — a shut folder that holds matches shows as the path to them, its matched children hidden until you open it. The folder-row counts still tally the matches after the filter.
- **Tooltips step aside when they'd be noise.** Hushed for: the currently-selected storage segment, the ask button while its box is empty, the accent swatch while the native picker is open (its hover light too), and the per-row pencil is hidden entirely when the store has no tags. The family filter segments now show the same hover as the drop box's family words — that family's file endings.
- **White fills.** The build-notes steppers and the viewer's file-steppers fill white inside (was page-colored), and the round close buttons in both are white inside too.
- **Build-notes steppers are the viewer's fat triangles.** Newer (up) and older (down) now use the same fat-triangle mark and hover as the viewer's file steppers, stacked one above the other; both slots are always placed, so hiding one never shifts the other.

## 2026-07-28 — softer folder corners, steadier controls, a few polish passes

- **The folder pointer's corners are gently rounded now.** The straight isosceles pointer keeps its straight sides but its three corners curve (a "soften" fraction pulls back from each tip before curving); its box is measured from the actual drawn line so it fills its slot at any softness, and its slot widens with it. Sized to the shared glyph size, filled solid in the accent.
- **The build-notes steppers are the viewer's fat triangles.** Up (newer) and down (older) now use the same fat triangle and hover as the document viewer's file-steppers, stacked one above the other. Both are always placed with pinned slots — the show/hide logic just flips visibility, so hiding one never shifts the other.
- **The search box and tag filter hold their height.** When the window shrinks, only the table gives up space now; those two rows no longer squeeze (they matched the family pill, which already held).
- **Tooltips get out of the way on a click.** A mouse press hides the current hint until the cursor moves again.
- **Drop box tidying.** Escape or Enter leaves the drop box for the file list; the dashed box lost its own hover hint (the close button carries one); the family words' hover lists their file endings comma-separated.

## 2026-07-28 — the build-notes popup fits itself to the window

**How the popup is sized and placed** (the rules, so it never spills off-screen):

- **Width.** The lesser of its full width (~605px) and the window minus a `--gap` on each side. Roomy window → full width, centered. Narrow window → it shrinks so both edges sit exactly a `--gap` in. Sizing counts the padding (border-box), so the gaps hold.
- **The note column clips.** Fixed table layout; the note truncates to one line with an ellipsis rather than wrapping, so rows stay one line tall as the popup narrows.
- **Height / row count.** Shows as many rows as the window allows, capped at 10 (a page). Any spill past the window drops enough rows to fit; one row is added back only when a whole row's worth of slack opens (so shrinking and growing never flip-flop). The up/down steppers page through the rest by whatever count currently fits.
- **Vertical placement.** Centered while all 10 fit; the moment fewer than 10 fit, it pins 20px from the top and grows downward — so shrinking the window stops the centered popup from jittering.

The popup is absolutely positioned inside the fixed backdrop and placed by inline top/left/transform, so nothing about the backdrop's centering can squeeze the rows or fight the pinning.

## 2026-07-28 — a sharper folder pointer, a drop-open zone, and a paced tooltip

- **The folder mark is a clean pointer now.** The old fat curved triangle became a plain straight-sided isosceles pointer: one corner points the way (down when open, right when shut), the other two sit closer together (90° apart) for a crisper point. It's a touch smaller and filled solid in the accent color instead of hollow.
- **The "drop files below" tab lights and clicks across a whole zone.** In the documents list, the two dividers and the column header between them are one area: pointing anywhere in it lights the "drop files below" tab as if the cursor were on it, and clicking anywhere in it opens the drop box. The area carries a "click to drop files" hint. (The header's own name/tags buttons keep their own actions.)
- **The drop box gets a close button instead of a whole-box click.** Dropping no longer means the whole box is a click target; a round close cross sits at the top-left, a small gap in from the dashed edge, and returns to the file list. It shows only when there are documents to go back to.
- **Tooltips wait, then fade.** A hint now holds clear for a short pause (a third of a second) before fading in over half that time, so a quick flick past something never flashes a hint. Sweeping across a column of rows restarts the pause on each new one, even when neighbors share the same words.
- **Smaller touches.** The file/folder name sits a gap in from the triangle; the drop box's hover hint reads "click to show files" once there's something to show; the tag field and the list's name search only light on hover when they aren't focused.

## 2026-07-27 — the AI store keeps its own content, live answers, tooltips everywhere

- **The AI store now holds the document itself, not just its name.** AnythingLLM's API never hands a document's body back, so each document's content is saved beside it in AnythingLLM as an extra, un-searched note keyed by the ji id (text as-is, binary as base64), and read back when the document is opened. This fixed the "this document's bytes are missing" error when opening a file on the AI store.
- **The whole AI record list lives in one note too.** The list of documents/folders/tags — everything the hierarchy shows — is saved as a single note in AnythingLLM and read back at launch, so the AI store fills itself from AnythingLLM instead of from anything on this mac. The screens hold off their "the store is empty" decision until that read finishes, so a still-loading store isn't mistaken for an empty one.
- **The list no longer cares where a row came from.** Removed the separate read-only "AI files" rows; every row is one hierarchy row now, whether its data came from this mac or from AnythingLLM.
- **When the store has no documents, the drop box takes over.** Asking for the list on an empty store now switches to the drop box instead — enforced in one place, so it holds for the pill, a help link, a background click, or deleting the last document.
- **Answers arrive word by word.** The ask box now shows the AI's reply building up live as it streams, with the spinning gear held until the last word lands.
- **Instant tooltips, one style, everywhere.** Replaced the browser's slow native tooltips with a single app tooltip that appears at once, centered just below the cursor; every hover hint across the app now uses it.
- **A softer chat question pill.** The question header sits on a color halfway between the accent and the page, easier on the eye, text still legible.
- **Too-big files on the AI store are refused with a dialog.** A file over the AI store's size limit is turned away with a message and a "do not ask again" tick that quiets the rest of that one drop, then resets for the next drop.

## 2026-07-27 — a top bar that measures itself, and tighter edges

- **The title bows out when there's no room.** The centered "Intersection" title now hides when the top row is too narrow to hold it beside the hamburger, the operations pill, and the help button — measured from the real on-screen widths (not a fixed break-point), so it reacts to a resize *and* to browser zoom. When hidden it leaves the layout entirely, freeing its space; it returns, centered, the moment there's room.
- **The operations view bows out too.** When the details region is open and the window can't fit both it and the operations view (each at its own least width), the operations view drops and details fill the width — again measured from the live window width, so zoom counts. A log line records the window-vs-needed numbers on each flip.
- **The app hugs the window.** The outer margin on all four edges tightened to half its old size; the frame's width math was moved to match, so no dead sliver is left at the sides.
- **The chat drops its right gap when nothing's scrolling.** The conversation keeps a gap on its right for the scrollbar; when the list is short enough that there's no scrollbar, that gap now goes away and the answers reach the edge — restored the moment the scrollbar returns.
- **Quieter log, fewer timeouts.** The every-eight-seconds AI heartbeat used to log two lines each tick, and those log posts sometimes timed out against the little local log server. The heartbeat now reads silently; the one-off refreshes still log.
- **Small tidy.** The manage-tags view lost its dead "done" button (it had no close action there).

## 2026-07-27 — research: what AnythingLLM can store and how it's built

Several questions answered against the live instance and AnythingLLM's own docs/spec, written up rather than guessed:

- **Sideband storage** — AnythingLLM has no key-value store, but an *un-embedded* raw-text document can carry a payload in its `description` details field, which round-trips exactly (proven to 4 MB). The document *body* is never returned by the API — only the details — so `description` is the seam. Design, read-merge-write safety, whole-database-as-payload, and the SQLite-store background are in [sideband storage proposal](proposals/sideband%20storage%20proposal.md); the code-debt sideband item points at it.
- **Threads** — a workspace holds many named threads, each its own chat history sharing the same documents; a whole thread can be deleted (a single exchange can't). Written into [build LLM proposal](proposals/build%20LLM%20proposal.md) as a subsection.
- **No per-exchange delete** — the developer API can only wipe a workspace's whole chat; confirmed from the OpenAPI spec. (So "delete a question" becomes hide-in-ji, via the sideband note.)
- **External-drive storage** — the Docker AnythingLLM's whole store can live on an external drive by pointing its one bind-mount at a folder there; steps in [external AnythingLLM storage](external%20AnythingLLM%20storage.md).

## 2026-07-26 — the AI answers live, word by word

- **The wait was blind.** Asking a question showed a spinning gear and nothing else until the whole answer landed at once — and there's no honest way to guess how long that takes, since the time is mostly the model writing an answer whose length isn't known until it's written.
- **So the answer streams instead.** AnythingLLM can hand back the answer in small pieces as it's written; a quick test against the running one confirmed it (the words "Hello", "!", "It", "was"… arrived one at a time). ji now uses that: each piece is pushed to the chat the instant it arrives — the server pushes, ji never polls — and the answer writes itself at the top of the conversation. When the last piece lands, the finished exchange settles into the saved history with its sources.
- **The gear stays for the whole answer.** It stands in for the ask button from the click until the stream closes (the last word), then the button returns.
- **The key-holding server had to stop hoarding.** It used to collect the entire reply before sending any of it — which would have swallowed the streaming. It now forwards each piece as it arrives, and tells every hop in between not to hold pieces back. The streaming call was added to its short list of allowed calls. Verified live through the tunnel after a restart — words appear one at a time in the browser.
- **The all-at-once ask stays** as a fallback, untouched.

## 2026-07-26 — an in-app help overlay (was the handoff's next item)

- **The help button now opens something.** A full-screen overlay over the app, placed by the frame like the build-notes popup. Its pages are markdown files under `lib/md/manual/`, pulled in at build; each page's title is its first heading, with a hand-set order and anything unlisted falling to the end. A hamburger-toggled sidebar lists the pages; a page can link to another and switch in place; a close cross returns to the app. Which page was open and whether the sidebar shows are both remembered. Seed pages: a short welcome and a "what's broken" list. A markdown link can carry an `action:` that switches the app's operation (e.g. jump to the chat).
- **Setup stayed retired.** The newcomer need is already met by the AI store's password screen, so the one-click-installer idea stays off.

## 2026-07-26 — reusable dividers, and a pass over the chat and list

- **A divider ported from di.** A thin accent bar (horizontal or vertical) with little rounded ends so it meets a rounded panel cleanly; it auto-extends to touch the accent frame, can carry a centered title, and the title can be a button. Used across the app: the list's "drop files & folders anywhere below" divider (a click opens the drop view), the list's header divider (replacing the old drawn underline), the data readout's more/less toggle, the chat's show/hide-responses divider, and the manage-tags view.
- **Chat touches.** The ask button moved to the far left with the input filling to its right; the input gained the same clear "x" as the list's search; the show/hide-responses control became the divider's title.

## 2026-07-25 — a password screen sets up a new browser for the shared AI

- **The problem it solves.** Pointing a new browser at the shared AI meant hand-editing two stored settings, quoted just so — easy to get wrong, and it leaves the share token lying in a settings screen. A native installer can't help: a program on the computer can't reach into a website's browser storage.
- **A one-field setup screen instead.** When the AI store is active but this browser is missing the two settings (the address pointer and the share token), the app shows a single centered password box. Typing the word writes both settings — saved the right way, so the quoting mistake can't happen — reads back what the AI holds, and drops you to the list. A wrong word says "that isn't it" and clears the box.
- **When it appears.** On opening the app already on the AI store, or on switching to it, if either setting is missing. Leaving the AI store drops the screen (it means nothing elsewhere).
- **Honest limit.** The two settings and the password live in the build, so anyone who loads the site and types the word gets the share token — a low-stakes gate to keep casual visitors out, not a real secret.

## 2026-07-25 — every browser sees the AI's own documents, and its true count

- **The gap.** A browser only knew about documents it had dropped itself — where each one lives in the AI is remembered per-browser. So a second computer, sharing the same AI, showed an empty document list and a count of zero, even though the AI held plenty.
- **A read that asks the AI what it holds.** A new call asks AnythingLLM for the workspace's own list — each document's readable name and the location a remove would use. It's shaped like the chat-history reader: safe, logs plainly, hands back an empty list on any trouble.
- **One shared count, pulled app-wide.** That list is read into one shared place, refreshed whenever the AI store becomes active and after this browser adds, removes, or erases one — so the number is the same everywhere and right on every machine, not only the one that dropped the files. A running number throws away a slow read if a newer one has started, so the count can't flick backwards.
- **The data readout shows the AI's real number.** On the AI store, the "documents" count is what the AI actually holds; every other store still shows its own local count. (The local count still decides whether the erase button appears, since erase only clears this browser.)
- **The documents table lists the AI's own documents.** They show as read-only rows — "AI" in the format cell, dimmed, with no open, edit, or delete, because their contents aren't on this browser. Any the local table already lists (matched by name) are left out, so a file dropped here isn't shown twice; the name search still narrows them, and a tag or family filter hides them.
- **The proxy was told about the new call.** The key-holding server forwards only ji's known calls; the workspace-detail read was added to that list (it needs a restart to take), so the off-mac path works. On the mac itself nothing extra was needed.

## 2026-07-25 — a thin proxy lets any browser reach the mac's AnythingLLM

- **The problem.** AnythingLLM runs only on the mac, and its key can't be put in a browser build (anyone could read it). So a deployed ji, in a browser on another computer, had no safe way to reach it.
- **A small server holds the key; the browser holds a separate token.** A tiny server on the mac keeps the AnythingLLM address and key. ji sends it a different shared token, which the server checks; if it matches, the server swaps in the real key and forwards only ji's own handful of calls (add a document, ask, read the chat, and so on) — nothing else gets through. So the browser never sees the real key.
- **Reached from anywhere through a free tunnel.** The mac sits behind a home router, so a free tunnel gives the server a public web address without touching the router. That address changes every time the tunnel restarts.
- **A fixed pointer solves the changing address.** The server writes its current address into one unchanging link (a public gist). ji reads that link to learn where the server is right now (asking fresh each time, since the link is served through a short cache). So the address can churn freely and ji still finds it.
- **It survives a reboot.** A launch job restarts the server and the tunnel on their own, and the server republishes its new address to the pointer on every start.
- **Two computers, one shared workspace.** Because every ji store defaults to the workspace named "intersection", two browsers on different computers now share one AnythingLLM workspace — the same questions, answers, and embedded documents. Only the document *list* stays per-browser (that list has never traveled through the proxy). Proven end-to-end: a second computer, given the pointer link and the share token in its stored settings, read the same chat history.
- **Setup, in plain steps.** On the browser side, two stored settings turn it on — the pointer link and the share token — both saved as quoted text (a bare, unquoted value reads as nothing and silently fails to connect). Full design and the newcomer setup steps are in [thin proxy proposal](proposals/thin%20proxy%20proposal.md).

## 2026-07-25 — folders show a count, and a few smaller touches

- **A folder tells you how much it holds.** In place of the "---" its format cell used to draw, a folder now shows how many things sit under it — files and subfolders — after the current filter, counting the ones on screen plus whatever a shut fold is hiding. The filter runs over the whole tree, so a shut folder still shows its full matching count, and with nothing filtered it's the folder's entire nested total. It's read straight from the already-filtered rows, so it follows the search.
- **Clicking a big surface returns to the list.** A click on the drop box, or on an open document in the viewer, goes back to the documents list.
- **The viewer's step arrows hide when there's nothing to step to** — fewer than two showable files on screen and the two triangles disappear (the title stays centered).
- **Chat spacing and the chat segment.** In the chat, the gap between exchanges shows only under a collapsed answer, so an open one sits snug against the next. The top-bar "chat" segment grays its text when the store isn't the AI one (still inert there).

## 2026-07-25 — the ask view becomes a running chat (chat history, phase 1)

- **AnythingLLM already keeps the conversation, so we read it back.** A new reader fetches the workspace's saved chat newest-first and pairs each question with its reply and the documents that reply drew from, into simple "exchange" records. AnythingLLM's own history is the store for now — the endpoint has no page-back, so we take the newest batch (fifty) and leave a local copy for later.
- **The ask view is now the chat.** A question box sits on top; below it the running conversation, newest first. Each question reads as a header lit in the accent, over its answer; a click on the question hides or shows that answer, and one pill toggle expands or collapses them all. The saved history is read on arrival — so a refresh returns you to the same conversation — and again after each new question.
- **Small fixes along the way.** Long unbroken strings (like a full key) now wrap instead of pushing a sideways scrollbar; the conversation's scrollbar is a set width with a clear gap from the text.

## 2026-07-24 — the operations move to the top bar, and the content region becomes a switcher

- **A pill of operations sits in the top bar.** Beside the hamburger: list, drop, ask, tag. The active one fills the accent; a click switches the content region to it. The "ask" segment only works on the LLM store — on any other store it is inert (dimmed, no click, no hover), and switching to a non-LLM store while asking drops you back to the list.
- **The content region is its own switcher now.** One small piece (Show_Operation) shows exactly one view for the current operation — the drop box when adding, the document viewer when viewing, the LLM ask box when the ask store is asking, else the documents list. So the drop box and the viewer moved out of the list and into the frame; the list shrank to just the list.
- **The viewer's stepping moved to one shared home.** The run of showable rows, the position in it, and step / close now live in the operations manager, so the list (which keeps the run updated as it filters and folds) and the separate viewer share one source of truth. A side benefit: the "the open document is gone, fall back to the list" guard now runs from the frame, so it works even on a reload straight into a since-deleted document.
- **A family filter under the search box.** A pill with a segment per family — video, audio, image, text, html, pdf (folder left out) — each toggles on its own and is saved across reloads. The list narrows by tags, name text, and picked families together; folders always pass the family test, but a folder left with no surviving row drops.
- **The table's scrollbar runs beside the rows only.** The column header is its own table above the scroller now, so the scrollbar no longer reaches up past the title row; the two tables' columns line up through a shared column sizing and a reserved scrollbar gutter.
- **The files were reorganized.** `actions/` became `operations/`; a new `support/` folder holds the shared pieces (the hover hint, the tag picker, the drop status, the add-tag field, the ask box); the documents list is now `List_Documents`. The shared filter file is `Filter_Documents`.
- **Smaller touches.** The all/any toggle hides with fewer than two tags; the tag filter hides when the store holds no tags; the "add tags" button came off the picker (the tag segment reaches that view now); the ask box gained a gap around it; the drop rectangle stretches to full height. The build opener and author credit now sit on one line and moved into the details region — still pinned bottom-left, but shown only while details is open.

## 2026-07-22 — the document viewer's header settles, and a viewed document survives a reload

- **The step triangles hold at the top, the close is pinned to the corner.** The viewer's two fat step triangles sit at the top-far-left and stay there; the close button is pinned to the viewer's top-right corner so it never moves. A long file name now grows downward beside them instead of pushing them around.
- **The file name is centered across the header.** The header is three columns — triangles, name, balance — so the name centers across the whole width, sits in the flow (so it reserves its height and no longer overlaps the document), and keeps a gap from the triangles and the close.
- **A viewed document survives a reload.** Which document the viewer is showing is now remembered, so a reload returns to the same open document. If that document has since been erased, the view falls back to the list. Leaving every operation also drops whatever document was open, so the two never disagree.
- **Two files were tidied:** the drop-box component is now named for what it does (dropping documents), and the shared hover hint moved in with the other always-present pieces.

## 2026-07-22 — each document knows if it can be shown and how ready its words are (phase 1)

- **Two independent facts on every document.** *viewable* — can a person open and look at it here. *status* — how ready its words are for a model: ready (words in hand), quick (a light words-pull still owed — pdf, web page, rich text, svg), or heavy (a picture's writing recognized or a clip's speech transcribed — pictures, sound, video). The two cross freely: a picture is viewable **and** heavy; a pdf is viewable **and** quick.
- **Both are worked out from the kind, never trusted from storage.** A quick helper reads "can it be shown", another reads the words-tier (ready if it's plain text or its words are already pulled, else quick or heavy by extension). They are set when a document is dropped or replaced, folders forced to not-viewable, and recomputed on every load — so old records land right and a document turns "ready" on its own the moment its words get filled in. The rows, the eye, and the viewer stepper now read the stored "viewable".
- **No extraction yet** — that words-pull is the next phase; the slot to hold the pulled words already exists.

## 2026-07-22 — the sticky parent-folders feature was removed

- **Gone for good.** Keeping a scrolled row's parent folders pinned at the top fought us end to end — a 1px flick at every crossing (the browser paints the scroll a frame ahead of any hand-placed row) and then a click-steal (a pinned triangle caught clicks meant for the row beneath it). A clip didn't settle it, so the whole feature came out: the pinned overlay, its scroll-time math, all of it. The sticky column header, the remembered scroll place, and folder open/close all stayed. If parent-orientation is ever wanted again, it should be done natively (each folder row sticky inside its own block), not hand-placed.

## 2026-07-22 — the app's name shows, and the drop and dedup boxes read cleaner

- **"Intersection" sits centered in the top bar** at hero size, held dead-center regardless of the side controls' widths.
- **The dedup question reads by date.** When a dropped file shares a name but not a date, the two choices are ordered newest-on-top, each marked older/newer; the newer one is picked by default. "Do the same for the rest" starts on and keeps its setting through a drop — turn it off once and later questions stay off; a new drop starts it back on.
- **The drop box's progress is a filling pie** (a wedge sweeping like a clock hand, white face, accent rim) instead of a thin arc. A line sets the running count off from the instruction above and, when it shows, off from the dedup question below. The instruction sits a third of the way down.
- **Kinds we can't show are ignored for now** — a drop skips them and the drop box's ending lists leave them out. The "other" family is gone; Word files count as text for listing but stay non-viewable.
- **The hover hint is a touch shorter and sits a little left.**

## 2026-07-21 — a drop can be cancelled

- **A "cancel" pill sits in the drop's status strip** while a drop is saving, beside the "captured n of x" count and its ring. Pressing it stops the save between items — folders and all — and whatever was already saved stays. The strip clears the moment it stops. A flag set on the press is checked before each item; it's wiped when the next drop begins, so it never carries over.

## 2026-07-20 — a hover hint that shows at once

- **Our own hover hint, because the browser's waits a second.** The browser's built-in hover text pauses about a second before it shows, and that pause can't be shortened — it belongs to the browser. So a small shared hint is drawn ourselves: any element hands it the thing being pointed at and the words to show, and it appears the instant the cursor arrives, sitting just below, running as wide as it needs, pulling back only off the window's right edge.
- **Only the drop box's family words use it so far.** Their endings now show at once instead of after a wait; their old browser hover text is gone. The clipped file names in the table keep their plain browser hint for now.

## 2026-07-21 — the folders above the top row stay pinned while scrolling

- **Scroll deep into a folder and its folders stay pinned at the top.** The whole chain of open folders above the top visible row shows just under the column header, so it's always clear which folders the visible files sit in. Each pinned folder is a live copy of its own row — the scrolling rows and the pinned ones share one piece of markup — so its open/close triangle and its edit/delete buttons work exactly as they do in the list.
- **Each folder pins the instant it starts to go, and stays until its subtree passes.** A folder joins the pinned stack the moment its own row's top slides under the header, and stays pinned until the bottom of its last child scrolls past — so it never flickers off and back. Nested folders stack: an inner folder only begins to stick once its top slides behind the marker already pinned above it.
- **It rides along with the rest.** The pinned set is recomputed as the rows scroll (at most once a frame), when the shown rows change (a fold, a filter, a delete), and after the table returns to its saved scroll place.

## 2026-07-21 — the table remembers where it was scrolled

- **It remembers the top spot, not a distance.** As the rows scroll, the spot sitting at the top is saved (a short wait after scrolling settles, so a fast scroll saves once). A spot is a document paired with the link that put it in that row — so a file that shows in two places (a duplicate under both its folder and its original) has two distinct spots, and reload returns to the very row that was at the top, not its twin. Saving a spot, not a pixel distance, means the place holds even when rows are added or removed above it, and it survives a reload the way the shut folders do.
- **A fast spot→row-number map turns it back.** A lookup from each row's spot to its row number is kept alongside the rows and rebuilt when they change; the saved spot becomes a row number at once, with no scan down the list. The walk now records, for each row, the id of the link that led into it (empty for a top-level row) — that plus the document id is the spot.
- **It returns to that place when the table comes back** — after a reload, and after opening a file and closing it. The row is placed just under the pinned header, not hidden behind it. If the saved item is gone from the list (deleted, or filtered away), the table starts at the top.

## 2026-07-21 — readable text on an accent-filled button

- **A button filled with the picked color gets readable text.** The color code already worked out white-or-black text for anything sitting on the accent (dark accent → white, light accent → black); that value is now named `text_forAccent` in the code. Every button whose own fill is the accent reads it — the all/any current segment, a lit tag chip, the chosen storage segment — so a dark accent no longer leaves near-black text on a near-black button. The hamburger already read this value; the CSS name for it stays as it was.

## 2026-07-21 — step to the previous / next file while viewing

- **Two fat triangles at the viewer's top-far-left step through the files.** Left goes back, right goes forward, wrapping around at both ends. They match the folder triangles — page-colored inside, accent outline, filling on hover — and 20 across. When only one file on screen can be shown, both go quiet.
- **The left and right arrow keys do the same** (up also steps back, down steps forward). A key that lands on a focused sound or clip player, a text field, or the sandboxed page is left alone, so seeking a video still works. **Escape closes the viewer** — caught before the stepping guards, so it works even when there's only one file.
- **Holding a triangle down keeps stepping.** One step at once, a pause, then a steady patter until the mouse is let go or drifts off the button. (The arrow keys already repeat — the operating system holds them down.)
- **The run is what's on screen and showable.** It follows the current search and folds, and skips folders and kinds the viewer can't show. A duplicate that shows in two places is two stops, so the viewer tracks *where in the run* it is, not just which file it holds — one file can sit at two spots.

## 2026-07-21 — the chosen storage ignores hover

- **The storage already in use no longer lights under the cursor**, and shows the plain arrow instead of a clickable one — clicking it would do nothing, so it now reads as inert. Only a different, built storage lights and invites a click. A one-line change to which storages the hover rule skips.

## 2026-07-21 — open and close a folder

- **A triangle leads any row that holds something nested.** The fat three-corner mark, 15 across, points down when open and right when shut. A folder holding files earns one; so does the original of a kept-both pair, since the duplicate hangs under it. Rows with nothing nested (plain files, empty folders) get an empty slot the same width, so every name still lines up at its indent.
- **Shutting a folder drops its contents from the table.** A row is hidden when any folder above it is shut, worked out before the search even looks, so a shut branch is fully out of play. Clicking the triangle flips that one folder.
- **The shut folders survive a reload.** One saved list of folder ids, kept the way the details region's open sections are. Reopen ji and the tree is folded as you left it.

## 2026-07-21 — a thing shows under every parent it links to

- **The table lists a thing once per parent.** The walk used to show a thing only the first place it was reached and skip it everywhere after. Now it lists a thing under each parent that leads to it, so a kept-both new item shows in both places at once — under its folder and under its original. The kept-both name also tucks the number in before the ending now ("notes (2).txt"), matching the spec.
- **The second appearance reads lighter.** Both appearances are one record — edit or trash either and the one thing changes — but the later one dims and wears a small turn-in mark, an "also here" that defers to the home. The home is the appearance reached through a folder link; the duplicate place is the echo.
- **A real loop still can't hang the walk.** The old guard was "seen anywhere", which is exactly what hid the second place. The new guard is narrower — "already above me on the branch I'm walking now" — so a thing can show in two branches but a folder that somehow sits inside its own branch stops the walk instead of spinning. A driven check builds a loop below a root and proves it terminates.

## 2026-07-21 — the hierarchy port: records, uniqueness, fast lookups

Foundational half of the ws hierarchy port — the data layer, not yet the visible tree behaviors (open/close, tag tree, ancestries are still ahead).

- **The living tree now owns the records.** ws's shape: a Hierarchy holds the documents, tags, links, and meanings and every operation on them; the store beneath it does nothing but load, save, and hold the file bytes. This landed in two proven steps — first the tree operations moved out of the store into a new Hierarchy that reached back into the store's lists (a leaky seam), then ownership of the lists themselves moved into the Hierarchy and the store shrank to pure persistence. Every caller reaches the tree the same way throughout.
- **Two clean ways to reach the active tree.** A store, `w_hierarchy`, for the screen (it re-runs when the store switches, never on an ordinary edit), and a plain `h` for ordinary code. Views and the drop both go through these instead of digging into the store.
- **Find-or-create is the rule now, not the exception.** Asking for a meaning, a parent-child link, a tag, or a tag-on-a-document twice hands back the one that's already there — no duplicates. Driven checks prove each.
- **Duplicate documents are caught store-wide by name.** A dropped file whose name already sits anywhere — same folder, another folder, the top level — with the same date is silently ignored; a different date still asks. (An earlier per-place rule let the same name live in two folders; a screenshot of two identical rows showed why store-wide is what's wanted.) The spec was corrected to match.
- **Two instant lookups replace linear scans.** A document by its name (the dedup check) and any record by its id (the viewer, the tree walk) — both maps, rebuilt on load and on delete, kept in step as records are made. Ids never collide across kinds, so one id map holds every record and a typed getter hands back the one kind a reference expects. A big folder drop no longer slows as the store fills.
- **Renamed the dirty-tracking manager to Persistence**, freeing the name "Persistable" for a planned record base class (see [persistables plan](persistables%20proposal.md), paused). That plan would make every record a real object with an identity and a dirty flag, ws-style — which means bringing back rehydration on load, the one thing ji deliberately skipped. Written down, not started.

## 2026-07-20 — a drop on the table opens the drop box

- **A drop that lands on the table now opens the add-documents view first**, then saves — so the count and any question report in the drop box, where there's room for two lines. Reporting in the table's column-label row was tried and taken back out: a question is taller than one row and the columns re-measured when the labels stepped aside, so the whole table shrank and shifted for the length of a drop.

## 2026-07-20 — the drop box gets an edge

- **The edge is drawn, not bordered.** A dashed border leaves the dash length to the browser, and this one is 4 on and 2 off, so the line is a shape laid over the box's edge instead: rounded to the same corner, in the accent color, and going solid the moment a drag is over the box.
- **What was there before drew nothing at all.** The old border named a thickness and a color but never said what kind of line to draw, so the browser drew none. The box has been edgeless this whole time.

## 2026-07-19 — dropping the same thing twice

- **The address field is gone.** Every document carried an address, but it was minted from a fresh random name at the moment of the drop — it said where that copy lived, never where the file came from, so it could never recognize a repeat. A browser refuses to tell a web page a dropped file's real location, so there was nothing true to put there.
- **A file is recognized by its name and the moment it was last changed**, among the documents sitting in the same place — two files called "notes.txt" in different folders stay two documents. Same name and same moment means the same file: its row is left exactly as it is, tags and folder included, and only its bytes are written again. No message.
- **Same name, a different moment, and the drop stops and asks.** The two are shown side by side with their sizes and dates, and either or both can be kept. Keeping the one already here throws the dropped one away; keeping the dropped one pours it into the row that is already there, so its tags and its folder survive; keeping both saves the dropped one as "notes.txt (2)". Nothing is saved or removed until OK. From the second question onward it offers to answer the rest of the drop the same way.
- **A repeated folder is examined before it is trusted.** If nothing inside it is already held there, it's treated as a different folder and gets a numbered name; otherwise it is the same folder, and its contents are worked through one at a time by the rules above.
- **A drop now counts itself first.** It walks everything without saving, to learn the total, then saves — so a status line stands where the family words stand and says "captured 3 of 40", with a ring filling beside it. Folders, repeats, and files we don't take are all counted, so the number always arrives at the total. The status line shows above the table too, for drops that land there with no drop box open.
- **A dialog line below it, rarely seen.** It carries the two-copies question, and anything else the drop has to say — the refusal of a file over a gigabyte moved here from a browser alert, so a drop is never interrupted by a window from outside the app. Each waits on OK, then vanishes.
- **Thirteen driven checks for the drop.** The browser's dropped entries are stood in for — each one only ever says whether it's a file or a folder, hands back the file, or lists what's inside — and the questions are answered through the same shared state the strip on screen reads, which proves the drop really does stop and wait. They cover every same-name rule, the standing "do the same for the rest" answer (and that it doesn't leak into the next drop), the counting, a refused ending, a file over the limit, and the folder rules. Writing them caught nothing in the drop; the one thing that broke was my stand-in reader, which answered before marking itself finished and so asked itself forever.
- **A repeated folder is compared by name and date, not name alone.** A folder whose files merely share names with an existing one is treated as a different folder and gets a numbered name; only a real match by date says it is the same folder.

## 2026-07-19 — clips, sound, and a movie that killed the tab

- **Audio and video are taken and played.** Every popular ending is accepted — mp4, m4v, mov, webm, ogv, avi, mkv, wmv, flv, mpg for clips, mp3, wav, ogg, m4a, aac, flac, wma, aiff for sound. The ones a browser can play open in a player; the rest are stored and grouped correctly but stay dark, the way Word files already do. They all still have speech in them, which is the point: a transcriber turns any of them into words later.
- **A 2 GB movie killed the tab, and the cause was ours.** Every file that wasn't words used to be turned into one enormous piece of text about a third larger than the file itself. A browser can't hold a piece of text that big, so the tab died outright. Now a file's raw bytes go into storage untouched — nothing is copied into memory at all — and the viewer points a player, picture, or page at a short-lived link to them, handed back the moment another document is shown. Documents saved the old way still open, because a stored piece of text is already a usable link.
- **One file over a gigabyte is refused out loud**, naming the file, its size, and the limit. Storage has a ceiling somewhere; a clear refusal beats hitting it partway through a save.
- **The drop box says what it takes, family by family.** Each family word now carries its own list of endings, shown on hover, worked out from what we accept — so a newly accepted ending appears in the right list by itself. Each word lights as a pill under the cursor, which is the only hint the list is there at all. The words stay quiet while a drag is over the box.
- **We accept more than the reading tool does.** I read AnythingLLM's own source: it takes plain words, web pages, pdf, docx, png, jpg, webp, and only mp3, wav, mp4, mpeg, ogg, oga, m4a, webm among sound and clips — and it does read words off pictures, which I had wrongly said it didn't. Everything else we accept (mov, avi, mkv, flac, gif, bmp, svg, rtf, doc and friends) is now marked as needing converting first. None of it is worthless: each one holds words or speech. Every dropped file now says in the log which of the three it is — already plain words, the tool pulls the words out itself, or it must be converted first.

## 2026-07-19 — what a document knows about itself

- **A document now records what it is, not just what to call it.** Alongside its name it keeps: the family it belongs to (picture, video, sound, pdf, web page, text, other), its file ending, the exact type the browser reported, its size in bytes, when the file was last changed, its own address in the store, and whether its words have been pulled out yet. Most of these are only knowable at the moment of the drop — the browser hands them over once and never again — so they're captured there and everything else is worked out later from what's kept.
- **Folders stopped pretending to be a file type.** "Folder" and "unknown" were entries in the list of file endings, which was a lie: neither is an ending. A folder is now marked by its family, with no ending and no bytes at all; an unrecognized file simply has no ending (and is skipped on the way in, as before). This needed an erase and re-drop, agreed in advance.
- **One idea instead of two.** The separate "how do we show this" list was the same four words as four of the families, so it's gone — asking a document how to show it now answers with a family, or nothing when a browser can't show it here. That also means adding a video or sound player later needs no new vocabulary.
- **The file knowledge moved onto the document itself.** Deciding a dropped file's kind, reading its bytes, and trimming a redundant ending all used to live with the drop handling; they now sit with the document, which is what they describe. The drop keeps only the browser wrangling — reading entries, walking folders — so the document stays free of any database ties. The two ways a document gets made (a file, a folder) now share one start and one finish, instead of repeating the same four lines.
- **Aimed at what comes next.** I read AnythingLLM's own source to see what it stores per document: the text body drives everything, and the rest — title, address, date, author, description — rides along on every piece and becomes the citation you see in an answer. The fields it fills with "Unknown" unless told otherwise are exactly the ones ji can now supply. The one real gap left is the extracted text, which each document now flags for itself.

## 2026-07-18 — the filter and header stay put while the list scrolls

- **Controls and header pinned.** The tag filter, the search box, and the column header now stay in place; only the list of documents scrolls beneath them. The rows moved into their own scrolling area and the header cells are held at the top.
- **Two table quirks solved.** The header wouldn't stay put at first: this table draws its grid as single shared lines between cells, and in that mode the browser ignores "stay pinned" on the header as a whole — so each header cell is pinned on its own instead. The closing line under the header kept scrolling away too, because a shared line between the header and the first row belongs to both; it's now drawn as its own line that stays with the header. A page-colored gap below that line also stays pinned, and the header text sits a few pixels higher.
- **Search box reacts to hover.** Hovering the search field lights it to the hover shade, matching the other controls. (A hover effect for the scroll bar was tried and taken back out — the browser drops the list's hover the moment the pointer reaches the bar, so it couldn't work cleanly.)

## 2026-07-17 — the details sections remember whether they were open

- **Preferences and data stay the way you leave them.** Inside the details region are two collapsible sections, "preferences" and "data". They opened fresh every reload. Now each remembers whether it was open or closed and comes back that way (open the first time), saved next to the other small settings. The whole region's show/hide was already remembered; this covers the two sections within it.

## 2026-07-17 — a jpeg counts as a jpg, and the tags title sits right

- **The extension drop now knows its aliases.** A "photo.jpg" in a jpeg row shows as "photo" now, not just "photo.jpeg". Rather than compare the ending to the format word, it reuses the same table that decides a dropped file's kind — so any extension that maps to the row's format is trimmed, which also covers htm/html and md/markdown. Folders and unmatched names still show whole.
- **Tags title moved right.** The heading over the tags column now hugs the right, lining up with the tags and buttons that sit at the right of each row.

## 2026-07-17 — filenames read cleaner, headers centered

- **A redundant extension drops off.** When a file's name ends in the same thing as its format ("notes.txt" in a text row), that ending is noise, so the list shows just "notes". Only an exact match is trimmed, and folders (which have no format) are left whole. The full name is still there for filtering and on hover. Making a jpeg count as a jpg is a small follow-up still open.
- **Long names cut off cleanly.** A name is capped at about 40% of the table's width and ends in an ellipsis when it runs long, its full text on hover. The cut-off is done on an inner piece of each row rather than the row cell itself, because cutting off at the cell was unreliable — that's why folder names were spilling while short file names looked fine.
- **Headers centered.** Each column's heading now sits centered over its column.
- **Empty ENTER backs out of adding a tag.** In the new-tag field, pressing RETURN with nothing typed closes the add-a-tag view instead of doing nothing.

## 2026-07-17 — a row only lights when its file can be opened

- **Hover highlight, narrowed.** A row now lights on hover only when its document can actually be shown. Folders and the kinds a browser can't open (documents, spreadsheets, tiff pictures) stay dark, so the highlight promises what the click delivers. It rides the same can-be-shown check that already decides whether the name opens and shows the pointer. The edit-tags and trash buttons still work on every row, showable or not.

## 2026-07-17 — erasing truly empties the file store

- **Erase now clears every stored file, not only the ones still listed.** Before, erase deleted the bytes of each document the app currently knew about — so bytes left behind by an older save scheme, or by a save that failed partway, kept sitting in the browser's large store taking space. The log proved it: an erase reported clearing zero while the store held tens of megabytes. Erase now deletes the whole file-store outright, so nothing survives however or whenever it was written, and the space is given back at once — the store came down from 27 MB to about 31 KB.
- **When another tab blocks it, you're told.** The browser refuses to delete the file-store while another tab has the same app open, and that used to fail silently and look like erase did nothing. Now a plain alert names the app's address and asks you to close your other tabs of it and erase again. The browser gives no way to name each tab, so it points at the shared address.
- **Proven.** A test plants a stray file-entry with no matching document and confirms erase clears it; ten store tests pass and the type check is clean.

## 2026-07-17 — the document rows get quieter and clearer

- **The whole row lights on hover, as a pill.** Hovering a row fills it with the hover shade, its ends rounded into a pill. Moving onto the small action buttons at the right drops that fill — they act on their own, not the row. The highlight is tracked in code rather than the usual hover, because the buttons stand a hair taller than the row and the plain hover kept dropping out over them.
- **Click a name to open it.** A showable document opens by clicking its name — the eye button is gone. The name shows a pointer and lights on hover only when the file can actually be shown; other names and folders stay plain.
- **The bin, drawn and colored.** The trash icon is a drawn bin, not the multicolor emoji (which ignores color), stroked in a new darker, more vivid accent. That shade is derived from the accent — 30% less true luminance and 30% more saturation — and recomputed whenever the accent changes.
- **Adding tags when there are none yet.** When the store holds no tags to pick from, a row's pencil offers an "add tags" button that opens the tag view, the same as the top control. Its click was reaching the background clearer and undoing itself the instant it fired; stopped that.
- **One click on a tag, and done.** Picking a tag in a row's picker now toggles it and closes the picker in a single click.
- **Cleared the row-measuring scaffolding.** The debug flag and the code that logged each row's height are gone; the faint line under each row stays.

## 2026-07-16 — the "autofocus was blocked" warning, gone

- **The cursor lands in the new-tag field without a warning.** Opening that view put the cursor in the field using the browser's own auto-focus mark. But the browser only honors that mark when nothing is focused, and the field opens right after a click that leaves the "add tags" button holding focus — so the browser refused and warned each time. Now the field focuses itself the moment it appears, which works even while the button still holds focus. Same result on screen, no warning.

## 2026-07-16 — dropping a folder keeps its shape

- **A dropped folder now comes in whole.** Before, a folder landing on the drop box was ignored — the drop could only see a flat list of files. It now reads through the door the browser offers for folders, so it can step inside. Each folder becomes a stand-in document named for the folder, every file inside is saved and linked under it, and any folder within is handled the same way, all the way down.
- **The list shows the tree.** Documents are listed folders-first, each contents following its folder, and every row is pushed right 20px for each folder it sits inside — so the nesting reads at a glance. A folder row shows nothing in the format column. Every document the drop makes, folders and files at any depth, wears the tags chosen at drop time.
- **Filtering never orphans a match.** When a search or tag filter keeps a file, its folder chain is kept on screen too, so a match never shows indented under nothing.
- **One small store addition, and it's tested.** A folder link needs a named meaning ("contains"); the store now reuses the one meaning instead of making a fresh copy each time. Two new store tests cover the depth-and-chain walk and the reused meaning; all eight pass, and the type check is clean. The one thing only a browser can confirm — the actual folder drop and the indented rows — Jonathan checked by eye.

## 2026-07-16 — html views as a page, and a file's kind stops guessing wrong

- **HTML opens as a page, safely.** An html document now renders in its own frame, sandboxed with no scripts — so the file's own markup and any scripts can't reach the app; it just shows as a page. Text, markdown, and rich text still show as text.
- **The view kept closing itself, found by the log.** Clicking the eye opened the view and then instantly shut it: the same click bubbled up to the click-anywhere-clears-it handler. The log told the story plainly — "Viewing document" was always followed by "Clicked out." The eye's click now stops there. (Then, on purpose, a click anywhere on an open document closes it, and the close became the shared cross in a black circle.)
- **A file's kind was decided only by its reported type, which lies.** A page from Chrome's "Save page as," and files that come in through the folder-reading path, often carry an empty or wrong type, so a .html never got the html kind and the viewer said "can't show." Now the kind is read from the filename extension first, with the reported type only as a fallback. The drop logs its kind decision, and the viewer logs the kind when it can't show something, so "can't show" is never a mystery again. Documents saved before this fix keep their old wrong kind — erase and re-drop to correct them.

## 2026-07-16 — each row gets view, edit, and trash

- **Three buttons per document row, in one column with its tags.** The last column, which held a single "edit tags" text button, is now quiet borderless icons: an eye to view, a pencil to edit tags, a bin to trash. They share the tags column — tag names on the left, buttons at the right. The eye is dark and dead on types a browser can't show, and simply blank on a folder row.
- **Opening a document.** The eye opens the file right in the content area (a new "view document" mode), showing pictures, pdfs, and text; the type decides how. The knowledge of which types are stored as text and which as wrapped bytes moved to a shared spot so the drop and the viewer read it the same way. This first viewer is basic — fleshing it out is its own next item.
- **Trashing, and folders.** The bin asks first: the three icons give way to two bordered buttons, "erase" and a round x (the shared cross). Erasing a folder takes everything inside it — a new delete-a-whole-branch step in the store that also removes every tag link and every relationship the deleted documents touched. Two store tests cover it.
- **Holding the row still, twice.** The bordered confirm buttons stand a touch taller than the icons; twice the row grew when they appeared, and twice it was a height leaking through — first the buttons stretching their cell, then, after the column merge, a flex child refusing to stay shorter than its content. Both fixed by pinning the button strip's height and telling it not to grow. Then the rows were trimmed a few dots shorter by his eye.

## 2026-07-16 — document bytes leave the tiny store, and the database files tidy up

- **A folder of real files stopped overflowing storage.** The bytes of each document were kept in browser storage, which holds only about five megabytes for the whole site — a folder of real PDFs blew past it and the save threw. The bytes now live in the browser's large store (IndexedDB), which holds far more; the small record lists stay in browser storage. Saving a document became a wait-for-it step, and the few places that save (the drop, the erase button) now wait for it. Type check clean, and the database tests pass, including two new ones for the deep-folder walk and the reused link-meaning.
- **A second overflow, from leftover copies.** After the move, a folder drop still overflowed — browser storage was still full of the old byte copies from before the move, so even the tiny record list couldn't fit. I added a one-time sweep to clear them, then Jonathan judged it unneeded (the erase button clears old data in one click) and I took it back out.
- **The database folder tidied.** The little "store changed" tick, the save-tracking helper, and the record shapes each moved to where they belong (the tick and shapes into shared spots, the save-tracker with the other plain types); the database test moved into a tests folder. One attempt to fold the tick into the registry was turned back — it would recreate the exact circular reference the tick was split out to avoid, and would have crashed the tests. The byte-store helper, briefly its own file, was folded back into the local store since nothing else used it.
- **Standing question, still open.** For private storage Jonathan does not want the app to copy the file in at all — the file already sits on disk. A reference could read it, but only with the user's approval each session, and remembering the reference across reloads needs the browser's large store anyway. Left undecided; the copy-into-IndexedDB path stands for now.

## 2026-07-16 — the "add documents" header becomes a real button

- **The middle header is now a button, not just text on the rule.** It stands at the shared control height with a solid black edge, sits white at rest, lights to the hover shade, and rides a dot lower so its text lines up with the plain headings beside it.
- **Two rule bugs, chased in the wrong order first.** The line vanished, then a faint ghost line appeared. My first guesses (row height, then the browser's default line) were both wrong. The line vanished because a reset was wiping out the line set right before it. The faint ghost was the black rule showing through the header labels — the labels were partly see-through, so their masking cover let the rule bleed through. The cover was made solid and only the label text fades now.
- **Lesson, again:** every wrong guess here was a claim about cause I couldn't see. The real causes only showed once I read the exact lines and reasoned from what the page must be doing — not from the first plausible story.

## 2026-07-16 — the details controls fall in line, and text rides right

- **Three controls in the data area finally agree.** The color swatch was drawn from a different size than the rest — a bigger token meant for square buttons — so it stood taller than the erase button and the storage switcher beside it. It now uses the shared control height. The erase button and the switcher also weren't counting their border inside, so they sat a hair tall; both now do, along with the yes/no buttons that appear when you confirm an erase. All four match the rest of the app.
- **All control text was sitting low, and now doesn't.** Jonathan saw every control's text riding about two dots below where it should within its border — a quirk of the label font. One shared change fixed it everywhere at once: the space above the text was trimmed and the same amount given back below, so the text rides up without changing any control's height. Settled at one dot of space on top, three below, by his eye.

## 2026-07-16 — every control the same height

- **Eight controls, one height at last.** Two of them — the search box and the new-tag field — already stood right, because they counted their own border inside the height. The other six didn't: the all/any toggle, the tag pill, and the help button each stood a border-width taller, and the "add a tag", "done", and build-opener buttons had no set height at all, taking whatever their text and padding worked out to. All six now count the border inside, the way the two inputs already did — one small change each, nothing else touched, type check clean.
- **The one thing a browser still has to say.** The two plain buttons used to hold their text upright by padding alone; now a fixed height governs them. The help button has worked this way with the same numbers all along, so I expect them fine — but only a browser can prove text stays centered, and I can't open one.

## 2026-07-15 — the shared rules stop living inside di

- **The session-behavior helpers moved up to the repo root.** Eleven of them (the reply checks, the always-file injection, the pre-edit snapshot, the command guard, the type check) sat inside di's folder even though they fire in every project. They now live at the root and are wired from there — verified live after a restart.
- **One of them had been checking the wrong project all along.** The end-of-turn type check was pinned to di, so a whole session of ji work would never have caught a ji error. It now checks whichever project the file you edited belongs to; a file with nothing to check is ignored.
- **The word list split in two.** di's own vocabulary (smart objects, unifaces, placement, measurements) stays with di; the ~19 rules that apply to any prose moved to a shared list beside the shared rules file. Both are named the same and sit at the same spot under their own root — the pattern the always-files already use.
- **Nothing names di any more.** The on-screen word-swapper and the rule-injector both read the shared list plus the list of whichever project you're working in, found by name. So the swapper could finally move to the root too, and a new project can add its own list tomorrow with no code change.
- **The word-checker followed, and its notebook came with it.** The last helper still naming di now finds both lists by name like the others, and moved to the root. The shared notebook the reply-checkers scribble in travelled with it, and now keeps only its newest 500 lines instead of growing forever.
- **Banned words can now keep their endings.** A swap used to force one spelling: "copies" became "move". A new mark on a row says its two sides are the same kind of word, so the ending carries — "copies" becomes "moves", "absorbing" becomes "placing", "liars" becomes "bugs". Seven rows are marked. The mark stays off where the two sides differ in kind, because carrying an ending there invents words: "shipped" would become "doned", "panels" would become "detailses".
- **The mark nearly killed every swap silently.** An empty mark column made the reader collapse two columns into one, so every row was skipped and nothing swapped at all. A tab reads as ordinary space; the fix was a separator that can't be mistaken for one. Caught only because the check ran the *unmarked* rows too — testing just the new feature would have shown a clean pass on an empty list.
- **Deleted the map that kept rotting.** di's wordsmithing page was a pointers-only map to four other files. It had gone stale in four ways at once — it described a check-before-send that was deleted, named di's own hooks folder as the enforcer after everything moved out of it, called the word list one home when it is now two, and opened by claiming the always-file calls it when nothing has called it for a while. A map with no truth of its own, that nobody reads, and that needs a rewrite every time anything moves, costs more than it returns. Gone, and unlinked from di's guide index.
- **The tail of the move turned out to be shorter than written.** Two of the three leftover jobs were already done: all three reply checkers write to the moved notebook, and the dead helpers are gone (two deleted, the test moved beside what it tests, di left with only its own two). The written plan had claimed otherwise; the files said different.
- **A rule for me.** Twice I reformatted Jonathan's indentation to satisfy a linter and mangled correct lines doing it. New standing rule: tabs in code, four spaces in notes; never reformat indentation nobody asked me to touch; a linter that disagrees loses. The real fix was already sitting in di — a settings file telling the checker four spaces is correct. It now lives at the root, so it covers every project, and di's copy is gone.

## 2026-07-14 — more file types a drop keeps

- **Seven more formats.** A drop now also saves markdown, html, rich text, and svg (kept as their plain text), plus webp images and Word doc / docx files (kept as wrapped bytes). The specific text types are matched before the plain-text catch-all so markdown and html aren't flattened to plain text. Tiff was left out — a browser can't show one, so there'd be no preview later; Word files store the same way but we accepted them anyway. The "accepted types" hint under the drop box lists them all straight from the type list, so it stays current on its own.

## 2026-07-14 — cutting the di leftovers

- **Trimmed the saved settings.** The settings list came over whole from di, carrying dozens of keys ji never touches (edge thickness, grid opacity, view mode, orientation, help sidebar, and more). Cut every key with no reader — the list is down to the seven ji actually uses (the details toggle, the current add-mode, the active store, the more/less choice, and the accent and text colors). Also renamed the saved-settings name-tag from "di:" to "ji:", so old di-era settings are ignored and everything starts fresh.
- **Cut the unused colors.** ji copied di's whole color engine — slider thumb/track/tick, focus halo, selection, and an edge color that fed 3D-part tints. Nothing on ji's screen reads any of those. Removed them and the machinery that derived and published them; only the accent, its lightened background, the hover shade, and the text color remain, and the color publisher now sets just the four page-variables something reads.

## 2026-07-14 — a diagnostic log that lives in a file

- **One log address for every project.** The hub's little log server used to answer a separate address per topic (only di's, hard-wired to one file). It now answers a single address and reads the file name from the request — send `where=intersection` and it writes `logs/intersection.log`. The name is checked so it can't point outside the logs folder. di's two log senders moved to the new address; the old one is gone.
- **ji writes to its own log now.** A tiny helper sends each line to that address (overwrites once at the start of a session, appends the rest), so a whole session's reasoning ends up in one file you can read afterward instead of only in the browser console.
- **Every log line ji already prints now goes to the file.** Swapped all the console prints over to the helper (the two failure warnings left as-is). Confirmed end-to-end: lines land in `logs/intersection.log`, the first one truncates and the rest append, and a bad file name is refused.

## 2026-07-14 — the table headers become the controls

- **Header row on the rule.** Above the documents table sits a row of column labels — format, document name, tags, edit tags — each a pill floating on the rule (the same look as the data panel's more/less), left-aligned to its column. Format and the last one are inert; the middle two light up on hover, where their text swaps to "add a document" / "add a tag".
- **Headers open the add flows.** Clicking "document name" shows the drop box, clicking "tags" shows the new-tag field. So I pulled the old "Add a new document / tag" control out of the top bar entirely — the headers are the entry point now, and the top bar is just the hamburger and help.
- **A click on the empty background closes an add flow** back to the list, leaving the picked filters alone. The new-tag view also has its own "done".
- **Empty store leads with the drop box.** With no documents, the view opens straight to the drop box and hides the filter, the search box, and the headers — nothing to filter or list yet.
- **Tags are one joined control now.** The tag chips became a single segmented pill (still multi-select — several can be lit), used both in the filter and in a row's edit-tags picker. The all/any toggle moved inside it and hides when there are no tags, and an "add a tag" button sits just to its right.
- **Search box.** Switched it to the browser's own search field so it draws its own clear ×; gave it a set width; and made both text fields share the standard control height.
- **Tidied the folders.** Renamed the tags folder to actions, moved the drop box in beside the tag pieces, moved the documents view into main, and deleted the emptied documents folder.

## 2026-07-13 — more file types, and a hint of what's accepted

- **More types save.** A drop now keeps text, jpeg, png, gif, bmp, and pdf — text as its plain contents, the rest as a data-URL (their bytes base64-wrapped, ready to show). Anything else is skipped with a note.
- **Accepted-types hint.** Under "drop documents here" sits a smaller centered line listing the types a drop will keep, read straight from the type list so it can never go stale.
- **Browse shows the type.** The browse view is now a two-column table — each document's type beside its name.
- **Erase names the store.** The confirm reads "erase all your local data?" (or firebase), the buttons pinned left and the question centered in the space beside them.

## 2026-07-13 — a live filter, one source of truth

- **Search state in one place.** A small `Search` module now holds the picked tags, the filter text, and the all/any mode, plus one function that narrows the documents. Every view reads it, so nothing keeps its own copy.
- **All or any.** A little segmented control at the far left of the tag row switches whether a document must carry every picked tag or just one of them.
- **Filter as you type.** A "filter by name" box sits under the tags; typing narrows the list at once, alongside the tag filter.

## 2026-07-13 — the always-on layout

- **One screen, no view-switching.** Rebuilt the content area to the intersection spec: a full-width accent controls row at the top (hamburger left, "Add a new document / tag" centered, help button right), then the tag chips, a rule, and the documents table — all always shown. Clicking "add new document" swaps the table for the drop box; clicking it again returns.
- **Chips filter, all-must-match.** The tag chips at the top double as a filter — picking chips keeps only documents that carry **every** picked tag.
- **Build + credit moved to the frame.** The "Build N" opener and "built by" credit now pin to the frame's bottom-left at the frontmost layer; the details region lost its empty top banner.
- **Files reorganized.** The old `operations/` folder became `documents/`; the tag pieces moved to a `tags/` folder; Add → Add_Document, Browse → Documents. Activity and the Enumerations file are gone (the operation enum lives in Operations now).
- **A pile of hand-tweaks.** Controls row sized to its controls with no vertical gaps; documents content gets an even `--gap` margin; the drop box a `--gap-fat` inset on three sides; the tag chips centered; the storage switcher moved to the far right of its row; the divider rule made visible again after the flex-column change hid it.

## 2026-07-13 — erase, a remembered toggle, and data-panel polish

- **Erase all.** A far-left "erase" button on the switcher row wipes the active store after an inline "erase all your data? yes / no"; while it asks, the erase button and the switcher both hide. Only the active store is touched — the wipe clears every record and every blob and saves it empty. A driven test proves it stays empty after a reload.
- **Remembered more / less.** Whether the storage switcher is shown is now a saved setting, so the choice survives a reload.
- **Dropped the unsaved readout.** It always read zero — the local store saves each change the instant it happens — so it was pulled until it means something for a cloud store.
- **Layout tidy.** The switcher row got a fixed height so clicking erase no longer squashes it, the erase button was matched to the switcher's height, and the rule and the row were nudged a few pixels tighter without changing the space below.

## 2026-07-13 — the store meets the screen

- **Drop to save.** Dropping files on the add view now saves each text file into the active store — its name, its kind, its contents. Images and pdfs are skipped with a note until we decide how to hold binary bytes.
- **Browse lists names.** The browse view shows every saved file's name, live: a drop or a delete updates it at once, with a quiet "no documents yet" when empty. The browse segment shows it now; the arrival text still shows when nothing is picked.
- **A data readout.** A "data" panel in the details region reports the document, tag, and unsaved counts, plus a storage switcher tucked behind a small "more / less" label that floats on a broken rule. Only the local store is built, so the cloud segment sits dimmed until firestore.
- **One live tick.** All three stay current off a single "the store changed" signal the store nudges on every save and every switch.
- **A freeze, caught.** The browse list first locked the page — it rebuilt a brand-new list inside a repeating step, which the framework saw as "changed" and ran again, forever. Fixed by making the names and the counts derived values — pure formulas that can't retrigger themselves.

## 2026-07-13 — document store built

- **Built the database repository** from [[db spec]] and [[db proposal]]. It's the ws plugin store ported whole — a registry that swaps storages, a shared base carrying the save / load / add / delete, thin storage subclasses — but the data is ji's own: five records (documents, tags, tagging, relationships, predicates) plus the document bytes kept outside the store.
- **Records live in browser storage,** each storage under its own name so two never collide. The bytes go through a read-by-id / write-by-id seam; the local storage parks them in browser storage for now (real files on disk come later).
- **Reads run off in-memory lookups** rebuilt on load — never saved. List documents walks the parent graph from each root (a node can have many parents; the walk won't loop). Filter by tag is one lookup. An inbox lists the untagged. Delete is a cascade: drop the links and the bytes, no orphans left.
- **Only the local storage is built;** the cloud one (firestore + Google's file store) is a drop-in for later, no changes to the base. Proven with a driven test — save a document and list it back after a reload, tag and filter, ordered children under a parent, delete leaves nothing behind. Type-check clean.
- **Killed the earlier flat one-record store** — it was the wrong shape (a plugin engine, not a single localStorage call).

## 2026-07-12 — design tokens complete + ws store scouted

- **Everything is a token now.** Extended the one-source system past sizes to cover every remaining design value: paddings and the header margin, the table column widths, font weight, letter-spacing, the two ink blacks/whites/gray, the popup shadow, and the dimming opacities. Each lives once in Constants (or Colors), is mirrored to a CSS variable at startup, and read with `var(...)`. No size, color, font, weight, spacing, border, radius, inset, shadow, or opacity is hardcoded in a component anymore — only structural `100%` fills and `0` resets remain.
- **One knob for bold.** Font weight is a single base number with two derived weights (banner, title); the whole interface's weight moves with it.
- **Ink colors joined the color pattern.** `black` (`#1a1a1a`, never `#000`), `white`, and `gray` live in Colors and push through Configuration, same as the theme tokens.
- **Fonts read bolder.** Loaded the medium Montserrat weight and preload it, so the heavier text is a real face, not browser-faked. (A wider bold range would want the variable font, which isn't installed.)
- **Small UI.** The build-notes close button fills with the hover color on pointer-over.
- **Scouted ws's document store** and wrote `notes/work/db spec.md` — what the ws persistence engine does (registry, base CRUD, the kept storages, the localStorage primitive), minus airtable/bubble/hierarchy. Finding: don't port the framework (it drags in Firebase + a large engine); ji needs only the local pattern — one localStorage key holding a JSON list of records.

## 2026-07-11 — design tokens: every size derived from one base number

- **One source for all sizes.** Every hardcoded number in the components — corner radii, heights, gaps, insets, font sizes, border widths, icon sizes — now comes from a single Constants file, where almost everything is a fraction or multiple of one base "comfortable tap" size (35). Change that one number and the whole interface rescales together.
- **The bridge.** Plain stylesheets can't read the TypeScript Constants, so a startup step mirrors the values onto the page as CSS variables (stacking layers, then all the layout sizes). A small global stylesheet (`main.css`) holds the stacking-layer classes; every component reads the rest with `var(...)`. Colors already worked this way; layers, metrics, fonts, insets, thicknesses, and icon sizes now do too.
- **Swept in waves.** Went value-family by value-family (radii, heights, gaps, fonts, insets, borders, icon sizes), each time finding every occurrence, routing it through the bridge, and confirming none were left. A few values shifted a fraction of a pixel where a tidy ratio replaced a round number — intended.
- **Icons on the size scale.** The hamburger and close-cross svgs now take their drawing and render sizes from the size constants; the hamburger box was made to match its drawing, so the old "let it spill over" setting could go.
- **Small UI.** The build-notes close button now fills with the hover color on pointer-over.

## 2026-07-11 — segmented control, arrival default, font twitch

- **Renames + reshuffle.** The layout frame is now Intersection (was Main), the content region is Activity (was Content), and the details-toggle icon is Controls (was Hamburger). The operation names moved into their own file under common as a small enum (browse / add / search, stored as one-letter codes).
- **Segmented control.** The old "add" pill became one segmented control driven off a single list of the operations. It then moved into the Controls cluster, so the hamburger and the segments sit together as one fixed group at the top-left, visible whether details are open or closed.
- **Arrival default + toggle-off.** Clicking the segment that's already on clears the selection to nothing, which drops the content to the arrival landing. The app now opens with nothing selected (arrival), and a chosen operation still survives a reload.
- **Add view trim.** Removed the back arrow from the add view (and its now-dead click wiring); getting back to browse is the browse segment. The drop rectangle keeps top room so it clears the control cluster.
- **Font twitch fixed.** On refresh the segment pill twitched a few pixels because the web font swapped in after the first paint. Fixed by preloading the two Montserrat weights the instant the bundle runs, so the font is ready before first paint — no late swap, no reflow. The preload paths come from importing the same font files the CSS uses, so nothing hardcoded goes stale.

## 2026-07-10 — add-document flow (skeleton) and picker polish

- **Add flow, Phase 1.** New content-mode store (browse / add / search); an "add" pill next to the hamburger switches to add mode; the content area swaps to a new Add view with a large drop-here rectangle that logs the dropped files. Persistence, tags, and the document store are still to come.
- **Color picker rebuilt.** The accent picker no longer leans on the native color swatch — the visible circle is our own element (background `--accent`, `--hover` on hover) with the real color input laid invisibly on top to catch the click. That fixed the hover the native swatch kept ignoring.
- **Polish.** The hamburger paths gained a permanent black 0.5px outline (hover changes only the fill). The add pill got a black border and `--hover` fill. The preferences banner fills `--hover` on hover.

## 2026-07-10 — auto text color

- **Text adapts to the theme.** Text flips white/black by background luminance so it stays readable at any accent. Two derived colors, computed in Colors when the accent changes: the content text from `--bg`, the details-region text from the accent (`--text-on-accent`). Wired the "Intersection" text to `--text` and the details banner to `--text-on-accent`.
- **Hamburger recolor.** On the content (details hidden) it's fixed black, turning the accent color on hover. On the accent (details shown) it flips with the accent and hovers to its opposite (`--text-on-accent-hover`). The build-notes popup is left alone — a fixed white card.

## 2026-07-09 — author credit

- **Author credit.** Added a small "author: jonathan sand" link in the content region, stacked under the "Build N" opener in the bottom-left corner — 4px gap, left-aligned, font two-thirds the opener's size. It opens jonathansand.me in a new tab and turns the accent color on hover.

## 2026-07-07 — content, hamburger, preferences

- **Content component.** Pulled the centered "Intersection" text and the "Build N" opener into their own Content component; the opener moved to Content's bottom-left corner, white background.
- **Popup takes over.** While the build-notes popup is open, the details and content regions hide (only the popup shows over the frame). Its open/closed flag lifted up to the frame so it can hide them.
- **di's hamburger.** The details toggle now draws di's exact hamburger icon (from the ported path utility) as a reusable snippet, shown at the same top-left spot whether details is open or closed; transparent background, white on hover, and an overflow fix so its left edge isn't clipped.
- **Show-details persists.** The show/hide state is now a saved preference (through the ported Preferences), so it survives a reload.

## 2026-07-07 — details toggle

- **Details region collapses.** A "details" banner atop the region hides it on click, so the content fills the full width. A fixed button in the upper-left corner (colored to match) brings it back.

## 2026-07-07 — rename

- **Renamed `in` → `ji`** across the folder, hub references, workspace list, the project's own config/package/guide, and the slash command. Re-linked the workspace and confirmed a clean type-check. Netlify base directory and the git commit left for Jonathan.

## 2026-07-06 — build notes, the cross, and theming

- **Two-line title.** Split the centered "Intersection / Hey, bro!" onto two lines.
- **Build notes popup, ported from di.** A "Build N" opener button (pill border, hover fills light gray) opens a modal listing build history, paged ten at a time with up/down arrows and a close button. The build data comes straight from a markdown table read at runtime, so editing it refreshes live. Applied the same direct-read change back to di.
- **The close cross.** Ported di's full SVG-path utility (plus its geometry and prototype-extension files) and used it to draw di's real X in the close button, inside a circular border.
- **di's color system.** Ported di's Colors plus its preferences and canvas-stale helpers, added the color2k package, and lifted just the CSS-variable setter out of di's Configuration (leaving its engine behind). Wired it so the color stores push `--bg` / `--accent` / `--hover` onto the page — the theme variables di components expect.
- **di's layout skeleton.** Rebuilt Main around di's frame: a fixed full-window frame with a details region and a content region (di's "graph", renamed), di's spacing numbers inlined.
- **Preferences banner + accent picker.** A collapsible "preferences" banner in the details region holds di's accent color picker, wired to the ported Colors — choosing an accent recolors the theme live. Fixed a "missing bottoms" report by giving the details region the accent color so the banner and body stand out against it.

## 2026-07-05 — into the hub, onto the web

- **Added the project to the hub.** New entry in the hub's ports list (port 5184), a button + keyboard shortcut in the hub page, and a dev-server line in the launcher script. Fixed a leftover port clash — the project's dev config still pointed at lv's port — and added it to the repo's workspace list.
- **Wired the public site.** Pointed intersection.lol (via Dynadot DNS) at the Netlify site, set Netlify's base directory and build, and worked through a stuck Let's Encrypt certificate by removing and re-adding the domain.
