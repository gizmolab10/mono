# ai log

<!-- consolidated: 15 September 2026 -->

## 21 September 2026

- D: a heading's words sit in one span, heading-words, from name_the_headings in Markdown_Blocks.ts: a heading is a flex row and each child was an item of its own, so the space before a link in a heading was drawn 0px wide, measured headless on workflow.md's line 5; 3.5px now. Two test cases, 145 pass, svelte-check clean; working features row 99. Jonathan's d and go

## 20 September 2026

- D: the tag edit joins the closed tag list and the tagset fix in Customizations.ts, a file whose prose needs work; the tag areas test passes. Jonathan's decision, the pac in shared's decisions.md

## 18 September 2026

- D: decisions.md to logs, its open pacs to zone/proposals.md; questions.md to the zone, through the dispatcher: logs hold the past, zone the present, truth the concrete. Jonathan's decision in memory/shared/logs/decisions.md
- D: a drawing answers neither hover nor click: Edit_Markdown.svelte's page target is dormant with no tip while drawing, on_page_click returns at once, and the drawing rule sets the cursor to default. Measured headless on cadence.svg: no hover fill, no tooltip, no edit box after a click, cursor default. Jonathan's decision in truth/decisions.md
- D: folded back links draw no upper line: Back_Links.svelte's Section edge is T_Edge.view while folded, T_Edge.thick while shown. Measured headless on the handbook: two lines in the foot shown, one folded, two again. Jonathan's decision in truth/decisions.md
- D: a drawing has no title line: Edit_Markdown.svelte draws title-sep for markdown only, the drawing class pads the top by one gap, and fill_the_gaps adds no blank-line rows to a drawing, the cause of the 137 numbered blank rows Jonathan saw. Measured headless: the markdown file keeps its line, its sticky h1 and its rows; the drawing has none of the three. Jonathan's decision in truth/decisions.md
- D: a drawing fits the view's width: Drawings.ts holds is_drawing and with_view_box, Labels.ts reads is_drawing from it, Edit_Markdown.svelte's drawn_page gives a drawing its viewBox and the view-page wears drawing, whose rule makes the svg 100% wide and its height auto. Measured headless: the svg one pixel under the view's inner width at 1400, 2400 and 900 wide, no sideways scroll. 143 tests pass. Jonathan's decision in truth/decisions.md
- D: svg files listed and drawn: plugin.py's LISTED_ENDINGS takes .svg, Labels.ts's is_drawing and labels_for give a drawing kind howto and tag journal from Customizations.ts, Edit_Markdown.svelte's drawn_page shows the svg as it is; cadence.svg opened headless, its labels written to the db, 82 svg elements on the page; ai's 137 tests and kb's 177 pass, the dispatcher's 47 once its stale co.md fixture named index.md. Jonathan's decision in truth/decisions.md

## 15 September 2026

- D: step 16 rewritten and proved headless, the four file operations on a throwaway file, the plan ticked, the journal's entry written; the visual report pending. Jonathan's go
- D: step 15 proved headless, a link followed and the stepper walking back, the plan ticked, the journal's entry written; the visual report pending. Jonathan's go
- D: step 15 rewritten in memory/ai/zone/work/music and ai.md: kb keeps link following, the report and the link stack; the step is a proof. Jonathan's decision in memory/ai/truth/decisions.md
- S: consolidated again 15 September 2026: three D: lines settled, two into working features rows 91 and 92, one already home in the lexicon and the banned words, one already home in the journal and the finished truth; the manifest in the chat
