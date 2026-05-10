# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: print-notifications.spec.ts >> Diagnostic — print media emulation: log the canvas dimensions before and after the print stylesheet activates, and verify the resulting transform
- Location: e2e/tests/print-notifications.spec.ts:438:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 2.2750835855653047
Received: 1.93345

Expected precision:    2
Expected difference: < 0.005
Received difference:   0.34163358556530476
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
  445 | 	}, ALPHA);
  446 | 
  447 | 	// Dimensions on screen, before print stylesheet activates.
  448 | 	const before = await page.locator('.region.graph canvas').evaluate(el => {
  449 | 		const node = el as HTMLCanvasElement;
  450 | 		return {
  451 | 			drawing_w: node.width,
  452 | 			drawing_h: node.height,
  453 | 			css_w: node.clientWidth,
  454 | 			css_h: node.clientHeight,
  455 | 			window_w: window.innerWidth,
  456 | 			window_h: window.innerHeight,
  457 | 		};
  458 | 	});
  459 | 
  460 | 	// Activate the print media query. This is what triggers the print stylesheet
  461 | 	// in a real browser when the user opens the print preview.
  462 | 	await page.emulateMedia({ media: 'print' });
  463 | 	await page.waitForTimeout(100);
  464 | 
  465 | 	// Dimensions during print, after stylesheet activates.
  466 | 	const during = await page.locator('.region.graph canvas').evaluate(el => {
  467 | 		const node = el as HTMLCanvasElement;
  468 | 		return {
  469 | 			drawing_w: node.width,
  470 | 			drawing_h: node.height,
  471 | 			css_w: node.clientWidth,
  472 | 			css_h: node.clientHeight,
  473 | 			window_w: window.innerWidth,
  474 | 			window_h: window.innerHeight,
  475 | 		};
  476 | 	});
  477 | 
  478 | 	// Fire the print-start notification.
  479 | 	await dispatch_print_start(page);
  480 | 	const after_transform = parse_transform(await transform_of(page));
  481 | 
  482 | 	// Log everything so the failure mode is visible in the test output.
  483 | 	console.log('ALPHA scene, viewport 1200 by 900');
  484 | 	console.log('  before print media — canvas drawing surface', before.drawing_w, 'by', before.drawing_h, '— canvas CSS box', before.css_w, 'by', before.css_h, '— window inner', before.window_w, 'by', before.window_h);
  485 | 	console.log('  during print media — canvas drawing surface', during.drawing_w, 'by', during.drawing_h, '— canvas CSS box', during.css_w, 'by', during.css_h, '— window inner', during.window_w, 'by', during.window_h);
  486 | 	console.log('  applied transform — scale', after_transform?.scale, '— translate', after_transform?.tx, ',', after_transform?.ty);
  487 | 
  488 | 	// Compute what the transform should be for the during-print dimensions.
  489 | 	const view_arr = await page.evaluate(() =>
  490 | 		(window as unknown as { di_test: { camera_view: () => number[] } }).di_test.camera_view()
  491 | 	);
  492 | 	const proj_arr = await page.evaluate(() =>
  493 | 		(window as unknown as { di_test: { camera_projection: () => number[] } }).di_test.camera_projection()
  494 | 	);
  495 | 	const view = mat4.fromValues(...(view_arr as Parameters<typeof mat4.fromValues>));
  496 | 	const proj = mat4.fromValues(...(proj_arr as Parameters<typeof mat4.fromValues>));
  497 | 	const view_proj = mat4.create();
  498 | 	mat4.multiply(view_proj, proj, view);
  499 | 
  500 | 	const expected_during = expected_transform_for(corners_of(ALPHA), view_proj, {
  501 | 		drawing_w: during.drawing_w,
  502 | 		drawing_h: during.drawing_h,
  503 | 		css_w: during.css_w,
  504 | 		css_h: during.css_h,
  505 | 	});
  506 | 	const expected_before = expected_transform_for(corners_of(ALPHA), view_proj, {
  507 | 		drawing_w: before.drawing_w,
  508 | 		drawing_h: before.drawing_h,
  509 | 		css_w: before.css_w,
  510 | 		css_h: before.css_h,
  511 | 	});
  512 | 
  513 | 	console.log('  expected for during-print dimensions — scale', expected_during?.scale, '— translate', expected_during?.tx, ',', expected_during?.ty);
  514 | 	console.log('  expected for before-print dimensions — scale', expected_before?.scale, '— translate', expected_before?.tx, ',', expected_before?.ty);
  515 | 
  516 | 	// Reset the media emulation for following tests.
  517 | 	await page.emulateMedia({ media: null });
  518 | 
  519 | 	// Assert: the applied transform should match the during-print expected,
  520 | 	// not the before-print one. If it matches the before-print one, the
  521 | 	// handler is reading stale dimensions.
  522 | 	expect(after_transform).not.toBeNull();
  523 | 	expect(expected_during).not.toBeNull();
  524 | 	if (!after_transform || !expected_during) return;
> 525 | 	expect(after_transform.scale).toBeCloseTo(expected_during.scale, 2);
      |                                ^ Error: expect(received).toBeCloseTo(expected, precision)
  526 | });
  527 | 
  528 | // ═══════════════════════════════════════════════════════════════════
  529 | // Rules 63 + 64 — the print layout's containers fill the page
  530 | // ═══════════════════════════════════════════════════════════════════
  531 | 
  532 | test('Rule 63 — the drawing area\'s CSS box fills the printable area during print', async ({ page }) => {
  533 | 	await setup_print_page(page);
  534 | 
  535 | 	const ALPHA = { x_min: -50, x_max: 50, y_min: -30, y_max: 30, z_min: -20, z_max: 20 };
  536 | 	await page.evaluate((bounds) => {
  537 | 		const t = (window as unknown as { di_test: Record<string, (...args: unknown[]) => unknown> }).di_test;
  538 | 		t.add_so({ name: 'ALPHA', bounds });
  539 | 	}, ALPHA);
  540 | 
  541 | 	await page.emulateMedia({ media: 'print' });
  542 | 	await page.waitForTimeout(100);
  543 | 
  544 | 	const dims = await page.evaluate(() => {
  545 | 		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement;
  546 | 		return {
  547 | 			canvas_w: canvas.clientWidth,
  548 | 			canvas_h: canvas.clientHeight,
  549 | 			window_w: window.innerWidth,
  550 | 			window_h: window.innerHeight,
  551 | 		};
  552 | 	});
  553 | 
  554 | 	await page.emulateMedia({ media: null });
  555 | 
  556 | 	// With a half-inch default margin on every side (96 CSS pixels at 96dpi
  557 | 	// per inch), the canvas should equal (window minus one inch) on each
  558 | 	// axis. Allow a few pixels tolerance for rounding.
  559 | 	const inch = 96;
  560 | 	const expected_w = dims.window_w - 2 * inch * 0.5;
  561 | 	const expected_h = dims.window_h - 2 * inch * 0.5;
  562 | 	expect(Math.abs(dims.canvas_w - expected_w)).toBeLessThan(8);
  563 | 	expect(Math.abs(dims.canvas_h - expected_h)).toBeLessThan(8);
  564 | });
  565 | 
  566 | test('Rule 65 — the printed sheet carries a default half-inch margin on every side', async ({ page }) => {
  567 | 	await setup_print_page(page);
  568 | 
  569 | 	await page.emulateMedia({ media: 'print' });
  570 | 	await page.waitForTimeout(100);
  571 | 
  572 | 	const padding = await page.evaluate(() => {
  573 | 		const cs = getComputedStyle(document.body);
  574 | 		return {
  575 | 			top:    cs.paddingTop,
  576 | 			right:  cs.paddingRight,
  577 | 			bottom: cs.paddingBottom,
  578 | 			left:   cs.paddingLeft,
  579 | 			box_sizing: cs.boxSizing,
  580 | 		};
  581 | 	});
  582 | 
  583 | 	await page.emulateMedia({ media: null });
  584 | 
  585 | 	// Half-inch at 96dpi is 48 CSS pixels. Each padding side should equal
  586 | 	// that value, and box-sizing must be border-box so body still fills the
  587 | 	// page area despite the padding.
  588 | 	expect(padding.top   ).toBe('48px');
  589 | 	expect(padding.right ).toBe('48px');
  590 | 	expect(padding.bottom).toBe('48px');
  591 | 	expect(padding.left  ).toBe('48px');
  592 | 	expect(padding.box_sizing).toBe('border-box');
  593 | });
  594 | 
  595 | test('Rule 64 — the body fills the page height during print', async ({ page }) => {
  596 | 	await setup_print_page(page);
  597 | 
  598 | 	await page.emulateMedia({ media: 'print' });
  599 | 	await page.waitForTimeout(100);
  600 | 
  601 | 	const dims = await page.evaluate(() => ({
  602 | 		body_h: document.body.clientHeight,
  603 | 		window_h: window.innerHeight,
  604 | 	}));
  605 | 
  606 | 	await page.emulateMedia({ media: null });
  607 | 
  608 | 	// The body's height must cover the window's height during print. If
  609 | 	// it collapses below the window, the chain of percentage heights
  610 | 	// below cannot resolve to the page area. Overflow is allowed.
  611 | 	expect(dims.body_h).toBeGreaterThanOrEqual(dims.window_h * 0.95);
  612 | });
  613 | 
  614 | test('Rule 62 — the production handler produces a centred transform: applying scale then translate to the canvas centre lands inside the canvas area', async ({ page }) => {
  615 | 	await page.goto('/?test=1');
  616 | 	await page.waitForSelector('.region.graph canvas');
  617 | 	await page.waitForFunction(() => 'di_test' in window);
  618 | 
  619 | 	await dispatch_print_start(page);
  620 | 
  621 | 	const parsed = parse_transform(await transform_of(page));
  622 | 	expect(parsed).not.toBeNull();
  623 | 	if (!parsed) return;
  624 | 
  625 | 	const css = await canvas_css_size(page);
```