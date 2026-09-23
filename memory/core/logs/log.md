# core log

<!-- consolidated: 9 September 2026 -->

## 23 September 2026

- D: T_Position.align drawn: Separator.svelte's horizontal line measures its left edge with a ResizeObserver and the window's resize, sets --line-x on itself, and a placed thing with align sits at calc(50vw - --line-x), translated back by half; sections.md says so; core's 100 pass. Jonathan's go
- D: Action's right is gone, Jonathan's edit, and T_Position gains align; Separator.svelte's line that read right dropped, its comment and sections.md's sentence with it; align's drawing waits for go. Jonathan's d
- D: Action gains right, px from the right end for a right-placed thing, 0 leaving the separator's own gap; Separator.svelte applies it as it applies top; sections.md says so; core's 100 pass. Jonathan's word
- D: Action gains top, px below the line's middle, negative above, 0 by default; Separator.svelte puts a placed thing at 50% plus its top, mask and all; sections.md's Element placement algorithm says so; core's 100 pass. Jonathan's go on shared's drive
## 22 September 2026

- D: SVG_Paths.ts gains t_cross, a plus of two strokes held in by a margin, ws's five lines beside x_cross, ws keeping its own; core's 100 pass. Jonathan's go, for kb's add button

## 19 September 2026

- D: drive, batch A, the fates of 7 September: sections, sections spec and hits system arrive from shared's truth/develop; design/okf, editing and compose an email are byte for byte ai's, their deletion waiting on Jonathan's word; design/ov - goals differs from ai's at line 3

## 18 September 2026

- D: decisions.md to logs, its open pacs to zone/proposals.md; proposals.md to the zone, through the dispatcher: logs hold the past, zone the present, truth the concrete. Jonathan's decision in memory/shared/logs/decisions.md
## 15 September 2026

- D: the area's name on a big pill sits a micro gap lower, Big_Pill.svelte. Jonathan's decision in memory/ai/truth/decisions.md
- D: organize.md deleted, the same file as shared's; murk journal moved to shared, the newer copy; zone/work/soon/index.md no longer names them. Jonathan's decision in memory/ai/truth/decisions.md
- D: core's hits manager and mouse ux in zone/work/soon are the one copy, ai's older twins deleted. Jonathan's decision in memory/ai/truth/decisions.md
- D: a micro rung on the thickness ladder, a quarter of the normal, pushed to the page as --thick-micro, Constants.ts and Configuration.ts; the area's name on a big pill edged with it, Big_Pill.svelte. Jonathan's decision in memory/ai/truth/decisions.md
- D: the hits manager's drift check raises its alert only past the thin line's thickness, a pixel and a tenth, where it raised it past half a pixel: six alerts in ai's editor were each under a pixel, the whole editor moved up by a fraction after it was measured, and a strip off by that much answers the same presses. The alert also logs every box above the element, its height, its top and its scroll, so the next one names the mover. Check clean at 470 files, 100 tests
## 14 September 2026

- D: a folded section's hairline is held in by --gap-huge at each side, in Section.svelte and Stack.svelte, and Section takes line_down_when_folded, how far below the band's middle its hairline sits, a style variable the hairline reads. Jonathan's decision in memory/ai/truth/decisions.md
- D: Preferences takes a prefix or a function answering it, prefix_now reading it at each call, and gains adopt, which moves every value saved under another prefix and drops the old keys; Storage_Like names length and key for the walk. Two cases in preferences.test. Check clean at 470 files, 100 tests

## 13 September 2026

- D: Debug.ts gathers log lines for 50 ms and sends them in one request per log file, the first request erasing as the first line did. Sending each line as it came made about 2,850 requests in a burst when kb's page related every link after a write, past the cap a browser puts on a page's requests, and the browser then failed the write itself with ERR_INSUFFICIENT_RESOURCES, read by the page as Failed to fetch. Reproduced in a headless browser at a burst of 2,000, not at 1,000. After: 54 log requests in a page's first 15 seconds against 1,661. Core check clean at 470 files, 98 tests, kb 540 and ai 533 clean

## 9 September 2026

- D: utilities/Preferences.ts, a class with a prefix and an injectable storage, read and write as text or json, remove, clear, and a store that saves itself. Offered from the utilities barrel. Seven tests beside it. adopting core.md no longer says no preferences
- I: pac in truth/decisions.md, move Persistence into core. Two hosts remember things two ways. For, behavior is core's. Against, core's truth says no preferences. Middle path, the mechanism with a prefix in core, the keys in each host. Undecided
- S: settled 6 lines of 1, 7 and 8 September. The bridge is in truth/adopting core.md and the lexicon. The pac's decision is in truth/decisions.md. The hosts and the Hamburger are in index.md. Two settle records dismissed as done. The ov-journey idea cleared from zone/ideas.md, its telling being truth/adopting core.md
- I: proposal, the preference keys every host shares. Dropped by Jonathan the same day, before anything was built
- I: pac in truth/decisions.md, move mj's four preference keys into core. Three of the four already exist in ov under the same names. For, one enum instead of two and soon three. Against, a key names state, which is the host's, and preferences_open is host vocabulary. Middle paths, the enum in panel, or the two colors alone in core. Undecided
- I: pac, the libraries define the keys and the hosts store the values. Removed from truth/decisions.md by Jonathan the same day
- D: T_Details gained rules, a third section of the details column, for ov's rules section. check clean
