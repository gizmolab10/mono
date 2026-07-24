import { render } from '../render';

// Print manager. Owns the silhouette-based print scaling that used to live in
// App.svelte. The browser's print system drives it: register() wires the
// beforeprint / afterprint events and the print media-query change, so Cmd+P
// (or File -> Print) calls in here exactly as before.
//
// Read the canvas's rendered pixels and find the smallest rectangle that
// contains every rendered (non-transparent) pixel. The rendered content is
// what the printer captures, so the silhouette must be derived from those
// pixels, not from world-space corner projections — which can disagree with
// the rendered content for perspective scenes near the camera plane.

class Print {
	private resize_observer: ResizeObserver | null = null;
	private registered = false;

	/** Wire the browser print events. Idempotent and safe to call with no DOM. */
	register(): void {
		if (this.registered || typeof window === 'undefined') return;
		this.registered = true;
		// Register both: beforeprint fires immediately (Safari relies on this);
		// the print media-query change event fires after the print stylesheet
		// has been applied (Chrome — gives the correct page-area dimensions).
		window.addEventListener('beforeprint', () => this.on_before_print());
		window.addEventListener('afterprint',  () => this.on_after_print());
		const print_mq = window.matchMedia('print');
		print_mq.addEventListener('change', e => {
			if (e.matches) this.on_before_print();
			else           this.on_after_print();
		});
	}

	private compute_silhouette(canvas: HTMLCanvasElement): { left: number, top: number, width: number, height: number } | null {
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

	private apply_print_transform(canvas: HTMLCanvasElement): void {
		const sil = this.compute_silhouette(canvas);
		if (!sil) {
			// Nothing rendered — drop any prior transform so the canvas stays
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

	private on_before_print(): void {
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement | null;
		if (!canvas) return;
		// Real browsers fire this event before flipping the print media query,
		// so the canvas still holds the on-screen render (with grid, axes, hover
		// dots, selection dots). Force a synchronous rerender under print mode
		// so the silhouette read below sees the clean pixels the printer will
		// actually capture.
		render.render_for_print();
		// First pass: synchronous apply so something is on screen immediately.
		// The resize observer below catches up if the layout reflows after.
		this.apply_print_transform(canvas);
		// Watch the canvas. The print stylesheet resizes it to fill the page,
		// and that resize may happen on the same tick or a frame later.
		// Re-apply on every observed resize.
		this.resize_observer?.disconnect();
		this.resize_observer = new ResizeObserver(() => {
			console.log('[print diagnostic] === resize observer fired ===');
			this.apply_print_transform(canvas);
		});
		this.resize_observer.observe(canvas);
	}

	private on_after_print(): void {
		this.resize_observer?.disconnect();
		this.resize_observer = null;
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement | null;
		if (!canvas) return;
		canvas.style.transform       = '';
		canvas.style.transformOrigin = '';
	}
}

export const print = new Print();
