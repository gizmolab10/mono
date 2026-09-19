# panel log

<!-- consolidated: 9 September 2026 -->

## 18 September 2026

- D: decisions.md to logs, its open pac to zone/proposals.md; questions.md to the zone, through the dispatcher: logs hold the past, zone the present, truth the concrete. Jonathan's decision in memory/shared/logs/decisions.md
## 13 September 2026

- D: the controls row's right end is a flex box that takes the whole row past the hamburger, its contents at the right end unless they grow, in place of a spacer sharing the width with the host's snippet: kb's row, which grows, started halfway across, its way back a gigantic gap from the hamburger. Now one gap off it, as ov's was
- D: the details column sits a big gap and a tiny gap further up, 13.6px, a negative top margin Jonathan set by eye, the nudge Jonathan measured with kb's stack in it after the padding above went. The cause is not found by reading panel's and kb's files, so the nudge is marked as one, to be measured in the browser
- D: the details column holds no gap above, padding 0 var(--gap) var(--gap) as ov's column, since kb's stack holds its own gap above its first separator and the column's top section sat a gap too low. gallery's sidebar rises by the same gap
- D: the details column's background is the accent, as ov's is, in place of the page color, so kb's stack paints the page color where it wants it and the accent shows above and below. gallery's sidebar sits on the accent now too
- D: the status line is core's Status_Line, drawn in place of panel's own line of words, so a host's offer passes through: four new props, offer, ontake, onhide and onreport, each with a default, so gallery, lv, mj and mu change nothing. kb is a host of panel now, at step 5 of ov's plan. Check clean at 414 files, gallery 480, mu 417, lv 406, mj 480

## 9 September 2026

- D: the outer div's class is app, not frame, in App.svelte. Check clean
- I: pac in truth/decisions.md, made for it — does panel remain. Source hosts take from, library hosts import, or nothing. Middle path: the Importing proposal's decision decides this one. Undecided
- S: settled 5 lines of 7 September, all into index.md: brought up, both halves proved, the badge F, the name label, panel imports core, mu and mj hold their own versions. zone/questions.md now asks only the half still open
- D: Panel.svelte, new, is the page as a component a host draws: the controls row, the details column, the operation view, and a status line below them while it has words. The host hands what goes in each region as snippets, the name, whether the column is shown and the press that toggles it. Controls.svelte takes the name and a snippet for its right end, Details.svelte and Operation.svelte take what they hold. App.svelte is the smallest host of it, feeding the cursor and pushing the colors, nothing in any region. gallery imports it. Check clean at 413 files
- D: Panel.svelte takes a resize at most once per 20 ms, mj's timer moved here for every host, and hands each region its size: the details snippet its width, the operation snippet its width and height, computed from the window's less the controls row and the status line, which say their own heights. mj and mu import Panel now and hold no version of the three region files. Nobody holds one but panel. Check clean 413 files
- D: Panel.svelte and Controls.svelte take hamburger, drawn by default, so a host with no column to show draws none
