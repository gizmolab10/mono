# panel log

<!-- consolidated: 9 September 2026 -->

## 9 September 2026

- D: the outer div's class is app, not frame, in App.svelte. Check clean
- I: pac in truth/decisions.md, made for it — does panel remain. Source hosts take from, library hosts import, or nothing. Middle path: the Importing proposal's decision decides this one. Undecided
- S: settled 5 lines of 7 September, all into index.md: brought up, both halves proved, the badge F, the name label, panel imports core, mu and mj hold their own versions. zone/questions.md now asks only the half still open
- D: Panel.svelte, new, is the page as a component a host draws: the controls row, the details column, the operation view, and a status line below them while it has words. The host hands what goes in each region as snippets, the name, whether the column is shown and the press that toggles it. Controls.svelte takes the name and a snippet for its right end, Details.svelte and Operation.svelte take what they hold. App.svelte is the smallest host of it, feeding the cursor and pushing the colors, nothing in any region. gallery imports it. Check clean at 413 files
- D: Panel.svelte takes a resize at most once per 20 ms, mj's timer moved here for every host, and hands each region its size: the details snippet its width, the operation snippet its width and height, computed from the window's less the controls row and the status line, which say their own heights. mj and mu import Panel now and hold no version of the three region files. Nobody holds one but panel. Check clean 413 files
- D: Panel.svelte and Controls.svelte take hamburger, drawn by default, so a host with no column to show draws none
