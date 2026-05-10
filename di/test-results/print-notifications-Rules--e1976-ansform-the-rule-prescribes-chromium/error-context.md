# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: print-notifications.spec.ts >> Rules 39 + 62 — a single box produces the exact silhouette transform the rule prescribes
- Location: e2e/tests/print-notifications.spec.ts:231:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 1.8115799685048077
Received: 1.47636

Expected precision:    3
Expected difference: < 0.0005
Received difference:   0.33521996850480784
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - button "toggle details" [ref=e6] [cursor=pointer]:
        - img [ref=e7]
      - button "Open user guide" [ref=e9] [cursor=pointer]: "?"
      - button "save" [ref=e10] [cursor=pointer]
      - button "edit ⟳" [ref=e11] [cursor=pointer]
      - generic [ref=e12]:
        - generic [ref=e13]: guides
        - slider [ref=e17]: "100"
      - generic [ref=e18]:
        - button "names" [ref=e19] [cursor=pointer]
        - button "dimensions" [ref=e20] [cursor=pointer]
        - button "angles" [ref=e21] [cursor=pointer]
      - button "3D ⟳" [ref=e22] [cursor=pointer]
      - button "solid ⟳" [ref=e23] [cursor=pointer]
    - generic [ref=e26]:
      - generic [ref=e28]:
        - slider [ref=e29]: "79.9313336224013"
        - generic:
          - generic:
            - generic: "1"
          - generic:
            - generic: "100"
      - generic [ref=e31]:
        - button [ref=e32] [cursor=pointer]:
          - img [ref=e33]
        - button [ref=e35] [cursor=pointer]:
          - img [ref=e36]
    - generic [ref=e38]:
      - generic [ref=e39]:
        - button "bottom" [ref=e40] [cursor=pointer]
        - button "top" [ref=e41] [cursor=pointer]
        - button "left" [ref=e42] [cursor=pointer]
        - button "right" [ref=e43] [cursor=pointer]
        - button "back" [ref=e44] [cursor=pointer]
        - button "front" [ref=e45] [cursor=pointer]
      - button "straighten" [ref=e46] [cursor=pointer]
      - button "🧲" [ref=e47] [cursor=pointer]
  - generic [ref=e48]:
    - generic [ref=e52]:
      - generic [ref=e53]:
        - button "factory reset preferences" [ref=e54] [cursor=pointer]:
          - button "factory reset" [ref=e56]
          - generic [ref=e57]: preferences
        - generic [ref=e58]:
          - combobox [ref=e60] [cursor=pointer]:
            - option "imperial" [selected]
            - option "metric"
            - option "marine"
            - option "archaic"
          - generic [ref=e61]:
            - generic [ref=e62]: precision
            - generic [ref=e63]:
              - button "foot" [ref=e64] [cursor=pointer]
              - button "inch" [ref=e65] [cursor=pointer]
              - button "1/2" [ref=e66] [cursor=pointer]
              - button "1/4" [ref=e67] [cursor=pointer]
              - button "1/8" [ref=e68] [cursor=pointer]
              - button "1/16" [ref=e69] [cursor=pointer]
              - button "1/32" [ref=e70] [cursor=pointer]
              - button "1/64" [ref=e71] [cursor=pointer]
          - generic [ref=e72]:
            - img
            - img
            - img
            - img
          - generic [ref=e73]:
            - generic [ref=e74]: line thickness
            - slider [ref=e75] [cursor=pointer]: "2"
          - generic [ref=e76]:
            - generic [ref=e77]:
              - generic [ref=e78]: accent
              - textbox [ref=e79] [cursor=pointer]: "#c8c8c8"
            - generic [ref=e80]:
              - generic [ref=e81]: lines
              - textbox [ref=e82] [cursor=pointer]: "#874efe"
      - button "reinstall library +" [ref=e84] [cursor=pointer]:
        - button "reinstall" [ref=e86]
        - generic [ref=e87]: library
        - button "+" [ref=e89]
      - button "parts (5) +" [ref=e91] [cursor=pointer]:
        - generic [ref=e92]: parts (5)
        - button "+" [ref=e94]
      - button "edit" [ref=e96] [cursor=pointer]:
        - generic [ref=e97]: edit
      - button "givens +" [ref=e99] [cursor=pointer]:
        - generic [ref=e100]: givens
        - button "+" [ref=e102]
    - button "build 66" [ref=e107] [cursor=pointer]
```

# Test source

```ts
  150 | // Rule 39 — the drawing's screen silhouette is the smallest rectangle
  151 | // on the screen that contains every visible block's projection.
  152 | // ═══════════════════════════════════════════════════════════════════
  153 | 
  154 | test('Rule 39 — the print handler computes a non-empty silhouette and applies a sensible transform', async ({ page }) => {
  155 | 	await page.goto('/?test=1');
  156 | 	await page.waitForSelector('.region.graph canvas');
  157 | 	await page.waitForFunction(() => 'di_test' in window);
  158 | 
  159 | 	expect(await transform_of(page)).toBe('');
  160 | 
  161 | 	await dispatch_print_start(page);
  162 | 
  163 | 	const transform = await transform_of(page);
  164 | 	const parsed = parse_transform(transform);
  165 | 	expect(parsed).not.toBeNull();
  166 | 	if (!parsed) return;
  167 | 
  168 | 	expect(parsed.scale).toBeGreaterThan(0);
  169 | 	expect(Number.isFinite(parsed.tx)).toBe(true);
  170 | 	expect(Number.isFinite(parsed.ty)).toBe(true);
  171 | });
  172 | 
  173 | test('Rule 39 — running the handler twice produces the same transform (the silhouette is stable)', async ({ page }) => {
  174 | 	await page.goto('/?test=1');
  175 | 	await page.waitForSelector('.region.graph canvas');
  176 | 	await page.waitForFunction(() => 'di_test' in window);
  177 | 
  178 | 	await dispatch_print_start(page);
  179 | 	const first = parse_transform(await transform_of(page));
  180 | 	expect(first).not.toBeNull();
  181 | 
  182 | 	await dispatch_print_end(page);
  183 | 	expect(await transform_of(page)).toBe('');
  184 | 
  185 | 	await dispatch_print_start(page);
  186 | 	const second = parse_transform(await transform_of(page));
  187 | 	expect(second).not.toBeNull();
  188 | 	if (!first || !second) return;
  189 | 
  190 | 	expect(second.scale).toBeCloseTo(first.scale, 4);
  191 | 	expect(second.tx).toBeCloseTo(first.tx, 4);
  192 | 	expect(second.ty).toBeCloseTo(first.ty, 4);
  193 | });
  194 | 
  195 | // ═══════════════════════════════════════════════════════════════════
  196 | // Rule 61 — during printing, the browser delivers two notifications;
  197 | // the second triggers the silhouette and printable-area calculation.
  198 | // ═══════════════════════════════════════════════════════════════════
  199 | 
  200 | test('Rule 61 — dispatching the print-start notification populates the canvas transform', async ({ page }) => {
  201 | 	await page.goto('/?test=1');
  202 | 	await page.waitForSelector('.region.graph canvas');
  203 | 	await page.waitForFunction(() => 'di_test' in window);
  204 | 
  205 | 	expect(await transform_of(page)).toBe('');
  206 | 
  207 | 	await dispatch_print_start(page);
  208 | 
  209 | 	const after = await transform_of(page);
  210 | 	expect(after).not.toBe('');
  211 | 	expect(after).toMatch(/translate.*scale/);
  212 | });
  213 | 
  214 | test('Rule 61 — dispatching the print-end notification clears the canvas transform', async ({ page }) => {
  215 | 	await page.goto('/?test=1');
  216 | 	await page.waitForSelector('.region.graph canvas');
  217 | 	await page.waitForFunction(() => 'di_test' in window);
  218 | 
  219 | 	await dispatch_print_start(page);
  220 | 	expect(await transform_of(page)).not.toBe('');
  221 | 
  222 | 	await dispatch_print_end(page);
  223 | 	expect(await transform_of(page)).toBe('');
  224 | });
  225 | 
  226 | // ═══════════════════════════════════════════════════════════════════
  227 | // Rules 39 + 62 — a known scene plus a known camera produces the
  228 | // exact silhouette and transform that the rule prescribes.
  229 | // ═══════════════════════════════════════════════════════════════════
  230 | 
  231 | test('Rules 39 + 62 — a single box produces the exact silhouette transform the rule prescribes', async ({ page }) => {
  232 | 	await setup_print_page(page);
  233 | 
  234 | 	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
  235 | 	await page.evaluate((bounds) => {
  236 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  237 | 		t.add_so({ name: 'ALPHA', bounds });
  238 | 	}, ALPHA);
  239 | 
  240 | 	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
  241 | 	const expected = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
  242 | 	expect(expected).not.toBeNull();
  243 | 	if (!expected) return;
  244 | 
  245 | 	await dispatch_print_start(page);
  246 | 	const actual = parse_transform(await transform_of(page));
  247 | 	expect(actual).not.toBeNull();
  248 | 	if (!actual) return;
  249 | 
> 250 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
      |                       ^ Error: expect(received).toBeCloseTo(expected, precision)
  251 | 	expect(actual.tx).toBeCloseTo(expected.tx, 0);
  252 | 	expect(actual.ty).toBeCloseTo(expected.ty, 0);
  253 | });
  254 | 
  255 | test('Rule 39 — two boxes far apart in world space produce a silhouette that contains both', async ({ page }) => {
  256 | 	await setup_print_page(page);
  257 | 
  258 | 	// ALPHA on the left, BETA on the right. Far enough apart that a
  259 | 	// single-object silhouette would be much smaller than the two-object one.
  260 | 	const ALPHA = { x_min: -60, x_max: -30, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  261 | 	const BETA  = { x_min:  30, x_max:  60, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  262 | 	await page.evaluate((args) => {
  263 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  264 | 		t.add_so({ name: 'ALPHA', bounds: args.alpha });
  265 | 		t.add_so({ name: 'BETA',  bounds: args.beta  });
  266 | 	}, { alpha: ALPHA, beta: BETA });
  267 | 
  268 | 	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
  269 | 	const all_corners = [...corners_of(ALPHA), ...corners_of(BETA)];
  270 | 	const expected = expected_transform_for(all_corners, view_proj, canvas_dims);
  271 | 	expect(expected).not.toBeNull();
  272 | 	if (!expected) return;
  273 | 
  274 | 	await dispatch_print_start(page);
  275 | 	const actual = parse_transform(await transform_of(page));
  276 | 	expect(actual).not.toBeNull();
  277 | 	if (!actual) return;
  278 | 
  279 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
  280 | 	expect(actual.tx).toBeCloseTo(expected.tx, 0);
  281 | 	expect(actual.ty).toBeCloseTo(expected.ty, 0);
  282 | 
  283 | 	// Sanity: the two-box silhouette must be wider than a single-box silhouette
  284 | 	// would have been (single-box scale would be much larger).
  285 | 	const alpha_only = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
  286 | 	expect(alpha_only).not.toBeNull();
  287 | 	if (alpha_only) expect(actual.scale).toBeLessThan(alpha_only.scale);
  288 | });
  289 | 
  290 | test('Rule 39 — a box that extends past the visible frame has its silhouette clamped to the canvas edges', async ({ page }) => {
  291 | 	await setup_print_page(page);
  292 | 
  293 | 	// Make the box much wider than the camera can see so the left and
  294 | 	// right corners project past the canvas edges in drawing pixels.
  295 | 	const HUGE = { x_min: -500, x_max: 500, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  296 | 	await page.evaluate((bounds) => {
  297 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  298 | 		t.add_so({ name: 'HUGE', bounds });
  299 | 	}, HUGE);
  300 | 
  301 | 	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
  302 | 	const expected = expected_transform_for(corners_of(HUGE), view_proj, canvas_dims);
  303 | 	expect(expected).not.toBeNull();
  304 | 	if (!expected) return;
  305 | 
  306 | 	await dispatch_print_start(page);
  307 | 	const actual = parse_transform(await transform_of(page));
  308 | 	expect(actual).not.toBeNull();
  309 | 	if (!actual) return;
  310 | 
  311 | 	// The expected transform was computed with clamping baked in. If the
  312 | 	// production handler doesn't clamp (or clamps differently), these
  313 | 	// numbers diverge and the test fails.
  314 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
  315 | 	expect(actual.tx).toBeCloseTo(expected.tx, 0);
  316 | 	expect(actual.ty).toBeCloseTo(expected.ty, 0);
  317 | });
  318 | 
  319 | test('Rule 39 — a box whose visibility flag is off contributes nothing to the silhouette', async ({ page }) => {
  320 | 	await setup_print_page(page);
  321 | 
  322 | 	// Visible ALPHA on the left, invisible BETA on the right. Without the
  323 | 	// visibility filter, BETA would expand the silhouette to the right.
  324 | 	const ALPHA = { x_min: -40, x_max: -10, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  325 | 	const BETA  = { x_min:  10, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  326 | 	await page.evaluate((args) => {
  327 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  328 | 		t.add_so({ name: 'ALPHA', bounds: args.alpha });
  329 | 		t.add_so({ name: 'BETA',  bounds: args.beta  });
  330 | 		t.set_so_visibility('BETA', false);
  331 | 	}, { alpha: ALPHA, beta: BETA });
  332 | 
  333 | 	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
  334 | 	// Expected silhouette uses ALPHA only — BETA is invisible.
  335 | 	const expected = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
  336 | 	expect(expected).not.toBeNull();
  337 | 	if (!expected) return;
  338 | 
  339 | 	await dispatch_print_start(page);
  340 | 	const actual = parse_transform(await transform_of(page));
  341 | 	expect(actual).not.toBeNull();
  342 | 	if (!actual) return;
  343 | 
  344 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
  345 | 	expect(actual.tx).toBeCloseTo(expected.tx, 0);
  346 | 	expect(actual.ty).toBeCloseTo(expected.ty, 0);
  347 | });
  348 | 
  349 | test('Rule 39 — a child whose ancestor has hide-children on contributes nothing to the silhouette', async ({ page }) => {
  350 | 	await setup_print_page(page);
```