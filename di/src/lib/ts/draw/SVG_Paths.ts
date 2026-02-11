import { Point } from '../types/Coordinates';
import Angle from '../types/Angle';

export class SVG_Paths {

	private rotated(p: Point, angle: number): Point { const [rx, ry] = Angle.rotate_xy(p.x, p.y, angle); return new Point(rx, ry); }

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
				controlOne: this.rotated(outer,preceder).offsetBy(offset),
				controlTwo: this.rotated(outer,follower).offsetBy(offset),
				end: this.rotated(inner,final).offsetBy(offset),
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
