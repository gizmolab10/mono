import { Point } from '../types/Coordinates';
import Angle, { Direction } from '../types/Angle';

export class SVG_Paths {

	gull_wings(center : Point, radius : number, direction : Direction) : string {
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

	gull_wings_bounds(radius : number, direction : Direction) : { minX : number; minY : number; width : number; height : number } {
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
