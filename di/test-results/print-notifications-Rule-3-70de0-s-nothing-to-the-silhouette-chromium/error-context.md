# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: print-notifications.spec.ts >> Rule 39 — a box whose visibility flag is off contributes nothing to the silhouette
- Location: e2e/tests/print-notifications.spec.ts:319:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 6.038599732006169
Received: 1.47636

Expected precision:    3
Expected difference: < 0.0005
Received difference:   4.562239732006169
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
  244 | 
  245 | 	await dispatch_print_start(page);
  246 | 	const actual = parse_transform(await transform_of(page));
  247 | 	expect(actual).not.toBeNull();
  248 | 	if (!actual) return;
  249 | 
  250 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
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
> 344 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
      |                       ^ Error: expect(received).toBeCloseTo(expected, precision)
  345 | 	expect(actual.tx).toBeCloseTo(expected.tx, 0);
  346 | 	expect(actual.ty).toBeCloseTo(expected.ty, 0);
  347 | });
  348 | 
  349 | test('Rule 39 — a child whose ancestor has hide-children on contributes nothing to the silhouette', async ({ page }) => {
  350 | 	await setup_print_page(page);
  351 | 
  352 | 	// Parent ALPHA on the left, child CHILD on the right (and parented
  353 | 	// to ALPHA). With hide-children turned on for ALPHA, the silhouette
  354 | 	// should reflect ALPHA alone — CHILD is suppressed.
  355 | 	const ALPHA = { x_min: -40, x_max: -10, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  356 | 	const CHILD = { x_min:  10, x_max:  40, y_min: -10, y_max: 10, z_min: -5, z_max: 5 };
  357 | 	await page.evaluate((args) => {
  358 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  359 | 		t.add_so({ name: 'ALPHA', bounds: args.alpha });
  360 | 		t.add_so({ name: 'CHILD', bounds: args.child, parent_name: 'ALPHA' });
  361 | 		t.set_so_hide_children('ALPHA', true);
  362 | 	}, { alpha: ALPHA, child: CHILD });
  363 | 
  364 | 	const { canvas_dims, view_proj } = await read_canvas_and_view_projection(page);
  365 | 	const expected = expected_transform_for(corners_of(ALPHA), view_proj, canvas_dims);
  366 | 	expect(expected).not.toBeNull();
  367 | 	if (!expected) return;
  368 | 
  369 | 	await dispatch_print_start(page);
  370 | 	const actual = parse_transform(await transform_of(page));
  371 | 	expect(actual).not.toBeNull();
  372 | 	if (!actual) return;
  373 | 
  374 | 	expect(actual.scale).toBeCloseTo(expected.scale, 3);
  375 | 	expect(actual.tx).toBeCloseTo(expected.tx, 0);
  376 | 	expect(actual.ty).toBeCloseTo(expected.ty, 0);
  377 | });
  378 | 
  379 | test('Rule 39 — an empty scene leaves the canvas with no transform applied', async ({ page }) => {
  380 | 	await setup_print_page(page);
  381 | 	// setup_print_page already cleared the scene. No SOs added.
  382 | 
  383 | 	expect(await transform_of(page)).toBe('');
  384 | 
  385 | 	await dispatch_print_start(page);
  386 | 
  387 | 	// With no objects, the silhouette is empty and the handler returns
  388 | 	// early — leaving the canvas untouched.
  389 | 	expect(await transform_of(page)).toBe('');
  390 | });
  391 | 
  392 | // ═══════════════════════════════════════════════════════════════════
  393 | // Rule 62 — the production handler produces a centred transform.
  394 | // ═══════════════════════════════════════════════════════════════════
  395 | 
  396 | test('Rule 39 — the canvas-resize signal causes the transform to be re-applied with the new dimensions (timing pin)', async ({ page }) => {
  397 | 	await setup_print_page(page);
  398 | 
  399 | 	const ALPHA = { x_min: -30, x_max: 30, y_min: -20, y_max: 20, z_min: -10, z_max: 10 };
  400 | 	await page.evaluate((bounds) => {
  401 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  402 | 		t.add_so({ name: 'ALPHA', bounds });
  403 | 	}, ALPHA);
  404 | 
  405 | 	// Capture the original canvas CSS-pixel size, then fire the print-start
  406 | 	// notification and capture the scale value of the resulting transform.
  407 | 	const initial_css_w = await page.locator('.region.graph canvas').evaluate(el => (el as HTMLElement).clientWidth);
  408 | 	await dispatch_print_start(page);
  409 | 	const before_resize = parse_transform(await transform_of(page));
  410 | 	expect(before_resize).not.toBeNull();
  411 | 	if (!before_resize) return;
  412 | 
  413 | 	// Now force the canvas's CSS box to change size. The handler should
  414 | 	// observe the resize and re-apply the transform.
  415 | 	await page.evaluate((new_w) => {
  416 | 		const canvas = document.querySelector('.region.graph canvas') as HTMLElement;
  417 | 		canvas.style.width = `${new_w}px`;
  418 | 	}, initial_css_w * 2);
  419 | 	await page.waitForTimeout(100);
  420 | 
  421 | 	const after_resize = parse_transform(await transform_of(page));
  422 | 	expect(after_resize).not.toBeNull();
  423 | 	if (!after_resize) return;
  424 | 
  425 | 	// The scale must change after the canvas resizes — otherwise the handler
  426 | 	// is reading stale dimensions and producing the wrong transform for the
  427 | 	// printed page area.
  428 | 	expect(Math.abs(after_resize.scale - before_resize.scale)).toBeGreaterThan(0.01);
  429 | });
  430 | 
  431 | // ═══════════════════════════════════════════════════════════════════
  432 | // Diagnostic test — uses Playwright's print media emulation to
  433 | // reproduce the real-browser print stylesheet effects (the canvas
  434 | // resizing). Logs the dimensions the handler sees at each stage so
  435 | // the bug can be isolated.
  436 | // ═══════════════════════════════════════════════════════════════════
  437 | 
  438 | test('Diagnostic — print media emulation: log the canvas dimensions before and after the print stylesheet activates, and verify the resulting transform', async ({ page }) => {
  439 | 	await setup_print_page(page);
  440 | 
  441 | 	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
  442 | 	await page.evaluate((bounds) => {
  443 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  444 | 		t.add_so({ name: 'ALPHA', bounds });
```