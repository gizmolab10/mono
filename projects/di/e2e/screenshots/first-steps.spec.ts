import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT = path.resolve(__dirname, '../../src/manual/images/first-steps');

async function setup_fresh(page: Page): Promise<void> {
	await page.goto('/');
	// Wipe local state so the bundled drawer is the loaded scene every time.
	await page.evaluate(() => localStorage.clear());
	await page.reload();
	await page.waitForSelector('canvas');
	// Allow paint and tumble settle.
	await page.waitForTimeout(1200);
	// Hide the details panel via the hamburger button so the canvas dominates.
	await page.getByRole('button', { name: 'toggle details' }).click();
	await page.waitForTimeout(400);
}

async function canvas_box(page: Page) {
	const canvas = page.locator('canvas').first();
	const box = await canvas.boundingBox();
	if (!box) throw new Error('canvas not visible');
	return box;
}

test.describe.configure({ mode: 'serial' });

test('01 — opening view of the drawer', async ({ page }) => {
	await setup_fresh(page);
	await page.screenshot({ path: path.join(OUT, '01-opening.png'), fullPage: false });
});

test('02 — dimensions on', async ({ page }) => {
	await setup_fresh(page);
	await page.getByRole('button', { name: 'dimensions' }).click();
	await page.waitForTimeout(400);
	await page.screenshot({ path: path.join(OUT, '02-dimensions-on.png'), fullPage: false });
});

test('03 — locked cursor', async ({ page }) => {
	await setup_fresh(page);
	// New default is editing-on; click the edit button to engage the lock.
	await page.getByRole('button', { name: /edit ⟳/ }).click();
	await page.waitForTimeout(300);
	// Hover near a corner of the drawer to surface the grab cursor.
	const box = await canvas_box(page);
	await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
	await page.waitForTimeout(300);
	await page.screenshot({ path: path.join(OUT, '03-locked-cursor.png'), fullPage: false });
});

test('04 — toolbar with padlock', async ({ page }) => {
	await setup_fresh(page);
	await page.getByRole('button', { name: /edit ⟳/ }).click();
	await page.waitForTimeout(300);
	const lock_btn = page.getByRole('button', { name: /🔒 edit ⟳/ });
	await lock_btn.screenshot({ path: path.join(OUT, '04-toolbar-padlock.png') });
});

test('05 — mid-stretch', async ({ page }) => {
	await setup_fresh(page);
	// Editing is on by default. Click a face to select it.
	const box = await canvas_box(page);
	await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
	await page.waitForTimeout(400);
	// Drag a region near a corner — capture mid-drag.
	const sx = box.x + box.width * 0.7;
	const sy = box.y + box.height * 0.7;
	await page.mouse.move(sx, sy);
	await page.mouse.down();
	await page.mouse.move(sx + 80, sy + 60, { steps: 12 });
	await page.waitForTimeout(300);
	await page.screenshot({ path: path.join(OUT, '05-mid-stretch.png'), fullPage: false });
	await page.mouse.up();
});

test('06 — dimension input overlay', async ({ page }) => {
	await setup_fresh(page);
	await page.getByRole('button', { name: 'dimensions' }).click();
	await page.waitForTimeout(400);
	// Click on the canvas at a likely dimension-number location. Dimensions are
	// rendered on the canvas itself, so this is best-effort by coordinate.
	const box = await canvas_box(page);
	// Try a position near the bottom edge of the drawer where a width number sits.
	await page.mouse.click(box.x + box.width * 0.35, box.y + box.height * 0.78);
	await page.waitForTimeout(400);
	await page.screenshot({ path: path.join(OUT, '06-dimension-input.png'), fullPage: false });
	// Dismiss any input overlay.
	await page.keyboard.press('Escape');
});

test('07 — blank canvas after library plus', async ({ page }) => {
	await setup_fresh(page);
	// Re-open the details panel to reach the library plus button, then close again.
	const hamburger = page.getByRole('button', { name: 'toggle details' });
	await hamburger.click();
	await page.waitForTimeout(300);
	const plus_buttons = page.locator('button.banner-add');
	await plus_buttons.first().click();
	await page.waitForTimeout(600);
	await hamburger.click();
	await page.waitForTimeout(400);
	await page.screenshot({ path: path.join(OUT, '07-blank-canvas.png'), fullPage: false });
});

test('08 — fresh child', async ({ page }) => {
	await setup_fresh(page);
	// Re-open the details panel to reach the library and parts plus buttons.
	const hamburger = page.getByRole('button', { name: 'toggle details' });
	await hamburger.click();
	await page.waitForTimeout(300);
	const plus_buttons = page.locator('button.banner-add');
	// Start a new scene.
	await plus_buttons.first().click();
	await page.waitForTimeout(500);
	// Add a child.
	await plus_buttons.nth(1).click();
	await page.waitForTimeout(600);
	await hamburger.click();
	await page.waitForTimeout(400);
	await page.screenshot({ path: path.join(OUT, '08-fresh-child.png'), fullPage: false });
});
