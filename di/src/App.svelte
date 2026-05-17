<script lang='ts'>
	import { colors } from './lib/ts/utilities/Colors';
	import { c } from './lib/ts/common/Configuration';
	import Main from './lib/svelte/main/Main.svelte';
	import { render } from './lib/ts/render';

	const { w_accent_color, w_background_color, w_selected_color, w_text_color, w_hover_color } = colors;

	$effect(() => {
		c.configure_reactive_colors($w_text_color, $w_accent_color, $w_selected_color, $w_background_color, $w_hover_color);
	});

	// ── Silhouette-based print scaling ──
	// Read the canvas's painted pixels and find the smallest rectangle that
	// contains every painted (non-transparent) pixel. The painted content is
	// what the printer captures, so the silhouette must be derived from those
	// pixels, not from world-space corner projections — which can disagree
	// with the painted content for perspective scenes near the camera plane.

	function compute_silhouette(canvas: HTMLCanvasElement): { left: number, top: number, width: number, height: number } | null {
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		const w = canvas.width;
		const h = canvas.height;
		if (w === 0 || h === 0) return null;

		const data = ctx.getImageData(0, 0, w, h).data;

		let x_lo = w, x_hi = -1;
		let y_lo = h, y_hi = -1;

		for (let y = 0; y < h; y++) {
			const row_offset = y * w * 4;
			for (let x = 0; x < w; x++) {
				const alpha = data[row_offset + x * 4 + 3];
				if (alpha === 0) continue;
				if (x < x_lo) x_lo = x;
				if (x > x_hi) x_hi = x;
				if (y < y_lo) y_lo = y;
				if (y > y_hi) y_hi = y;
			}
		}

		if (x_hi < x_lo || y_hi < y_lo) return null;

		return { left: x_lo, top: y_lo, width: x_hi - x_lo + 1, height: y_hi - y_lo + 1 };
	}

	function apply_print_transform(canvas: HTMLCanvasElement) {
		const sil = compute_silhouette(canvas);
		if (!sil) {
			// Nothing painted — drop any prior transform so the canvas stays
			// untouched. Without this, a transform applied on an earlier read
			// (when stale pixels were still on the canvas) would persist.
			canvas.style.transform       = '';
			canvas.style.transformOrigin = '';
			return;
		}

		const css_w = canvas.clientWidth  || canvas.width;
		const css_h = canvas.clientHeight || canvas.height;

		// The print stylesheet uses object-fit: contain — a single uniform
		// scale that fills one direction and letterboxes the other.
		const f     = Math.min(css_w / canvas.width, css_h / canvas.height);
		const lb_x  = (css_w - canvas.width  * f) / 2;
		const lb_y  = (css_h - canvas.height * f) / 2;
		const sil_css = {
			left  : sil.left   * f + lb_x,
			top   : sil.top    * f + lb_y,
			width : sil.width  * f,
			height: sil.height * f,
		};

		const s  = Math.min(css_w / sil_css.width, css_h / sil_css.height);
		const tx = css_w / 2 - (sil_css.left + sil_css.width  / 2) * s;
		const ty = css_h / 2 - (sil_css.top  + sil_css.height / 2) * s;

		canvas.style.transformOrigin = '0 0';
		canvas.style.transform       = `translate(${tx}px, ${ty}px) scale(${s})`;
	}

	let print_resize_observer: ResizeObserver | null = null;

	function on_before_print() {
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement | null;
		if (!canvas) return;
		// Real browsers fire this event before flipping the print media query,
		// so the canvas still holds the on-screen render (with grid, axes, hover
		// dots, selection dots). Force a synchronous repaint under print mode
		// so the silhouette read below sees the clean pixels the printer will
		// actually capture.
		render.paint_for_print();
		// First pass: synchronous apply so something is on screen immediately.
		// The resize observer below catches up if the layout reflows after.
		apply_print_transform(canvas);
		// Watch the canvas. The print stylesheet resizes it to fill the page,
		// and that resize may happen on the same tick or a frame later.
		// Re-apply on every observed resize.
		print_resize_observer?.disconnect();
		print_resize_observer = new ResizeObserver(() => {
			console.log('[print diag] === resize observer fired ===');
			apply_print_transform(canvas);
		});
		print_resize_observer.observe(canvas);
	}

	function on_after_print() {
		print_resize_observer?.disconnect();
		print_resize_observer = null;
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement | null;
		if (!canvas) return;
		canvas.style.transform       = '';
		canvas.style.transformOrigin = '';
	}

	if (typeof window !== 'undefined') {
		// Register both: beforeprint fires immediately (Safari relies on this);
		// the print media-query change event fires after the print stylesheet
		// has been applied (Chrome — gives the correct page-area dimensions).
		window.addEventListener('beforeprint', on_before_print);
		window.addEventListener('afterprint',  on_after_print);
		const print_mq = window.matchMedia('print');
		print_mq.addEventListener('change', e => {
			if (e.matches) on_before_print();
			else           on_after_print();
		});
	}

</script>

<Main />

<style>
	:global(body) {
		font-family: system-ui, sans-serif;
		user-select: none;
		margin: 0;
	}

	:global(input:focus, textarea:focus) {
		user-select: text;
	}

	@media (max-width: 429px) {
		:global(:root) {
			--th-content-sep: 1px !important;
			--th-thin-sep: 1px !important;
			--l-gap-small: 1px !important;
			--l-gap-tiny: 1px !important;
			--l-gap: 1px !important;
		}
	}

	@media print {
		@page {
			margin: 0;
		}

		/* Anchor the height chain at the top: html, body, and the mount-point
		 * div all fill the page area. Without these, percentage-height
		 * descendants collapse to content height, and the drawing area ends up
		 * too short on tall paper. */
		:global(html), :global(body), :global(#app) {
			height: 100% !important;
		}

		/* Half-inch margin on every side of the printed sheet. Implemented as
		 * body padding with border-box sizing instead of @page margin so the
		 * inset applies uniformly on all four sides regardless of browser. */
		:global(body) {
			background: white;
			margin: 0;
			padding: 0.5in !important;
			box-sizing: border-box !important;
		}

		:global(.panel) {
			background: white !important;
			position: static !important;
			min-width: 0 !important;
			padding: 0 !important;
			height: 100% !important;
			width: 100% !important;
		}

		:global(.region.controls),
		:global(.region.details),
		:global(.canvas-actions),
		:global(.breadcrumbs),
		:global(.status-strip) {
			display: none !important;
		}

		:global(.main) {
			height: 100% !important;
			width: 100% !important;
			margin: 0 !important;
			gap: 0 !important;
		}

		:global(.region.graph) {
			border-radius: 0 !important;
			overflow: hidden !important;
			position: relative !important;
			height: 100% !important;
			width: 100% !important;
			flex: 1 !important;
		}

		:global(.graph canvas) {
			object-fit: contain !important;
			height: 100% !important;
			width: 100% !important;
			transform-origin: 0 0;
		}
	}
</style>
