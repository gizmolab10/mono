# core log

<!-- consolidated: 9 September 2026 -->

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
