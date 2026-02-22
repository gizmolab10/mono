import { Point }        from '../types/Coordinates';
import { Direction }    from '../types/Angle';
import Angle            from '../types/Angle';
import type { Integer } from '../types/Types';

class SVG_Paths {

	// ————————————————————————————————————————— Core lines

	line_connecting(start: Point, end: Point): string {
		return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
	}

	line_atAngle(start: Point, radius: number, angle: number): string {
		return this.line_connecting(start, Point.fromPolar(radius, angle).offsetBy(start));
	}

	line(vector: Point, offset: Point = Point.zero): string {
		const x = vector.x + offset.x;
		const y = vector.y + offset.y;
		if (x >= 0 && y >= 0)       { return `M ${offset.x} ${offset.y} L ${x} ${y}`; }
		else if (x >= 0 && y < 0)   { return `M ${offset.x} ${-y} L ${x} ${offset.y}`; }
		else if (x < 0 && y >= 0)   { return `M ${-x} ${offset.y} L ${offset.x} ${y}`; }
		else                        { return `M ${-x} ${-y} L ${offset.x} ${offset.y}`; }
	}

	// ————————————————————————————————————————— Circles

	circle(center: Point, radius: number, clockwise: boolean = true): string {
		const direction = clockwise ? 0 : 1;
		const diametric_move = radius * 2 * (clockwise ? 1 : -1);
		return `M${center.x - radius} ${center.y} a ${radius} ${radius} 0 0 ${direction} ${diametric_move} 0 a ${radius} ${radius} 0 0 ${direction} ${-diametric_move} 0`;
	}

	circle_atOffset(width: number, diameter: number, offset: Point = Point.zero): string {
		const center = offset.offsetEquallyBy(width / 2);
		return this.circle(center, diameter / 2);
	}

	annulus(center: Point, outer_radius: number, thickness: number, offset: Point = Point.zero): string {
		const offset_center = center.offsetBy(offset);
		const inner_center = offset_center.offsetByX(center.x * 2);
		return `${this.circle(offset_center, outer_radius, true)} ${this.circle(inner_center, outer_radius - thickness, false)}`;
	}

	// ————————————————————————————————————————— Arcs

	arc(center: Point, radius: number, sweepFlag: number, startAngle: number, endAngle: number): string {
		const end   = center.offsetBy(Point.fromPolar(radius, endAngle));
		const start = center.offsetBy(Point.fromPolar(radius, startAngle));
		const largeArcFlag = ((startAngle - endAngle).angle_normalized() > Math.PI) ? 1 : 0;
		return `\nM ${start.x} ${start.y} \nA ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} \n${end.x} ${end.y}`;
	}

	arc_partial(center: Point, radius: number, largeArcFlag: number, sweepFlag: number, endAngle: number): string {
		const end = center.offsetBy(Point.fromPolar(radius, endAngle));
		return `\nA ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} \n${end.x} ${end.y}`;
	}

	startOutAt(center: Point, radius: number, startAngle: number): string {
		const start = center.offsetBy(Point.fromPolar(radius, startAngle));
		return `\nM ${start.x} ${start.y}`;
	}

	// ————————————————————————————————————————— Fillets

	fillets(center: Point, radius: number, direction: Direction): string {
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

	// ————————————————————————————————————————— Fat polygon (curvy triangle for chevrons)

	fat_polygon(size: number, angle: number, onCenter: boolean = false, vertices: number = 3): string {
		const segmentAngle = Math.PI / vertices;
		const offset = onCenter ? Point.zero : Point.square(size / 2);
		const inner  = Point.x(size / 3);
		const outer  = Point.x(size / 2);
		const tweak  = segmentAngle / 5;
		const data: { controlOne: Point; controlTwo: Point; end: Point }[] = [];
		let i = 0;
		while (i++ < vertices) {
			const final     = angle + i * segmentAngle * 2;
			const halfWay   = final - segmentAngle;
			const preceder  = halfWay - tweak;
			const follower  = halfWay + tweak;
			data.push({
				controlOne: outer.rotate_by(preceder).offsetBy(offset),
				controlTwo: outer.rotate_by(follower).offsetBy(offset),
				end:        inner.rotate_by(final).offsetBy(offset),
			});
		}
		const start = data[vertices - 1].end;
		const arcs  = data.map(d => `C${d.controlOne.description} ${d.controlTwo.description} ${d.end.description}`);
		return 'M' + start.description + ' ' + arcs.join(' ') + 'Z';
	}

	fat_polygon_path_for(name: string, size: number = 16): string | null {
		const angle = Angle.angle_from_name(name);
		return angle != null ? this.fat_polygon(size, angle) : null;
	}

	// ————————————————————————————————————————— Polygon (basic)

	polygon(radius: number, angle: number, count: number = 3, skip: number[] = []): string {
		const points = SVG_Paths.polygonPoints(radius, count, angle);
		const center = Point.square(radius);
		let index = count;
		let path = 'M ';
		while (index > 0) {
			index--;
			if (!skip.includes(index)) {
				const separator = (index == 0) ? '' : ' L ';
				const point = center.offsetBy(points[index]);
				path = path + `${point.x} ${point.y}${separator}`;
			}
		}
		return path + ' Z';
	}

	private static polygonPoints(radius: number, count: number, offset: number): Point[] {
		const increment = Angle.full / count;
		const points: Point[] = [];
		let angle = offset;
		let index = count;
		do {
			points.push(Point.fromPolar(radius, angle));
			angle += increment;
			index--;
		} while (index > 0);
		return points;
	}

	// ————————————————————————————————————————— Tiny outer dots (digit-decomposition sizing)

	tiny_outer_dots_circular(diameter: number, count: Integer, points_right: boolean): string {
		const halfCircular = (c: Integer, dot_size: number, isBig: boolean = false): string => {
			return this.tiny_outer_dots_halfCircular(diameter, c, points_right, dot_size, isBig);
		};
		const thousands = Math.floor(count / 1000) as Integer;
		const hundreds  = Math.floor((count - thousands * 1000) / 100) as Integer;
		const tens      = Math.floor((count - thousands * 1000 - hundreds * 100) / 10) as Integer;
		const ones      = count % 10 as Integer;
		const small     = 1.5;
		const big       = small * 1.3;
		const huge      = big * 1.3;
		const gigantic  = huge * 1.3;
		if (thousands > 0) {
			if (hundreds > 0)    { return halfCircular(hundreds, huge) + halfCircular(thousands, gigantic, true); }
			else if (tens > 0)   { return halfCircular(tens, big) + halfCircular(thousands, gigantic, true); }
			else if (ones > 0)   { return halfCircular(ones, small) + halfCircular(thousands, gigantic, true); }
			return this.tiny_outer_dots_fullCircular(diameter, thousands, points_right, gigantic);
		} else if (hundreds > 0) {
			if (tens > 0)        { return halfCircular(tens, big) + halfCircular(hundreds, huge, true); }
			else if (ones > 0)   { return halfCircular(ones, small) + halfCircular(hundreds, huge, true); }
			return this.tiny_outer_dots_fullCircular(diameter, hundreds, points_right, huge);
		} else if (tens > 0) {
			if (ones > 0)        { return halfCircular(ones, small) + halfCircular(tens, big, true); }
			return this.tiny_outer_dots_fullCircular(diameter, tens, points_right, big);
		} else if (ones > 0) {
			return this.tiny_outer_dots_fullCircular(diameter, ones, points_right, small);
		}
		return this.tiny_outer_dots_fullCircular(diameter, count, points_right);
	}

	tiny_outer_dots_fullCircular(diameter: number, count: Integer, points_right: boolean, dot_size: number = 2): string {
		if (count == 0) { return ''; }
		const radius    = diameter / 3;
		const increment = Math.PI * 2 / count;
		const radial    = Point.x(radius).rotate_by(points_right ? 0 : Math.PI);
		return this.tiny_outer_dots_path(diameter, dot_size, increment, count, radial);
	}

	tiny_outer_dots_halfCircular(diameter: number, count: Integer, points_right: boolean, dot_size: number, isBig: boolean = false): string {
		if (count == 0) { return ''; }
		const radius    = diameter / 3;
		const increment = Math.PI / count;
		const radial    = Point.y((isBig == points_right) ? -radius : radius).rotate_by(increment / 2);
		return this.tiny_outer_dots_path(diameter, dot_size, increment, count, radial);
	}

	private tiny_outer_dots_path(diameter: number, dot_size: number, increment: number, count: Integer, radial: Point): string {
		let i = 0;
		let path = '';
		while (i++ < count) {
			path = path + this.circle_atOffset(diameter, dot_size, radial.offsetByXY(-0.7, 0.3));
			radial = radial.rotate_by(increment);
		}
		return path;
	}
}

export const svgPaths = new SVG_Paths();
