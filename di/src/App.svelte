<script lang='ts'>
	import { colors } from './lib/ts/utilities/Colors';
	import { c } from './lib/ts/common/Configuration';
	import Main from './lib/svelte/main/Main.svelte';
	import { camera, scene } from './lib/ts/render';
	import { mat4, vec4 } from 'gl-matrix';

	const { w_accent_color, w_background_color, w_selected_color, w_text_color } = colors;

	$effect(() => {
		c.configure_reactive_colors($w_text_color, $w_accent_color, $w_selected_color, $w_background_color);
	});

	// ── Silhouette-based print scaling ──
	// Project every smart object's world-space corners through the camera to
	// canvas pixel coordinates, take the smallest enclosing rectangle, then
	// scale and translate the canvas so that rectangle fills the page area.

	function compute_silhouette(canvas: HTMLCanvasElement): { left: number, top: number, width: number, height: number } | null {
		// Use the same visibility filter the renderer uses: an object counts
		// only when its own visibility flag is on AND no ancestor has its
		// "hide children" flag on. That excludes invisible container objects
		// whose bounds may extend far beyond the visible scene.
		const view_proj = mat4.create();
		mat4.multiply(view_proj, camera.projection, camera.view);

		const all     = scene.get_all();
		const visible = all.filter(o => {
			if (!o.so.visible) return false;
			let cursor = o.parent;
			while (cursor) {
				if (cursor.so.hide_children) return false;
				cursor = cursor.parent;
			}
			return true;
		});

		let x_lo =  Infinity, x_hi = -Infinity;
		let y_lo =  Infinity, y_hi = -Infinity;
		let any  =  false;

		for (const obj of visible) {
			const so = obj.so;
			for (const x of [so.x_min, so.x_max]) {
				for (const y of [so.y_min, so.y_max]) {
					for (const z of [so.z_min, so.z_max]) {
						const v = vec4.fromValues(x, y, z, 1);
						vec4.transformMat4(v, v, view_proj);
						if (v[3] === 0) continue;
						const ndc_x = v[0] / v[3];
						const ndc_y = v[1] / v[3];
						const px = (ndc_x * 0.5 + 0.5) * canvas.width;
						const py = (1 - (ndc_y * 0.5 + 0.5)) * canvas.height;
						if (px < x_lo) x_lo = px;
						if (px > x_hi) x_hi = px;
						if (py < y_lo) y_lo = py;
						if (py > y_hi) y_hi = py;
						any = true;
					}
				}
			}
		}

		if (!any) return null;
		console.log('[print] silhouette pre-clamp — left', x_lo, 'top', y_lo, 'right', x_hi, 'bottom', y_hi, '— from', visible.length, 'visible objects');
		x_lo = Math.max(0, x_lo);
		y_lo = Math.max(0, y_lo);
		x_hi = Math.min(canvas.width,  x_hi);
		y_hi = Math.min(canvas.height, y_hi);
		const width  = x_hi - x_lo;
		const height = y_hi - y_lo;
		if (width <= 0 || height <= 0) return null;
		return { left: x_lo, top: y_lo, width, height };
	}

	function on_before_print() {
		console.log('[print] handler fired');
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement | null;
		if (!canvas) { console.log('[print] no canvas found'); return; }

		const sil = compute_silhouette(canvas);
		if (!sil) { console.log('[print] silhouette is empty'); return; }

		const css_w = canvas.clientWidth  || canvas.width;
		const css_h = canvas.clientHeight || canvas.height;
		console.log('[print] canvas drawing surface', canvas.width, 'by', canvas.height, '— display box', css_w, 'by', css_h);
		console.log('[print] silhouette in drawing pixels — left', sil.left, 'top', sil.top, 'width', sil.width, 'height', sil.height);

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
		console.log('[print] scale', s, '— translate', tx, ',', ty);

		canvas.style.transformOrigin = '0 0';
		canvas.style.transform       = `translate(${tx}px, ${ty}px) scale(${s})`;
		canvas.style.outline         = '5px solid red';  // DEBUG: visible if handler ran
	}

	function on_after_print() {
		const canvas = document.querySelector('.region.graph canvas') as HTMLCanvasElement | null;
		if (!canvas) return;
		canvas.style.transform       = '';
		canvas.style.transformOrigin = '';
		canvas.style.outline         = '';
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

		:global(body) {
			background: white;
			margin: 0;
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
