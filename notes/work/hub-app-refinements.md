# Hub App Refinements

**Started:** 2026-01-28
**Status:** Proposals

* [ ] i want simpler update docs 1 liners
* [ ] a hover to show deploy status
* [ ] links to logs when errors occur
* [ ] all 5 deploys complete
## 1. Simpler update docs 1-liners

**Current:** Console shows "building" then full status message from script.

**Problem:** Status messages are verbose, hard to scan.

**Proposal:** Show compact progress like `ws ✓  di...  mono` where:
- `✓` = done
- `...` = in progress  
- `✗` = failed
- (nothing) = pending

**Implementation:**
- Modify `update-project-docs.sh` to write single-line status
- Or parse existing status in JS and compress it

---

## 2. Hover to show deploy status

**Current:** Deploy status only shows in console when actively deploying.

**Problem:** No way to see deploy state without clicking through to Netlify.

**Proposal:** Hover over 'Work Sites' title in title row shows per-site status tooltip:
```
ws: ready (2m ago)
di: building
ws-docs: ready (5m ago)
di-docs: ready (5m ago)  
mono-docs: error
```

**Implementation:**
- Cache deploy status from existing `/deploy-status` endpoint
- Show tooltip on 'Work Sites' title hover with current state per site
- Update cache every 10s (already polling)

---

## 3. Links to logs when errors occur

**Current:** Error messages shown in console but no way to see details.

**Problem:** Have to navigate to Netlify manually to see logs.

**Proposal:** When deploy fails, make console text clickable → opens deploy log page.

**Implementation:**
- `/deploy-status` already returns `deploy_url`
- On error state, wrap console message in `<a>` to deploy page
- Or: Add "view log" link after error message

---

## 4. All 5 deploys complete

**Current:** Shows `✓ All 5 deploys complete` when all finish.

**Problem:** Message disappears; no persistent indicator of deploy health.

**Proposal:** Add subtle status indicator near title or in corner:
- Green dot = all 5 ready
- Yellow dot = some building
- Red dot = any errors

**Implementation:**
- Add small status dot element
- Update color based on aggregated deploy state
- Always visible, doesn't require hover

---

## Next Action

Pick one to implement first. Suggest #2 (hover deploy status) — highest value, moderate complexity.
