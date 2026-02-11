import { Point } from '../types/Coordinates';
import Angle, { Direction } from '../types/Angle';

export class SVG_Paths {

	circle(center: Point, radius: number, clockwise: boolean = true): string {
		const direction = clockwise ? 0 : 1;
		const diametric_move = radius * 2 * (clockwise ? 1 : -1);
		return `M${center.x - radius} ${center.y} a ${radius} ${radius} 0 0 ${direction} ${diametric_move} 0 a ${radius} ${radius} 0 0 ${direction} ${-diametric_move} 0`;
	}

	circle_atOffset(width: number, diameter: number, offset: Point = Point.zero): string {
		const center = offset.offsetEquallyBy(width / 2);
		return this.circle(center, diameter / 2);
	}

	x_cross(diameter: number, margin: number): string {
		const start = margin + 2;
		const end = diameter - start;
		return `M ${start} ${start} L ${end} ${end} M ${start} ${end} L ${end} ${start}`;
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
				controlOne: outer.rotate_by(preceder).offsetBy(offset),
				controlTwo: outer.rotate_by(follower).offsetBy(offset),
				end: inner.rotate_by(final).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		return 'M' + start.description + ' ' + arcs.join(' ') + 'Z';
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
				outer.rotate_by(preceder).offsetBy(offset),
				outer.rotate_by(follower).offsetBy(offset),
				inner.rotate_by(final).offsetBy(offset),
			);
		}
		const xs   = points.map(p => p.x);
		const ys   = points.map(p => p.y);
		const minX = Math.min(...xs);
		const minY = Math.min(...ys);
		return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
	}

	fillets(center : Point, radius : number, direction : Direction) : string {
		const baseAngle     = direction + Angle.half;
		const leftEndAngle  = baseAngle + Angle.quarter;
		const rightEndAngle = baseAngle - Angle.quarter;
		const a_start       = center.offsetBy(Point.fromPolar(radius, leftEndAngle));
		const a_end         = center.offsetBy(Point.fromPolar(radius, baseAngle));
		const b_end         = center.offsetBy(Point.fromPolar(radius, rightEndAngle));
		const leftArc       = `A ${radius} ${radius} 0 0 0 ${a_end.x} ${a_end.y}`;
		const rightArc      = `A ${radius} ${radius} 0 0 0 ${b_end.x} ${b_end.y}`;
		return `M ${a_start.x} ${a_start.y} ${leftArc} ${rightArc} L ${a_start.x} ${a_start.y} Z`;
	}

	fillets_bounds(radius : number, direction : Direction) : { minX : number; minY : number; width : number; height : number } {
		const baseAngle     = direction + Angle.half;
		const leftEndAngle  = baseAngle + Angle.quarter;
		const rightEndAngle = baseAngle - Angle.quarter;
		const a_start       = Point.fromPolar(radius, leftEndAngle);
		const a_end         = Point.fromPolar(radius, baseAngle);
		const b_end         = Point.fromPolar(radius, rightEndAngle);
		const minX          = Math.min(a_start.x, a_end.x, b_end.x);
		const maxX          = Math.max(a_start.x, a_end.x, b_end.x);
		const minY          = Math.min(a_start.y, a_end.y, b_end.y);
		const maxY          = Math.max(a_start.y, a_end.y, b_end.y);
		return { minX, minY, width : maxX - minX, height : maxY - minY };
	}

}

export const svg_paths = new SVG_Paths();
