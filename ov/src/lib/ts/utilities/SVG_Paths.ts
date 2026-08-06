import { Point } from '../types/Coordinates';
import Angle from '../types/Angle';

// How far, as a fraction of each side, the soft-pointer pulls back from every tip before the corner
// curves: 0 = sharp tips, toward 0.5 = the pull-backs meet mid-side and it's all curve.
const POINTER_SOFTEN = 0.55 ;

export class SVG_Paths {

	private rotated(p: Point, angle: number): Point { const [rx, ry] = Angle.rotate_xy(p.x, p.y, angle); return new Point(rx, ry); }

	flares(r: number) {
		const w = r * 7 / 3
		return `M 0 0 H ${w} A ${r} ${r} 0 0 0 ${w - r} ${r} H ${r} A ${r} ${r} 0 0 0 0 0 Z`
	}

	circle(center: Point, radius: number, clockwise: boolean = true): string {
		const direction = clockwise ? 0 : 1;
		const diametric_move = radius * 2 * (clockwise ? 1 : -1);
		return `M${center.x - radius} ${center.y} a ${radius} ${radius} 0 0 ${direction} ${diametric_move} 0 a ${radius} ${radius} 0 0 ${direction} ${-diametric_move} 0`;
	}

	circle_atOffset(width: number, diameter: number, offset: Point = Point.zero): string {
		const center = offset.offsetEquallyBy(width / 2);
		return this.circle(center, diameter / 2);
	}

	/**
	 * The clear mark: a circle with one slash across it, meaning the opposite of whatever it
	 * is laid over. Drawn as a stroked outline — nothing filled — so what it covers still
	 * shows through. It fills a `size` box, the slash running from the lower left of the
	 * circle to its upper right, and the stroke stops short of the edge by half its own
	 * width so nothing is clipped.
	 */
	circle_slash(size: number = 22, thickness: number = 1.5): string {
		const c = size / 2;
		const r = c - thickness / 2;
		const n = (v: number) => +v.toFixed(2);
		const reach = r * Math.SQRT1_2;                 // the slash meets the circle at 45°
		const ring = `M ${n(c - r)} ${n(c)} a ${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0 a ${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0`;
		const slash = ` M ${n(c - reach)} ${n(c + reach)} L ${n(c + reach)} ${n(c - reach)}`;
		return ring + slash;
	}

	x_cross(diameter: number, margin: number): string {
		const start = margin + 2;
		const end = diameter - start;
		return `M ${start} ${start} L ${end} ${end} M ${start} ${end} L ${end} ${start}`;
	}

	/**
	 * The shut mark: two upright strokes of the given height, standing side by side with the
	 * given space between them, the pair centered across the same width it is tall. Drawn as
	 * filled bars rather than stroked lines, so the thickness is exact at any size.
	 */
	closed(size: number, thickness: number = 1.5, gap: number = 4): string {
		// One flat bar, centered top to bottom, held in from each end by the gap, with a small
		// round dot of the gap's own size sitting at its left end.
		const top = (size - thickness) / 2;
		const middle = size / 2;
		const left = gap;
		const right = size - gap;
		const n = (v: number) => +v.toFixed(2);
		const bar = `M ${n(left)} ${n(top)} H ${n(right)} V ${n(top + thickness)} H ${n(left)} Z`;
		// A three-sided mark of the gap's size, turned so one corner rests on the line's left
		// end. It is wound the same way round as the bar, so where the two overlap the color
		// stays whole instead of cancelling out.
		const side = gap * 2;
		const height = side * Math.sqrt(3) / 2;
		const tip = left - 2;                     // nudged 2 left of the line's end
		const triangle = ` M ${n(tip)} ${n(middle)}`
			+ ` L ${n(tip + height)} ${n(middle - side / 2)}`
			+ ` L ${n(tip + height)} ${n(middle + side / 2)} Z`;
		return bar + triangle;

		// The two upright bars, standing side by side with the given space between them:
		// const top = 0;
		// const bottom = size;
		// const left = (size - (gap + thickness * 2)) / 2;             // the pair, centered
		// const right = left + thickness + gap;
		// const bar = (x: number) => `M ${+x.toFixed(2)} ${top} H ${+(x + thickness).toFixed(2)} V ${bottom} H ${+x.toFixed(2)} Z `;
		// return bar(left) + bar(right);
	}

	// A trash bin, drawn as a stroked outline: the lid line, the handle, the tapered body, and
	// two slots down the front. Laid out on a 24-unit grid and scaled to `size`; render with
	// fill='none' and a stroke.
	trashcan(size: number = 24): string {
		const s = size / 24;
		const n = (v: number) => +(v * s).toFixed(2);
		return `M ${n(4)} ${n(6)} H ${n(20)} `                                  // lid
			+ `M ${n(9)} ${n(6)} V ${n(4)} H ${n(15)} V ${n(6)} `               // handle
			+ `M ${n(6)} ${n(6)} L ${n(7)} ${n(20)} H ${n(17)} L ${n(18)} ${n(6)} ` // body
			+ `M ${n(10)} ${n(10)} V ${n(17)} `                                 // left slot
			+ `M ${n(14)} ${n(10)} V ${n(17)}`;                                 // right slot
	}

	toggle(size: number = 20): string {

		// @returns SVG path string that renders a toggle icon
		//	a latching push button, side view, in the pressed (down) state
		//	three filled subpaths: base plate, compressed body, cap

		const pill = (cx: number, cy: number, width: number, height: number): string => {
			const r = height / 2;
			const half = width / 2 - r;
			const L = cx - half;
			const R = cx + half;
			return `M ${L} ${cy - r} L ${R} ${cy - r} A ${r} ${r} 0 0 1 ${R} ${cy + r} L ${L} ${cy + r} A ${r} ${r} 0 0 1 ${L} ${cy - r} Z`;
		};
		const center_x = size / 2;
		const base_height = size * 0.14;
		const cap_height = size * 0.16;
		const body_width = size * 0.36;
		const body_top = size * 0.62;
		const base_top = size - base_height;
		const base = pill(center_x, size - base_height / 2, size, base_height);
		const cap = pill(center_x, body_top - cap_height / 2, size * 0.6, cap_height);
		const body = `M ${center_x - body_width / 2} ${body_top} L ${center_x + body_width / 2} ${body_top} L ${center_x + body_width / 2} ${base_top} L ${center_x - body_width / 2} ${base_top} Z`;
		return [base, body, cap].join(' ');
	}

	fat_polygon(size: number, angle: number, vertices: number = 3): string {
		const segmentAngle = Math.PI / vertices;
		const offset = Point.square(size / 2);
		const inner = Point.x(size / 3);
		const outer = Point.x(size / 2);
		const tweak = segmentAngle / 5;
		let data = [];
		let i = 0;
		while (i++ < vertices) {
			const final = angle + i * segmentAngle * 2;
			const halfWay = final - segmentAngle;
			const preceder = halfWay - tweak;
			const follower = halfWay + tweak;
			data.push({
				controlOne: this.rotated(outer,preceder).offsetBy(offset),
				controlTwo: this.rotated(outer,follower).offsetBy(offset),
				end: this.rotated(inner,final).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		return 'M' + start.description + ' ' + arcs.join(' ') + 'Z';
	}

	// The three tips of a soft-pointer: an isosceles triangle inside the `size` box, one corner
	// pointing in `direction`. All three sit on the box's circle; the two back corners are 45° either
	// side of the back (90° apart — narrower than an even triangle's 120°, so the point reads as a
	// pointer). These are the sharp tips; soft_pointer rounds them. Shared with soft_pointer_bounds.
	private soft_pointer_points(size: number, direction: number): Point[] {
		const offset = Point.square(size / 2);
		const radius = Point.x(size / 2);
		const half   = (90 * Math.PI / 180) / 2.25;   // half the 90° gap between the two back corners
		const point  = direction + Math.PI;        // the tip points opposite the given direction
		const angles = [point, point + Math.PI - half, point + Math.PI + half];
		return angles.map(a => this.rotated(radius, a).offsetBy(offset));
	}

	// Each rounded corner of the soft-pointer: the tip (used only as the curve's control point, never
	// touched by the outline) and the two pull-back points on its neighboring sides where the curve
	// starts and ends. `soften` is the pull-back fraction (see POINTER_SOFTEN). Shared by
	// soft_pointer and soft_pointer_bounds so the drawing and its measured size stay in step.
	private soft_pointer_corners(size: number, direction: number, soften: number): { tip: Point; arrive: Point; leave: Point }[] {
		const tips = this.soft_pointer_points(size, direction);
		const towards = (from: Point, to: Point) => new Point(from.x + soften * (to.x - from.x), from.y + soften * (to.y - from.y));
		return tips.map((tip, i) => ({
			tip,
			arrive: towards(tip, tips[(i + 2) % 3]),   // on the incoming side, short of this tip
			leave:  towards(tip, tips[(i + 1) % 3]),   // on the outgoing side, short of this tip
		}));
	}

	// The pointer with its three corners gently rounded and its three sides left straight: six
	// pull-back points, a short curve bending around each tip between its pair. See POINTER_SOFTEN.
	soft_pointer(size: number, direction: number, soften: number = POINTER_SOFTEN): string {
		const corners = this.soft_pointer_corners(size, direction, soften);
		const parts: string[] = [];
		corners.forEach((c, i) => {
			parts.push(`${i === 0 ? 'M' : 'L'} ${c.arrive.description}`);   // straight side into the corner
			parts.push(`Q ${c.tip.description} ${c.leave.description}`);    // round the corner, the tip its control point
		});
		return parts.join(' ') + ' Z';
	}

	// The box of the actual drawn outline (not the sharp tips, which the curves never reach), so the
	// mark fills its slot whatever the softness. Each corner is a curve from `arrive` to `leave` with
	// the tip as control; its real reach along each axis is the two ends plus, where the curve bows
	// out between them, one interior high point — so we include that too.
	soft_pointer_bounds(size: number, direction: number, soften: number = POINTER_SOFTEN): { minX: number; minY: number; width: number; height: number } {
		const xs: number[] = [];
		const ys: number[] = [];
		const bow = (a: number, control: number, b: number): number | null => {   // the curve's turning point along one axis, if it lies between the ends
			const denom = a - 2 * control + b;
			if (denom === 0) { return null; }
			const t = (a - control) / denom;
			if (t <= 0 || t >= 1) { return null; }
			return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * control + t * t * b;
		};
		for (const c of this.soft_pointer_corners(size, direction, soften)) {
			xs.push(c.arrive.x, c.leave.x);
			ys.push(c.arrive.y, c.leave.y);
			const bx = bow(c.arrive.x, c.tip.x, c.leave.x); if (bx !== null) { xs.push(bx); }
			const by = bow(c.arrive.y, c.tip.y, c.leave.y); if (by !== null) { ys.push(by); }
		}
		const minX = Math.min(...xs);
		const minY = Math.min(...ys);
		return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
	}

	// A cog centered on the middle of a `size`×`size` box (so rotating it spins in place,
	// no wobble): flat-topped teeth stepped evenly around the circle, plus a round center
	// hole shown by an even-odd fill. Render with viewBox `0 0 size size` and fill-rule
	// evenodd. Defaults look gear-like; tune the tooth count if wanted.
	gear(size: number, teeth: number = 7): string {
		const c    = size / 2;
		const ro   = size * 0.46;   // outer (tooth tip) radius
		const ri   = size * 0.32;   // root radius between teeth
		const hole = size * 0.14;   // center hole radius
		const slice = (Math.PI * 2) / teeth;
		const pt = (r: number, a: number) => `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
		const seg: string[] = [];
		for (let i = 0; i < teeth; i++) {
			const a = i * slice;
			seg.push(pt(ri, a), pt(ro, a + slice * 0.15), pt(ro, a + slice * 0.35), pt(ri, a + slice * 0.5));
		}
		const body = 'M' + seg.join(' L') + ' Z';
		const center_hole = ` M${(c + hole).toFixed(2)},${c} A${hole} ${hole} 0 1 0 ${(c - hole).toFixed(2)},${c} A${hole} ${hole} 0 1 0 ${(c + hole).toFixed(2)},${c} Z`;
		return body + center_hole;
	}

	hamburger(size: number): string {
		const w   = size * 0.8;
		const h   = size * 0.125;
		const r   = h / 2;
		const x   = (size - w) / 2;
		const gap = (size - 3 * h) / 4;
		let d = '';
		for (let i = 0; i < 3; i++) {
			const y = gap + i * (h + gap);
			d += `M${x + r},${y}H${x + w - r}`
			   + `A${r},${r},0,0,1,${x + w},${y + r}`
			   + `A${r},${r},0,0,1,${x + w - r},${y + h}`
			   + `H${x + r}`
			   + `A${r},${r},0,0,1,${x},${y + h - r}`
			   + `A${r},${r},0,0,1,${x + r},${y}Z`;
		}
		return d;
	}

	fat_polygon_bounds(size: number, angle: number, vertices: number = 3): { minX: number; minY: number; width: number; height: number } {
		const segmentAngle = Math.PI / vertices;
		const offset = Point.square(size / 2);
		const inner = Point.x(size / 3);
		const outer = Point.x(size / 2);
		const tweak = segmentAngle / 5;
		const points: Point[] = [];
		let i = 0;
		while (i++ < vertices) {
			const final    = angle + i * segmentAngle * 2;
			const halfWay  = final - segmentAngle;
			const preceder = halfWay - tweak;
			const follower = halfWay + tweak;
			points.push(
				this.rotated(outer,preceder).offsetBy(offset),
				this.rotated(outer,follower).offsetBy(offset),
				this.rotated(inner,final).offsetBy(offset),
			);
		}
		const xs   = points.map(p => p.x);
		const ys   = points.map(p => p.y);
		const minX = Math.min(...xs);
		const minY = Math.min(...ys);
		return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
	}

}

export const svg_paths = new SVG_Paths();
