import { T_Quadrant, T_Orientation } from './Angle';
import type { SvelteComponent } from 'svelte';
import type { BBox } from 'rbush';
import Angle from './Angle';

const p = 2;

export class Polar {
	r: number;
	phi: number;
	constructor(r: number, phi: number) {
		this.r = r;
		this.phi = phi;
	}

	get asPoint(): Point { return Point.fromPolar(this.r, this.phi); }
}

export class Point {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	get magnitude():				 		 number { return Math.sqrt(this.x * this.x + this.y * this.y); }
	get isZero():					 		boolean { return this.x == 0 && this.y == 0; }
	get pixelVerbose():				 		 string { return `${this.x.toFixed(p)}px ${this.y.toFixed(p)}px`; }
	get verbose():					 		 string { return `(${this.x.toFixed(p)}, ${this.y.toFixed(p)})`; }
	get description():				 		 string { return `${this.x.toFixed(p)} ${this.y.toFixed(p)}`; }
	get asBBox():							   BBox { return { minX: this.x, minY: this.y, maxX: this.x, maxY: this.y }; }
	get asPolar():							  Polar { return new Polar(this.magnitude, this.angle); }
	get asSize():					 	 	   Size { return new Size(this.x, this.y); }		// NB: can have negative values, so rect extended by negative works
	get negated():					 		  Point { return this.multipliedEquallyBy(-1); }
	get doubled():					 		  Point { return this.multipliedEquallyBy(2); }
	get negatedInHalf():			 		  Point { return this.dividedEquallyBy(-2); }
	get dividedInHalf():			 		  Point { return this.dividedEquallyBy(2); }
	get swap():						 		  Point { return new Point(this.y, this.x); }
	get negateY():					 		  Point { return new Point(this.x, -this.y); }
	get negateX():					 		  Point { return new Point(-this.x, this.y); }
	get abs():						 		  Point { return new Point(Math.abs(this.x), Math.abs(this.y)); }
	offsetByX(x: number):			 		  Point { return this.offsetByXY(x, 0); }
	offsetByY(y: number):			 		  Point { return this.offsetByXY(0, y); }
	offsetEquallyBy(offset: number): 		  Point { return this.offsetByXY(offset, offset); }
	offsetByXY(x: number, y: number):		  Point { return new Point(this.x + x, this.y + y); }
	spreadByXY(x: number, y: number):		  Point { return new Point(this.x * x, this.y * y); }
	offsetBy(point: Point):			 		  Point { return new Point(this.x + point.x, this.y + point.y); }
	vector_to(point: Point):		 		  Point { return point.offsetBy(this.negated); }
	multiply_xBy(multiplier: number):		  Point { return new Point(this.x * multiplier, this.y) }
	multiply_yBy(multiplier: number):		  Point { return new Point(this.x, this.y * multiplier) }
	equals(other: Point):					boolean { return this.x == other.x && this.y == other.y; }
	dividedEquallyBy(divisor: number):		  Point { return new Point(this.x / divisor, this.y / divisor) }
	multipliedEquallyBy(multiplier: number):  Point { return new Point(this.x * multiplier, this.y * multiplier) }
	static fromDOMRect(rect: DOMRect):		  Point { return new Point(rect.left, rect.top); }
	static square(length: number):			  Point { return new Point(length, length); }
	static x(x: number):					  Point { return new Point(x, 0); }
	static y(y: number):					  Point { return new Point(0, y); }
	static get zero():						  Point { return new Point();}
	static fromPolar(r: number, phi: number): Point { return Point.x(r).rotate_by(phi); }

	// in this (as in math), y increases going up and angles increase counter-clockwise
	get angle(): number { return (Math.atan2(-this.y, this.x)); }	// in browsers, y is the opposite, so reverse it here

	get quadrant_ofPoint(): T_Quadrant {
		const x = this.x;
		const y = this.y;
		if		  (x >= 0 && y >= 0) { return T_Quadrant.upperRight;
		} else if (x <  0 && y >= 0) { return T_Quadrant.upperLeft;
		} else if (x <  0 && y <  0) { return T_Quadrant.lowerLeft;
		} else						 { return T_Quadrant.lowerRight;
		}
	}

	get orientation_ofVector(): T_Orientation {
		let quadrant = new Angle(this.angle).quadrant_ofAngle;
		const isFirstEighth = (this.angle).normalize_between_zeroAnd(Angle.quarter) < (Math.PI / 4);
		switch (quadrant) {
			case T_Quadrant.upperRight: return isFirstEighth ? T_Orientation.right : T_Orientation.up;
			case T_Quadrant.upperLeft:  return isFirstEighth ? T_Orientation.up	   : T_Orientation.left;
			case T_Quadrant.lowerLeft:  return isFirstEighth ? T_Orientation.left  : T_Orientation.down;
			case T_Quadrant.lowerRight: return isFirstEighth ? T_Orientation.down  : T_Orientation.right;
		}
	}

	rotate_by(angle: number): Point {
		// rotate counter-clockwise
		// angle of zero is on the x-axis pointing right
		// angle of one-half pi is on the y-axis pointing up
		// in math y increases going up,
		// so it must be reversed for browsers
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			this.x * cos + this.y * sin,
			this.y * cos - this.x * sin	// reverse y for browsers
		);
	}
	
	isContainedBy_path(path: string): boolean {
		const canvas = document.createElement('canvas');		// Create a temporary canvas element
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Failed to get 2D context');
		}
		canvas.width = window.innerWidth;		// Set canvas dimensions (arbitrary large values to ensure it covers the path)
		canvas.height = window.innerHeight;
		const path2D = new Path2D(path);		// Create a new Path2D object from the SVG path
		const isInside = context.isPointInPath(path2D, this.x, this.y);		// Check if the point is inside the path
		return isInside;
	}

	static origin_inWindowCoordinates_for(element: HTMLElement): Point {
		let e: HTMLElement | null = element;
		let point = Point.zero;
		while (e) {
			point = point.offsetByXY(e.offsetLeft, e.offsetTop);
			e = e.offsetParent as HTMLElement;
		}
		return point;
	}

}

export class Size {
	height: number;
	width: number;

	constructor(width: number = 0, height: number = 0) {
		this.height = height;
		this.width = width;
	}

	get proportion():					   number { return this.width / this.height; }
	get isZero():						  boolean { return this.width == 0 && this.height == 0; }
	get description():					   string { return `${this.width.toFixed(p)} ${this.height.toFixed(p)}`; }
	get verbose():						   string { return `(${this.width.toFixed(p)}, ${this.height.toFixed(p)})`; }
	get pixelVerbose():					   string { return `${this.width.toFixed(p)}px ${this.height.toFixed(p)}px`; }
	get center():						    Point { return this.asPoint.dividedInHalf; }
	get asPoint():			   			    Point { return new Point(this.width, this.height); }			// NOTE: always in lower right quadrant (increasing clockwise)
	get swap():								 Size { return new Size(this.height, this.width); }
	get negated():							 Size { return this.multipliedEquallyBy(-1); }
	get dividedInHalf():					 Size { return this.dividedEquallyBy(2); }
	reducedByXY(x: number, y: number):		 Size { return this.extendedByXY(-x, -y); }
	extendedByX(delta: number):				 Size { return this.extendedByXY(delta, 0); }
	extendedByY(delta: number):				 Size { return this.extendedByXY(0, delta); }
	reducedByX(delta: number):				 Size { return this.extendedByXY(-delta, 0); }
	reducedByY(delta: number):				 Size { return this.extendedByXY(0, -delta); }
	expandedEquallyBy(delta: number):		 Size { return this.extendedByXY(delta, delta); }
	reducedBy(srinkage: Point):				 Size { return this.extendedBy(srinkage.negated); }
	insetEquallyBy(delta: number):			 Size { return this.expandedEquallyBy(2 * -delta); }
	extendedBy(delta: Point):				 Size { return this.extendedByXY(delta.x, delta.y); }
	dividedEquallyBy(divisor: number):		 Size { return this.multipliedEquallyBy(1 / divisor); }
	extendedByXY(x: number, y: number):		 Size { return new Size(this.width + x, this.height + y); }
	multipliedEquallyBy(multiplier: number): Size { return new Size(this.width * multiplier, this.height * multiplier); }
	dividedBy(size: Size):					 Size { return new Size(this.width / size.width, this.height / size.height); }
	best_ratio_to(size: Size):			   number { return Math.min(this.width / size.width, this.height / size.height); }
	equals(other: Size):				  boolean { return this.width == other.width && this.height == other.height; }
	static fromDOMRect(rect: DOMRect):		 Size { return new Size(rect.width, rect.height); }
	static square(length: number):			 Size { return new Size(length, length); }
	static height(height: number):			 Size { return new Size(0, height); }
	static width(width: number):			 Size { return new Size(width, 0); }
	static get zero():						 Size { return new Size(); }

}

export class Rect {
	origin: Point;
	size: Size;

	constructor(origin: Point = Point.zero, size: Size = Size.zero) {
		this.origin = origin;
		this.size = size;
	}

	get x():						 number { return this.origin.x; }
	get y():						 number { return this.origin.y; }
	get right():					 number { return this.extent.x; }
	get bottom():					 number { return this.extent.y; }
	get width():					 number { return this.size.width; }
	get height():					 number { return this.size.height; }
	get isZero():					boolean { return this.size.isZero; }
	get verbose():					 string { return `${this.origin.verbose}, ${this.size.verbose}`; }
	get description():				 string { return `${this.origin.description} ${this.size.description}`; }
	get pixelVerbose():				 string { return `${this.origin.pixelVerbose} ${this.size.pixelVerbose}`; }
	get asBBox():					   BBox { return { minX: this.x, minY: this.y, maxX: this.right, maxY: this.bottom }; }
	get center():					  Point { return this.origin.offsetBy(this.size.center); }
	get extent():					  Point { return this.origin.offsetBy(this.size.asPoint); }		// bottom right
	get topRight():					  Point { return new Point(this.extent.x, this.origin.y); }
	get centerTop():				  Point { return new Point(this.center.x, this.origin.y); }
	get bottomLeft():				  Point { return new Point(this.origin.x, this.extent.y); }
	get centerLeft():				  Point { return new Point(this.origin.x, this.center.y); }
	get centerRight():				  Point { return new Point(this.extent.x, this.center.y); }
	get centerBottom():				  Point { return new Point(this.center.x, this.extent.y); }
	get dividedInHalf():			   Rect { return new Rect(this.origin, this.size.multipliedEquallyBy(-1/2)); }
	get atZero_forX():				   Rect { return new Rect(Point.y(this.origin.y), this.size); }
	get atZero_forY():				   Rect { return new Rect(Point.x(this.origin.x), this.size); }
	get atZero():					   Rect { return new Rect(Point.zero, this.size); }
	set x(x: number)						{ this.origin.x = x; }
	set y(y: number)						{ this.origin.y = y; }
	set width(width: number)				{ this.size.width = width; }
	set height(height: number)				{ this.size.height = height; }

	get normalized(): Rect {			// make width and height positive
		let width = this.width;
		let height = this.height;
		if (width < 0) {
			this.size.width = -width;	// invert width
			this.origin.x -= width;		// compensate
		}
		if (height < 0) {
			this.size.height = -height;	// "
			this.origin.y -= height;	// "
		}
		return this;					// for method chaining	
	}

	equals(other: Rect):			boolean { return this.origin.equals(other.origin) && this.size.equals(other.size); }
	multipliedEquallyBy(m: number):	   Rect { return new Rect(this.origin.multipliedEquallyBy(m), this.size.multipliedEquallyBy(m)); }
	dividedEquallyBy(m: number):	   Rect { return new Rect(this.origin.dividedEquallyBy(m), this.size.dividedEquallyBy(m)); }
	centeredRect_ofSize(size: Size):   Rect { return new Rect(this.center.offsetBy(size.center.negated), size); }
	originMultipliedBy(ratio: number): Rect { return new Rect(this.origin.multipliedEquallyBy(ratio), this.size); }
	expand_sizeBy(ratio: number):	   Rect { return new Rect(this.origin, this.size.multipliedEquallyBy(ratio)); }
	expand_heightBy(height: number):   Rect { return new Rect(this.origin, this.size.extendedByY(height)); }
	multiply_xBy(ratio: number):	   Rect { return new Rect(this.origin.multiply_xBy(ratio), this.size); }
	multiply_yBy(ratio: number):	   Rect { return new Rect(this.origin.multiply_yBy(ratio), this.size); }
	extend_widthBy(width: number):	   Rect { return new Rect(this.origin, this.size.extendedByX(width)); }
	offsetByXY(x: number, y: number):  Rect { return new Rect(this.origin.offsetByXY(x, y), this.size); }
	offsetBy(delta: Point):			   Rect { return new Rect(this.origin.offsetBy(delta), this.size); }
	offsetByX(x: number):			   Rect { return new Rect(this.origin.offsetByX(x), this.size); }
	offsetByY(y: number):			   Rect { return new Rect(this.origin.offsetByY(y), this.size); }
	offsetEquallyBy(offset: number):   Rect { return this.offsetByXY(offset, offset); }
	
	expandedBy(expansion: Point): Rect {
		const size = this.size.extendedBy(expansion);
		const origin = expansion.vector_to(this.origin);
		return new Rect(origin, size)
	}

	contains(point: Point): boolean {
		const origin = this.origin;
		const extent = this.extent;
		return point.x.isBetween(origin.x, extent.x, true) && 
			   point.y.isBetween(origin.y, extent.y, true);
	}

	corners_forAngle(angle: number): [Point, Point] {
		switch (new Angle(angle).quadrant_ofAngle) {
			case T_Quadrant.lowerRight: return [this.bottomLeft, this.topRight];
			case T_Quadrant.upperLeft:  return [this.topRight, this.bottomLeft];
			case T_Quadrant.lowerLeft:  return [this.extent, this.origin];
			default:					return [this.origin, this.extent];
		}
	}

	intersects(rect: Rect): boolean {
		// handle zero-width/height cases by using origin instead of extent
		// for a zero dimension, treat the rectangle as a line by using the origin point
        const thisExtentX = this.size.width  === 0 ? this.origin.x : this.extent.x;
        const thisExtentY = this.size.height === 0 ? this.origin.y : this.extent.y;
        const rectExtentX = rect.size.width  === 0 ? rect.origin.x : rect.extent.x;
        const rectExtentY = rect.size.height === 0 ? rect.origin.y : rect.extent.y;

		// check for non-intersection using the separating axis theorem
		// two rectangles do NOT intersect if:
		// - the left edge of one is right of the right edge of the other OR
		// - the top edge of one is below the bottom edge of the other
        return !(this.origin.x > rectExtentX || 
				 this.origin.y > rectExtentY ||
                 rect.origin.x > thisExtentX || 
                 rect.origin.y > thisExtentY);
    }

	clippedTo(bounds: Rect): Rect {
		// Clip this rect to the bounds, returning the intersection
		// If no intersection, returns a zero-sized rect at the clipped origin
		const clippedLeft = Math.max(this.origin.x, bounds.origin.x);
		const clippedTop = Math.max(this.origin.y, bounds.origin.y);
		const clippedRight = Math.min(this.extent.x, bounds.extent.x);
		const clippedBottom = Math.min(this.extent.y, bounds.extent.y);
		
		const clippedWidth = Math.max(0, clippedRight - clippedLeft);
		const clippedHeight = Math.max(0, clippedBottom - clippedTop);
		
		return new Rect(new Point(clippedLeft, clippedTop), new Size(clippedWidth, clippedHeight));
	}

	static createSizeRect(size: Size): Rect { return new Rect(Point.zero, size); }
	static get zero():				   Rect { return new Rect(Point.zero, Size.zero); }

	static createWHRect(width: number, height: number): Rect {
		return new Rect(Point.zero, new Size(width, height));
	}
	
	static createExtentRect(origin: Point, extent: Point): Rect {
		return new Rect(origin, origin.vector_to(extent).asSize);
	}

	static createRightCenterRect(rightCenter: Point, size: Size): Rect {
		return new Rect(rightCenter.offsetByY(size.height / -2), size);
	}

	static createCenterRect(center: Point, size: Size): Rect {
		const toOrigin = size.center.negated;
		const origin = center.offsetBy(toOrigin);
		return new Rect(origin, size);
	}

	static createFromDOMRect(domRect: DOMRect | null) {
		if (!domRect) {
			return null;
		}
		const origin = new Point(domRect.x, domRect.y).offsetByXY(window.scrollX, window.scrollY);
		return new Rect(origin, new Size(domRect.width, domRect.height));
	}

	static rect_forElement(element: HTMLElement | null): Rect | null {
		if (!element) {
			return null;
		}
		const domRect = element.getBoundingClientRect();
		const origin = Point.fromDOMRect(domRect);
		const size = Size.fromDOMRect(domRect);
		return new Rect(origin, size);
	}

	static rect_forComponent(c: SvelteComponent): Rect {
		const top = c['offsetTop'];
		const left = c['offsetLeft'];
		const width = c['offsetWidth'];
		const height = c['offsetHeight'];
		if ((!!top || top == 0) && (!!left || left == 0) && !!width && !!height) {
			return new Rect(new Point(left, top), new Size(width, height));
		}
		return Rect.zero;
	}

}
