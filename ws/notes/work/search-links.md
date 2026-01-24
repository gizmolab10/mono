# Search Links

## Problem

Search currently finds Things by title, trait values, or tags. If a Thing has a LINK trait (URL), users can't search the content *at* that URL.

## Goal

Add an optional search mode that:
1. Fetches HTML content from LINK trait URLs
2. Indexes that content
3. Lets users find Things based on their linked content

## Questions

- When to fetch? On-demand when mode enabled? Background on index build?
- Cache strategy? Store fetched content locally? Expiration?
- What to index? Full text? Just visible text (strip HTML)?
- UI for enabling? New `T_Search_Preference.link_content`?
- Error handling? Dead links, slow fetches, CORS issues?

## Approach

*Decisions and changes as we go*

## Resolution

*Verify the solution works*
